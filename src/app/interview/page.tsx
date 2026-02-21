"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useInterviewStore } from "@/store/useInterviewStore";
import { MOCK_LIVE_ALERTS, MOCK_TRANSCRIPT, MOCK_BIOMETRICS } from "@/lib/mockData";

// ─── ICONS ────────────────────────────────────────────────────────────────────
function CameraIcon({ off }: { off: boolean }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      {off ? (
        <>
          <line x1="1" y1="1" x2="23" y2="23" />
          <path d="M21 21H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h3m3-3h6l2 3h2a2 2 0 0 1 2 2v9.34" />
          <circle cx="12" cy="13" r="3" />
        </>
      ) : (
        <>
          <path d="M23 7l-7 5 7 5V7z" />
          <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
        </>
      )}
    </svg>
  );
}

function MicIcon({ off }: { off: boolean }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      {off ? (
        <>
          <line x1="1" y1="1" x2="23" y2="23" />
          <path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6" />
          <path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23" />
          <line x1="12" y1="19" x2="12" y2="23" />
          <line x1="8" y1="23" x2="16" y2="23" />
        </>
      ) : (
        <>
          <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
          <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
          <line x1="12" y1="19" x2="12" y2="23" />
          <line x1="8" y1="23" x2="16" y2="23" />
        </>
      )}
    </svg>
  );
}

// ─── LIVE SCORE RING ──────────────────────────────────────────────────────────
function ScoreRing({ label, value, color }: { label: string; value: number; color: string }) {
  const r = 28;
  const circ = 2 * Math.PI * r;
  const offset = circ - (value / 100) * circ;
  return (
    <div style={{ textAlign: "center" }}>
      <svg width="72" height="72" viewBox="0 0 72 72">
        <circle cx="36" cy="36" r={r} fill="none" stroke="var(--border)" strokeWidth="4" />
        <circle cx="36" cy="36" r={r} fill="none" stroke={color} strokeWidth="4"
          strokeDasharray={circ} strokeDashoffset={offset}
          strokeLinecap="round" transform="rotate(-90 36 36)"
          style={{ transition: "stroke-dashoffset 0.8s ease" }}
        />
        <text x="36" y="40" textAnchor="middle" fill="var(--text)" fontSize="13" fontFamily="var(--font-mono)" fontWeight="500">
          {value}
        </text>
      </svg>
      <div className="label" style={{ marginTop: "0.25rem" }}>{label}</div>
    </div>
  );
}

