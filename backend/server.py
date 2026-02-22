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
from openai import OpenAI, AsyncOpenAI
from google import genai
from google.genai import types
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
    
    sync_client = OpenAI()
    _async_client = None
    def get_async_client():
        global _async_client
        if _async_client is None:
            _async_client = AsyncOpenAI()
        return _async_client
        
    _gemini_client = None
    def get_gemini_client():
        global _gemini_client
        if _gemini_client is None:
            _gemini_client = genai.Client(api_key=os.environ.get("GEMINI_API_KEY", ""))
        return _gemini_client
        
    analyzer_engine = InterviewAnalyzerEngine()
    
    # Load base prompt constraints
    BASE_PROMPT = ""
    base_prompt_path = os.path.join(BACKEND_DIR, "prompts", "base_prompt.txt")
    if os.path.exists(base_prompt_path):
        with open(base_prompt_path, "r") as f:
            BASE_PROMPT = f.read()
            
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

TECH_ROLES = ["engineer", "developer", "architect", "scientist", "analyst", "devops", "qa", "security", "ml", "software", "programmer", "educator", "instructor", "coding", "programming"]


def is_tech_job(job_text):
    if not job_text: return False
    lower_job = job_text.lower()
    return any(role in lower_job for role in TECH_ROLES)

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
            transcription = await get_async_client().audio.transcriptions.create(model="whisper-1", file=f)
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
    try:
        reader = await request.multipart()
        resume_text = ""
        job_description = ""
        interviewer_persona_id = ""
        role = "Software Engineer"
        company = "AceIt"
        user_id = ""
        resume_filename = "resume.pdf"
        
        while True:
            part = await reader.next()
            if part is None: break
            if part.name == 'resume':
                resume_filename = getattr(part, 'filename', '') or 'resume.pdf'
                content = await part.read()
                if resume_filename.endswith('.pdf'):
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
            elif part.name == 'user_id':
                user_id = (await part.read()).decode('utf-8')

        # Load persona prompt
        persona_prompt = "You are an expert AI Interviewer."
        if interviewer_persona_id:
            persona_path = os.path.join(BACKEND_DIR, "prompts", "interviewers", f"{interviewer_persona_id}.json")
            if os.path.exists(persona_path):
                try:
                    with open(persona_path, 'r') as f:
                        data = json.load(f)
                        persona_prompt = f"PERSONA: {data.get('name')}\n"
                        persona_prompt += f"ROLE: {data.get('role')}\n"
                        persona_prompt += f"TRAITS: {data.get('traits')}\n\n"
                        persona_prompt += f"YOUR MISSION:\n{data.get('description')}\n"
                        if data.get('example_reaction'):
                            persona_prompt += f"\nEXAMPLE REACTION: {data.get('example_reaction')}"
                except Exception as e:
                    logger.error(f"Error loading persona JSON: {e}")


        system_prompt = (
            f"{BASE_PROMPT}\n\n"
            "--- CURRENT INTERVIEWER PERSONA ---\n"
            f"{persona_prompt}\n\n"
            "Based on the candidate's resume and the job description, "
            "introduce yourself briefly and ask an introductory question about their background. "
            "Keep it professional and concise (under 3 sentences)."
        )
        user_prompt = f"Resume:\n{resume_text}\n\nJob Description:\n{job_description}"
        
        # Immediate generation for first question
        gemini = get_gemini_client()
        response = await gemini.aio.models.generate_content(
            model="models/gemini-3-flash-preview",
            contents=user_prompt,
            config=types.GenerateContentConfig(
                system_instruction=system_prompt,
            )
        )
        initial_question = response.text or "Welcome. Tell me about your background."
        
        session_id = f"session-{uuid.uuid4().hex[:8]}"
        
        # Save metadata to Supabase (Initial)
        supabase_logger.save_session_metadata(session_id, role, company, user_id=user_id)
        
        # PERSIST RESUME: If we have a user_id, save the extracted resume text for future auto-fill
        if user_id and resume_text:
            logger.info(f"[PERSISTENCE] Saving resume for user {user_id}")
            supabase_logger.save_resume(user_id, resume_text, filename=resume_filename)
        
        return web.json_response({
            "session_id": session_id,
            "resume_text": resume_text,
            "job_text": job_description,
            "initial_question": initial_question
        })
    except Exception as e:
        import traceback
        traceback.print_exc()
        return web.json_response({"error": str(e)}, status=500)

