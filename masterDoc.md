# 🎯 AceIt: Real-Time Multimodal AI Interview Coach

## 1. Project Overview
**AceIt** is a high-performance, AI-driven mock interview platform that provides real-time multimodal analysis to evaluate and enhance candidate performance. Unlike traditional tools that focus solely on verbal responses, AceIt leverages a high-frequency pipeline to correlate resume-specific context and job requirements with real-time biometric signals—such as gaze stability and fidgeting. 

The platform generates a dynamic **Confidence Score** and actionable, timestamped coaching reports to bridge the gap between technical knowledge and behavioral delivery, helping candidates master both *what* they say and *how* they say it.

## 2. Technical Leadership & Specializations
The project is architected across three core engineering domains:

*   **Audio & Intelligence Orchestrator (Jason):** Manages the conversational core, including real-time audio capture, Whisper transcription, and the adaptive GPT-4o interview logic. Implements the cascading stream to ElevenLabs for sub-500ms voice synthesis.
*   **Computer Vision Engineer (Mitch):** Oversees the visual intelligence pipeline, managing high-frequency landmark streams via WebRTC DataChannels. Implements Behavioral Math (MediaPipe + PyTorch) to derive gaze stability, hand movement variance (Fidget Index), and physical stress markers.
*   **Systems & Frontend Architect (Konrad):** Leads the Next.js/React application development and WebRTC signaling infrastructure. Responsible for the complex interview state machine, 3D Avatar integration (TalkingHead), and the Cyberpunk-inspired dashboard using Recharts.

## 3. The Technical Pipeline
AceIt operates as an asynchronous, streaming architecture designed to minimize latency and maximize feedback density.

### Stage 1: Specialized Interview Packaging
*   **Targeted Tracks:** Users can select between **Behavioral**, **System Design**, or **Technical (Coding)** interview tracks.
*   **Contextual RAG Ingestion:** The system parses the candidate's Resume and target Job Posting to generate a bespoke interviewer persona and a tailored question set.

### Stage 2: Multimodal Edge Capture
*   **Visual (MediaPipe WASM):** Hand and facial landmarking runs in a Web Worker, extracting 468+ landmarks at 30 FPS.
*   **Audio (Continuous PCM):** Microphone input is captured as a high-fidelity stream for fluid conversation.

### Stage 3: Real-Time WebRTC Pipeline
*   **Signaling & Media:** Uses `aiortc` (Backend) and standard WebRTC (Frontend) for low-latency media and data transmission.
*   **Vision DataChannel:** High-frequency landmark JSON packets are streamed to the backend without blocking the main UI thread.

### Stage 4: Behavioral Inference & Async Logging
*   **Biometric Scoring:** The backend processes rolling windows of landmark data to derive real-time metrics (Gaze, Fidget, Pressure Score).
*   **Asynchronous Persistence:** Metrics are flushed to **Supabase** via `asyncio.create_task`, ensuring zero impact on interview performance.

### Stage 5: Cascading AI Responses & Technical Interaction
*   **Sentence-Based Synthesis:** OpenAI Whisper transcribes the audio stream with word-level timestamps.
*   **Adaptive Persona Engine:** GPT-4o generates responses that are immediately proxied to ElevenLabs Flash, with latency under 500ms.
*   **Integrated Python IDE:** For technical tracks, candidates implement solutions inside a **browser-integrated Python Compiler** (Powered by Pyodide). The AI interviewer observes the coding process in real-time, providing feedback on complexity and edge cases.
*   **Visual Avatar Rendering:** A 3D avatar lip-syncs to the incoming audio via TalkingHead, providing an immersive experience.

## 4. Current Technology Stack
*   **Frontend:** Next.js 15 (App Router), TypeScript, Zustand, WebRTC, MediaPipe WASM, TalkingHead, Recharts.
*   **Backend:** Python `aiohttp`, `aiortc`, MediaPipe, PyTorch (Custom Models).
*   **AI/ML Orchestration:**
    *   **Google Gemini (Flash 3.0 & Pro 2.5):** Conversational intelligence and report synthesis.
    *   **OpenAI Whisper:** Speech-to-Text transcription.
    *   **ElevenLabs Flash:** Low-latency voice synthesis.
*   **Infrastructure:** Supabase (PostgreSQL), Clerk (Identity & RLS).

## 5. Implementation Status
- [x] **Phase 1: Foundations** - WebRTC signaling, MediaPipe integration, and Supabase schema.
- [x] **Phase 2: Intelligence** - Gemini-driven persona engine and real-time biometric analysis.
- [x] **Phase 3: Experience** - Cyberpunk UI refactor, 3D avatar integration, and low-latency TTS.
- [x] **Phase 4: Analytics** - Detailed coaching reports with "CANDIDATE_ACTION" vs "IDEAL_STRATEGY" comparison.
