import sys
import argparse
import pypdf
import io
import asyncio
import json
import logging
import uuid
import os
import tempfile
import numpy as np
import librosa
from dotenv import load_dotenv

logger = logging.getLogger(__name__)

# Handle environment and search paths
BACKEND_DIR = os.path.dirname(os.path.abspath(__file__))
if BACKEND_DIR not in sys.path: sys.path.append(BACKEND_DIR)
parent_dir = os.path.dirname(BACKEND_DIR)
if parent_dir not in sys.path: sys.path.append(parent_dir)

load_dotenv(os.path.join(BACKEND_DIR, ".env"))

from aiohttp import web
from aiortc import RTCPeerConnection, RTCSessionDescription
from aiortc.contrib.media import MediaBlackhole
from supabase_client import supabase_logger
from openai import OpenAI
from scipy.interpolate import interp1d
import cv2
import torch
import torch.nn.functional as F
import mediapipe as mp

# Setup PeerConnection set
pcs = set()

# Initialize API Clients and Shared Resources
try:
    from stream_processor import (
        get_landmarkers, get_visual_model, whisper_model,
        process_mediapipe_results, device, SEQUENCE_LENGTH, VisualConfidenceModel,
        VideoStreamProcessor, AudioStreamProcessor, DataChannelManager,
        SpeechAnalyzer
    )
    from anaylisis.engine import InterviewAnalyzerEngine
    
    client = OpenAI()
    analyzer_engine = InterviewAnalyzerEngine()
    print("Backend initialization successful (Models, API clients, & Analyzer ready)")
except Exception as e:
    print(f"CRITICAL ERROR: Failed to initialize backend components: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)

FALLBACK_QUESTIONS = [
    "Welcome to Ace It. To start, can you tell me a bit about your experience with AI and machine learning?",
    "That's interesting. How do you approach debugging a complex problem in your code?",
    "Great. Finally, why are you interested in this specific project for HackAI?"
]

print("Defining helpers...")

# --- HELPERS ---

def extract_text_from_pdf(pdf_bytes):
    try:
        reader = pypdf.PdfReader(io.BytesIO(pdf_bytes))
        text = ""
        for page in reader.pages:
            text += page.extract_text() + "\n"
        return text.strip()
    except Exception as e:
        logging.error(f"PDF extraction error: {e}")
        return ""


def extract_video_metrics(video_path):
    try:
        cap = cv2.VideoCapture(video_path)
        feature_history = []
        frame_count = 0
        face_landmarker, hand_landmarker = get_landmarkers()
        while cap.isOpened():
            ret, frame = cap.read()
            if not ret: break
            frame_count += 1
            if frame_count % 3 != 0: continue
            
            rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb_frame)
            timestamp_ms = int(cap.get(cv2.CAP_PROP_POS_MSEC))
            
            if face_landmarker and hand_landmarker:
                face_res = face_landmarker.detect(mp_image)
                hand_res = hand_landmarker.detect(mp_image)
                feat = process_mediapipe_results(face_res, hand_res)
                feature_history.append((timestamp_ms, feat))
            
        cap.release()
        if len(feature_history) < 5: return 0.5, 0.8, 0.1
            
        window_data = np.array([f for t, f in feature_history])
        window_times = np.array([t for t, f in feature_history])
        target_ts = np.linspace(window_times[0], window_times[-1], SEQUENCE_LENGTH)
        
        f_interp = interp1d(window_times, window_data, axis=0, kind='linear', fill_value="extrapolate")
        resampled_seq = f_interp(target_ts)
        input_tensor = torch.FloatTensor(resampled_seq).unsqueeze(0).to(device)
        
        visual_model = get_visual_model()
        if visual_model:
            with torch.no_grad():
                logits = visual_model(input_tensor)
                probs = F.softmax(logits, dim=1)
                visual_confidence = probs[0][1].item()
        else:
            visual_confidence = 0.5

        face_feats = window_data[:, :52]
        gaze_score = 1.0 - np.mean(face_feats[:, 13:15]) 
        hand_feats = window_data[:, 52:]
        fidget_index = min(1.0, np.std(hand_feats) * 5.0) 
        
        return float(visual_confidence), float(gaze_score), float(fidget_index)
    except Exception as e:
        logging.error(f"Extract Video Metrics Error: {e}")
        return 0.5, 0.8, 0.1

print("Defining handlers...")

async def heartbeat(request):
    return web.json_response({"status": "healthy", "message": "AceIt Unified Backend is live!"})

