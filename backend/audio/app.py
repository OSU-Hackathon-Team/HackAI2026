from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import os
import uuid
import tempfile
import numpy as np
import librosa
import soundfile as sf
import requests
import time
import cv2
import torch
import torch.nn.functional as F
import mediapipe as mp
from mediapipe.tasks import python
from mediapipe.tasks.python import vision
from scipy.interpolate import interp1d

import sys
import os

parent_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if parent_dir not in sys.path:
    sys.path.append(parent_dir)

from supabase_client import supabase_logger
from dotenv import load_dotenv
from openai import OpenAI
from video.models import VisualConfidenceModel

load_dotenv() # Load variables from .env

app = Flask(__name__)
CORS(app)

# Note: Ensure OPENAI_API_KEY and ELEVENLABS_API_KEY are set in environment variables
client = OpenAI()

INTERVIEW_QUESTIONS = [
    "Welcome to Ace It. To start, can you tell me a bit about your experience with AI and machine learning?",
    "That's interesting. How do you approach debugging a complex problem in your code?",
    "Great. Finally, why are you interested in this specific project for HackAI?"
]

# --- VIDEO CONFIG ---
MODELS_DIR = os.path.join(parent_dir, "models")
VISUAL_MODEL_PATH = os.path.join(MODELS_DIR, "visual_confidence.pth")
FACE_TASK_PATH = os.path.join(MODELS_DIR, "face_landmarker.task")
HAND_TASK_PATH = os.path.join(MODELS_DIR, "hand_landmarker.task")
INPUT_DIM = 178
SEQUENCE_LENGTH = 30
WINDOW_SIZE_MS = 1000

# Global Model & MP Initialization
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
visual_model = VisualConfidenceModel(input_dim=INPUT_DIM)
if os.path.exists(VISUAL_MODEL_PATH):
    visual_model.load_state_dict(torch.load(VISUAL_MODEL_PATH, map_location=device))
visual_model.to(device).eval()

# MediaPipe
base_options = python.BaseOptions(model_asset_path=FACE_TASK_PATH)
face_options = vision.FaceLandmarkerOptions(
    base_options=base_options,
    output_face_blendshapes=True,
    num_faces=1,
    running_mode=vision.RunningMode.IMAGE)
face_landmarker = vision.FaceLandmarker.create_from_options(face_options)

hand_base_options = python.BaseOptions(model_asset_path=HAND_TASK_PATH)
hand_options = vision.HandLandmarkerOptions(
    base_options=hand_base_options,
    num_hands=2,
    running_mode=vision.RunningMode.IMAGE)
hand_landmarker = vision.HandLandmarker.create_from_options(hand_options)

def process_mediapipe_results(face_result, hand_result):
    bs = [0.0] * 52
    if face_result and face_result.face_blendshapes:
        bs = [b.score for b in face_result.face_blendshapes[0]]
    lh = np.zeros(63)
    rh = np.zeros(63)
    if hand_result and hand_result.hand_landmarks:
        for i, hand_lms in enumerate(hand_result.hand_landmarks):
            if i < len(hand_result.handedness):
                side = hand_result.handedness[i][0].category_name
                landmarks = np.array([[lm.x, lm.y, lm.z] for lm in hand_lms]).flatten()
                if side.lower() == 'left': lh = landmarks
                else: rh = landmarks
    return np.concatenate([bs, lh, rh])

def extract_video_metrics(video_path):
    try:
        cap = cv2.VideoCapture(video_path)
        feature_history = []
        frame_count = 0
        
        while cap.isOpened():
            ret, frame = cap.read()
            if not ret: break
            
            frame_count += 1
            if frame_count % 3 != 0: continue # Skip more frames for speed
            
            rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb_frame)
            timestamp_ms = int(cap.get(cv2.CAP_PROP_POS_MSEC))
            
            face_res = face_landmarker.detect(mp_image)
            hand_res = hand_landmarker.detect(mp_image)
            feat = process_mediapipe_results(face_res, hand_res)
            feature_history.append((timestamp_ms, feat))
            
        cap.release()
        
        if len(feature_history) < 5:
            return 0.5, 0.8, 0.1 # Defaults
            
        # Visual Confidence Inference
        window_data = np.array([f for t, f in feature_history])
        window_times = np.array([t for t, f in feature_history])
        target_ts = np.linspace(window_times[0], window_times[-1], SEQUENCE_LENGTH)
        
        f_interp = interp1d(window_times, window_data, axis=0, kind='linear', fill_value="extrapolate")
        resampled_seq = f_interp(target_ts)
        input_tensor = torch.FloatTensor(resampled_seq).unsqueeze(0).to(device)
        
        with torch.no_grad():
            logits = visual_model(input_tensor)
            probs = F.softmax(logits, dim=1)
            visual_confidence = probs[0][1].item()

        # Heuristics for Gaze and Fidget
        face_feats = window_data[:, :52]
        gaze_score = 1.0 - np.mean(face_feats[:, 13:15]) 
        
        hand_feats = window_data[:, 52:]
        fidget_index = min(1.0, np.std(hand_feats) * 5.0) 
        
        return float(visual_confidence), float(gaze_score), float(fidget_index)
    except Exception as e:
        import traceback
        traceback.print_exc()
        return 0.5, 0.8, 0.1

