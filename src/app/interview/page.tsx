"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useInterviewStore } from "@/store/useInterviewStore";
import { MOCK_LIVE_ALERTS, MOCK_TRANSCRIPT, MOCK_BIOMETRICS } from "@/lib/mockData";

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

// ─── AVATAR PLACEHOLDER ───────────────────────────────────────────────────────
function AvatarPlaceholder({ isSpeaking }: { isSpeaking: boolean }) {
  return (
    <div style={{ position: "relative", width: "100%", aspectRatio: "4/3", background: "linear-gradient(135deg, #0e1e35 0%, #0a1525 100%)", borderRadius: "12px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", overflow: "hidden", border: "1px solid var(--border)" }}>
      <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(rgba(0,229,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0,229,255,0.03) 1px, transparent 1px)", backgroundSize: "40px 40px" }} />
      <div style={{ position: "relative", width: "120px", height: "120px", borderRadius: "50%", background: "linear-gradient(135deg, var(--accent2), var(--accent))", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "3rem", boxShadow: isSpeaking ? "0 0 40px rgba(0,229,255,0.4)" : "0 0 20px rgba(0,229,255,0.1)", transition: "box-shadow 0.3s ease" }}>
        🤖
        {isSpeaking && (
          <div style={{ position: "absolute", inset: "-8px", borderRadius: "50%", border: "2px solid var(--accent)", animation: "pulse-ring 1.5s ease-out infinite" }} />
        )}
      </div>
      <div style={{ marginTop: "1rem", fontWeight: 600, letterSpacing: "0.05em" }}>AI Interviewer</div>
      <div className="label" style={{ marginTop: "0.25rem", color: isSpeaking ? "var(--accent)" : "var(--muted)" }}>
        {isSpeaking ? "● SPEAKING" : "LISTENING"}
      </div>
      <div className="label" style={{ position: "absolute", bottom: "1rem", opacity: 0.4 }}>
        [ 3D Avatar — Three.js / TalkingHead ]
      </div>
    </div>
  );
}

