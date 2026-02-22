import asyncio
import io
import time
import json
import numpy as np
import torch
import torch.nn.functional as F
import mediapipe as mp
from mediapipe.tasks import python
from mediapipe.tasks.python import vision
from scipy.interpolate import interp1d
import os
import av
import whisper
import re

class SpeechAnalyzer:
    """
    Analyzes transcript text for filler words and estimates performance tone.
    """
    FILLER_WORDS = [r'\bum+h?\b', r'\buh\b', r'\ber\b', r'\bah\b', r'\blike\b', r'\bu+h+m+\b', r'\byou know\b', r'\bi mean\b']
    
    POSITIVE_KEYWORDS = ["definitely", "absolutely", "passionate", "excited", "expertise", "solved", "achieved", "learned"]
    NEGATIVE_KEYWORDS = ["unsure", "maybe", "i guess", "probably", "not sure", "don't know", "struggled"]

    @classmethod
    def analyze(cls, text: str):
        text_lower = text.lower()
        
        # Count fillers
        filler_count = 0
        for pattern in cls.FILLER_WORDS:
            filler_count += len(re.findall(pattern, text_lower))
            
        # Estimate Tone (0.0 to 1.0, where 0.5 is neutral)
        sentiment = 0.5
        pos_matches = sum(1 for word in cls.POSITIVE_KEYWORDS if word in text_lower)
        neg_matches = sum(1 for word in cls.NEGATIVE_KEYWORDS if word in text_lower)
        
        if pos_matches > neg_matches:
            sentiment = min(1.0, 0.5 + (pos_matches * 0.1))
        elif neg_matches > pos_matches:
            sentiment = max(0.0, 0.5 - (neg_matches * 0.1))
            
        return {
            "filler_count": filler_count,
            "sentiment": sentiment
        }

from video.models import VisualConfidenceModel, AudioConfidenceModel

# Setup paths
BACKEND_DIR = os.path.dirname(os.path.abspath(__file__))
MODELS_DIR = os.path.join(BACKEND_DIR, "models")

MODEL_PATH = os.path.join(MODELS_DIR, "visual_confidence.pth")
AUDIO_MODEL_PATH = os.path.join(MODELS_DIR, "audio_confidence.pth")
FACE_TASK_PATH = os.path.join(MODELS_DIR, "face_landmarker.task")
HAND_TASK_PATH = os.path.join(MODELS_DIR, "hand_landmarker.task")

INPUT_DIM = 178
SEQUENCE_LENGTH = 30
WINDOW_SIZE_MS = 1000

# Global AI Initializations
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

# Visual model (LAZY)
_visual_model = None

def get_visual_model():
    global _visual_model
    if _visual_model is None:
        try:
            _visual_model = VisualConfidenceModel(input_dim=INPUT_DIM)
            if os.path.exists(MODEL_PATH):
                _visual_model.load_state_dict(torch.load(MODEL_PATH, map_location=device))
            _visual_model.to(device).eval()
        except Exception as e:
            print(f"Warning: Visual model init failed. {e}")
    return _visual_model

# MediaPipe Initializations (LAZY to avoid initialization crashes on import)
_face_landmarker = None
_hand_landmarker = None

def get_landmarkers():
    global _face_landmarker, _hand_landmarker
    if _face_landmarker is None or _hand_landmarker is None:
        try:
            face_opts = vision.FaceLandmarkerOptions(
                base_options=python.BaseOptions(model_asset_path=FACE_TASK_PATH),
                output_face_blendshapes=True,
                num_faces=1,
                running_mode=vision.RunningMode.IMAGE)
            _face_landmarker = vision.FaceLandmarker.create_from_options(face_opts)

            hand_opts = vision.HandLandmarkerOptions(
                base_options=python.BaseOptions(model_asset_path=HAND_TASK_PATH),
                num_hands=2,
                running_mode=vision.RunningMode.IMAGE)
            _hand_landmarker = vision.HandLandmarker.create_from_options(hand_opts)
        except Exception as e:
            print(f"Warning: MediaPipe init failed. {e}")
    return _face_landmarker, _hand_landmarker

