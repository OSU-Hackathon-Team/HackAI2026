import { BiometricPoint, TranscriptEntry } from "@/store/useInterviewStore";

// ─── MOCK BIOMETRICS ──────────────────────────────────────────────────────────
// Simulates what Mitch's vision server + Jason's audio server will send.
// Replace this with real Supabase fetches when backend is ready.
export const MOCK_BIOMETRICS: BiometricPoint[] = [
  { time: 0,  gazeScore: 92, confidence: 88, fidgetIndex: 5 },
  { time: 5,  gazeScore: 89, confidence: 85, fidgetIndex: 8 },
  { time: 10, gazeScore: 60, confidence: 52, fidgetIndex: 42, stressSpike: true },
  { time: 15, gazeScore: 55, confidence: 48, fidgetIndex: 50, stressSpike: true },
  { time: 20, gazeScore: 78, confidence: 71, fidgetIndex: 18 },
  { time: 25, gazeScore: 85, confidence: 80, fidgetIndex: 10 },
  { time: 30, gazeScore: 90, confidence: 86, fidgetIndex: 6 },
  { time: 35, gazeScore: 88, confidence: 82, fidgetIndex: 9 },
  { time: 40, gazeScore: 45, confidence: 40, fidgetIndex: 65, stressSpike: true },
  { time: 45, gazeScore: 62, confidence: 58, fidgetIndex: 30 },
  { time: 50, gazeScore: 80, confidence: 75, fidgetIndex: 12 },
  { time: 55, gazeScore: 91, confidence: 87, fidgetIndex: 7 },
  { time: 60, gazeScore: 94, confidence: 90, fidgetIndex: 4 },
];

// ─── MOCK TRANSCRIPT ─────────────────────────────────────────────────────────
// Simulates what Jason's Whisper transcription will produce.
export const MOCK_TRANSCRIPT: TranscriptEntry[] = [
  { time: 0,  speaker: "interviewer", text: "Tell me about yourself and your background in software engineering." },
  { time: 8,  speaker: "user",        text: "Sure! I've been studying computer science for two years now, with a focus on backend systems..." },
  { time: 18, speaker: "interviewer", text: "Interesting. Can you walk me through a time you handled a technically difficult problem under pressure?" },
  { time: 28, speaker: "user",        text: "Um, yeah... there was this one project where our database kept timing out right before our demo..." },
  { time: 42, speaker: "interviewer", text: "How did you resolve it?" },
  { time: 46, speaker: "user",        text: "We ended up caching the expensive queries with Redis, which cut response time by about 80 percent." },
  { time: 56, speaker: "interviewer", text: "Great answer. Last question — where do you see yourself in five years?" },
];

// ─── MOCK SESSION ─────────────────────────────────────────────────────────────
export const MOCK_SESSION = {
  id: "mock-session-001",
  candidateName: "Alex Johnson",
  role: "Software Engineering Intern",
  company: "TechCorp",
  duration: 63, // seconds
  overallScore: 74,
  date: new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }),
};

// ─── MOCK LIVE ALERTS ─────────────────────────────────────────────────────────
// Simulates what Mitch's Supabase Realtime broadcast will send during the interview.
export const MOCK_LIVE_ALERTS = [
  { delay: 8000,  message: "👀 You're looking away from the camera" },
  { delay: 14000, message: "🤲 Excessive hand movement detected" },
  { delay: 35000, message: "😌 Great eye contact — keep it up!" },
];

// ─── SWAP GUIDE ───────────────────────────────────────────────────────────────
// When backend is ready, replace mock data with these:
//
// BIOMETRICS:
//   const { data } = await supabase
//     .from("biometrics")
//     .select("*")
//     .eq("session_id", sessionId)
//     .order("time", { ascending: true });
//
// TRANSCRIPT:
//   const { data } = await supabase
//     .from("transcripts")
//     .select("*")
//     .eq("session_id", sessionId)
//     .order("time", { ascending: true });