import subprocess

def convert_to_wav(input_path):
    output_path = input_path.rsplit('.', 1)[0] + ".wav"
    try:
        # Use ffmpeg to convert to wav, 16kHz, mono
        subprocess.run([
            "ffmpeg", "-y", "-i", input_path, 
            "-ar", "16000", "-ac", "1", output_path
        ], check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        return output_path
    except Exception as e:
        logger.error(f"FFmpeg conversion failed: {e}")
        return None

async def stream_process(request):
    reader = await request.multipart()
    audio_data = None
    video_data = None
    session_id = None
    timestamp_sec = 0.0

    while True:
        part = await reader.next()
        if part is None: break
        if part.name == 'audio':
            audio_data = await part.read()
        elif part.name == 'video':
            video_data = await part.read()
        elif part.name == 'session_id':
            session_id = (await part.read()).decode()
        elif part.name == 'timestamp_sec':
            timestamp_sec = float((await part.read()).decode())

    if not audio_data:
        return web.json_response({"error": "No audio provided"}, status=400)

    # 1. Transcribe immediately
    temp_audio = os.path.join(tempfile.gettempdir(), f"{uuid.uuid4().hex}.webm")
    with open(temp_audio, 'wb') as f:
        f.write(audio_data)

    try:
        with open(temp_audio, "rb") as f:
            transcription = client.audio.transcriptions.create(model="whisper-1", file=f)
        text = transcription.text
        
        # 2. Return text to frontend ASAP
        # We start a background task for the heavy biometrics
        # We need a copy of video_data if we want to process it in background
        async def run_metrics_background(a_path, v_data, s_id, t_sec, transcribed_text):
            try:
                print(f"[DEBUG] Processing metrics for session {s_id} at {t_sec}s")
                # Defaults
                mean_rms = 0.05
                pitch_stdev = 400
                pacing_wpm = 0
                confidence_score = 0.5
                
                # Audio Metrics
                try:
                    # Try direct load first
                    try:
                        y, sr = librosa.load(a_path, sr=None)
                    except Exception:
                        print(f"[DEBUG] Direct load failed for {a_path}, trying WAV conversion fallback...")
                        wav_path = convert_to_wav(a_path)
                        if wav_path and os.path.exists(wav_path):
                            y, sr = librosa.load(wav_path, sr=None)
                            if os.path.exists(wav_path): os.remove(wav_path)
                        else:
                            y = np.array([])
                    
                    if len(y) > 0:
                        duration = librosa.get_duration(y=y, sr=sr)
                        word_count = len(transcribed_text.split())
                        pacing_wpm = (word_count / duration) * 60 if duration > 0 else 0
                        
                        rms_data = librosa.feature.rms(y=y)
                        mean_rms = np.mean(rms_data) if rms_data.size > 0 else 0.05
                        
                        zcr = librosa.feature.zero_crossing_rate(y)
                        active_zcr = zcr[zcr > np.median(zcr)]
                        pitch_stdev = (np.std(active_zcr) * 1000) if len(active_zcr) > 0 else 400
                        
                        confidence_score = ((max(0.0, 1.0 - (pitch_stdev / 400.0))) * 0.4) + (min(1.0, mean_rms * 20.0) * 0.6)
                        print(f"[DEBUG] Audio metrics: RMS={mean_rms:.4f}, PitchSD={pitch_stdev:.2f}, WPM={pacing_wpm:.1f}, Conf={confidence_score:.2f}")
                except Exception as lib_err:
                    print(f"[ERROR] Audio metrics calculation failed: {lib_err}")

                # Video Metrics
                v_conf, v_gaze, v_fidget = 0.5, 0.8, 0.1
                if v_data:
                    t_video = os.path.join(tempfile.gettempdir(), f"v_{uuid.uuid4().hex}.webm")
                    with open(t_video, 'wb') as f: f.write(v_data)
                    try:
                        v_conf, v_gaze, v_fidget = await asyncio.to_thread(extract_video_metrics, t_video)
                        print(f"[DEBUG] Video metrics: Gaze={v_gaze:.2f}, Fidget={v_fidget:.2f}, Conf={v_conf:.2f}")
                    except Exception as vid_err:
                        print(f"[ERROR] Video analysis failed: {vid_err}")
                    finally:
                        if os.path.exists(t_video): os.remove(t_video)
                else:
                    print(f"[DEBUG] No video data provided")

                # Speech Analysis (Fillers & Tone)
                speech_results = SpeechAnalyzer.analyze(transcribed_text)
                filler_count = speech_results["filler_count"]
                sentiment_score = speech_results["sentiment"]

                # Log to Supabase (Unified record)
                print(f"[DEBUG] Logging Background Analysis for {s_id}")
                supabase_logger.log_keyframe(
                    session_id=s_id,
                    timestamp_sec=t_sec,
                    associated_transcript=transcribed_text,
                    volume_rms=float(mean_rms),
                    pitch_stdev=float(pitch_stdev),
                    pacing_wpm=float(pacing_wpm),
                    is_audibly_confident=confidence_score >= 0.5,
                    gaze_score=float(v_gaze),
                    fidget_index=float(v_fidget),
                    is_visually_confident=v_conf >= 0.5,
                    overall_confidence_score=float(confidence_score),
                    filler_words_count=filler_count,
                    sentiment_score=sentiment_score,
                    keyframe_reason="Background Analysis"
                )
            except Exception as e:
                logger.error(f"Background metrics error: {e}")
                import traceback
                traceback.print_exc()
            finally:
                if os.path.exists(a_path): os.remove(a_path)

        # Fire and forget
        asyncio.create_task(run_metrics_background(temp_audio, video_data, session_id, timestamp_sec, text))

        return web.json_response({"text": text})
    except Exception as e:
        if os.path.exists(temp_audio): os.remove(temp_audio)
        return web.json_response({"error": str(e)}, status=500)

async def init_session(request):
    reader = await request.multipart()
    resume_text = ""
    job_description = ""
    interviewer_persona_id = ""
    role = "Software Engineer"
    company = "AceIt"
    
    while True:
        part = await reader.next()
        if part is None: break
        if part.name == 'resume':
            filename = part.filename
            content = await part.read()
            if filename.endswith('.pdf'):
                resume_text = extract_text_from_pdf(content)
            else:
                resume_text = content.decode('utf-8', errors='ignore')
        elif part.name == 'job_description':
            job_description = (await part.read()).decode('utf-8')
        elif part.name == 'interviewer_persona':
            interviewer_persona_id = (await part.read()).decode('utf-8')
        elif part.name == 'role':
            role = (await part.read()).decode('utf-8')
        elif part.name == 'company':
            company = (await part.read()).decode('utf-8')

    # Load persona prompt
    persona_prompt = "You are an expert AI Interviewer."
    if interviewer_persona_id:
        persona_path = os.path.join(BACKEND_DIR, "prompts", "interviewers", f"{interviewer_persona_id}.txt")
        if os.path.exists(persona_path):
            with open(persona_path, 'r') as f:
                persona_prompt = f.read()

    system_prompt = (
        f"{persona_prompt}\n\n"
        "Based on the candidate's resume and the job description, "
        "introduce yourself briefly and ask the first most relevant interview question. "
        "Keep it professional and concise (under 3 sentences)."
    )
    user_prompt = f"Resume:\n{resume_text}\n\nJob Description:\n{job_description}"
    
    try:
        completion = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "system", "content": system_prompt}, {"role": "user", "content": user_prompt}]
        )
        first_question = completion.choices[0].message.content
        session_id = f"session-{uuid.uuid4().hex[:8]}"
        
        # Save metadata to Supabase
        supabase_logger.save_session_metadata(session_id, role, company)
        
        return web.json_response({
            "session_id": session_id,
            "first_question": first_question,
            "resume_text": resume_text,
            "job_text": job_description
        })
    except Exception as e:
        return web.json_response({"error": str(e)}, status=500)