// ─── AI AVATAR PANEL (top half) ───────────────────────────────────────────────
function AvatarPanel({ isSpeaking }: { isSpeaking: boolean }) {
  return (
    <div style={{ position: "relative", width: "100%", flex: 1, background: "linear-gradient(135deg, #0e1e35 0%, #0a1525 100%)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
      <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(rgba(0,229,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0,229,255,0.03) 1px, transparent 1px)", backgroundSize: "40px 40px" }} />
      <div style={{ position: "relative", width: "100px", height: "100px", borderRadius: "50%", background: "linear-gradient(135deg, var(--accent2), var(--accent))", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "2.5rem", boxShadow: isSpeaking ? "0 0 40px rgba(0,229,255,0.4)" : "0 0 20px rgba(0,229,255,0.1)", transition: "box-shadow 0.3s ease" }}>
        🤖
        {isSpeaking && (
          <div style={{ position: "absolute", inset: "-8px", borderRadius: "50%", border: "2px solid var(--accent)", animation: "pulse-ring 1.5s ease-out infinite" }} />
        )}
      </div>
      <div style={{ marginTop: "0.75rem", fontWeight: 600, letterSpacing: "0.05em", position: "relative" }}>AI Interviewer</div>
      <div className="label" style={{ marginTop: "0.25rem", position: "relative", color: isSpeaking ? "var(--accent)" : "var(--muted)" }}>
        {isSpeaking ? "● SPEAKING" : "LISTENING"}
      </div>
      <div className="label" style={{ position: "absolute", bottom: "0.75rem", opacity: 0.4 }}>
        [ 3D Avatar — Three.js / TalkingHead ]
      </div>
    </div>
  );
}

// ─── USER CAMERA PANEL (bottom half) ─────────────────────────────────────────
function CameraPanel({
  videoRef,
  cameraOn,
  micOn,
  onToggleCamera,
  onToggleMic,
  isRecording,
  isProcessing,
  isSpeaking,
  onStartRecording,
  onStopRecording
}: {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  cameraOn: boolean;
  micOn: boolean;
  onToggleCamera: () => void;
  onToggleMic: () => void;
  isRecording: boolean;
  isProcessing: boolean;
  isSpeaking: boolean;
  onStartRecording: () => void;
  onStopRecording: () => void;
}) {
  return (
    <div style={{ position: "relative", width: "100%", flex: 1, background: "#000", overflow: "hidden" }}>
      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        style={{ width: "100%", height: "100%", objectFit: "cover", transform: "scaleX(-1)", display: "block", opacity: cameraOn ? 1 : 0, transition: "opacity 0.3s ease" }}
      />

      {cameraOn && (
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", pointerEvents: "none" }}>
          <button
            onClick={isRecording ? onStopRecording : onStartRecording}
            disabled={isProcessing || isSpeaking}
            style={{
              pointerEvents: "auto",
              padding: "0.8rem 1.6rem",
              borderRadius: "99px",
              border: "none",
              background: isRecording ? "var(--danger)" : "var(--accent)",
              color: "#080b12",
              fontWeight: 800,
              fontSize: "0.85rem",
              fontFamily: "var(--font-mono)",
              cursor: (isProcessing || isSpeaking) ? "not-allowed" : "pointer",
              boxShadow: isRecording ? "0 0 30px rgba(255,77,109,0.4)" : "0 0 30px rgba(0,229,255,0.3)",
              display: "flex",
              alignItems: "center",
              gap: "0.6rem",
              transition: "all 0.3s ease",
              transform: isRecording ? "scale(1.05)" : "scale(1)",
              opacity: (isProcessing || isSpeaking) ? 0.7 : 1
            }}
          >
            {isRecording && <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#fff", animation: "pulse-ring 1.2s infinite" }} />}
            {isProcessing ? "ANALYZING..." : isSpeaking ? "AI SPEAKING..." : isRecording ? "STOP & SUBMIT" : "RECORD ANSWER"}
          </button>
        </div>
      )}

      {!cameraOn && (
        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "#0a0f1a", gap: "0.5rem" }}>
          <div style={{ color: "var(--muted)", opacity: 0.4 }}><CameraIcon off={true} /></div>
          <span style={{ fontSize: "0.7rem", fontFamily: "var(--font-mono)", color: "var(--muted)", letterSpacing: "0.08em" }}>CAMERA OFF</span>
        </div>
      )}
      <div style={{ position: "absolute", bottom: "0.75rem", left: "0.75rem", display: "flex", alignItems: "center", gap: "0.4rem" }}>
        <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: cameraOn ? "var(--danger)" : "var(--muted)" }} />
        <span style={{ fontSize: "0.65rem", fontFamily: "var(--font-mono)", color: "rgba(255,255,255,0.7)", letterSpacing: "0.08em" }}>YOU</span>
      </div>
      <div style={{ position: "absolute", bottom: "0.65rem", right: "0.75rem", display: "flex", gap: "0.5rem" }}>
        <button
          onClick={onToggleCamera}
          title={cameraOn ? "Turn off camera" : "Turn on camera"}
          style={{ width: "32px", height: "32px", borderRadius: "50%", border: "1px solid rgba(255,255,255,0.15)", background: cameraOn ? "rgba(255,255,255,0.1)" : "rgba(255,77,109,0.3)", color: cameraOn ? "rgba(255,255,255,0.8)" : "var(--danger)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", transition: "all 0.2s ease", backdropFilter: "blur(8px)" }}
        >
          <CameraIcon off={!cameraOn} />
        </button>
        <button
          onClick={onToggleMic}
          title={micOn ? "Mute microphone" : "Unmute microphone"}
          style={{ width: "32px", height: "32px", borderRadius: "50%", border: "1px solid rgba(255,255,255,0.15)", background: micOn ? "rgba(255,255,255,0.1)" : "rgba(255,77,109,0.3)", color: micOn ? "rgba(255,255,255,0.8)" : "var(--danger)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", transition: "all 0.2s ease", backdropFilter: "blur(8px)" }}
        >
          <MicIcon off={!micOn} />
        </button>
      </div>
    </div>
  );
}

