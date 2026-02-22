import { create } from 'zustand';

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
    stressSpike: boolean;
}

interface InterviewState {
    phase: string;
    transcript: TranscriptEntry[];
    biometrics: BiometricPoint[];
    sessionId: string | null;
    resumeText: string;
    jobText: string;
    interviewerPersona: string;
    role: string;
    company: string;
    pressureScore: number;
    pressureTrend: 'stable' | 'rising' | 'falling';
    aiCoachingReport: string | null;
    liveAlert: string | null;

    setPhase: (phase: string) => void;
    setSessionId: (id: string | null) => void;
    setResumeText: (text: string) => void;
    setJobText: (text: string) => void;
    setInterviewerPersona: (id: string) => void;
    setRole: (role: string) => void;
    setCompany: (company: string) => void;
    setAiCoachingReport: (report: string | null) => void;
    setBiometrics: (data: BiometricPoint[]) => void;
    setTranscript: (data: TranscriptEntry[]) => void;
    addTranscriptEntry: (entry: TranscriptEntry) => void;
    updateLastTranscriptText: (text: string) => void;
    addBiometricPoint: (point: BiometricPoint) => void;
    updatePressureScore: (delta: number) => void;
    updateEloScore: (score: number) => void;
    setLiveAlert: (alert: string | null) => void;
    startInterview: () => void;
    finishInterview: () => void;
    reset: () => void;
    clearSessionData: () => void;
}

export const useInterviewStore = create<InterviewState>((set) => ({
    phase: 'initial',
    transcript: [],
    biometrics: [],
    sessionId: null,
    resumeText: '',
    jobText: '',
    interviewerPersona: '',
    role: 'Software Engineer',
    company: 'AceIt',
    pressureScore: 50,
    pressureTrend: 'stable',
    aiCoachingReport: null,
    liveAlert: null,

    setPhase: (phase) => set({ phase }),
    setSessionId: (sessionId) => set({ sessionId }),
    setResumeText: (resumeText) => set({ resumeText }),
    setJobText: (jobText) => set({ jobText }),
    setInterviewerPersona: (interviewerPersona) => set({ interviewerPersona }),
    setRole: (role) => set({ role }),
    setCompany: (company) => set({ company }),
    setAiCoachingReport: (aiCoachingReport) => set({ aiCoachingReport }),
    setBiometrics: (biometrics) => set({ biometrics }),
    setTranscript: (transcript) => set({ transcript }),

    addTranscriptEntry: (entry) => set((state) => ({
        transcript: [...state.transcript, entry]
    })),

    updateLastTranscriptText: (text) => set((state) => {
        const newTranscript = [...state.transcript];
        if (newTranscript.length > 0) {
            newTranscript[newTranscript.length - 1].text = text;
        }
        return { transcript: newTranscript };
    }),

    addBiometricPoint: (point) => set((state) => ({
        biometrics: [...state.biometrics, point]
    })),

    updatePressureScore: (delta) => set((state) => {
        const newScore = Math.max(0, Math.min(100, state.pressureScore + delta * 20));
        const trend = delta > 0 ? 'rising' : delta < 0 ? 'falling' : 'stable';
        return { pressureScore: newScore, pressureTrend: trend };
    }),

    updateEloScore: (score) => set((state) => {
        // Expected score is 0.0 to 1.0 from Gemini
        const target = score * 100;
        const newScore = state.pressureScore * 0.7 + target * 0.3;
        const trend = target > state.pressureScore ? 'rising' : 'falling';
        return { pressureScore: newScore, pressureTrend: trend };
    }),

    setLiveAlert: (liveAlert) => set({ liveAlert }),

    startInterview: () => set({ phase: 'live' }),

    finishInterview: () => set({ phase: 'finished' }),

    reset: () => set({
        phase: 'initial',
        transcript: [],
        biometrics: [],
        sessionId: null,
        pressureScore: 50,
        pressureTrend: 'stable',
        aiCoachingReport: null,
        liveAlert: null,
    }),

    clearSessionData: () => set({
        transcript: [],
        biometrics: [],
        sessionId: null,
        pressureScore: 50,
        pressureTrend: 'stable',
        aiCoachingReport: null,
    }),
}));