async def get_latest_resume(request):
    """
    Fetch the most recently uploaded resume for a given user.
    """
    user_id = request.query.get("user_id")
    if not user_id:
        return web.json_response({"error": "user_id is required"}, status=400)
    
    resume = supabase_logger.get_latest_resume(user_id)
    if not resume:
        return web.json_response({"error": "No resume found for this user"}, status=404)
        
    return web.json_response({
        "resume_text": resume.get("resume_text"),
        "filename": resume.get("filename"),
        "created_at": resume.get("created_at")
    })

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
    pressure_score = data.get('pressure_score', 50)
    pressure_trend = data.get('pressure_trend', 'stable')
    history = data.get('history', [])
    current_code = data.get('code', '')

    # Format history for prompt context
    history_context = ""
    if history:
        history_context = "--- CONVERSATION HISTORY ---\n"
        for entry in history:
            speaker = "CANDIDATE" if entry.get('speaker') == 'user' else "INTERVIEWER"
            history_context += f"{speaker}: {entry.get('text')}\n"
        history_context += "\n"

    print(f"[DEBUG] /api/chat hit! session={session_id}, text='{user_text[:50]}...', index={question_index}")
    
    is_tech = is_tech_job(job_text)
    
    # Coding challenge logic:
    # Trigger after a few intro/technical questions if tech job.
    # We'll trigger it around question index 3-4.
    is_coding_phase = data.get('force_coding', False)
    if not is_coding_phase and is_tech:
        # If difficulty is high, maybe show twice. For now, let's target index 3.
        coding_trigger_indices = [3]
        if pressure_score > 70:
            coding_trigger_indices = [3, 5]
        
        if question_index in coding_trigger_indices:
            is_coding_phase = True

    # Load base persona prompt
    persona_prompt = "You are a professional technical interviewer for AceIt."
    if interviewer_persona_id:
        persona_path = os.path.join(BACKEND_DIR, "prompts", "interviewers", f"{interviewer_persona_id}.json")
        if os.path.exists(persona_path):
            try:
                with open(persona_path, 'r') as f:
                    data = json.load(f)
                    persona_prompt = f"PERSONA: {data.get('name')}\n"
                    persona_prompt += f"ROLE: {data.get('role')}\n"
                    persona_prompt += f"TRAITS: {data.get('traits')}\n\n"
                    persona_prompt += f"YOUR MISSION:\n{data.get('description')}\n"
                    if data.get('example_reaction'):
                        persona_prompt += f"\nEXAMPLE REACTION: {data.get('example_reaction')}"
            except Exception as e:
                logger.error(f"Error loading persona JSON: {e}")


    # ── CHESS ENGINE: Adaptive Difficulty Tiers (HARSHER) ─────────────────────────────
    if pressure_score < 20:
        # ── TIER 0: FIRM PROFESSIONAL ─────────────────────────────────────────
        difficulty_mode = (
            "PERSONA: You are a firm, professional interviewer. "
            "The candidate is struggling, but you must maintain high standards. "
            "Ask a fundamental technical question. Do not give them the answer. "
            "If they fumble, ask them to clarify exactly what they mean. "
            "Your tone is entirely neutral. Do not be overly supportive."
        )
    elif pressure_score < 40:
        # ── TIER 1: STRICT EXAMINER ──────────────────────────────────────────
        difficulty_mode = (
            "PERSONA: You are a strict engineering examiner. "
            "Ask sharp questions with a specific correct answer in mind. "
            "Do not accept partial answers easily. Point out flaws in their logic immediately. "
            "Your tone is serious and expectant. Give no hints."
        )
    elif pressure_score < 60:
        # ── TIER 2: SKEPTICAL SENIOR ──────────────────────────────────────────
        difficulty_mode = (
            "PERSONA: You are a highly skeptical senior engineer. "
            "Every answer gets a follow-up: 'But what happens when X fails?', 'Give me a concrete example.', 'Walk me through the trade-offs.' "
            "You do not accept vague or theoretical answers. Interrupt generalities with 'But specifically, how?' "
            "Your tone is dry, mildly impatient. Give minimal praise."
        )
    elif pressure_score < 80:
        # ── TIER 3: ELITE INTERROGATOR ────────────────────────────────────────
        difficulty_mode = (
            "PERSONA: You are an elite engineering interrogator conducting a principal-level interview. "
            "You question every assumption. After their answer, immediately pivot to the hardest sub-problem. "
            "Give NO encouragement. If they answer well, simply say 'Okay.' and move to a harder angle. "
            "If they waffle, cut them off abruptly. "
            "Your tone is cold, precise, and relentless. Search for their limits."
        )
    else:
        # ── TIER 4: MAXIMUM ANTAGONISM ────────────────────────────────────────
        difficulty_mode = (
            "PERSONA: You are conducting the most brutal technical interview possible. "
            "Treat every answer as flawed by default. Ask about extreme edge cases, timing attacks, or Byzantine faults. "
            "Use terse, cold reactions: 'That approach breaks entirely in production because...' "
            "Interrupt immediately if they hesitate. "
            "You give zero positive reinforcement. Dismantle their system design ruthlessly."
        )

    if is_coding_phase:
        difficulty_mode = (
            "CONVERSATIONAL MODE: You are guiding the candidate through a live coding challenge in Python. "
            "TAILOR THE TASK: The question MUST be directly relevant to the specific Job Description and the Candidate's Resume provided. "
            "IMPORTANT: If the user just skipped to this phase, start immediately with 'Let's move on to the coding question.' followed by a full, detailed task. "
            "You must NOT divulge the solution or write code for them. "
            "Instead, talk with them to understand their technical approach. "
            "Ask sharp, clarifying questions. Avoid empathy puffery. "
            "Keep it technical, cold, and direct. "
        )

    # Trend modifier: if score is rising fast, lean harder into the tier
    trend_modifier = ""
    if pressure_trend == "rising":
        trend_modifier = " [TREND: RISING — the candidate is performing well and improving. Increase difficulty within your current persona. Raise the bar now.]"
    elif pressure_trend == "falling":
        trend_modifier = " [TREND: FALLING — the candidate is struggling. Ease up slightly. Focus on confidence recovery without drastically changing your persona.]"

    system_prompt = (
        f"{BASE_PROMPT}\n\n"
        f"--- CURRENT INTERVIEWER PERSONA ---\n"
        f"{persona_prompt}\n\n"
        f"{history_context}"
        f"--- ADAPTIVE DIFFICULTY INSTRUCTION ---\n"
        f"{difficulty_mode}{trend_modifier}\n\n"
        "Keep your response under 3 sentences. "
        + ("" if is_coding_phase else "First, react to the candidate's last answer in 1 sentence (do not be generic). ") +
        f"\nContext - Job Description: {job_text[:300]}... Resume Summary: {resume_text[:300]}...\n\n"
        "CRITICAL GRADING INSTRUCTION: You MUST evaluate the candidate's last answer and assign a quality score A (0.0 to 1.0).\n"
        "IMPORTANT: Decouple your persona's tone from this grade. Even if your persona is skeptical, aggressive, or cold, you MUST give a high score (0.8-1.0) if the candidate provides specific, deep technical details (e.g., race conditions, idempotency, architectural trade-offs).\n"
        "Scoring Rubric (BE OBJECTIVE AND REWARD TECHNICAL DEPTH):\n"
        "- 0.0-0.1: Says 'no', one-word/vague answer, deflects, or low effort.\n"
        "- 0.2-0.3: Basic but incomplete or factually weak answer.\n"
        "- 0.4-0.6: Solid, standard technical answer covering the basics.\n"
        "- 0.7-0.8: Strong technical answer with specific architectural details or complex problem solving.\n"
        "- 0.9-1.0: Mastery. Exceptional depth, trade-offs, scalability, and specific advanced technical concepts.\n"
        "\n"
        "At the VERY END of your response, you MUST output a score tag in this EXACT format: [SCORE: 0.95]. "
    )
    if is_coding_phase:
        system_prompt += (
            "\n\nLIVE CODING CONTEXT:\n"
            f"Current Python Code: \n```python\n{current_code}\n```\n"
            "Evaluate the code quality and the candidate's explanation. "
            "If the code is incomplete, that's okay, you are in-progress. "
            "Encourage them to continue or explain a specific part."
        )

    # Determine if this is the start of the interview
    # If question_index is 0 and user_text is empty, it's a fallback for the intro
    is_initial = (question_index == 0 and not user_text.strip())
    is_skip = not user_text.strip() and not is_initial
    
    if is_initial:
        # ── INITIAL PROMPT: INTRODUCTION ──────────────────────────────────────────
        prompt = (
            "You are an technical interviewer. Please introduce yourself briefly (name/role) "
            "based on your persona, then ask a strong introductory question about the candidate's "
            "background or their interest in the role. "
            "CRITICAL: Start your response with a clear greeting (e.g., 'Hello!', 'Hi there!', 'Welcome!') "
            "to ensure the user starts hearing you immediately."
        )
        is_finished = False
        next_index = 0
    elif is_coding_phase:
        # Coding Challenge Prompt
        is_starting_coding = "[SYSTEM: The user has requested to skip" in user_text or (not current_code.strip() or current_code.startswith("# Live Coding"))
        if is_starting_coding:
            prompt = (
                "The user is ready for the live coding challenge. "
                "BASED ON THE JOB DESCRIPTION AND RESUME provided in the system context, "
                "PRESENT A SPECIFIC, RELEVANT Python coding challenge now. "
                "Describe the problem clearly, including requirements and any constraints. "
                "Start exactly with 'Let's move on to the coding question.' then the full task description. No fluff."
            )
        else:
            prompt = (
                f"The candidate is in the middle of a coding challenge. Current code: {current_code}. "
                f"They said: '{user_text}'. Ask a direct technical or guiding question "
                "to help them move forward or justify a decision. No fluff."
            )
        is_finished = False
        next_index = question_index + 1
    elif float(timestamp_sec) < 260.0:
        # ── INTERMEDIATE PROMPT: TECHNICAL FOLLOW-UP ───────────────────────────────
        prompt = (
            f"The candidate said: '{user_text}'. React to their answer in one sentence, "
            "then ask a technical follow-up question. The question MUST ask them how they "
            "would design a system, feature, or architecture that pertains to the job listing requirements."
        )
        is_finished = False
        next_index = question_index + 1
    else:
        # ── FINAL PROMPT: CONCLUSION ──────────────────────────────────────────────
        prompt = (
            f"The candidate said: '{user_text}'. React to their answer in one sentence, "
            "then thank them and professionally conclude the interview."
        )
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
        # Use stream=True for token-by-token delivery via Gemini
        gemini = get_gemini_client()
        stream = await gemini.aio.models.generate_content_stream(
            model="models/gemini-3-flash-preview",
            contents=prompt,
            config=types.GenerateContentConfig(
                system_instruction=system_prompt,
            )
        )

        print(f"[DEBUG] Starting Gemini stream for session={session_id}...")
        async for chunk in stream:
            if chunk.text:
                content = chunk.text
                full_ai_response += content
                safe_content = content[:20].replace('\n', ' ')
                print(f"[DEBUG] Sending token: '{safe_content}...'")
                # SSE Format: data: <payload>\n\n
                await response.write(f"data: {json.dumps({'token': content})}\n\n".encode())
            else:
                print(f"[DEBUG] Received empty or non-text chunk from Gemini")

        # Extract the score from the full response
        quality_score = 0.5 # Default
        import re
        # Case insensitive match for [SCORE: X.X]
        match = re.search(r"\[SCORE:\s*(\d+\.?\d*)\]", full_ai_response, re.IGNORECASE)
        if match:
            try:
                quality_score = float(match.group(1))
                print(f"[DEBUG] Extracted quality_score: {quality_score}")
                # Clean up the display text by removing the score tag
                full_ai_response = re.sub(r"\[SCORE:\s*\d+\.?\d*\]", "", full_ai_response, flags=re.IGNORECASE).strip()
            except Exception as e:
                print(f"[DEBUG] Failed to parse quality_score from match: {match.group(1)} - {e}")
                pass
        else:
            # Progressive fallbacks:
            # 1. Any bracketed number anywhere: [0.2]
            res = re.search(r"\[(\d+\.?\d*)]", full_ai_response)
            if not res:
                # 2. "Score: X" anywhere
                res = re.search(r"score:\s*(\d+\.?\d*)", full_ai_response, re.IGNORECASE)
            if not res:
                # 3. Any decimal number at the very end
                res = re.search(r"(\d\.\d+)\s*$", full_ai_response)
            
            if res:
                try:
                    quality_score = float(res.group(1))
                    print(f"[DEBUG] Robust extraction recovered: {quality_score}")
                except: pass

            if quality_score == 0.5:
                tail = full_ai_response[-100:].replace('\n', ' ')
                print(f"[DEBUG] Extraction failed. Raw tail: ...{tail}")

        # Send metadata at the end including the quality score A
        print(f"[DEBUG] Gemini stream complete. Total text length: {len(full_ai_response)}, score: {quality_score}")
        await response.write(f"data: {json.dumps({'done': True, 'full_text': full_ai_response, 'quality_score': quality_score, 'next_index': next_index, 'is_finished': is_finished, 'is_coding_phase': is_coding_phase})}\n\n".encode())

        # ── BACKGROUND: Supabase Logging & Analysis ──
        # Skip logging if this was a "safe skip" (empty response after intro)
        if is_skip:
            print(f"[DEBUG] Safe Skip detected for session={session_id}. Bypassing logging.")
            return

        # We wrap this in a top-level task so the SSE stream can end independently
        async def finalize_turn_async():
            try:
                if session_id:
                    # Offload the blocking HTTP request to a background thread
                    await asyncio.to_thread(
                        supabase_logger.log_keyframe,
                        session_id=session_id,
                        timestamp_sec=float(timestamp_sec),
                        interviewer_question=f"Dynamic Question {question_index}",
                        associated_transcript=user_text,
                        ai_response=full_ai_response,
                        keyframe_reason=f"AI Turn - Q{question_index + 1}"
                    )
                    
                    # Wait longer (10s) to give TTS and immediate playback a clear head start
                    await asyncio.sleep(10) 
                    
                    # Run full report analysis only every 3 turns to save on latency/crashes
                    if question_index % 3 == 0:
                        print(f"[DEBUG] background analysis starting for {session_id}...")
                        try:
                            # Use a timeout for the heavy analysis engine
                            report = await asyncio.wait_for(
                                analyzer_engine.generate_report(session_id, persona_prompt or "Standard Technical Interviewer"),
                                timeout=45.0
                            )
                            # Offload the blocking save report call to a background thread
                            await asyncio.to_thread(supabase_logger.save_report, session_id, report)
                            print(f"[DEBUG] background analysis complete for {session_id}")
                        except asyncio.TimeoutError:
                            print(f"[WARNING] background analysis timed out for {session_id}")
                        except Exception as e:
                            print(f"[ERROR] background analysis failed: {e}")
            except Exception as bg_err:
                logger.error(f"Background Finalization Error: {bg_err}")

        # No-op here, task fire moved to finally block or just before return
        pass

    except Exception as e:
        logger.error(f"Chat Stream Error: {e}")
        try:
            await response.write(f"data: {json.dumps({'error': str(e)})}\n\n".encode())
        except: pass
    
    finally:
        await response.write_eof()
        # Fire and forget WITHOUT awaiting in the handler, 
        # but do it AFTER eof is written to free up the stream
        if not is_skip and 'finalize_turn_async' in locals():
            asyncio.create_task(finalize_turn_async())

    return response