// ─── COUNTDOWN OVERLAY ────────────────────────────────────────────────────────
function CountdownOverlay({ countdown }: { countdown: number }) {
  const isGoodLuck = countdown === 0;
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 50, backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)", background: "rgba(8, 11, 18, 0.75)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "1.5rem" }}>
      <div style={{ position: "absolute", width: "400px", height: "400px", borderRadius: "50%", background: isGoodLuck ? "radial-gradient(circle, rgba(0,224,150,0.12) 0%, transparent 70%)" : "radial-gradient(circle, rgba(0,229,255,0.1) 0%, transparent 70%)", transition: "background 0.6s ease", pointerEvents: "none" }} />
      <div style={{ fontSize: isGoodLuck ? "4.5rem" : "6rem", fontWeight: 800, fontFamily: "var(--font-mono)", color: isGoodLuck ? "var(--success)" : "var(--accent)", lineHeight: 1, letterSpacing: "-0.04em", textShadow: isGoodLuck ? "0 0 60px rgba(0,224,150,0.5)" : "0 0 60px rgba(0,229,255,0.4)", animation: "countPop 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)" }}>
        {isGoodLuck ? "Good luck!" : countdown}
      </div>
      {!isGoodLuck && (
        <div style={{ textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: "0.5rem" }}>
          <div style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--text)", letterSpacing: "-0.02em" }}>Interview starting in</div>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.78rem", color: "var(--muted)", letterSpacing: "0.08em" }}>Get comfortable and look at the camera</div>
        </div>
      )}
      {!isGoodLuck && (
        <div style={{ width: "200px", height: "3px", background: "rgba(0,229,255,0.15)", borderRadius: "99px", overflow: "hidden", marginTop: "0.5rem" }}>
          <div style={{ height: "100%", background: "var(--accent)", borderRadius: "99px", width: `${((10 - countdown) / 10) * 100}%`, transition: "width 0.9s linear", boxShadow: "0 0 8px rgba(0,229,255,0.6)" }} />
        </div>
      )}
      <style>{`@keyframes countPop { from { transform: scale(0.7); opacity: 0; } to { transform: scale(1); opacity: 1; } }`}</style>
    </div>
  );
}

// ─── CONNECTION STATUS BADGE ──────────────────────────────────────────────────
function ConnectionBadge({ status }: { status: "connecting" | "connected" | "failed" | "mock" }) {
  const config = {
    connecting: { color: "#febc2e", label: "CONNECTING TO BACKEND" },
    connected: { color: "var(--success)", label: "BACKEND CONNECTED" },
    failed: { color: "var(--danger)", label: "USING MOCK DATA" },
    mock: { color: "var(--muted)", label: "MOCK MODE" },
  }[status];
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
      <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: config.color }} />
      <span style={{ fontSize: "0.65rem", fontFamily: "var(--font-mono)", color: config.color, letterSpacing: "0.08em" }}>
        {config.label}
      </span>
    </div>
  );
}

// ─── AUDIO QUEUE HELPER ──────────────────────────────────────────────────────
class AudioQueue {
  private queue: string[] = [];
  private isPlaying = false;
  private onEnd: () => void;
  private audio: HTMLAudioElement | null = null;

  constructor(onEnd: () => void) {
    this.onEnd = onEnd;
  }

  add(url: string) {
    this.queue.push(url);
    if (!this.isPlaying) this.playNext();
  }

  private playNext() {
    if (this.queue.length === 0) {
      this.isPlaying = false;
      this.onEnd();
      return;
    }
    this.isPlaying = true;
    this.audio = new Audio(this.queue.shift());
    this.audio.onended = () => this.playNext();
    this.audio.play().catch(e => console.error("Audio playback failed", e));
  }

