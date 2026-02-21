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

# Global Whispers Model Load
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
try:
    print("Loading Whisper model...")
    whisper_model = whisper.load_model("tiny", device=device)
    print("Whisper model loaded!")
except Exception as e:
    whisper_model = None
    print(f"Failed to load whisper model: {e}")

class VideoStreamProcessor:
    def __init__(self, track, datachannel_manager):
        self.track = track
        self.datachannel_manager = datachannel_manager
        self.feature_history = []
        self.device = device

        self.model = VisualConfidenceModel(input_dim=INPUT_DIM)
        if os.path.exists(MODEL_PATH):
            self.model.load_state_dict(torch.load(MODEL_PATH, map_location=self.device))
        self.model.to(self.device).eval()

        self.init_mediapipe()
        self.task = asyncio.create_task(self._process_stream())

    def init_mediapipe(self):
        try:
            face_base_options = python.BaseOptions(model_asset_path=FACE_TASK_PATH)
            face_options = vision.FaceLandmarkerOptions(
                base_options=face_base_options,
                output_face_blendshapes=True,
                num_faces=1,
                running_mode=vision.RunningMode.VIDEO)
            self.face_landmarker = vision.FaceLandmarker.create_from_options(face_options)

            hand_base_options = python.BaseOptions(model_asset_path=HAND_TASK_PATH)
            hand_options = vision.HandLandmarkerOptions(
                base_options=hand_base_options,
                num_hands=2,
                running_mode=vision.RunningMode.VIDEO)
            self.hand_landmarker = vision.HandLandmarker.create_from_options(hand_options)
        except Exception as e:
            print(f"Warning: Mediapipe init failed. {e}")
            self.face_landmarker = None
            self.hand_landmarker = None

    def process_mediapipe_results(self, face_result, hand_result):
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

    def do_inference(self):
        if len(self.feature_history) < 10: return 0.5
        now_ms = self.feature_history[-1][0]
        start_ms = now_ms - WINDOW_SIZE_MS
        window_data = [f for t, f in self.feature_history if t >= start_ms]
        window_times = [t for t, f in self.feature_history if t >= start_ms]
        if len(window_data) < 5: return 0.5

        window_data = np.array(window_data)
        window_times = np.array(window_times)
        target_ts = np.linspace(window_times[0], window_times[0] + WINDOW_SIZE_MS, SEQUENCE_LENGTH)

        try:
            f_interp = interp1d(window_times, window_data, axis=0, kind='linear', fill_value="extrapolate")
            resampled_seq = f_interp(target_ts)
            input_tensor = torch.FloatTensor(resampled_seq).unsqueeze(0).to(self.device)
            with torch.no_grad():
                logits = self.model(input_tensor)
                probs = F.softmax(logits, dim=1)
                return probs[0][1].item() # CONFIDENT score
        except Exception:
            return 0.5

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
                    conf = await asyncio.to_thread(self.do_inference)
                    
                    self.datachannel_manager.send_json({
                        "type": "video_inference",
                        "confidence": conf,
                        "timestamp": timestamp_ms
                    })

                 # Cleanup buffer
                while self.feature_history and self.feature_history[0][0] < timestamp_ms - 2000:
                    self.feature_history.pop(0)

            except av.error.EOFError:
                break
            except Exception as e:
                print(f"Video iteration error: {e}")
                break

    def _detect_and_buffer(self, mp_image, timestamp_ms):
        try:
            face_result = self.face_landmarker.detect_for_video(mp_image, timestamp_ms)
            hand_result = self.hand_landmarker.detect_for_video(mp_image, timestamp_ms)
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

        return {
            "type": "audio_inference",
            "transcript": transcript,
            "confidence": audio_confidence
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