async def tts(request):
    data = await request.json()
    text = data.get('text', '')
    voice_name = data.get('voice', 'Puck')
    print(f"[DEBUG] /api/tts hit! Length: {len(text)} chars, Voice: {voice_name}")
    
    gemini = get_gemini_client()
    audio_prompt = f"Please read the following text aloud naturally and professionally:\n\n{text}"

    # Prepare the streaming response object but don't prepare/send headers yet
    response = web.StreamResponse(
        status=200,
        reason='OK',
        headers={
            'Content-Type': 'application/octet-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
        }
    )

    max_retries = 2
    for attempt in range(max_retries + 1):
        try:
            print(f"[DEBUG] Requesting streaming TTS from Gemini (Attempt {attempt+1})...")
            start_time = asyncio.get_event_loop().time()
            
            # 1. Initialize the stream coroutine
            gemini_stream_coro = gemini.aio.models.generate_content_stream(
                model="models/gemini-2.5-flash-preview-tts",
                contents=audio_prompt,
                config=types.GenerateContentConfig(
                    response_modalities=["AUDIO"],
                )
            )
            
            # 2. Get the stream iterator
            stream_it = await gemini_stream_coro
            
            # 3. Buffer the first chunk to ensure the stream is valid before sending headers
            headers_prepared = False
            
            async for chunk in stream_it:
                if not chunk.candidates or not chunk.candidates[0].content or not chunk.candidates[0].content.parts:
                    continue
                    
                part = chunk.candidates[0].content.parts[0]
                audio_bytes = None
                
                if hasattr(part, 'inline_data') and part.inline_data and part.inline_data.data:
                    audio_bytes = part.inline_data.data
                elif hasattr(part, 'blob') and part.blob and part.blob.data:
                    audio_bytes = part.blob.data
                
                if audio_bytes:
                    if not headers_prepared:
                        await response.prepare(request)
                        headers_prepared = True
                        first_time = asyncio.get_event_loop().time()
                        print(f"[DEBUG] Gemini TTS first chunk received in {first_time - start_time:.2f}s")
                    
                    await response.write(audio_bytes)

            if headers_prepared:
                await response.write_eof()
                end_time = asyncio.get_event_loop().time()
                print(f"[DEBUG] TTS stream complete in {end_time - start_time:.2f}s")
                return response
            else:
                # We finished the loop without ever getting audio bytes
                raise Exception("Gemini stream completed without sending any audio data.")

        except Exception as e:
            logger.error(f"Gemini TTS Error (Attempt {attempt+1}): {e}")
            if attempt < max_retries:
                # Wait a bit before retrying
                await asyncio.sleep(1)
                continue
            
            # If we already sent headers, we can't send a JSON error
            if 'headers_prepared' in locals() and headers_prepared:
                # The connection is already in an invalid state for a new response
                # Just close the stream
                return response
            
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

