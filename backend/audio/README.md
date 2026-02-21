# AceIt: Backend Audio Service

This microservice handles the audio and natural language processing backend for the AceIt application, powering the AI Interviewer experience.

## Features
- **Speech-to-Text (`/transcribe`)**: Converts user audio to text using OpenAI Whisper.
- **Chat (`/chat`)**: Generates an interviewer response and manages conversation state using GPT-4o.
- **Text-to-Speech (`/tts`)**: Streams natural voice responses via ElevenLabs.
- **Audio Biometrics (`/score`, `/stream-process`)**: Analyzes audio files in real-time or via batches to score pacing, volume (energy), and pitch stability using standard audio processing libraries like Librosa.

## Setup Instructions

1. **Environment Setup**
    Ensure you have Python 3.9+ installed.
    ```bash
    cd backend/audio
    python -m venv venv
    
    # On Windows:
    venv\Scripts\activate
    # On Mac/Linux:
    source venv/bin/activate
    ```

2. **Install Dependencies**
    ```bash
    pip install -r requirements.txt
    ```

3. **Environment Variables**
    Copy the `.env.example` file to `.env`:
    ```bash
    cp .env.example .env
    ```
    Then open the `.env` file and insert your API keys:
    - `OPENAI_API_KEY`: Get this from your OpenAI dashboard.
    - `ELEVENLABS_API_KEY`: Get this from your ElevenLabs dashboard.

4. **Run the Application**
    ```bash
    python app.py
    ```
    The server will start running locally at `http://127.0.0.1:5000`.

## Testing the Health Endpoint
To verify the service is running correctly, you can hit the heartbeat endpoint:
```bash
curl http://127.0.0.1:5000/heartbeat
```