# Global Whisper Model (Disabled to avoid WinError 6 on Windows, using OpenAI API instead)
whisper_model = None
# try:
#     print("Loading Whisper model...")
#     whisper_model = whisper.load_model("tiny", device=device)
#     print("Whisper model loaded!")
# except Exception as e:
#     whisper_model = None
#     print(f"Failed to load whisper model: {e}")

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
                if side.lower() == 'left':
                    lh = landmarks
                else:
                    rh = landmarks
    return np.concatenate([bs, lh, rh])

class VideoStreamProcessor:
    def __init__(self, track, datachannel_manager):
        self.track = track
        self.datachannel_manager = datachannel_manager
        self.feature_history = []
        self.device = device
        self.model = get_visual_model() # Use lazy global
        self.face_landmarker, self.hand_landmarker = get_landmarkers()
        self.task = asyncio.create_task(self._process_stream())

    def process_mediapipe_results(self, face_result, hand_result):
        # Delegate to global function
        return process_mediapipe_results(face_result, hand_result)

    def do_inference(self):
        if len(self.feature_history) < 10: return 0.5, 0.8, 0.1
        now_ms = self.feature_history[-1][0]
        start_ms = now_ms - WINDOW_SIZE_MS
        window_data = [f for t, f in self.feature_history if t >= start_ms]
        window_times = [t for t, f in self.feature_history if t >= start_ms]
        if len(window_data) < 5: return 0.5, 0.8, 0.1

        window_data = np.array(window_data)
        window_times = np.array(window_times)
        
        # Calculate real-time Gaze and Fidget
        face_feats = window_data[:, :52]
        gaze_score = 1.0 - np.mean(face_feats[:, 13:15]) 
        hand_feats = window_data[:, 52:]
        fidget_index = min(1.0, np.std(hand_feats) * 5.0) 

        target_ts = np.linspace(window_times[0], window_times[0] + WINDOW_SIZE_MS, SEQUENCE_LENGTH)

        try:
            f_interp = interp1d(window_times, window_data, axis=0, kind='linear', fill_value="extrapolate")
            resampled_seq = f_interp(target_ts)
            input_tensor = torch.FloatTensor(resampled_seq).unsqueeze(0).to(self.device)
            with torch.no_grad():
                logits = self.model(input_tensor)
                probs = F.softmax(logits, dim=1)
                conf = probs[0][1].item() # CONFIDENT score
            
            return float(conf), float(gaze_score), float(fidget_index)
        except Exception:
            return 0.5, float(gaze_score), float(fidget_index)

    async def _process_stream(self):
        start_time = time.time()
        last_inference_time = 0

        while True:
            try:
                frame = await self.track.recv()
                img = frame.to_ndarray(format="rgb24")
                timestamp_ms = int((time.time() - start_time) * 1000)

                mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=img)
                if self.face_landmarker and self.hand_landmarker:
                    # MediaPipe requires calling it from the same thread normally
                    # For aio we can do it synchronous as a prototype or wrap in executor
                    await asyncio.to_thread(self._detect_and_buffer, mp_image, timestamp_ms)

                current_time = time.time()
                if current_time - last_inference_time > 1.0: # Run every 1s
                    last_inference_time = current_time
                    conf, gaze, fidget = await asyncio.to_thread(self.do_inference)
                    
                    self.datachannel_manager.send_json({
                        "type": "video_inference",
                        "confidence": conf,
                        "gaze": gaze,
                        "fidget": fidget,
                        "timestamp": timestamp_ms
                    })

                 # Cleanup buffer
                while self.feature_history and self.feature_history[0][0] < timestamp_ms - 2000:
                    self.feature_history.pop(0)

            except av.error.EOFError:
                break
            except Exception as e:
                err_str = str(e)
                if "Connection lost" not in err_str and "Stream connection lost" not in err_str and "Track was closed" not in err_str:
                    print(f"Video iteration error: {e}")
                break

    def _detect_and_buffer(self, mp_image, timestamp_ms):
        try:
            if not self.face_landmarker or not self.hand_landmarker: return
            face_result = self.face_landmarker.detect(mp_image)
            hand_result = self.hand_landmarker.detect(mp_image)
            feat = self.process_mediapipe_results(face_result, hand_result)
            if feat is not None:
                self.feature_history.append((timestamp_ms, feat))
        except Exception as e:
            pass # Suppress mp errors