async def chat(request):
    try:
        data = await request.json()
    except:
        return web.json_response({"error": "Invalid JSON"}, status=400)

    user_text = data.get('text', '')
    question_index = data.get('question_index', 0)
    session_id = data.get('session_id')
    timestamp_sec = data.get('timestamp_sec', float(question_index))
    resume_text = data.get('resume_text', '')
    job_text = data.get('job_text', '')
    interviewer_persona_id = data.get('interviewer_persona', '')

    # Load persona prompt
    persona_prompt = "You are a professional technical interviewer for AceIt."
    if interviewer_persona_id:
        persona_path = os.path.join(BACKEND_DIR, "prompts", "interviewers", f"{interviewer_persona_id}.txt")
        if os.path.exists(persona_path):
            with open(persona_path, 'r') as f:
                persona_prompt = f.read()

    system_prompt = (
        f"{persona_prompt}\n\n"
        "Keep your response concise, encouraging, and under 3 sentences. "
        "First, react to the candidate's answer in exactly 1 sentence. "
        f"Context - Job Description: {job_text[:300]}... Resume Summary: {resume_text[:300]}..."
    )
    
    if question_index < 5:
        prompt = f"The candidate said: '{user_text}'. React to their answer in one sentence, then ask a relevant follow-up question."
        is_finished = False
        next_index = question_index + 1
    else:
        prompt = f"The candidate said: '{user_text}'. React to their answer in one sentence, then thank them and conclude the interview."
        is_finished = True
        next_index = question_index

    # Prepare SSE response
    response = web.StreamResponse(
        status=200,
        reason='OK',
        headers={'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache'}
    )
    await response.prepare(request)

    full_ai_response = ""
    try:
        # Use stream=True for token-by-token delivery
        stream = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "system", "content": system_prompt}, {"role": "user", "content": prompt}],
            stream=True
        )

        for chunk in stream:
            if chunk.choices[0].delta.content:
                content = chunk.choices[0].delta.content
                full_ai_response += content
                # SSE Format: data: <payload>\n\n
                await response.write(f"data: {json.dumps({'token': content})}\n\n".encode())

        # Send metadata at the end
        await response.write(f"data: {json.dumps({'done': True, 'full_text': full_ai_response, 'next_index': next_index, 'is_finished': is_finished})}\n\n".encode())

        # Log to Supabase and trigger analysis in the background after stream
        if session_id:
            supabase_logger.log_keyframe(
                session_id=session_id,
                timestamp_sec=float(timestamp_sec),
                interviewer_question=f"Dynamic Question {question_index}",
                associated_transcript=user_text,
                ai_response=full_ai_response,
                keyframe_reason=f"AI Turn - Q{question_index + 1}"
            )
            
            async def run_analysis():
                try:
                    print(f"[DEBUG] Waiting for background metrics to finish for {session_id}...")
                    await asyncio.sleep(3) # Wait for run_metrics_background to finish
                    report = await analyzer_engine.generate_report(session_id, "Standard Technical Interviewer")
                    # Save the report markdown to Supabase
                    supabase_logger.save_report(session_id, report)
                    print(f"\n--- INTERVIEW ANALYSIS REPORT ({session_id}) ---\n{report}\n")
                except Exception as ex:
                    print(f"Analysis Error: {ex}")
            
            asyncio.create_task(run_analysis())

    except Exception as e:
        logger.error(f"Chat Stream Error: {e}")
        await response.write(f"data: {json.dumps({'error': str(e)})}\n\n".encode())
    
    await response.write_eof()
    return response

