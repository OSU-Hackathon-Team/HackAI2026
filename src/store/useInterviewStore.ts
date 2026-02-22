import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Interviewer } from '@/types/interviewer';


export type InterviewPhase = 'upload' | 'initial' | 'connecting' | 'live' | 'processing' | 'finished';

export interface TranscriptEntry {
  time: number;
  speaker: 'user' | 'interviewer';
  text: string;
}

export interface BiometricPoint {
  time: number;
  gazeScore: number;
  confidence: number;
  fidgetIndex: number;
  fillerCount?: number;
  tone?: number;
  wpm?: number;
  pitchStability?: number;
  frequency?: number;
  stressSpike: boolean;
}

interface InterviewStore {
  phase: InterviewPhase;
  sessionId: string | null;
  resumeText: string | null;
  jobText: string | null;
  biometrics: BiometricPoint[];
  transcript: TranscriptEntry[];
  interviewerPersona: string | null;
  interviewerModel: string | null;
  interviewerVoice: string | null;
  liveAlert: string | null;
  interviewStartTime: number | null;
  aiCoachingReport: string | null;
  role: string;
  company: string;
  // ── Adaptive ELO System ──────────────────────────────────────────────────
  pressureScore: number;           // 0-100, the normalized display score (baseline 50)
  elo: number;                     // Internal ELO (starts at 1200)
  difficulty: number;              // Internal Difficulty (starts at 1200)
  questionCount: number;           // Number of questions answered
  eloDeltas: number[];             // History of last 3 ELO changes for ΔS
  performanceHistory: number[];    // rolling window of last 5 raw scores (A values 0..1)
  pressureTrend: "rising" | "falling" | "stable"; // direction for backend context
  heuristicScore: number;          // Grounded heuristic signal (0..1)
  userId: string | null;           // Clerk user id
  interviewers: Interviewer[];
  skippedQuestions: string[];      // List of questions user skipped

  setPhase: (phase: InterviewPhase) => void;
  setSessionId: (id: string | null) => void;
  setUserId: (id: string | null) => void;
  setResumeText: (text: string) => void;
  setJobText: (text: string) => void;
  setInterviewerPersona: (persona: string) => void;
  setInterviewerModel: (model: string) => void;
  setInterviewerVoice: (voice: string) => void;
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
  addSkippedQuestion: (question: string) => void;
  updateEloScore: (qualityA: number) => void;
  updatePressureScore: (rawScore: number) => void;
  setInterviewers: (interviewers: Interviewer[]) => void;
  clearSessionData: () => void;

  reset: () => void;
}

