import { create } from "zustand";

export type InterviewPhase =
  | "upload"
  | "connecting"
  | "live"
  | "processing"
  | "report";

export interface BiometricPoint {
  time: number;
  gazeScore: number;
  confidence: number;
  fidgetIndex: number;
  stressSpike?: boolean;
}

export interface TranscriptEntry {
  time: number;
  speaker: "interviewer" | "user";
  text: string;
}

interface InterviewStore {
  phase: InterviewPhase;
  sessionId: string | null;
  resumeText: string | null;
  jobText: string | null;
  biometrics: BiometricPoint[];
  transcript: TranscriptEntry[];
  liveAlert: string | null;
  interviewStartTime: number | null;

  setPhase: (phase: InterviewPhase) => void;
  setSessionId: (id: string) => void;
  setResumeText: (text: string) => void;
  setJobText: (text: string) => void;
  addBiometricPoint: (point: BiometricPoint) => void;
  addTranscriptEntry: (entry: TranscriptEntry) => void;
  setLiveAlert: (alert: string | null) => void;
  startInterview: () => void;
  finishInterview: () => void;
  reset: () => void;
}

export const useInterviewStore = create<InterviewStore>((set) => ({
  phase: "upload",
  sessionId: null,
  resumeText: null,
  jobText: null,
  biometrics: [],
  transcript: [],
  liveAlert: null,
  interviewStartTime: null,

  setPhase: (phase) => set({ phase }),
  setSessionId: (id) => set({ sessionId: id }),
  setResumeText: (text) => set({ resumeText: text }),
  setJobText: (text) => set({ jobText: text }),
  addBiometricPoint: (point) =>
    set((state) => ({ biometrics: [...state.biometrics, point] })),
  addTranscriptEntry: (entry) =>
    set((state) => ({ transcript: [...state.transcript, entry] })),
  setLiveAlert: (alert) => set({ liveAlert: alert }),
  startInterview: () =>
    set({ phase: "live", interviewStartTime: Date.now() }),
  finishInterview: () => set({ phase: "processing" }),
  reset: () =>
    set({
      phase: "upload",
      sessionId: null,
      resumeText: null,
      jobText: null,
      biometrics: [],
      transcript: [],
      liveAlert: null,
      interviewStartTime: null,
    }),
}));