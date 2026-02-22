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
  // ── Chess Engine Adaptive System ──────────────────────────────────────────
  pressureScore: number;           // 0-100, the live difficulty level
  performanceHistory: number[];    // rolling window of last 5 raw scores (-1..1)
  pressureTrend: "rising" | "falling" | "stable"; // direction for backend context

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
  updatePressureScore: (rawScore: number) => void;
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
  pressureScore: 50,
  performanceHistory: [],
  pressureTrend: "stable",

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

  /**
   * ELO-Style Adaptive Pressure Update:
   *
   * Borrowed directly from chess rating theory:
   *
   *   expectedPerf = 1 / (1 + 10^((50 - pressureScore) / 25))
   *
   *   This is the "expected" normalized performance (0..1) given the current
   *   difficulty level. A candidate at pressure=50 is expected to score 0.5.
   *   At pressure=80 the expectation rises to ~0.88 (harder questions, more expected).
   *
   *   actualPerf = (rawScore + 1) / 2   → normalize -1..1 to 0..1
   *
   *   K (sensitivity) scales with |actual - expected|:
   *     K = 20 + 30 * |actual - expected|
   *     → Small surprises use K≈20, big upsets use K≈50.
   *     → A huge improvement or crash adjusts much faster than gradual drift.
   *
   *   delta = K * (actualPerf - expectedPerf)
   *   newPressure = clamp(pressureScore + delta, 0, 100)
   *
   * Rolling history is maintained for trend calculation only.
   */
  updatePressureScore: (rawScore) => set((state) => {
    // Keep rolling window for trend calculation
    const WINDOW = 5;
    const newHistory = [...state.performanceHistory, rawScore].slice(-WINDOW);

    // Step 1: Map current pressure to expected performance (ELO expectation curve)
    // pressureScore=50 → expectedPerf=0.5  |  80 → 0.88  |  20 → 0.12
    const expectedPerf = 1 / (1 + Math.pow(10, (50 - state.pressureScore) / 25));

    // Step 2: Map raw score (-1..1) to normalized actual performance (0..1)
    const actualPerf = (rawScore + 1) / 2;

    // Step 3: Compute K-factor — sensitivity scales with surprise magnitude
    // Small surprises (near expected): K~20. Big upsets: K up to ~50.
    const surprise = Math.abs(actualPerf - expectedPerf);
    const K = 20 + 30 * surprise;

    // Step 4: ELO delta
    const delta = K * (actualPerf - expectedPerf);

    const newScore = Math.max(0, Math.min(100, state.pressureScore + delta));

    // Step 5: Determine trend direction from rolling history
    const recentAvg = newHistory.slice(-3).reduce((a, b) => a + b, 0) / Math.max(1, Math.min(3, newHistory.length));
    const trend: "rising" | "falling" | "stable" =
      newScore > state.pressureScore + 2 ? "rising" :
        newScore < state.pressureScore - 2 ? "falling" : "stable";

    return {
      pressureScore: newScore,
      performanceHistory: newHistory,
      pressureTrend: trend,
    };
  }),

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
      pressureScore: 50,
      performanceHistory: [],
      pressureTrend: "stable",
    }),
}));