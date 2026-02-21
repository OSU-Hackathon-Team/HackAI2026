from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import os
import uuid
import tempfile
import numpy as np
import librosa
import soundfile as sf
import requests

import sys
import os

parent_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if parent_dir not in sys.path:
    sys.path.append(parent_dir)

from supabase_client import supabase_logger
from dotenv import load_dotenv
from openai import OpenAI

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
        if session_id:
            supabase_logger.log_keyframe(
                session_id=session_id,
                timestamp_sec=float(question_index),
                keyframe_reason=f"Chat QA - Q{question_index + 1}",
                associated_transcript=f"Candidate: {user_text}\nAI: {ai_response}",
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
        
        y, sr = sf.read(temp_filepath)
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
        
        # Transcription
        with open(temp_filepath, "rb") as file_to_transcribe:
            transcription = client.audio.transcriptions.create(
                model="whisper-1",
                file=file_to_transcribe
            )
        
        text = transcription.text
        word_count = len(text.split())
        
        # Audio length using soundfile directly (faster than librosa.load)
        y, sr = sf.read(temp_filepath)
        if len(y.shape) > 1:
            y = y.mean(axis=1) # mono conversion
            
        duration = len(y) / sr
        
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
        
        # Log to Supabase
        if session_id:
            supabase_logger.log_keyframe(
                session_id=session_id,
                timestamp_sec=timestamp_sec,
                volume_rms=float(mean_rms),
                pitch_stdev=float(pitch_stdev),
                pacing_wpm=float(pacing_wpm),
                is_audibly_confident=bool(confidence_score >= 0.5),
                overall_confidence_score=float(confidence_score),
                keyframe_reason="Audio processed successfully",
                associated_transcript=text
            )
        
        return jsonify({
            "text": text,
            "metrics": {
                "pacing_wpm": float(pacing_wpm),
                "pacing_score": float(pacing_score),
                "confidence_score": float(confidence_score),
                "word_count": word_count,
                "duration_seconds": float(duration)
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
    # Run server
    app.run(debug=True, port=5000)