class AudioStreamProcessor:
    def __init__(self, track, datachannel_manager):
        self.track = track
        self.datachannel_manager = datachannel_manager
        
        # Audio confidence model
        self.audio_model = AudioConfidenceModel(embedding_dim=384)
        if os.path.exists(AUDIO_MODEL_PATH):
            self.audio_model.load_state_dict(torch.load(AUDIO_MODEL_PATH, map_location=device))
        self.audio_model.to(device).eval()

        self.resampler = av.AudioResampler(format='s16', layout='mono', rate=16000)
        self.task = asyncio.create_task(self._process_stream())

    def _process_audio_chunk(self, audio_data):
        if whisper_model is None: return

        # audio_data: np.array of float32 around (-1, 1), shape (N,)
        audio_tensor = whisper.pad_or_trim(audio_data.flatten())
        mel = whisper.log_mel_spectrogram(audio_tensor, n_mels=whisper_model.dims.n_mels).to(whisper_model.device)
        
        with torch.no_grad():
            # 1. Transcript
            options = whisper.DecodingOptions(language="en", fp16=False)
            result = whisper.decode(whisper_model, mel, options)
            transcript = result.text
            
            # 2. Embeddings
            audio_features = whisper_model.encoder(mel.unsqueeze(0))
            # Shape for audio_features is [1, 1500, 384]
            # Mean pool across time to get [1, 384] to send over datachannel
            pooled_embedding = torch.mean(audio_features, dim=1).cpu().numpy()[0]

            # 3. Audio Confidence
            logits = self.audio_model(audio_features)
            probs = F.softmax(logits, dim=1)
            audio_confidence = probs[0][1].item() # Class 1 is CONFIDENT

            # 4. Audio Metrics (Pitch, WPM, Frequency)
            import librosa
            # audio_data is already 16kHz mono
            y = audio_data.flatten()
            
            # WPM
            duration_sec = len(y) / 16000.0
            word_count = len(transcript.split())
            wpm = (word_count / duration_sec) * 60 if duration_sec > 0 else 0
            
            # Pitch & Frequency using YIN or Zero Crossing as proxy if needed
            # For real-time, zero crossing rate is fast
            zcr = librosa.feature.zero_crossing_rate(y)
            mean_freq = np.mean(zcr) * 8000 # Rough estimate of mean frequency
            
            # Pitch estimation (stdev of ZCR as a proxy for vocal stability)
            pitch_stability = max(0.0, 1.0 - np.std(zcr) * 10)

        return {
            "type": "audio_inference",
            "transcript": transcript,
            "confidence": audio_confidence,
            "wpm": float(wpm),
            "pitch_stability": float(pitch_stability),
            "frequency": float(mean_freq)
        }

    async def _process_stream(self):
        # We will buffer 3 seconds of audio at a time
        chunk_length_samples = 16000 * 3 
        audio_buffer = []

        while True:
            try:
                frame = await self.track.recv()
                
                resampled_frames = self.resampler.resample(frame.frame)
                for resampled_frame in resampled_frames:
                    data = resampled_frame.to_ndarray()
                    audio_buffer.append(data.flatten())
                
                # Check if we have enough samples
                current_length = sum(len(x) for x in audio_buffer)
                if current_length >= chunk_length_samples:
                    audio_data = np.concatenate(audio_buffer)[:chunk_length_samples]
                    # Keep 1 sec overlap
                    samples_to_keep = np.concatenate(audio_buffer)[16000:]
                    audio_buffer = [samples_to_keep]

                    # Convert to float32 expected by whisper
                    audio_float = audio_data.astype(np.float32) / 32768.0

                    # Run model
                    result_event = await asyncio.to_thread(self._process_audio_chunk, audio_float)
                    if result_event:
                        self.datachannel_manager.send_json(result_event)

            except av.error.EOFError:
                break
            except Exception as e:
                print(f"Audio processing error: {e}")
                break


class DataChannelManager:
    def __init__(self, channel=None):
        self.channel = channel

    def send_json(self, data):
        if self.channel and self.channel.readyState == "open":
            try:
                self.channel.send(json.dumps(data))
            except Exception as e:
                print(f"Failed to send over DataChannel: {e}")