async def tts(request):
    data = await request.json()
    text = data.get('text', '')
    try:
        temp_audio = os.path.join(tempfile.gettempdir(), f"{uuid.uuid4().hex}.mp3")
        with client.audio.speech.with_streaming_response.create(model="tts-1", voice="nova", input=text) as response:
            response.stream_to_file(temp_audio)
        return web.FileResponse(temp_audio)
    except Exception as e:
        return web.json_response({"error": str(e)}, status=500)

async def offer(request):
    try:
        params = await request.json()
        offer = RTCSessionDescription(sdp=params["sdp"], type=params["type"])

        pc = RTCPeerConnection()
        pc_id = "PeerConnection(%s)" % uuid.uuid4()
        pcs.add(pc)

        # We will use our custom processors instead of a simple MediaBlackhole
        from stream_processor import VideoStreamProcessor, AudioStreamProcessor, DataChannelManager
        
        dc_manager = DataChannelManager()
        processors = []

        def log_info(msg, *args):
            logger.info(pc_id + " " + msg, *args)

        log_info("Created for %s", request.remote)

        @pc.on("datachannel")
        def on_datachannel(channel):
            log_info("Data channel %s created", channel.label)
            dc_manager.channel = channel
            
            @channel.on("message")
            def on_message(message):
                if isinstance(message, str) and message.startswith("ping"):
                    channel.send("pong" + message[4:])

        @pc.on("connectionstatechange")
        async def on_connectionstatechange():
            log_info("Connection state is %s", pc.connectionState)
            if pc.connectionState == "failed":
                await pc.close()
                pcs.discard(pc)

        @pc.on("track")
        def on_track(track):
            log_info("Track %s received", track.kind)

            # Hook up streams to our backend AI components
            if track.kind == "video":
                processor = VideoStreamProcessor(track, dc_manager)
                processors.append(processor)
            # AudioStreamProcessor is commented out as requested to favor turn-based logic
            # elif track.kind == "audio":
            #    processor = AudioStreamProcessor(track, dc_manager)
            #    processors.append(processor)

            @track.on("ended")
            async def on_ended():
                log_info("Track %s ended", track.kind)

        # handle offer
        await pc.setRemoteDescription(offer)

        # send answer
        answer = await pc.createAnswer()
        await pc.setLocalDescription(answer)

        return web.json_response(
            {"sdp": pc.localDescription.sdp, "type": pc.localDescription.type}
        )
    except Exception as e:
        logger.error(f"Offer Error: {e}")
        import traceback
        traceback.print_exc()
        return web.json_response({"error": str(e)}, status=500)


