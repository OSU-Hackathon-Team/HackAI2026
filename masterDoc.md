Project Master Document: AceIt

1. Project Overview
AceIt is a real-time, AI-driven mock interview platform that uses multimodal analysis to evaluate candidate performance. Unlike traditional tools that focus solely on verbal responses, AceIt leverages a high-frequency pipeline to correlate resume-specific context and job requirements with real-time biometric signals—such as gaze stability and fidgeting. This provides users with a "Confidence Score" and actionable, timestamped coaching to bridge the gap between technical knowledge and behavioral delivery.

2. Team Roles
To manage the complexity of this multimodal system, the team is divided into three specialized engineering domains:
Audio & Intelligence Orchestrator (Jason): Responsible for the conversational core, including real-time audio capture, OpenAI Whisper transcription with word-level timestamps, tone analysis and confidence scores via Librosa, and the GPT-4o interview logic. Manages the cascading stream to ElevenLabs Flash for low-latency voice synthesis.
Computer Vision Engineer (Mitch): Oversees the visual intelligence pipeline, specifically managing the high-frequency landmark stream via WebRTC DataChannels. Implements OpenCV-based behavioral math to derive gaze stability, head pose, and fidget indices, ensuring real-time logging to the Supabase database. Additionally, using a PyTorch model, predict confident/unconfident behavior.
Systems & Frontend Architect (Konrad): Leads the Next.js/React application development and WebRTC signaling infrastructure. Responsible for the "Single-Page Interview" state machine, the 3D Avatar integration (Three.js/TalkingHead), and the final Feedback Dashboard utilizing Recharts to visualize synchronized audio and vision metrics.

3. Technical Breakdown (The Process)
The system is built as an asynchronous, streaming architecture designed to minimize latency and provide instantaneous feedback post-interview.
Stage 1: Contextual RAG Ingestion
Personalization: The user uploads their Resume and a target Job Posting at the start of the session.
Interviewer Persona: The system parses these documents to generate a bespoke interviewer persona and a tailored set of technical and behavioral questions.
Stage 2: Multimodal Edge Capture (The Sensors)
Visual (MediaPipe WASM): A facial landmarking instance runs in a Web Worker on the frontend, extracting 468 3D landmarks at 30 FPS.
Audio (Continuous Stream): Microphone input is captured as a continuous stream rather than discrete chunks, allowing for fluid, natural conversation.
Stage 3: Real-Time WebRTC Pipeline
Vision DataChannel: High-frequency landmark JSON packets are streamed to the backend via WebRTC DataChannels.
Asynchronous "Fire-and-Forget": The system uses a non-blocking transmission protocol, ensuring that the UI remains at 60 FPS even during heavy network activity.
Stage 4: Behavioral Inference & Async Logging
OpenCV Analysis: The vision server processes "rolling windows" of landmark data to derive high-level metrics like Gaze Score and Fidget Index.
Background Storage: These processed metrics are flushed to Supabase (PostgreSQL) asynchronously while the interview is live, ensuring the final database is ready as soon as the session ends.

Stage 5: Cascading AI Responses
Sentence-Based Synthesis: OpenAI Whisper transcribes the audio stream with word-level timestamps.
Streaming TTS: GPT-4o generates responses that are immediately proxied to ElevenLabs Flash, streaming audio bytes back to the client with sub-500ms Time-to-First-Byte (TTFB).
Visual Avatar Rendering: The frontend receives the audio stream and visual cues. Using Three.js (React Three Fiber) and TalkingHead (or similar), a 3D avatar lip-syncs to the incoming audio in real-time, providing an immersive "face-to-face" experience.

4. Recommended Tech Stack
Frontend: Next.js (App Router), Tailwind CSS, WebRTC API, MediaPipe WASM, Recharts.
Backend: Flask (Python) for vision metrics and AI orchestration.
Database: Supabase (PostgreSQL) with real-time logging.
AI/ML:
OpenAI Whisper: For word-level timestamped transcription.
GPT-4o: For real-time conversational logic and multimodal coaching synthesis.
ElevenLabs Flash: For low-latency, streamed text-to-speech.

5. Targeted Users
University Students: Particularly those seeking technical internships who need interview practice.
Career Switchers: Individuals moving into tech who require practice correlating their past experience (Resume) with new Job Descriptions.

6. Initial Implementation Roadmap
Phase 1 (The Sensors): Implement a Next.js frontend that successfully initializes the MediaPipe Worker and requests WebRTC stream permissions.
Phase 2 (The Data Plumbing): Establish the WebRTC DataChannel connection to the vision server and verify real-time metric logging to Supabase.
Phase 3 (The Brain): Integrate the cascading GPT-4o and ElevenLabs stream for "Resume-aware" dialogue.
Phase 4 (The Report): Build the Feedback Dashboard that cross-references the transcript timestamps with stored biometric logs.