  stop() {
    if (this.audio) {
      this.audio.pause();
      this.audio = null;
    }
    this.queue = [];
    this.isPlaying = false;
  }
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────
export default function InterviewPage() {
  const router = useRouter();
  const {
    phase, setPhase, finishInterview,
    transcript, addTranscriptEntry, addBiometricPoint,
    updateLastTranscriptText,
    liveAlert, setLiveAlert,
    startInterview,
    sessionId, resumeText, jobText, interviewerPersona
  } = useInterviewStore();

  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [gazeScore, setGazeScore] = useState(88);
  const [confidence, setConfidence] = useState(82);
  const [fidget, setFidget] = useState(12);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [connStatus, setConnStatus] = useState<"connecting" | "connected" | "failed" | "mock">("connecting");
  const [cameraOn, setCameraOn] = useState(false);
  const [micOn, setMicOn] = useState(false);

  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [questionIndex, setQuestionIndex] = useState(0);

  const transcriptRef = useRef<HTMLDivElement>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const dcRef = useRef<RTCDataChannel | null>(null);
  const interviewStartedRef = useRef(false);

  const audioRecorderRef = useRef<MediaRecorder | null>(null);
  const videoRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const videoChunksRef = useRef<Blob[]>([]);

  const audioQueueRef = useRef<AudioQueue | null>(null);

  // ─── PIPELINE: Process Turn ───────────────────────────────────────────────
  const processTurn = async (audioBlob: Blob | null, videoBlob: Blob | null) => {
    if (!sessionId) return;
    if (!audioBlob) {
      alert("No audio recorded.");
      return;
    }

    setIsProcessing(true);
    if (!audioQueueRef.current) {
      audioQueueRef.current = new AudioQueue(() => setIsSpeaking(false));
    }
    audioQueueRef.current.stop();

    try {
      // 1. Send to stream-process
      const formData = new FormData();
      formData.append('audio', audioBlob);
      if (videoBlob) formData.append('video', videoBlob);
      formData.append('session_id', sessionId);
      formData.append('timestamp_sec', elapsedSeconds.toString());

      const streamRes = await fetch('http://127.0.0.1:8080/api/stream-process', {
        method: 'POST',
        body: formData,
      });
      const streamData = await streamRes.json();

      if (streamData.text) {
        addTranscriptEntry({ time: elapsedSeconds, speaker: 'user', text: streamData.text });

        // 2. Chat for next question (STREAMING)
        const chatRes = await fetch('http://127.0.0.1:8080/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: streamData.text,
            question_index: questionIndex,
            session_id: sessionId,
            resume_text: resumeText,
            job_text: jobText,
            interviewer_persona: interviewerPersona
          }),
        });

        if (!chatRes.body) return;
        const reader = chatRes.body.getReader();
        const decoder = new TextDecoder();

        addTranscriptEntry({ time: elapsedSeconds, speaker: 'interviewer', text: "" });

        let sentenceBuffer = "";
        let doneMetadata: any = null;

        while (true) {
          const { value, done } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = JSON.parse(line.slice(6));
              if (data.token) {
                updateLastTranscriptText(data.token);
                sentenceBuffer += data.token;

                // Trigger TTS for each complete sentence
                if (/[.!?]$/.test(sentenceBuffer.trim())) {
                  const fragment = sentenceBuffer.trim();
                  sentenceBuffer = ""; // Clear for next fragment

                  setIsSpeaking(true);
                  fetch('http://127.0.0.1:8080/api/tts', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ text: fragment }),
                  }).then(r => r.blob()).then(blob => {
                    if (audioQueueRef.current) {
                      audioQueueRef.current.add(URL.createObjectURL(blob));
                    }
                  });
                }
              } else if (data.done) {
                doneMetadata = data;
              }
            }
          }
        }

        // Final tail fragment if it didn't end with punctuation
        if (sentenceBuffer.trim().length > 0) {
          const fragment = sentenceBuffer.trim();
          fetch('http://127.0.0.1:8080/api/tts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: fragment }),
          }).then(r => r.blob()).then(blob => {
            if (audioQueueRef.current) {
              audioQueueRef.current.add(URL.createObjectURL(blob));
            }
          });
        }

        if (doneMetadata) {
          setQuestionIndex(doneMetadata.next_index);
          if (doneMetadata.is_finished) {
            setTimeout(() => finishInterview(), 2000);
          }
        }
      }
    } catch (err) {
      console.error("Turn processing failed:", err);
    } finally {
      setIsProcessing(false);
    }
  };

  // ─── Recording Controls ───────────────────────────────────────────────────
  const startRecording = () => {
    if (!streamRef.current) {
      alert("No media stream found. Please enable your camera or microphone first.");
      return;
    }

    try {
      const getMimeType = (type: 'audio' | 'video') => {
        const types = type === 'audio'
          ? ['audio/webm;codecs=opus', 'audio/webm', 'audio/ogg', 'audio/mp4']
          : ['video/webm;codecs=vp8,opus', 'video/webm;codecs=h264,opus', 'video/webm', 'video/mp4'];
        return types.find(t => MediaRecorder.isTypeSupported(t)) || '';
      };

      const audioMime = getMimeType('audio');
      const videoMime = getMimeType('video');

      console.log(`[MediaRecorder] Attempting start. Audio Mime: ${audioMime}, Video Mime: ${videoMime}`);

      // Create specific streams for each recorder to avoid "NotSupportedError" if a track is missing
      const audioTracks = streamRef.current.getAudioTracks();
      const videoTracks = streamRef.current.getVideoTracks();

      if (audioTracks.length === 0 && videoTracks.length === 0) {
        throw new Error("No active audio or video tracks found to record.");
      }

      // Initialize audio recorder if audio tracks exist
      if (audioTracks.length > 0) {
        audioChunksRef.current = [];
        const audioStream = new MediaStream(audioTracks);
        const audioRecorder = new MediaRecorder(audioStream, audioMime ? { mimeType: audioMime } : {});
        audioRecorder.ondataavailable = (e) => { if (e.data.size > 0) audioChunksRef.current.push(e.data); };
        audioRecorder.start();
        audioRecorderRef.current = audioRecorder;
      }

      // Initialize video recorder if video tracks exist
      if (videoTracks.length > 0) {
        videoChunksRef.current = [];
        const videoStream = new MediaStream(videoTracks);
        const videoRecorder = new MediaRecorder(videoStream, videoMime ? { mimeType: videoMime } : {});
        videoRecorder.ondataavailable = (e) => { if (e.data.size > 0) videoChunksRef.current.push(e.data); };
        videoRecorder.start();
        videoRecorderRef.current = videoRecorder;
      }

      setIsRecording(true);
      console.log("[MediaRecorder] Recording started successfully.");
    } catch (err: any) {
      console.error("[MediaRecorder] Startup failed:", err);
      // Clean up if partial start
      [audioRecorderRef, videoRecorderRef].forEach(ref => {
        if (ref.current && ref.current.state === "recording") ref.current.stop();
        ref.current = null;
      });
      alert(`Could not start recording: ${err.message || err.name || "Unknown error"}. Check console for details.`);
    }
  };

  const stopRecording = () => {
    const hasAudio = !!audioRecorderRef.current;
    const hasVideo = !!videoRecorderRef.current;
    const activeRecorders = [audioRecorderRef.current, videoRecorderRef.current].filter(r => r !== null);

    if (activeRecorders.length === 0) {
      setIsRecording(false);
      return;
    }

    let stoppedCount = 0;
    const onRecorderStop = () => {
      stoppedCount++;
      if (stoppedCount === activeRecorders.length) {
        const audioBlob = hasAudio ? new Blob(audioChunksRef.current, { type: audioChunksRef.current[0]?.type || 'audio/webm' }) : null;
        const videoBlob = hasVideo ? new Blob(videoChunksRef.current, { type: videoChunksRef.current[0]?.type || 'video/webm' }) : null;
        processTurn(audioBlob, videoBlob);
      }
    };

    activeRecorders.forEach(r => {
      r!.onstop = onRecorderStop;
      r!.stop();
    });

    audioRecorderRef.current = null;
    videoRecorderRef.current = null;
    setIsRecording(false);
  };


  // ── Start timer + interview when camera or mic first turns on ─────────────
  const maybeStartInterview = () => {
    if (interviewStartedRef.current) return;
    interviewStartedRef.current = true;
    startInterview();
    setIsReady(true);
    startWebRTC();
  };

  // ── Toggle camera ─────────────────────────────────────────────────────────
  const handleToggleCamera = async () => {
    try {
      if (!streamRef.current) {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: micOn });
        streamRef.current = stream;
        if (localVideoRef.current) localVideoRef.current.srcObject = stream;
        setCameraOn(true);
        maybeStartInterview();
      } else {
        const videoTracks = streamRef.current.getVideoTracks();
        if (videoTracks.length === 0) {
          // If stream exists but no video track, request it
          const videoStream = await navigator.mediaDevices.getUserMedia({ video: true });
          const newTrack = videoStream.getVideoTracks()[0];
          streamRef.current.addTrack(newTrack);
          setCameraOn(true);
        } else {
          const newState = !cameraOn;
          videoTracks.forEach(t => { t.enabled = newState; });
          setCameraOn(newState);
        }
        if (!cameraOn) maybeStartInterview();
      }
    } catch (err: any) {
      console.error("Camera access failed:", err);
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        alert("Camera permission denied. Please enable it in your browser settings and refresh.");
      } else {
        alert(`Camera error: ${err.message || "Unknown error"}`);
      }
    }
  };

  // ── Toggle mic ────────────────────────────────────────────────────────────
  const handleToggleMic = async () => {
    try {
      if (!streamRef.current) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: cameraOn });
        streamRef.current = stream;
        if (localVideoRef.current) localVideoRef.current.srcObject = stream;
        setMicOn(true);
        maybeStartInterview();
      } else {
        const audioTracks = streamRef.current.getAudioTracks();
        if (audioTracks.length === 0) {
          // If stream exists but no audio track, request it
          const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
          const newTrack = audioStream.getAudioTracks()[0];
          streamRef.current.addTrack(newTrack);
          setMicOn(true);
        } else {
          const newState = !micOn;
          audioTracks.forEach(t => { t.enabled = newState; });
          setMicOn(newState);
        }
        if (!micOn) maybeStartInterview();
      }
    } catch (err: any) {
      console.error("Mic access failed:", err);
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        alert("Microphone permission denied. Please enable it in your browser settings and refresh.");
      } else {
        alert(`Microphone error: ${err.message || "Unknown error"}`);
      }
    }
  };

  // ── WebRTC ────────────────────────────────────────────────────────────────
  const startWebRTC = async () => {
    if (!streamRef.current) {
      console.warn("%c[WebRTC] ✗ No media stream — falling back to mock UI (no data)", "color:#ff4d6d");
      setConnStatus("failed");
      return;
    }
    console.log("%c[WebRTC] Starting connection to backend...", "color:#febc2e;font-weight:bold");
    try {
      setConnStatus("connecting");
      const pc = new RTCPeerConnection({
        iceServers: [
          { urls: "stun:stun.l.google.com:19302" },
          { urls: "turn:openrelay.metered.ca:80", username: "openrelayproject", credential: "openrelayproject" },
          { urls: "turn:openrelay.metered.ca:443", username: "openrelayproject", credential: "openrelayproject" },
        ],
        iceTransportPolicy: "all",
      });
      pcRef.current = pc;
      (window as any)._pc = pc;

      pc.oniceconnectionstatechange = () => {
        const s = pc.iceConnectionState;
        const c: Record<string, string> = { checking: "#febc2e", connected: "#00e096", completed: "#00e096", failed: "#ff4d6d", disconnected: "#ff4d6d", closed: "#5a6a82" };
        console.log(`%c[WebRTC] ICE → ${s}`, `color:${c[s] ?? "#e8edf5"};font-weight:bold`);
      };
      pc.onconnectionstatechange = () => {
        console.log(`%c[WebRTC] Connection → ${pc.connectionState}`, "color:#00e5ff;font-weight:bold");
      };

      const dc = pc.createDataChannel("inference");
      dcRef.current = dc;
      dc.onopen = () => { setConnStatus("connected"); dc.send("ping"); };
      dc.onclose = () => console.log("%c[DataChannel] closed", "color:#5a6a82");
      dc.onerror = (e) => console.error("%c[DataChannel] error:", "color:#ff4d6d", e);
      dc.onmessage = (event) => {
        try {
          if (typeof event.data === "string" && event.data.startsWith("pong")) return;
          const msg = JSON.parse(event.data);
          if (msg.type === "video_inference") {
            const conf = Math.round(msg.confidence * 100);
            setConfidence(conf);
            addBiometricPoint({ time: Math.round(msg.timestamp / 1000), gazeScore, confidence: conf, fidgetIndex: fidget, stressSpike: conf < 40 });
          }
          if (msg.type === "audio_inference") {
            const audioConf = Math.round(msg.confidence * 100);
            setConfidence(prev => Math.round((prev + audioConf) / 2));
            if (msg.transcript?.trim()) {
              addTranscriptEntry({ time: elapsedSeconds, speaker: "user", text: msg.transcript.trim() });
              setIsSpeaking(false);
            }
          }
        } catch { /* non-JSON */ }
      };

      streamRef.current.getTracks().forEach(track => pc.addTrack(track, streamRef.current!));

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      const res = await fetch("/api/offer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sdp: offer.sdp, type: offer.type }),
      });
      if (!res.ok) throw new Error(`Backend returned ${res.status}`);
      const answer = await res.json();
      await pc.setRemoteDescription(new RTCSessionDescription(answer));
      console.log("%c[WebRTC] ✓ Handshake complete", "color:#00e5ff;font-weight:bold");

    } catch (err) {
      console.error("%c[WebRTC] ✗ Setup failed — falling back to mock UI:", "color:#ff4d6d;font-weight:bold", err);
      setConnStatus("failed");
    }
  };

  // ── Countdown (visual only — timer starts on first device toggle) ─────────
  useEffect(() => {
    if (phase !== "connecting") return;
    setCountdown(10);
    let current = 10;
    const ticker = setInterval(() => {
      current -= 1;
      setCountdown(current);
      if (current <= 0) {
        clearInterval(ticker);
        setTimeout(() => setCountdown(null), 1500);
        // Note: interview/timer does NOT start here — waits for camera/mic toggle
      }
    }, 1000);
    return () => clearInterval(ticker);
  }, [phase]);

  useEffect(() => { if (phase === "live") setIsReady(true); }, [phase]);

  // ── Timer — only runs once isReady is true ────────────────────────────────
  useEffect(() => {
    if (!isReady) return;
    const interval = setInterval(() => setElapsedSeconds(s => s + 1), 1000);
    return () => clearInterval(interval);
  }, [isReady]);

  // ── Auto-scroll transcript ────────────────────────────────────────────────
  useEffect(() => {
    if (transcriptRef.current)
      transcriptRef.current.scrollTop = transcriptRef.current.scrollHeight;
  }, [transcript]);

  // ── Cleanup on unmount ────────────────────────────────────────────────────
  useEffect(() => {
    return () => { streamRef.current?.getTracks().forEach(t => t.stop()); };
  }, []);

  // Removed Mock Logic

  // ── Finish ────────────────────────────────────────────────────────────────
  const handleFinish = () => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    dcRef.current?.close();
    pcRef.current?.close();
    finishInterview();
    setTimeout(() => { setPhase("report"); router.push("/report"); }, 2000);
  };

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60).toString().padStart(2, "0");
    const sec = (s % 60).toString().padStart(2, "0");
    return `${m}:${sec}`;
  };

  if (phase === "processing") {
    return (
      <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "1.5rem" }}>
        <div style={{ width: "48px", height: "48px", border: "3px solid var(--border)", borderTopColor: "var(--success)", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
        <div style={{ fontFamily: "var(--font-mono)", color: "var(--muted)" }}>Generating your report...</div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", display: "grid", gridTemplateRows: "auto 1fr auto", background: "var(--bg)" }}>

      {countdown !== null && <CountdownOverlay countdown={countdown} />}

      {/* ── TOP BAR ── */}
      <header style={{ borderBottom: "1px solid var(--border)", padding: "1rem 2rem", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "1.25rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "var(--danger)" }} />
            <span className="label" style={{ color: "var(--danger)" }}>LIVE SESSION</span>
          </div>
          <ConnectionBadge status={connStatus} />
        </div>
        {/* Timer dims until interview starts */}
        <div style={{ fontFamily: "var(--font-mono)", fontSize: "1.5rem", fontWeight: 500, letterSpacing: "0.05em", color: isReady ? "var(--text)" : "var(--muted)", transition: "color 0.3s ease" }}>
          {isReady ? formatTime(elapsedSeconds) : "--:--"}
        </div>
        <button className="btn-danger" onClick={handleFinish} style={{ padding: "0.5rem 1.25rem", fontSize: "0.8rem" }}>
          End Interview
        </button>
      </header>

      {/* ── MAIN CONTENT ── */}
      <main style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: "1.5rem", padding: "1.5rem 2rem", overflow: "hidden" }}>

        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          <div style={{ display: "flex", flexDirection: "column", borderRadius: "12px", overflow: "hidden", border: "1px solid var(--border)", aspectRatio: "4/3" }}>
            <AvatarPanel isSpeaking={isSpeaking} />
            <div style={{ height: "1px", background: "var(--border)", flexShrink: 0 }} />
            <CameraPanel
              videoRef={localVideoRef}
              cameraOn={cameraOn}
              micOn={micOn}
              onToggleCamera={handleToggleCamera}
              onToggleMic={handleToggleMic}
              isRecording={isRecording}
              isProcessing={isProcessing}
              isSpeaking={isSpeaking}
              onStartRecording={startRecording}
              onStopRecording={stopRecording}
            />
          </div>

          <div className="card" style={{ display: "flex", justifyContent: "space-around", padding: "1.25rem" }}>
            <ScoreRing label="GAZE" value={gazeScore} color="var(--accent)" />
            <ScoreRing label="CONFIDENCE" value={confidence} color="var(--accent2)" />
            <ScoreRing label="CALM" value={100 - fidget} color="var(--success)" />
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "1rem", overflow: "hidden" }}>
          <div style={{ minHeight: "52px" }}>
            {liveAlert && (
              <div className="slide-in" style={{ background: "rgba(255,77,109,0.1)", border: "1px solid var(--danger)", borderRadius: "10px", padding: "0.75rem 1rem", fontFamily: "var(--font-mono)", fontSize: "0.85rem", color: "var(--danger)" }}>
                {liveAlert}
              </div>
            )}
          </div>

          <div className="card" style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column", padding: "1rem" }}>
            <div className="label" style={{ marginBottom: "0.75rem" }}>LIVE TRANSCRIPT</div>
            <div ref={transcriptRef} style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {transcript.length === 0 ? (
                <div className="label" style={{ textAlign: "center", marginTop: "2rem" }}>
                  {isReady ? "Listening..." : "Turn on your camera or mic to begin"}
                </div>
              ) : (
                transcript.map((entry, i) => (
                  <div key={i} className="fade-up" style={{ display: "flex", gap: "0.75rem", alignItems: "flex-start" }}>
                    <div style={{ fontSize: "0.7rem", fontFamily: "var(--font-mono)", fontWeight: 700, color: entry.speaker === "interviewer" ? "var(--accent)" : "var(--accent2)", marginTop: "2px", whiteSpace: "nowrap", flexShrink: 0 }}>
                      {entry.speaker === "interviewer" ? "AI" : "YOU"}
                    </div>
                    <p style={{ fontSize: "0.85rem", lineHeight: 1.5, color: entry.speaker === "user" ? "var(--text)" : "rgba(232,237,245,0.7)" }}>
                      {entry.text}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}