async def log_skip_handler(request):
    try:
        data = await request.json()
        session_id = data.get('session_id')
        question = data.get('question', 'Unknown Question')
        timestamp_sec = data.get('timestamp_sec', 0.0)
        
        if not session_id:
            return web.json_response({"error": "No session_id provided"}, status=400)
            
        supabase_logger.log_keyframe(
            session_id=session_id,
            timestamp_sec=float(timestamp_sec),
            interviewer_question=question,
            keyframe_reason="User Skip",
            associated_transcript="[USER SKIPPED QUESTION]"
        )
        print(f"[DEBUG] Skip event logged for session={session_id}: {question}")
        return web.json_response({"status": "success"})
    except Exception as e:
        logger.error(f"Log skip error: {e}")
        return web.json_response({"error": str(e)}, status=500)

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

async def save_session_handler(request):
    try:
        data = await request.json()
        session_id = data.get('session_id') or data.get('id') # Support both naming conventions
        user_id = data.get('user_id')
        role = data.get('role', 'Software Engineer')
        company = data.get('company', 'AceIt')
        
        # Metrics
        score = data.get('score', 0)
        gaze = data.get('gaze', 0)
        confidence = data.get('confidence', 0)
        composure = data.get('composure', 0)
        spikes = data.get('spikes', 0)
        date = data.get('date')

        if not session_id:
            return web.json_response({"error": "No session_id provided"}, status=400)
            
        supabase_logger.save_session_metadata(
            session_id=session_id,
            role=role,
            company=company,
            user_id=user_id,
            score=score,
            gaze=gaze,
            confidence=confidence,
            composure=composure,
            spikes=spikes,
            date=date
        )
        
        return web.json_response({"status": "success", "session_id": session_id})
    except Exception as e:
        logger.error(f"Save session error: {e}")
        return web.json_response({"error": str(e)}, status=500)

