# 🎯 AceIt: Real-Time Multimodal AI Interview Coach

**Team Name:** Mitchell
 
**Team Members:**
1. Jason Seh
2. Mitchell Eickhoff
3. Konrad Gozon
4. Rocky Shao

---

## 🚀 Project Overview
**AceIt** is a high-performance, AI-driven mock interview platform that provides real-time multimodal analysis. It combines computer vision (MediaPipe) and audio analysis with large language models to provide instantaneous feedback on candidate performance.

## ✨ Key Features
- **Real-Time Biometrics:** Tracks gaze stability, confidence levels, and fidgeting in real-time.
- **"Response-First" Architecture:** Sub-500ms AI response latency using Gemini Flash 3.0 and ElevenLabs.
- **Specialized Tracks:** Behavioral, System Design, and Technical (Coding) interview modes.
- **Integrated Python IDE:** A browser-based Python compiler (Pyodide) for real-time technical assessments.
- **AI Coaching Reports:** Detailed feedback with comparative "Candidate Action" vs. "Ideal Strategy" analysis.

## 🛠️ Performance Tech Stack
- **Frontend:** Next.js 15, TypeScript, Zustand, WebRTC, MediaPipe, TalkingHead (3D Avatar).
- **Backend:** Python `aiohttp`, `aiortc`, PyTorch.
- **AI Intelligence:** Google Gemini (Flash 3.0 & Pro 2.5), OpenAI Whisper, ElevenLabs Flash.
- **Infrastructure:** Supabase (PostgreSQL), Clerk.

## 📖 Documentation
Detailed documentation for developers and technical stakeholders:
- [System Architecture](architecture.md)
- [Project Master Document](masterDoc.md)

## 🏗️ Getting Started

### Prerequisites
- Node.js 18+
- Python 3.10+
- [Supabase](https://supabase.com/) Account
- [Clerk](https://clerk.com/) Account

### Installation

1. **Clone the repository**
   ```bash
   git clone [repository-url]
   cd HackAI2026
   ```

2. **Frontend Setup**
   ```bash
   npm install
   npm run dev
   ```

3. **Backend Setup**
   ```bash
   # Create and activate virtual environment
   python -m venv .venv
   source .venv/bin/activate # Windows: .venv\Scripts\activate
   
   # Install dependencies
   pip install -r requirements.txt
   
   # Start the backend server
   python backend/server.py
   ```

---
*Built for the HackAI 2026 Hackathon.*