async def get_report_handler(request):
    session_id = request.match_info.get('session_id')
    if not session_id:
        return web.json_response({"error": "No session_id provided"}, status=400)
    
    report_data = supabase_logger.get_report(session_id)
    if not report_data:
        return web.json_response({"error": "Report not found or not yet generated"}, status=404)
    
    return web.json_response(report_data)

async def get_session_data_handler(request):
    session_id = request.match_info.get('session_id')
    if not session_id:
        return web.json_response({"error": "No session_id provided"}, status=400)
    
    report = supabase_logger.get_report(session_id)
    keyframes = supabase_logger.get_keyframes(session_id)
    metadata = supabase_logger.get_session_metadata(session_id)
    
    return web.json_response({
        "report": report,
        "keyframes": keyframes,
        "metadata": metadata
    })

async def get_session_details_handler(request):
    session_id = request.query.get('session_id')
    if not session_id:
        return web.json_response({"error": "No session_id provided"}, status=400)
    
    metadata = supabase_logger.get_session_metadata(session_id)
    if not metadata:
        return web.json_response({"error": "Session not found"}, status=404)
        
    # Also fetch data for the old dashboard logic if needed
    report = supabase_logger.get_report(session_id)
    keyframes = supabase_logger.get_keyframes(session_id)
    
    # Map keyframes back to what the frontend expects for biometrics/transcript if needed
    # but the report page fetch already does this from /api/session/{id}/data
    
    return web.json_response({"data": metadata})

async def on_shutdown(app):
    # close peer connections
    coros = [pc.close() for pc in pcs]
    await asyncio.gather(*coros)
    pcs.clear()


if __name__ == "__main__":
    try:
        parser = argparse.ArgumentParser(
            description="WebRTC audio / video / data-channels server"
        )
        parser.add_argument("--host", default="0.0.0.0", help="Host for HTTP server (default: 0.0.0.0)")
        parser.add_argument("--port", type=int, default=8080, help="Port for HTTP server (default: 8080)")
        parser.add_argument("--verbose", "-v", action="count")
        args = parser.parse_args()

        if args.verbose:
            logging.basicConfig(level=logging.DEBUG)
        else:
            logging.basicConfig(level=logging.INFO)

        import aiohttp_cors

        app = web.Application()
        app.on_shutdown.append(on_shutdown)
        
        # Configure CORS
        cors = aiohttp_cors.setup(app, defaults={
            "*": aiohttp_cors.ResourceOptions(
                allow_credentials=True,
                expose_headers="*",
                allow_headers="*",
                allow_methods="*",
            )
        })

        # Prefix all routes with /api/ to handle proxy
        app.router.add_post("/api/init-session", init_session)
        res_offer = app.router.add_post("/api/offer", offer)
        res_health = app.router.add_get("/api/health", lambda request: web.Response(text="OK"))
        res_heartbeat = app.router.add_get("/api/heartbeat", heartbeat)
        res_stream = app.router.add_post("/api/stream-process", stream_process)
        res_chat = app.router.add_post("/api/chat", chat)
        res_tts = app.router.add_post("/api/tts", tts)
        app.router.add_get("/api/report/{session_id}", get_report_handler)
        app.router.add_get("/api/session/{session_id}/data", get_session_data_handler)
        app.router.add_get("/api/get-session-details", get_session_details_handler)

        # Add CORS to all routes
        for route in list(app.router.routes()):
            cors.add(route)

        web.run_app(app, access_log=None, host=args.host, port=args.port)
    except Exception as e:
        print(f"FATAL CRASH: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
