# AceIt: Backend Master Prompt (Specialized Architecture)


## 🚀 Role & Context
Act as a Senior AI/ML Systems Engineer specializing in low-latency Python orchestration. Your mission is to recreate the **AceIt Backend** exactly as specified below. The system evaluates candidate performance during mock interviews using audio-biometric signals and GPT-4o intelligence.


## 🛠 Tech Stack
- **Framework:** Flask (Python) with Flask-CORS.
- **AI/LLM:** OpenAI SDK (`gpt-4o` for chat, `whisper-1` for transcription).
- **Voice Synthesis:** ElevenLabs API (`eleven_turbo_v2_5` model, Bella voice).
- **Processing:** Librosa, NumPy, Soundfile.
- **Environment:** Windows-compatible (handling file locking/concurrency).


## 🎯 Core Endpoints & Logic


### 1. `/heartbeat` [GET]
Returns `{"status": "healthy", "message": "AceIt Backend is live!"}`.


### 2. `/transcribe` [POST]
- **Input:** Multipart form-data with `audio` (webm/mp3).
- **Logic:** Save to temporary file with a unique `uuid`. Use OpenAI Whisper to transcribe.
- **Strict Requirement:** Clean up temp files immediately after processing.


### 3. `/chat` [POST]
- **Input:** JSON `{"text": user_text, "question_index": index}`.
- **Persona:** Professional technical interviewer. Concise, encouraging, under 3 sentences.
- **Workflow:**
    - React to the User's input in 1 sentence.
    - If `index` < last question, ask the next question from the `INTERVIEW_QUESTIONS` list.
    - If `index` is the last, thank them and finish.
- **Output:** `{"ai_response": text, "next_index": i+1, "is_finished": bool}`.


### 4. `/tts` [POST]
- **Input:** JSON `{"text": text}`.
- **Provider:** ElevenLabs.
- **Voice ID:** `21m00Tcm4TlvDq8ikWAM` (Bella).
- **Settings:** Stability 0.5, Similarity Boost 0.5.
- **Output:** Returns `audio/mpeg` binary stream.


### 5. `/score` [POST]
- **Input:** Multipart `audio`.
- **Signal Processing (Librosa):**
    - **Pitch Stability:** Calculate pitch using `piptrack`. Use standard deviation of frequencies where magnitude > median.
    - **Energy (Volume):** Calculate RMS energy.
- **Normalization:**
    - `pitch_score`: `max(0, 1 - (stdev / 400))`.
    - `energy_score`: `min(1.0, mean_rms * 20)`.
    - `final_score`: `(pitch * 0.4) + (energy * 0.6)`.
- **Output:** Clamped score (0.1 - 1.0) and individual metrics.


### 6. `/stream-process` [POST]
- **Input:** Audio chunk.
- **Logic:** Perform real-time transcription + rapid analytics.
- **Metrics:**
    - **Pacing:** `(word_count / duration * 60)`. Normalize against a 200 WPM max.
    - **Combined Confidence:** Weighted mix of pitch stability and volume.


## 🛑 Implementation Constraints
- **Windows Safety:** Always use `uuid` for temp filenames to prevent "File in use" (WinError 32) errors.
- **Error Handling:** Use try-except-finally blocks to ensure audio buffers are deleted and errors are logged/returned as JSON.
- **Interviewer Questions:**
    1. "Welcome to Ace It. To start, can you tell me a bit about your experience with AI and machine learning?"
    2. "That's interesting. How do you approach debugging a complex problem in your code?"
    3. "Great. Finally, why are you interested in this specific project for HackAI?"