export const useInterviewStore = create<InterviewStore>()(
  persist(
    (set) => ({
      phase: "upload",
      sessionId: null,
      resumeText: null,
      jobText: null,
      interviewerPersona: "10_data_scientist", // Default
      interviewerModel: "/models/business_girl.glb", // Default
      interviewerVoice: "Algenib", // Default
      biometrics: [],
      transcript: [],
      liveAlert: null,
      interviewStartTime: null,
      aiCoachingReport: null,
      role: "Software Engineer",
      company: "AceIt",
      pressureScore: 50,
      elo: 1200,
      difficulty: 1200,
      questionCount: 0,
      eloDeltas: [],
      performanceHistory: [],
      pressureTrend: "stable",
      heuristicScore: 0.5,
      userId: null,
      interviewers: [],
      skippedQuestions: [],

      setPhase: (phase) => set({ phase }),
      setSessionId: (id) => set({ sessionId: id }),
      setUserId: (id) => set({ userId: id }),
      setResumeText: (text) => set({ resumeText: text }),
      setJobText: (text) => set({ jobText: text }),
      setInterviewerPersona: (persona) => set({ interviewerPersona: persona }),
      setInterviewerModel: (model) => set({ interviewerModel: model }),
      setInterviewerVoice: (voice) => set({ interviewerVoice: voice }),
      addBiometricPoint: (point) =>
        set((state) => ({ biometrics: [...state.biometrics, point] })),
      addTranscriptEntry: (entry) =>
        set((state) => ({ transcript: [...state.transcript, entry] })),
      updateLastTranscriptText: (text) =>
        set((state) => {
          if (state.transcript.length === 0) return state;
          const newList = [...state.transcript];
          const lastIndex = newList.length - 1;
          newList[lastIndex] = { ...newList[lastIndex], text: text };
          return { transcript: newList };
        }),
      setLiveAlert: (alert) => set({ liveAlert: alert }),
      startInterview: () => {
        console.log("[DEBUG] Starting new interview session, resetting ELO tracking.");
        set({
          phase: "live",
          interviewStartTime: Date.now(),
          pressureScore: 50,
          elo: 1200,
          difficulty: 1200,
          questionCount: 0,
          eloDeltas: [],
          performanceHistory: [],
          pressureTrend: "stable",
        });
      },
      finishInterview: () => set({ phase: "processing" }),
      setAiCoachingReport: (report) => set({ aiCoachingReport: report }),
      setBiometrics: (biometrics) => set({ biometrics }),
      setTranscript: (transcript) => set({ transcript }),
      setRole: (role) => set({ role }),
      setCompany: (company) => set({ company }),
      setInterviewers: (interviewers) => set({ interviewers }),
      addSkippedQuestion: (q) => set((state) => ({ skippedQuestions: [...state.skippedQuestions, q] })),
      updatePressureScore: (rawScore) => set({ heuristicScore: (rawScore + 1) / 2 }),

      updateEloScore: (qualityA) => set((state) => {
        const n = state.questionCount;
        const ELO_BASELINE = 1200;

        // Hybrid Strategy: Weighted combination of LLM evaluation and Heuristic ground truth
        // Weight: 70% LLM, 30% Heuristic
        const hybridQuality = (qualityA * 0.7) + (state.heuristicScore * 0.3);

        console.log(`[ELO_HYBRID] LLM=${qualityA.toFixed(2)}, Heuristic=${state.heuristicScore.toFixed(2)}, Combined=${hybridQuality.toFixed(2)}`);

        // 1. K(n) = 100 / (1 + 0.02 * n) -- Extreme volatility
        const K = 100 / (1 + 0.02 * n);

        // 2. E = 1 / (1 + 10^((D - ELO(n)) / 400))
        const E = 1 / (1 + Math.pow(10, (state.difficulty - state.elo) / 400));

        // 3. ELO(n+1) = ELO(n) + K * (hybridQuality - E)
        const deltaElo = K * (hybridQuality - E);
        const newElo = state.elo + deltaElo;

        // 4. Update rolling deltas and ΔS (last 3)
        const newEloDeltas = [...state.eloDeltas, deltaElo].slice(-3);
        const deltaS = newEloDeltas.reduce((a, b) => a + b, 0);

        // 5. D(next) = ELO(n) + 0.4 * ΔS
        const nextDifficulty = newElo + 0.4 * deltaS;

        // 6. Normalized Score (0-100)
        // Sharper divisor (40 instead of 80) makes the HUD much more responsive
        const normalizedScore = (1 / (1 + Math.pow(10, (ELO_BASELINE - newElo) / 40))) * 100;

        const trend: "rising" | "falling" | "stable" =
          deltaElo > 5 ? "rising" :
            deltaElo < -5 ? "falling" : "stable";

        console.log(`[ELO_DEBUG] n=${n}, K=${K.toFixed(2)}, E=${E.toFixed(3)}, A=${qualityA.toFixed(2)}`);
        console.log(`[ELO_DEBUG] deltaElo=${deltaElo.toFixed(2)}, newElo=${newElo.toFixed(2)}`);
        console.log(`[ELO_DEBUG] normalizedScore=${normalizedScore.toFixed(2)} (${Math.round(normalizedScore)})`);

        return {
          elo: newElo,
          difficulty: nextDifficulty,
          questionCount: n + 1,
          eloDeltas: newEloDeltas,
          pressureScore: normalizedScore,
          pressureTrend: trend,
          performanceHistory: [...state.performanceHistory, qualityA].slice(-5)
        };
      }),
      clearSessionData: () =>
        set({
          sessionId: null,
          biometrics: [],
          transcript: [],
          liveAlert: null,
          interviewStartTime: null,
          aiCoachingReport: null,
          pressureScore: 50,
          performanceHistory: [],
          pressureTrend: "stable",
          skippedQuestions: [],
        }),
      reset: () =>
        set({
          phase: "upload",
          sessionId: null,
          resumeText: null,
          jobText: null,
          interviewerPersona: "10_data_scientist",
          interviewerModel: "/models/business_girl.glb",
          interviewerVoice: "Algenib",
          biometrics: [],
          transcript: [],
          liveAlert: null,
          interviewStartTime: Date.now(),
          aiCoachingReport: null,
          role: "Software Engineer",
          company: "AceIt",
          pressureScore: 50,
          elo: 1200,
          difficulty: 1200,
          questionCount: 0,
          eloDeltas: [],
          performanceHistory: [],
          pressureTrend: "stable",
          skippedQuestions: [],
        }),
    }),
    {
      name: 'interview-storage', // name of the item in the storage (must be unique)
    }
  )
);
