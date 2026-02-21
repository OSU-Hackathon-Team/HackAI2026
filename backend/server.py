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
        VideoStreamProcessor, AudioStreamProcessor, DataChannelManager
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

    # Save audio to temp file
    temp_audio = os.path.join(tempfile.gettempdir(), f"{uuid.uuid4().hex}.webm")
    with open(temp_audio, 'wb') as f:
        f.write(audio_data)

    try:
        # 1. Transcribe
        with open(temp_audio, "rb") as f:
            transcription = client.audio.transcriptions.create(model="whisper-1", file=f)
        text = transcription.text
        word_count = len(text.split())

        # 2. Audio Metrics
        y, sr = librosa.load(temp_audio, sr=None)
        duration = librosa.get_duration(y=y, sr=sr)
        pacing_wpm = (word_count / duration) * 60 if duration > 0 else 0
        pacing_score = min(1.0, pacing_wpm / 200.0)

        zcr = librosa.feature.zero_crossing_rate(y)
        active_zcr = zcr[zcr > np.median(zcr)]
        pitch_stdev = (np.std(active_zcr) * 1000) if len(active_zcr) > 0 else 400
        pitch_score = max(0.0, 1.0 - (pitch_stdev / 400.0))
        mean_rms = np.mean(librosa.feature.rms(y=y))
        energy_score = min(1.0, mean_rms * 20.0)
        confidence_score = (pitch_score * 0.4) + (energy_score * 0.6)

        # 3. Video Metrics
        v_conf, v_gaze, v_fidget = 0.5, 0.8, 0.1
        if video_data:
            temp_video = os.path.join(tempfile.gettempdir(), f"v_{uuid.uuid4().hex}.webm")
            with open(temp_video, 'wb') as f: f.write(video_data)
            try:
                v_conf, v_gaze, v_fidget = await asyncio.to_thread(extract_video_metrics, temp_video)
            finally:
                if os.path.exists(temp_video): os.remove(temp_video)

        return web.json_response({
            "text": text,
            "metrics": {
                "pacing_wpm": float(pacing_wpm),
                "pacing_score": float(pacing_score),
                "confidence_score": float(confidence_score),
                "word_count": word_count,
                "duration_seconds": float(duration),
                "v_conf": float(v_conf),
                "v_gaze": float(v_gaze),
                "v_fidget": float(v_fidget),
                "volume_rms": float(mean_rms),
                "pitch_stdev": float(pitch_stdev)
            }
        })
    finally:
        if os.path.exists(temp_audio): os.remove(temp_audio)

async def init_session(request):
    reader = await request.multipart()
    resume_text = ""
    job_description = ""
    interviewer_persona_id = ""
    
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
        
        return web.json_response({
            "session_id": session_id,
            "first_question": first_question,
            "resume_text": resume_text,
            "job_text": job_description
        })
    except Exception as e:
        return web.json_response({"error": str(e)}, status=500)

async def chat(request):
    data = await request.json()
    user_text = data.get('text', '')
    question_index = data.get('question_index', 0)
    session_id = data.get('session_id')
    metrics = data.get('metrics', {})

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
    
    if question_index < 5: # Limit to 5 dynamic questions for now
        prompt = f"The candidate said: '{user_text}'. React to their answer in one sentence, then ask a relevant follow-up question based on the JD and Resume provided."
        is_finished = False
        next_index = question_index + 1
    else:
        prompt = f"The candidate said: '{user_text}'. React to their answer in one sentence, then thank them and conclude the interview."
        is_finished = True
        next_index = question_index

    try:
        completion = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "system", "content": system_prompt}, {"role": "user", "content": prompt}]
        )
        ai_response = completion.choices[0].message.content
        
        if session_id:
            # Use a dummy question text for logging if it's dynamic
            q_text = f"Dynamic Question {question_index}" 
            supabase_logger.log_keyframe(
                session_id=session_id,
                timestamp_sec=float(question_index),
                interviewer_question=q_text,
                associated_transcript=user_text,
                ai_response=ai_response,
                volume_rms=metrics.get('volume_rms'),
                pitch_stdev=metrics.get('pitch_stdev'),
                pacing_wpm=metrics.get('pacing_wpm'),
                is_audibly_confident=metrics.get('confidence_score', 0) >= 0.5,
                gaze_score=metrics.get('v_gaze'),
                fidget_index=metrics.get('v_fidget'),
                is_visually_confident=metrics.get('v_conf', 0) >= 0.5,
                overall_confidence_score=metrics.get('confidence_score'),
                keyframe_reason=f"Unified Turn - Q{question_index + 1}"
            )
            
            # Trigger background analysis
            async def run_analysis():
                try:
                    report = await analyzer_engine.generate_report(session_id, "Standard Technical Interviewer")
                    print(f"\n--- INTERVIEW ANALYSIS REPORT ({session_id}) ---\n{report}\n")
                except Exception as ex:
                    print(f"Analysis Error: {ex}")
            
            asyncio.create_task(run_analysis())

        return web.json_response({"ai_response": ai_response, "next_index": next_index, "is_finished": is_finished})
    except Exception as e:
        return web.json_response({"error": str(e)}, status=500)

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
    """
    WebRTC Offer Endpoint: /api/offer
    
    How to use:
    1. The client (frontend) should create an RTCPeerConnection and add their webcam
       video and audio tracks to it. Give the frontend audio and video media streams.
    2. The client generates an SDP offer and sends it via POST request to this endpoint
       with a JSON payload containing `sdp` and `type` fields.
    3. The server processes the offer, sets up listeners for incoming media tracks,
       creates an SDP answer, and returns it to the client.
    4. The client applies the SDP answer to establish the WebRTC connection.
    5. The server will receive the video/audio streams on the 'track' event.

    Example JSON payload from client:
    {
        "sdp": "v=0\r\no=- 4209 ...",
        "type": "offer"
    }
    """
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

        # Add CORS to all routes
        for route in list(app.router.routes()):
            cors.add(route)

        web.run_app(app, access_log=None, host=args.host, port=args.port)
    except Exception as e:
        print(f"FATAL CRASH: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