// ─── COUNTDOWN OVERLAY ────────────────────────────────────────────────────────
function CountdownOverlay({ countdown }: { countdown: number }) {
  const isGoodLuck = countdown === 0;

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 50,
      backdropFilter: "blur(12px)",
      WebkitBackdropFilter: "blur(12px)",
      background: "rgba(8, 11, 18, 0.75)",
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      gap: "1.5rem",
      transition: "opacity 0.4s ease",
    }}>
      {/* Ambient glow behind the content */}
      <div style={{
        position: "absolute",
        width: "400px", height: "400px",
        borderRadius: "50%",
        background: isGoodLuck
          ? "radial-gradient(circle, rgba(0,224,150,0.12) 0%, transparent 70%)"
          : "radial-gradient(circle, rgba(0,229,255,0.1) 0%, transparent 70%)",
        transition: "background 0.6s ease",
        pointerEvents: "none",
      }} />

      {/* Main countdown number or checkmark */}
      <div style={{
        fontSize: isGoodLuck ? "4rem" : "6rem",
        fontWeight: 800,
        fontFamily: "var(--font-mono)",
        color: isGoodLuck ? "var(--success)" : "var(--accent)",
        lineHeight: 1,
        letterSpacing: "-0.04em",
        textShadow: isGoodLuck
          ? "0 0 60px rgba(0,224,150,0.5)"
          : "0 0 60px rgba(0,229,255,0.4)",
        animation: "countPop 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)",
        key: countdown,
      }}>
        {isGoodLuck ? "✓" : countdown}
      </div>

      {/* Message */}
      <div style={{
        textAlign: "center",
        display: "flex", flexDirection: "column", alignItems: "center", gap: "0.5rem",
      }}>
        <div style={{
          fontSize: isGoodLuck ? "1.6rem" : "1.1rem",
          fontWeight: 700,
          color: isGoodLuck ? "var(--success)" : "var(--text)",
          letterSpacing: "-0.02em",
          transition: "all 0.4s ease",
          textShadow: isGoodLuck ? "0 0 40px rgba(0,224,150,0.4)" : "none",
        }}>
          {isGoodLuck ? "Good luck!" : "Interview starting in"}
        </div>
        {!isGoodLuck && (
          <div style={{
            fontFamily: "var(--font-mono)",
            fontSize: "0.78rem",
            color: "var(--muted)",
            letterSpacing: "0.08em",
          }}>
            Get comfortable and look at the camera
          </div>
        )}
      </div>

      {/* Progress bar */}
      {!isGoodLuck && (
        <div style={{
          width: "200px", height: "3px",
          background: "rgba(0,229,255,0.15)",
          borderRadius: "99px", overflow: "hidden",
          marginTop: "0.5rem",
        }}>
          <div style={{
            height: "100%",
            background: "var(--accent)",
            borderRadius: "99px",
            width: `${((10 - countdown) / 10) * 100}%`,
            transition: "width 0.9s linear",
            boxShadow: "0 0 8px rgba(0,229,255,0.6)",
          }} />
        </div>
      )}

      <style>{`
        @keyframes countPop {
          from { transform: scale(0.7); opacity: 0; }
          to   { transform: scale(1);   opacity: 1; }
        }
      `}</style>
    </div>
  );
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────
export default function InterviewPage() {
  const router = useRouter();
  const {
    phase, setPhase, finishInterview,
    transcript, addTranscriptEntry, addBiometricPoint,
    liveAlert, setLiveAlert,
    startInterview,
  } = useInterviewStore();

  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [gazeScore, setGazeScore] = useState(88);
  const [confidence, setConfidence] = useState(82);
  const [fidget, setFidget] = useState(12);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isReady, setIsReady] = useState(false);

  // Countdown state: null = no overlay, 10..1 = counting, 0 = "Good luck!"
  const [countdown, setCountdown] = useState<number | null>(null);

  const transcriptRef = useRef<HTMLDivElement>(null);

  // ── Connecting phase → start countdown ──
  useEffect(() => {
    if (phase !== "connecting") return;

    // Show the overlay immediately with 10
    setCountdown(10);

    // Tick down every second
    let current = 10;
    const ticker = setInterval(() => {
      current -= 1;
      setCountdown(current);

      if (current <= 0) {
        clearInterval(ticker);
        // Show "Good luck!" for 1.5s then dismiss
        setTimeout(() => {
          setCountdown(null);
          startInterview();
          setIsReady(true);
          startMockStreams();
        }, 1500);
      }
    }, 1000);

    return () => clearInterval(ticker);
  }, [phase]);

  useEffect(() => {
    if (phase === "live") setIsReady(true);
  }, [phase]);

  // ── Timer ──
  useEffect(() => {
    if (!isReady) return;
    const interval = setInterval(() => setElapsedSeconds((s) => s + 1), 1000);
    return () => clearInterval(interval);
  }, [isReady]);

  // ── Auto-scroll transcript ──
  useEffect(() => {
    if (transcriptRef.current) {
      transcriptRef.current.scrollTop = transcriptRef.current.scrollHeight;
    }
  }, [transcript]);

  // ── Mock data streaming ──
  const startMockStreams = () => {
    MOCK_BIOMETRICS.forEach((point) => {
      setTimeout(() => {
        setGazeScore(point.gazeScore);
        setConfidence(point.confidence);
        setFidget(point.fidgetIndex);
        addBiometricPoint(point);
      }, point.time * 1000);
    });

    MOCK_TRANSCRIPT.forEach((entry) => {
      setTimeout(() => {
        setIsSpeaking(entry.speaker === "interviewer");
        addTranscriptEntry(entry);
        if (entry.speaker === "interviewer") {
          setTimeout(() => setIsSpeaking(false), 5000);
        }
      }, entry.time * 1000);
    });

    MOCK_LIVE_ALERTS.forEach(({ delay, message }) => {
      setTimeout(() => {
        setLiveAlert(message);
        setTimeout(() => setLiveAlert(null), 4000);
      }, delay);
    });
  };

  const handleFinish = () => {
    finishInterview();
    setTimeout(() => {
      setPhase("report");
      router.push("/report");
    }, 2000);
  };

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60).toString().padStart(2, "0");
    const sec = (s % 60).toString().padStart(2, "0");
    return `${m}:${sec}`;
  };

  // ── Processing screen ──
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

      {/* ── COUNTDOWN OVERLAY ── */}
      {countdown !== null && <CountdownOverlay countdown={countdown} />}

      {/* ── TOP BAR ── */}
      <header style={{ borderBottom: "1px solid var(--border)", padding: "1rem 2rem", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "var(--danger)", position: "relative" }} className="pulse-ring" />
          <span className="label" style={{ color: "var(--danger)" }}>LIVE SESSION</span>
        </div>
        <div style={{ fontFamily: "var(--font-mono)", fontSize: "1.5rem", fontWeight: 500, letterSpacing: "0.05em" }}>
          {formatTime(elapsedSeconds)}
        </div>
        <button className="btn-danger" onClick={handleFinish} style={{ padding: "0.5rem 1.25rem", fontSize: "0.8rem" }}>
          End Interview
        </button>
      </header>

      {/* ── MAIN CONTENT ── */}
      <main style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: "1.5rem", padding: "1.5rem 2rem", overflow: "hidden" }}>

        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          <AvatarPlaceholder isSpeaking={isSpeaking} />
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
                <div className="label" style={{ textAlign: "center", marginTop: "2rem" }}>Waiting for interview to begin...</div>
              ) : (
                transcript.map((entry, i) => (
                  <div key={i} className="fade-up" style={{ display: "flex", gap: "0.75rem", alignItems: "flex-start" }}>
                    <div style={{
                      fontSize: "0.7rem", fontFamily: "var(--font-mono)", fontWeight: 700,
                      color: entry.speaker === "interviewer" ? "var(--accent)" : "var(--accent2)",
                      marginTop: "2px", whiteSpace: "nowrap", flexShrink: 0
                    }}>
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

      {/* ── USER VIDEO STRIP ── */}
      <footer style={{ borderTop: "1px solid var(--border)", padding: "0.75rem 2rem", display: "flex", alignItems: "center", gap: "1rem" }}>
        <div style={{ width: "80px", height: "56px", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <span style={{ fontSize: "1.25rem" }}>📹</span>
        </div>
        <div>
          <div style={{ fontWeight: 600, fontSize: "0.85rem" }}>Your Camera</div>
          <div className="label" style={{ color: "var(--success)" }}>● MediaPipe Active — 468 landmarks @ 30fps</div>
        </div>
      </footer>
    </div>
  );
}