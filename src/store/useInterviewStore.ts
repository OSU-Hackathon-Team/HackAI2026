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
  fillerCount?: number;
  tone?: number;
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
  interviewerPersona: string | null;
  liveAlert: string | null;
  interviewStartTime: number | null;
  aiCoachingReport: string | null;
  role: string;
  company: string;

  setPhase: (phase: InterviewPhase) => void;
  setSessionId: (id: string) => void;
  setResumeText: (text: string) => void;
  setJobText: (text: string) => void;
  setInterviewerPersona: (persona: string) => void;
  addBiometricPoint: (point: BiometricPoint) => void;
  addTranscriptEntry: (entry: TranscriptEntry) => void;
  updateLastTranscriptText: (text: string) => void;
  setLiveAlert: (alert: string | null) => void;
  startInterview: () => void;
  finishInterview: () => void;
  setAiCoachingReport: (report: string | null) => void;
  setBiometrics: (biometrics: BiometricPoint[]) => void;
  setTranscript: (transcript: TranscriptEntry[]) => void;
  setRole: (role: string) => void;
  setCompany: (company: string) => void;
  reset: () => void;
}

export const useInterviewStore = create<InterviewStore>((set) => ({
  phase: "upload",
  sessionId: null,
  resumeText: null,
  jobText: null,
  interviewerPersona: "10_data_scientist", // Default
  biometrics: [],
  transcript: [],
  liveAlert: null,
  interviewStartTime: null,
  aiCoachingReport: null,
  role: "Software Engineer",
  company: "AceIt",

  setPhase: (phase) => set({ phase }),
  setSessionId: (id) => set({ sessionId: id }),
  setResumeText: (text) => set({ resumeText: text }),
  setJobText: (text) => set({ jobText: text }),
  setInterviewerPersona: (persona) => set({ interviewerPersona: persona }),
  addBiometricPoint: (point) =>
    set((state) => ({ biometrics: [...state.biometrics, point] })),
  addTranscriptEntry: (entry) =>
    set((state) => ({ transcript: [...state.transcript, entry] })),
  updateLastTranscriptText: (text) =>
    set((state) => {
      if (state.transcript.length === 0) return state;
      const last = state.transcript[state.transcript.length - 1];
      const updated = { ...last, text: last.text + text };
      const newList = [...state.transcript];
      newList[newList.length - 1] = updated;
      return { transcript: newList };
    }),
  setLiveAlert: (alert) => set({ liveAlert: alert }),
  startInterview: () =>
    set({ phase: "live", interviewStartTime: Date.now() }),
  finishInterview: () => set({ phase: "processing" }),
  setAiCoachingReport: (report) => set({ aiCoachingReport: report }),
  setBiometrics: (biometrics) => set({ biometrics }),
  setTranscript: (transcript) => set({ transcript }),
  setRole: (role) => set({ role }),
  setCompany: (company) => set({ company }),
  reset: () =>
    set({
      phase: "upload",
      sessionId: null,
      resumeText: null,
      jobText: null,
      interviewerPersona: "10_data_scientist",
      biometrics: [],
      transcript: [],
      liveAlert: null,
      interviewStartTime: null,
      aiCoachingReport: null,
      role: "Software Engineer",
      company: "AceIt",
    }),
}));