@app.route('/heartbeat', methods=['GET'])
def heartbeat():
    return jsonify({"status": "healthy", "message": "AceIt Backend is live!"})

@app.route('/transcribe', methods=['POST'])
def transcribe():
    if 'audio' not in request.files:
        return jsonify({"error": "No audio file provided"}), 400
    
    audio_file = request.files['audio']
    temp_filename = f"{uuid.uuid4().hex}.webm"
    temp_filepath = os.path.join(tempfile.gettempdir(), temp_filename)
    
    try:
        audio_file.save(temp_filepath)
        
        with open(temp_filepath, "rb") as file_to_transcribe:
            transcription = client.audio.transcriptions.create(
                model="whisper-1",
                file=file_to_transcribe
            )
            
        return jsonify({"text": transcription.text})
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        if os.path.exists(temp_filepath):
            try:
                os.remove(temp_filepath)
            except Exception as e:
                print(f"Failed to delete temp file {temp_filepath}: {e}")

@app.route('/chat', methods=['POST'])
def chat():
    data = request.json
    if not data:
        return jsonify({"error": "No JSON data provided"}), 400
    
    user_text = data.get('text', '')
    question_index = data.get('question_index', 0)
    
    system_prompt = (
        "You are a professional technical interviewer for AceIt. "
        "Keep your response concise, encouraging, and under 3 sentences. "
        "First, react to the candidate's answer in exactly 1 sentence. "
    )
    
    if question_index < len(INTERVIEW_QUESTIONS):
        next_question = INTERVIEW_QUESTIONS[question_index]
        prompt = f"The candidate said: '{user_text}'. React to their answer in one sentence, then ask this next question: '{next_question}'."
        is_finished = False
        next_index = question_index + 1
    else:
        prompt = f"The candidate said: '{user_text}'. React to their answer in one sentence, then thank them and conclude the interview."
        is_finished = True
        next_index = question_index
        
    try:
        completion = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": prompt}
            ]
        )
        ai_response = completion.choices[0].message.content
        
        session_id = data.get('session_id')
        metrics = data.get('metrics', {})
        
        if session_id:
            # Determine the question that was just answered
            q_text = "Intro / Start"
            if 0 <= question_index < len(INTERVIEW_QUESTIONS):
                q_text = INTERVIEW_QUESTIONS[question_index]
            
            supabase_logger.log_keyframe(
                session_id=session_id,
                timestamp_sec=float(question_index),
                interviewer_question=q_text,
                associated_transcript=user_text,
                ai_response=ai_response,
                # Metrics from payload if available
                volume_rms=metrics.get('volume_rms'),
                pitch_stdev=metrics.get('pitch_stdev'),
                pacing_wpm=metrics.get('pacing_wpm'),
                is_audibly_confident=metrics.get('confidence_score', 0) >= 0.5,
                gaze_score=metrics.get('v_gaze'),
                fidget_index=metrics.get('v_fidget'),
                is_visually_confident=metrics.get('v_conf', 0) >= 0.5,
                overall_confidence_score=metrics.get('confidence_score'),
                keyframe_reason=f"Unified Turn - Q{question_index + 1}",
                severity="neutral"
            )

        return jsonify({
            "ai_response": ai_response,
            "next_index": next_index,
            "is_finished": is_finished
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/tts', methods=['POST'])
def tts():
    data = request.json
    if not data or 'text' not in data:
        return jsonify({"error": "No text provided"}), 400
        
    text = data['text']
    
    try:
        temp_filename = f"{uuid.uuid4().hex}.mp3"
        temp_filepath = os.path.join(tempfile.gettempdir(), temp_filename)
        
        with client.audio.speech.with_streaming_response.create(
            model="tts-1",
            voice="nova",
            input=text
        ) as response:
            response.stream_to_file(temp_filepath)
                    
        return send_file(temp_filepath, mimetype="audio/mpeg", as_attachment=False)
        # Note: the temp file isn't deleted here. Real implementation might use an after_request cleanup or in-memory file.
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/score', methods=['POST'])
def score():
    if 'audio' not in request.files:
        return jsonify({"error": "No audio file provided"}), 400
        
    audio_file = request.files['audio']
    temp_filename = f"{uuid.uuid4().hex}.webm"
    temp_filepath = os.path.join(tempfile.gettempdir(), temp_filename)
    
    try:
        audio_file.save(temp_filepath)
        
        # Audio Analysis
        y, sr = librosa.load(temp_filepath, sr=None)
        if len(y.shape) > 1:
            y = y.mean(axis=1) # downmix to mono if needed
            
        # Optimization: Skip STFT/piptrack. Use Zero-Crossing Rate to measure "pitch stability/variance".
        zcr = librosa.feature.zero_crossing_rate(y)
        active_zcr = zcr[zcr > np.median(zcr)]
        
        if len(active_zcr) > 0:
            pitch_stdev = np.std(active_zcr) * 1000 # Scaling factor to roughly match 0-400 range of piptrack std
        else:
            pitch_stdev = 400 
            
        pitch_score = max(0.0, 1.0 - (pitch_stdev / 400.0))
        
        # Energy (Volume)
        rms = librosa.feature.rms(y=y)
        mean_rms = np.mean(rms)
        energy_score = min(1.0, mean_rms * 20.0)
        
        final_score = (pitch_score * 0.4) + (energy_score * 0.6)
        
        # Clamp score 0.1 - 1.0
        final_score = max(0.1, min(1.0, final_score))
        
        return jsonify({
            "final_score": final_score,
            "metrics": {
                "pitch_score": float(pitch_score),
                "energy_score": float(energy_score),
                "pitch_stdev": float(pitch_stdev),
                "mean_rms": float(mean_rms)
            }
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        if os.path.exists(temp_filepath):
            try:
                os.remove(temp_filepath)
            except Exception as e:
                print(f"Failed to delete temp file {temp_filepath}: {e}")

@app.route('/stream-process', methods=['POST'])
def stream_process():
    if 'audio' not in request.files:
        return jsonify({"error": "No audio file provided"}), 400
        
    audio_file = request.files['audio']
    temp_filename = f"{uuid.uuid4().hex}.webm"
    temp_filepath = os.path.join(tempfile.gettempdir(), temp_filename)
    
    try:
        audio_file.save(temp_filepath)
        
        # Check if the file is extremely small or empty (Whisper API crashes on 0-byte files)
        if os.path.getsize(temp_filepath) < 100:
            return jsonify({"error": "Audio recording is too short or empty"}), 400
            
        # Transcription
        with open(temp_filepath, "rb") as file_to_transcribe:
            transcription = client.audio.transcriptions.create(
                model="whisper-1",
                file=file_to_transcribe
            )
        
        text = transcription.text
        word_count = len(text.split())
        
        # Audio length using librosa (since soundfile cannot decode webm)
        y, sr = librosa.load(temp_filepath, sr=None)
        duration = librosa.get_duration(y=y, sr=sr)
        
        # Pacing: (word_count / duration * 60). Normalize against a 200 WPM max.
        pacing_wpm = (word_count / duration) * 60 if duration > 0 else 0
        pacing_score = min(1.0, pacing_wpm / 200.0)
        
        # Extract session info
        session_id = request.form.get('session_id')
        timestamp_sec = float(request.form.get('timestamp_sec', 0.0))
        
        # Combined Confidence: Faster heuristics for pitch variance and volume
        zcr = librosa.feature.zero_crossing_rate(y)
        active_zcr = zcr[zcr > np.median(zcr)]
        pitch_stdev = (np.std(active_zcr) * 1000) if len(active_zcr) > 0 else 400
        pitch_score = max(0.0, 1.0 - (pitch_stdev / 400.0))
        
        mean_rms = np.mean(librosa.feature.rms(y=y))
        energy_score = min(1.0, mean_rms * 20.0)
        
        confidence_score = (pitch_score * 0.4) + (energy_score * 0.6)
        
        # Multimodal Integration: Extract Video Metrics if available
        video_file = request.files.get('video')
        v_conf, v_gaze, v_fidget = 0.5, 0.8, 0.1 # Defaults
        
        if video_file:
            v_filename = f"v_{uuid.uuid4().hex}.webm"
            v_path = os.path.join(tempfile.gettempdir(), v_filename)
            video_file.save(v_path)
            try:
                v_conf, v_gaze, v_fidget = extract_video_metrics(v_path)
            except Exception as ve:
                print(f"Video extraction failed: {ve}")
            finally:
                if os.path.exists(v_path): os.remove(v_path)
        
        return jsonify({
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
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        if os.path.exists(temp_filepath):
            try:
                os.remove(temp_filepath)
            except Exception as e:
                print(f"Failed to delete temp file {temp_filepath}: {e}")

if __name__ == '__main__':
    print("Starting Flask server on http://127.0.0.1:5000")
    app.run(debug=False, port=5000)