async def get_sessions_handler(request):
    user_id = request.query.get('user_id')
    if not user_id:
        return web.json_response({"error": "No user_id provided"}, status=400)
    
    sessions = supabase_logger.get_user_sessions(user_id)
    return web.json_response({"data": sessions})

async def get_session_details_handler(request):
    session_id = request.query.get('session_id')
    if not session_id:
        return web.json_response({"error": "No session_id provided"}, status=400)
    
    metadata = supabase_logger.get_session_metadata(session_id)
    if not metadata:
        return web.json_response({"error": "Session not found"}, status=404)
        
    return web.json_response({"data": metadata})

async def get_jobs_handler(request):
    jobs_dir = os.path.join(BACKEND_DIR, "prompts", "job_descriptions")
    jobs = []
    if os.path.exists(jobs_dir):
        for filename in sorted(os.listdir(jobs_dir)):
            if filename.endswith(".json"):
                with open(os.path.join(jobs_dir, filename), "r") as f:
                    try:
                        job_data = json.load(f)
                        job_data["id"] = filename.replace(".json", "")
                        jobs.append(job_data)
                    except Exception as e:
                        logger.error(f"Error loading job {filename}: {e}")
    return web.json_response({"jobs": jobs})

async def get_interviewers_handler(request):
    interviewers_dir = os.path.join(BACKEND_DIR, "prompts", "interviewers")
    interviewers = []
    if os.path.exists(interviewers_dir):
        # Sort files to maintain order if needed, but normally frontend might sort by sector/difficulty
        for filename in sorted(os.listdir(interviewers_dir)):
            if filename.endswith(".json"):
                try:
                    with open(os.path.join(interviewers_dir, filename), "r") as f:
                        interviewer_data = json.load(f)
                        # Ensure ID matches filename just in case
                        if "id" not in interviewer_data:
                            interviewer_data["id"] = filename.replace(".json", "")
                        interviewers.append(interviewer_data)
                except Exception as e:
                    logger.error(f"Error loading interviewer {filename}: {e}")
    return web.json_response({"interviewers": interviewers})


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
        app.router.add_get("/api/get-latest-resume", get_latest_resume)
        res_offer = app.router.add_post("/api/offer", offer)
        res_health = app.router.add_get("/api/health", lambda request: web.Response(text="OK"))
        res_heartbeat = app.router.add_get("/api/heartbeat", heartbeat)
        res_stream = app.router.add_post("/api/stream-process", stream_process)
        res_chat = app.router.add_post("/api/chat", chat)
        res_tts = app.router.add_post("/api/tts", tts)
        app.router.add_get("/api/report/{session_id}", get_report_handler)
        app.router.add_get("/api/session/{session_id}/data", get_session_data_handler)
        app.router.add_get("/api/get-session-details", get_session_details_handler)
        app.router.add_post("/api/save-session", save_session_handler)
        app.router.add_get("/api/get-sessions", get_sessions_handler)
        app.router.add_get("/api/jobs", get_jobs_handler)
        app.router.add_get("/api/interviewers", get_interviewers_handler)
        app.router.add_post("/api/log-skip", log_skip_handler)

        # Add CORS to all routes
        for route in list(app.router.routes()):
            cors.add(route)

        web.run_app(app, access_log=None, host=args.host, port=args.port)
    except Exception as e:
        print(f"FATAL CRASH: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
