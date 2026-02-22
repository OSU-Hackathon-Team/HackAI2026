"use client";
import { useState, useEffect, useRef, Suspense } from "react";
import { useRouter } from "next/navigation";
import { useInterviewStore } from "@/store/useInterviewStore";
import dynamic from "next/dynamic";
import { AvatarHandle } from "@/components/Avatar";
import { PythonProvider, usePython } from "react-py";
import { CodeEditor, ConsoleOutput } from "@/components/CodeEditor";

const PYTHON_PACKAGES = { official: ["pyodide-http"] };
const Avatar = dynamic(() => import("@/components/Avatar"), { ssr: false });

// ─── GLOBAL STYLES ────────────────────────────────────────────────────────────
const GlobalStyles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800;900&family=IBM+Plex+Mono:wght@400;500;600&display=swap');

    :root {
      --display: 'Outfit', sans-serif;
      --mono: 'IBM Plex Mono', monospace;
      --bg: #060810;
      --surface: rgba(255,255,255,0.018);
      --surface2: rgba(255,255,255,0.03);
      --border: rgba(255,255,255,0.07);
      --border-bright: rgba(255,255,255,0.12);
      --cyan: #5fc8ff;
      --purple: #9b6fff;
      --green: #2de6a4;
      --pink: #ff5fa0;
      --danger: #ff4d6d;
      --gold: #ffb340;
      --text: #e8edf5;
      --muted: #4a5a72;
      --accent: #5fc8ff;
      --accent2: #9b6fff;
      --success: #2de6a4;
      --font-mono: 'IBM Plex Mono', monospace;
      --font-display: 'Outfit', sans-serif;
    }

    * { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      background: var(--bg);
      color: var(--text);
      font-family: var(--display);
      overflow-x: hidden;
    }

    /* Grain overlay */
    body::before {
      content: "";
      position: fixed; inset: 0;
      background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E");
      pointer-events: none; z-index: 9999; opacity: 0.25;
    }

    /* Ambient background nebula */
    body::after {
      content: "";
      position: fixed; inset: 0;
      background:
        radial-gradient(ellipse 50% 60% at 10% 20%, rgba(95,200,255,0.04) 0%, transparent 60%),
        radial-gradient(ellipse 40% 50% at 90% 80%, rgba(155,111,255,0.05) 0%, transparent 60%);
      pointer-events: none; z-index: 0;
    }

    .label {
      font-family: var(--mono);
      font-size: 0.58rem;
      letter-spacing: 0.16em;
      text-transform: uppercase;
      color: var(--muted);
    }

    .card {
      background: rgba(255,255,255,0.018);
      border: 1px solid var(--border);
      border-radius: 16px;
      position: relative;
      overflow: hidden;
    }

    .card::before {
      content: "";
      position: absolute; top: 0; left: 0; right: 0; height: 1px;
      background: linear-gradient(90deg, transparent, rgba(95,200,255,0.3), transparent);
    }

    /* Custom scrollbar for cyberpunk feel */
    *::-webkit-scrollbar {
      width: 4px;
      height: 4px;
    }
    *::-webkit-scrollbar-track {
      background: rgba(255, 255, 255, 0.02);
      border-radius: 10px;
    }
    *::-webkit-scrollbar-thumb {
      background: rgba(95, 200, 255, 0.15);
      border-radius: 10px;
      transition: all 0.2s ease;
    }
    *::-webkit-scrollbar-thumb:hover {
      background: rgba(95, 200, 255, 0.3);
    }
    
    /* Transparent scrollbar for some areas */
    .no-scrollbar::-webkit-scrollbar {
      display: none;
    }


    .btn-primary {
      display: inline-flex; align-items: center; gap: 0.4rem;
      background: linear-gradient(135deg, #5fc8ff, #9b6fff);
      color: #060810; font-family: var(--mono); font-weight: 700; font-size: 0.75rem;
      padding: 0.55rem 1.1rem; border-radius: 8px; border: none; cursor: pointer;
      letter-spacing: 0.04em; transition: all 0.2s ease;
      box-shadow: 0 0 20px rgba(95,200,255,0.15);
    }
    .btn-primary:hover { filter: brightness(1.1); transform: translateY(-1px); box-shadow: 0 6px 24px rgba(95,200,255,0.25); }

    .btn-ghost {
      display: inline-flex; align-items: center; gap: 0.4rem;
      background: rgba(255,255,255,0.04); color: var(--muted);
      font-family: var(--mono); font-weight: 500; font-size: 0.72rem;
      padding: 0.5rem 1rem; border-radius: 8px; border: 1px solid var(--border);
      cursor: pointer; transition: all 0.2s ease; letter-spacing: 0.04em;
    }
    .btn-ghost:hover { border-color: rgba(95,200,255,0.35); color: var(--cyan); background: rgba(95,200,255,0.06); }

    .btn-danger {
      display: inline-flex; align-items: center; gap: 0.4rem;
      background: rgba(255,77,109,0.08); color: var(--danger);
      font-family: var(--mono); font-weight: 600; font-size: 0.72rem;
      padding: 0.5rem 1rem; border-radius: 8px; border: 1px solid rgba(255,77,109,0.25);
      cursor: pointer; transition: all 0.2s ease; letter-spacing: 0.04em;
    }
    .btn-danger:hover { background: rgba(255,77,109,0.15); border-color: rgba(255,77,109,0.5); }

    .fade-up { animation: fadeUp 0.35s ease forwards; }
    @keyframes fadeUp { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
    @keyframes spin { to { transform: rotate(360deg); } }
    @keyframes pulse-ring { 0%,100% { opacity:1; transform:scale(1); } 50% { opacity:0.5; transform:scale(1.4); } }
    @keyframes blink { 0%,100% { opacity:1; } 50% { opacity:0.25; } }
    @keyframes scanline { 0% { top:-2px; } 100% { top:100%; } }
    @keyframes countPop { from { transform:scale(0.6); opacity:0; } to { transform:scale(1); opacity:1; } }

    /* Scrollbar */
    ::-webkit-scrollbar { width: 4px; }
    ::-webkit-scrollbar-track { background: transparent; }
    ::-webkit-scrollbar-thumb { background: rgba(95,200,255,0.2); border-radius: 2px; }
    ::-webkit-scrollbar-thumb:hover { background: rgba(95,200,255,0.4); }
  `}</style>
);

// ─── ICONS ────────────────────────────────────────────────────────────────────
function CameraIcon({ off }: { off: boolean }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      {off ? (
        <><line x1="1" y1="1" x2="23" y2="23" /><path d="M21 21H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h3m3-3h6l2 3h2a2 2 0 0 1 2 2v9.34" /><circle cx="12" cy="13" r="3" /></>
      ) : (
        <><path d="M23 7l-7 5 7 5V7z" /><rect x="1" y="5" width="15" height="14" rx="2" ry="2" /></>
      )}
    </svg>
  );
}

function MicIcon({ off }: { off: boolean }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      {off ? (
        <><line x1="1" y1="1" x2="23" y2="23" /><path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6" /><path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23" /><line x1="12" y1="19" x2="12" y2="23" /><line x1="8" y1="23" x2="16" y2="23" /></>
      ) : (
        <><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" /><path d="M19 10v2a7 7 0 0 1-14 0v-2" /><line x1="12" y1="19" x2="12" y2="23" /><line x1="8" y1="23" x2="16" y2="23" /></>
      )}
    </svg>
  );
}

// ─── CODING TASK PANEL ───────────────────────────────────────────────────────
function CodingTask({ transcript }: { transcript: { speaker: string; text: string }[] }) {
  const lastInterviewerMessage = [...transcript].reverse().find(m => m.speaker === 'interviewer');

  return (
    <div className="card fade-up" style={{ flex: 1, display: "flex", flexDirection: "column", padding: "1.5rem", gap: "1rem", overflow: "hidden", minHeight: 0 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <div style={{ width: "4px", height: "4px", borderRadius: "50%", background: "#5fc8ff", animation: "blink 2s ease-in-out infinite" }} />
          <span className="label" style={{ color: "var(--cyan)" }}>ACTIVE_CHALLENGE</span>
        </div>
      </div>
      <div style={{ flex: 1, overflowY: "auto", paddingRight: "0.5rem", marginTop: "0.25rem" }}>
        <p style={{ fontSize: "1.05rem", lineHeight: 1.6, color: "#fff", fontFamily: "var(--display)", fontWeight: 500, whiteSpace: "pre-wrap", letterSpacing: "-0.01em" }}>
          {lastInterviewerMessage?.text?.replace(/\[SCORE:\s*\d+\.?\d*\]/gi, "").trim() || "SYSTEM: INITIALIZING CODING ENVIRONMENT..."}
        </p>
      </div>
      <div style={{ borderTop: "1px solid var(--border)", paddingTop: "0.75rem", marginTop: "auto" }}>
        <div style={{ fontFamily: "var(--mono)", fontSize: "0.5rem", color: "var(--muted)", letterSpacing: "0.1em" }}>
          SYSTEM // CHALLENGE_VERSION_1.0 // RE-EVALUATING_PERFORMANCE
        </div>
      </div>
    </div>
  );
}

// ─── HUD METRIC RING ──────────────────────────────────────────────────────────
function HUDMetric({ label, value, color, glowColor }: { label: string; value: number; color: string; glowColor: string }) {
  const r = 26;
  const circ = 2 * Math.PI * r;
  const offset = circ - (value / 100) * circ;

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.5rem", flex: 1 }}>
      <div style={{ position: "relative", width: "68px", height: "68px" }}>
        <svg width="68" height="68" viewBox="0 0 68 68" style={{ position: "absolute", top: 0, left: 0 }}>
          <circle cx="34" cy="34" r={r} fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="3" />
          <circle
            cx="34" cy="34" r={r} fill="none" stroke={color} strokeWidth="3"
            strokeDasharray={circ} strokeDashoffset={offset}
            strokeLinecap="round" transform="rotate(-90 34 34)"
            style={{ transition: "stroke-dashoffset 1s cubic-bezier(0.4,0,0.2,1)", filter: `drop-shadow(0 0 8px ${glowColor})` }}
          />
        </svg>
        <div style={{
          position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center",
          fontFamily: "var(--mono)", fontSize: "1rem", color: "#fff", fontWeight: 600,
          textShadow: `0 0 12px ${glowColor}`
        }}>
          {Math.round(value)}
        </div>
      </div>
      <div style={{ fontFamily: "var(--mono)", fontSize: "0.48rem", color: "rgba(255,255,255,0.25)", letterSpacing: "0.2em", textAlign: "center" }}>
        {label}
      </div>
    </div>
  );
}

// ─── PRESSURE / GRADE BAR ────────────────────────────────────────────────────
const getColor = (s: number) => {
  if (s < 25) return "#2de6a4";
  if (s < 50) return "#caff00";
  if (s < 70) return "#ffcc00";
  if (s < 85) return "#ff8800";
  return "#ff4d6d";
};

function OverallGradeBar({ score, trend }: { score: number; trend: "rising" | "falling" | "stable" }) {
  const color = getColor(score);
  const trendIcon = trend === "rising" ? "▲" : trend === "falling" ? "▼" : "─";
  const trendColor = trend === "rising" ? "#ff4d6d" : trend === "falling" ? "#2de6a4" : "rgba(255,255,255,0.2)";

  return (
    <div style={{ width: "100%", paddingTop: "1rem", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.65rem" }}>
        <span style={{ fontFamily: "var(--mono)", fontSize: "0.52rem", color: "rgba(255,255,255,0.2)", letterSpacing: "0.18em" }}>RESPONSE_GRADE</span>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <span style={{ fontFamily: "var(--mono)", fontSize: "0.6rem", color: trendColor, fontWeight: 700 }}>{trendIcon}</span>
          <span style={{ fontFamily: "var(--display)", fontSize: "1.5rem", color, fontWeight: 800, lineHeight: 1, textShadow: `0 0 20px ${color}55` }}>
            {Math.round(score)}<span style={{ fontSize: "0.65rem", opacity: 0.4, marginLeft: "2px" }}>/100</span>
          </span>
        </div>
      </div>
      <div style={{ height: "3px", width: "100%", background: "rgba(255,255,255,0.06)", borderRadius: "2px", overflow: "hidden" }}>
        <div style={{
          height: "100%", width: `${score}%`, background: color,
          boxShadow: `0 0 10px ${color}`,
          transition: "width 0.8s cubic-bezier(0.4,0,0.2,1), background 0.8s ease"
        }} />
      </div>
    </div>
  );
}

// ─── SCORE PERFORMANCE ───────────────────────────────────────────────────────
function scorePerformance(text: string): number {
  const lower = text.toLowerCase();
  const wordCount = text.trim().split(/\s+/).length;
  const sentenceCount = text.split(/[.!?]+/).filter(s => s.trim().length > 5).length;
  const sig = (x: number, center: number, slope: number) => Math.tanh((x - center) / slope);
  const depthScore = sig(wordCount, 20, 15);
  const techKeywords = ["algorithm", "complexity", "architecture", "scalability", "latency", "throughput", "trade-off", "tradeoff", "distributed", "consistency", "availability", "partition", "database", "cache", "api", "microservice", "kubernetes", "docker", "ci/cd", "pipeline", "deployed", "implemented", "optimized", "refactored", "async", "concurrent", "thread", "memory", "time complexity", "space complexity", "o(n", "race condition", "idempotent", "inconsistency", "ingestion", "validation gates", "feature engineering", "scraping", "bottleneck", "deadlock", "idempotency", "eventual consistency", "acid", "normalization", "indexing", "sharding", "load balancer", "replication", "failover", "consensus", "raft", "paxos"];
  const techHits = techKeywords.filter(k => lower.includes(k)).length;
  const techScore = sig(techHits, 1.2, 1.2);
  const specificityMarkers = ["specifically", "for example", "for instance", "such as", "in particular", "we used", "i built", "i led", "i reduced", "i increased", "resulted in", "percent", "%", "ms", "seconds", "million", "thousand", "users", "enforcing", "tackle", "separation", "gate", "logic"];
  const numberHits = (text.match(/\b\d+(\.\d+)?[kmb%]?\b/gi) || []).length;
  const specificityHits = specificityMarkers.filter(m => lower.includes(m)).length + numberHits;
  const specificityScore = sig(specificityHits, 1, 1.0);
  const structureScore = sig(sentenceCount, 1.5, 0.8);
  const fillers = ["um", "uh", "like", "you know", "basically", "kind of", "sort of", "i mean"];
  const fillerCount = fillers.filter(f => lower.includes(f)).length;
  const fillerDensity = fillerCount / Math.max(1, wordCount / 10);
  const fillerPenalty = Math.tanh(fillerDensity * 2.5);
  const raw = (depthScore * 0.25 + techScore * 0.45 + specificityScore * 0.15 + structureScore * 0.15) - fillerPenalty * 0.3;
  return Math.max(-1, Math.min(1, raw));
}

// ─── AVATAR PANEL ────────────────────────────────────────────────────────────
function AvatarPanel({ isSpeaking, isProcessing, avatarRef, onAudioStart, onAudioEnd, pressureScore, pressureTrend, interviewerModel, interviewerName }: {
  isSpeaking: boolean; isProcessing: boolean; avatarRef: React.RefObject<AvatarHandle | null>;
  onAudioStart: () => void; onAudioEnd: () => void; pressureScore: number;
  pressureTrend: "rising" | "falling" | "stable"; interviewerModel: string; interviewerName: string;
}) {
  const statusColor = isSpeaking ? "#2de6a4" : isProcessing ? "#5fc8ff" : "rgba(255,255,255,0.2)";
  const statusLabel = isSpeaking ? "TRANSMITTING" : isProcessing ? "PROCESSING" : "STANDBY";

  return (
    <div style={{ position: "relative", width: "100%", height: "100%", background: "linear-gradient(160deg, #04060e 0%, #080b18 100%)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
      {/* Grid bg */}
      <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(rgba(95,200,255,0.025) 1px,transparent 1px),linear-gradient(90deg,rgba(95,200,255,0.025) 1px,transparent 1px)", backgroundSize: "32px 32px", maskImage: "radial-gradient(ellipse 80% 80% at 50% 50%,black 40%,transparent 100%)", WebkitMaskImage: "radial-gradient(ellipse 80% 80% at 50% 50%,black 40%,transparent 100%)" }} />

      {/* Scanline */}
      <div style={{ position: "absolute", left: 0, right: 0, height: "1px", background: "linear-gradient(90deg,transparent,rgba(95,200,255,0.4),transparent)", animation: "scanline 4s linear infinite", pointerEvents: "none", zIndex: 3 }} />

      {/* Ambient glow */}
      <div style={{ position: "absolute", width: "200px", height: "200px", borderRadius: "50%", background: "radial-gradient(circle,rgba(95,200,255,0.06) 0%,transparent 70%)", bottom: "0", left: "50%", transform: "translateX(-50%)", pointerEvents: "none" }} />

      {/* Avatar */}
      <div style={{ position: "absolute", inset: 0, zIndex: 1 }}>
        <Avatar ref={avatarRef} onAudioStart={onAudioStart} onAudioEnd={onAudioEnd} modelUrl={interviewerModel} cameraZoom={1} />
      </div>

      {/* Top-right status badge */}
      <div style={{ position: "absolute", top: "0.875rem", right: "0.875rem", zIndex: 4, display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "0.3rem" }}>
        <div style={{ fontFamily: "var(--mono)", fontSize: "0.62rem", fontWeight: 700, color: "#e8edf5", letterSpacing: "0.12em" }}>
          {interviewerName.toUpperCase().replace(/\s+/g, "_")}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
          <div style={{ width: "5px", height: "5px", borderRadius: "50%", background: statusColor, boxShadow: `0 0 6px ${statusColor}`, animation: isSpeaking || isProcessing ? "blink 1.2s ease-in-out infinite" : "none" }} />
          <span style={{ fontFamily: "var(--mono)", fontSize: "0.5rem", color: statusColor, letterSpacing: "0.14em" }}>{statusLabel}</span>
        </div>
      </div>

      {/* Corner brackets */}
      {[["top:8px;left:8px", "border-top:1px solid;border-left:1px solid"], ["top:8px;right:8px", "border-top:1px solid;border-right:1px solid"], ["bottom:8px;left:8px", "border-bottom:1px solid;border-left:1px solid"], ["bottom:8px;right:8px", "border-bottom:1px solid;border-right:1px solid"]].map((_, i) => (
        <div key={i} style={{ position: "absolute", width: "14px", height: "14px", borderColor: "rgba(95,200,255,0.3)", zIndex: 4, ...(i === 0 ? { top: 8, left: 8, borderTop: "1px solid rgba(95,200,255,0.3)", borderLeft: "1px solid rgba(95,200,255,0.3)" } : i === 1 ? { top: 8, right: 8, borderTop: "1px solid rgba(95,200,255,0.3)", borderRight: "1px solid rgba(95,200,255,0.3)" } : i === 2 ? { bottom: 8, left: 8, borderBottom: "1px solid rgba(95,200,255,0.3)", borderLeft: "1px solid rgba(95,200,255,0.3)" } : { bottom: 8, right: 8, borderBottom: "1px solid rgba(95,200,255,0.3)", borderRight: "1px solid rgba(95,200,255,0.3)" }) }} />
      ))}
    </div>
  );
}

// ─── CAMERA PANEL ─────────────────────────────────────────────────────────────
function CameraPanel({ videoRef, cameraOn, micOn, onToggleCamera, onToggleMic, isRecording, isProcessing, isSpeaking, onStartRecording, onStopRecording, onStartInterview, isReady, countdown, gazeScore, confidence, fidget }: {
  videoRef: React.RefObject<HTMLVideoElement | null>; cameraOn: boolean; micOn: boolean;
  onToggleCamera: () => void; onToggleMic: () => void; isRecording: boolean; isProcessing: boolean;
  isSpeaking: boolean; onStartRecording: () => void; onStopRecording: () => void;
  onStartInterview: () => void; isReady: boolean; countdown: number | null;
  gazeScore: number; confidence: number; fidget: number;
}) {
  return (
    <div style={{ position: "relative", width: "100%", height: "100%", background: "#020408", overflow: "hidden" }}>
      <video ref={videoRef} autoPlay muted playsInline style={{ width: "100%", height: "100%", objectFit: "cover", transform: "scaleX(-1)", display: "block", opacity: cameraOn ? 1 : 0, transition: "opacity 0.4s ease" }} />

      {/* Vignette */}
      {cameraOn && <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.5) 100%)", pointerEvents: "none" }} />}

      {/* Ready / Start prompt */}
      {cameraOn && !isReady && countdown === null && (
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
          {(!cameraOn || !micOn) ? (
            <div style={{ background: "rgba(6,8,16,0.85)", backdropFilter: "blur(12px)", padding: "0.875rem 1.5rem", borderRadius: "12px", border: "1px solid rgba(95,200,255,0.2)", color: "#5fc8ff", fontFamily: "var(--mono)", fontSize: "0.75rem", textAlign: "center" }}>
              Enable camera &amp; microphone to begin
            </div>
          ) : (
            <button onClick={onStartInterview} style={{ padding: "0.9rem 2rem", borderRadius: "99px", border: "none", background: "linear-gradient(135deg,#2de6a4,#5fc8ff)", color: "#060810", fontWeight: 800, fontSize: "0.9rem", fontFamily: "var(--mono)", cursor: "pointer", boxShadow: "0 0 40px rgba(45,230,164,0.35)", letterSpacing: "0.06em", transition: "all 0.2s ease" }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = "scale(1.04)"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = "scale(1)"; }}
            >
              READY TO START
            </button>
          )}
        </div>
      )}

      {/* Bottom bar */}
      <div style={{ position: "absolute", bottom: "40px", left: 0, right: 0, padding: "0 1.25rem", display: "flex", justifyContent: "space-between", alignItems: "center", zIndex: 20 }}>

        {/* Left: User Status */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", background: "rgba(0,0,0,0.45)", padding: "0.4rem 0.7rem", borderRadius: "8px", backdropFilter: "blur(10px)", border: "1px solid rgba(255,255,255,0.05)" }}>
          <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: cameraOn ? "#ff4d6d" : "rgba(255,255,255,0.2)", boxShadow: cameraOn ? "0 0 8px #ff4d6d" : "none", animation: cameraOn ? "blink 2s ease-in-out infinite" : "none" }} />
          <span style={{ fontFamily: "var(--mono)", fontSize: "0.55rem", color: "rgba(255,255,255,0.6)", letterSpacing: "0.14em", fontWeight: 600 }}>YOU</span>
        </div>

        {/* Center: Record button */}
        {cameraOn && isReady && (
          <button
            onClick={isRecording ? onStopRecording : onStartRecording}
            disabled={isProcessing || isSpeaking}
            style={{
              padding: "0.55rem 1.25rem",
              borderRadius: "10px",
              border: "1px solid rgba(255,255,255,0.12)",
              background: isRecording ? "rgba(255,77,109,0.95)" : "rgba(95,200,255,0.92)",
              color: "#060810",
              fontWeight: 800,
              fontSize: "0.72rem",
              fontFamily: "var(--mono)",
              cursor: (isProcessing || isSpeaking) ? "not-allowed" : "pointer",
              boxShadow: isRecording ? "0 4px 20px rgba(255,77,109,0.3)" : "0 4px 20px rgba(95,200,255,0.25)",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
              opacity: (isProcessing || isSpeaking) ? 0.5 : 1,
              letterSpacing: "0.04em",
              transform: "translateY(-2px)"
            }}
          >
            {isRecording && <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#fff", animation: "pulse-ring 1.2s infinite" }} />}
            <span style={{ whiteSpace: "nowrap" }}>
              {isProcessing ? "PROCESSING" : isSpeaking ? "AI_SPEAKING" : isRecording ? "SUBMIT" : "RECORD_ANSWER"}
            </span>
          </button>
        )}

        {/* Right: Device Toggles */}
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <button onClick={onToggleCamera} style={{ width: "34px", height: "34px", borderRadius: "50%", border: `1px solid ${cameraOn ? "rgba(255,255,255,0.12)" : "rgba(255,77,109,0.4)"}`, background: cameraOn ? "rgba(255,255,255,0.08)" : "rgba(255,77,109,0.15)", color: cameraOn ? "rgba(255,255,255,0.7)" : "#ff4d6d", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", backdropFilter: "blur(10px)", transition: "all 0.2s" }}>
            <CameraIcon off={!cameraOn} />
          </button>
          <button onClick={onToggleMic} style={{ width: "34px", height: "34px", borderRadius: "50%", border: `1px solid ${micOn ? "rgba(255,255,255,0.12)" : "rgba(255,77,109,0.4)"}`, background: micOn ? "rgba(255,255,255,0.08)" : "rgba(255,77,109,0.15)", color: micOn ? "rgba(255,255,255,0.7)" : "#ff4d6d", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", backdropFilter: "blur(10px)", transition: "all 0.2s" }}>
            <MicIcon off={!micOn} />
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── COUNTDOWN OVERLAY ────────────────────────────────────────────────────────
function CountdownOverlay({ countdown }: { countdown: number }) {
  const isGoodLuck = countdown === 0;
  const color = isGoodLuck ? "#2de6a4" : "#5fc8ff";
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 50, backdropFilter: "blur(16px)", background: "rgba(6,8,16,0.8)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "2rem" }}>
      <div style={{ position: "absolute", width: "500px", height: "500px", borderRadius: "50%", background: `radial-gradient(circle,${color}10 0%,transparent 70%)`, pointerEvents: "none", transition: "background 0.6s" }} />
      {/* Bracket decoration */}
      <div style={{ position: "absolute", width: "200px", height: "200px", border: `1px solid ${color}20`, borderRadius: "4px", animation: "countPop 0.4s ease" }} />
      <div style={{ fontSize: isGoodLuck ? "3.5rem" : "7rem", fontWeight: 900, fontFamily: "var(--display)", color, lineHeight: 1, letterSpacing: "-0.05em", textShadow: `0 0 80px ${color}60`, animation: "countPop 0.3s cubic-bezier(0.34,1.56,0.64,1)" }}>
        {isGoodLuck ? "Good luck!" : countdown}
      </div>
      {!isGoodLuck && (
        <div style={{ textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: "0.5rem" }}>
          <div style={{ fontFamily: "var(--display)", fontSize: "1rem", fontWeight: 600, color: "rgba(232,237,245,0.6)", letterSpacing: "-0.02em" }}>Interview starting</div>
          <div style={{ fontFamily: "var(--mono)", fontSize: "0.65rem", color: "rgba(255,255,255,0.2)", letterSpacing: "0.1em" }}>Get comfortable and look at the camera</div>
        </div>
      )}
      {!isGoodLuck && (
        <div style={{ width: "160px", height: "2px", background: "rgba(95,200,255,0.1)", borderRadius: "1px", overflow: "hidden" }}>
          <div style={{ height: "100%", background: color, borderRadius: "1px", width: `${((3 - countdown) / 3) * 100}%`, transition: "width 0.9s linear", boxShadow: `0 0 8px ${color}` }} />
        </div>
      )}
    </div>
  );
}

// ─── CONNECTION BADGE ─────────────────────────────────────────────────────────
function ConnectionBadge({ status }: { status: "connecting" | "connected" | "failed" | "mock" }) {
  const config = {
    connecting: { color: "#ffb340", label: "CONNECTING" },
    connected: { color: "#2de6a4", label: "CONNECTED" },
    failed: { color: "#ff4d6d", label: "OFFLINE" },
    mock: { color: "rgba(255,255,255,0.2)", label: "MOCK MODE" },
  }[status];
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", padding: "0.25rem 0.6rem", borderRadius: "6px", background: `${config.color}10`, border: `1px solid ${config.color}25` }}>
      <div style={{ width: "5px", height: "5px", borderRadius: "50%", background: config.color, boxShadow: `0 0 6px ${config.color}`, animation: status === "connecting" ? "blink 1s ease-in-out infinite" : "none" }} />
      <span style={{ fontFamily: "var(--mono)", fontSize: "0.55rem", color: config.color, letterSpacing: "0.12em" }}>{config.label}</span>
    </div>
  );
}

// ─── AUDIO QUEUE ─────────────────────────────────────────────────────────────
class AudioQueue {
  private queue: { text: string }[] = [];
  public isPlaying = false;
  private onEnd: () => void;
  private avatarRef: React.RefObject<AvatarHandle | null>;
  private isStreamStarted = false;
  private turnEnded = false;
  private expectedEndTime = 0;
  private isFinishing = false;

  constructor(onEnd: () => void, avatarRef: React.RefObject<AvatarHandle | null>) {
    this.onEnd = onEnd;
    this.avatarRef = avatarRef;
  }
  add(text: string) { this.queue.push({ text }); if (!this.isPlaying) this.playNext(); }
  signalEndTurn() {
    if (this.turnEnded) return;
    this.turnEnded = true;
    if (!this.isPlaying && this.queue.length === 0) { this.isPlaying = false; this.finishStream(); }
  }
  private async finishStream() {
    if (this.isFinishing) return;
    this.isFinishing = true;
    if (!this.isStreamStarted) { this.onEnd(); this.turnEnded = false; this.isFinishing = false; return; }
    const waitTime = this.expectedEndTime - Date.now() + 500;
    if (waitTime > 0) await new Promise(resolve => setTimeout(resolve, waitTime));
    if (this.avatarRef?.current) { this.avatarRef.current.endStream(); this.isStreamStarted = false; }
    this.onEnd(); this.turnEnded = false; this.isFinishing = false;
  }
  private async playNext() {
    if (!this.queue || this.queue.length === 0) {
      if (this.turnEnded && this.isPlaying) { this.isPlaying = false; await this.finishStream(); }
      else { this.isPlaying = false; }
      return;
    }
    let attempts = 0;
    while ((!this.avatarRef?.current || !this.avatarRef.current.isLoaded) && attempts < 100) {
      await new Promise(r => setTimeout(r, 100)); attempts++;
    }
    // Detect remount/change to restart stream on new avatar instance
    if (this.avatarRef?.current && (this.avatarRef.current as any) !== (this as any)._lastHandle) {
      this.isStreamStarted = false;
      (this as any)._lastHandle = this.avatarRef.current;
    }
    const item = this.queue.shift();
    if (item && this.avatarRef?.current) {
      this.isPlaying = true;
      try {
        if (!this.isStreamStarted) { await this.avatarRef.current.startStream(); this.isStreamStarted = true; this.expectedEndTime = Date.now(); }
        const durationMs = await this.avatarRef.current.appendStream(item.text) || 0;
        this.expectedEndTime = Math.max(this.expectedEndTime, Date.now()) + durationMs;
      } catch (e) { console.error("[AudioQueue] Stream request failed:", e); }
      this.playNext();
    } else { this.isPlaying = false; if (this.queue.length > 0) this.playNext(); }
  }
  stop() {
    this.queue = []; this.isPlaying = false; this.turnEnded = false; this.expectedEndTime = 0;
    if (this.isStreamStarted && this.avatarRef?.current) { this.avatarRef.current.stop(); this.isStreamStarted = false; }
  }
}

// ─── INTERVIEW CONTENT ────────────────────────────────────────────────────────
function InterviewContent() {
  const router = useRouter();
  const { phase, setPhase, finishInterview, transcript, addTranscriptEntry, addBiometricPoint, updateLastTranscriptText, liveAlert, setLiveAlert, startInterview, sessionId, resumeText, jobText, interviewerPersona, interviewerModel, interviewerVoice, pressureScore, updatePressureScore, pressureTrend, updateEloScore, userId, role, company, biometrics, interviewers, addSkippedQuestion, skippedQuestions, interviewStartTime, makeEasier } = useInterviewStore();

  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [gazeScore, setGazeScore] = useState(100);
  const [confidence, setConfidence] = useState(100);
  const [fidget, setFidget] = useState(100);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [connStatus, setConnStatus] = useState<"connecting" | "connected" | "failed" | "mock">("connecting");
  const [cameraOn, setCameraOn] = useState(false);
  const [micOn, setMicOn] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [isCodingPhase, setIsCodingPhase] = useState(false);
  const [code, setCode] = useState("# Live Coding Challenge\n# Write your solution here\n\n");

  const { runPython, stdout, stderr, isLoading, isRunning, isAwaitingInput, prompt: pythonPrompt, sendInput } = usePython({ packages: PYTHON_PACKAGES });

  const avatarRef = useRef<AvatarHandle | null>(null);
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
  const isIntroTriggeredRef = useRef(false);
  const currentTurnIdRef = useRef(0);
  const scriptedQuestionsRef = useRef<any[]>([]);

  // Re-attach camera stream when localVideoRef changes or phase changes
  useEffect(() => {
    if (localVideoRef.current && streamRef.current && cameraOn) {
      if (localVideoRef.current.srcObject !== streamRef.current) {
        localVideoRef.current.srcObject = streamRef.current;
      }
    }
  }, [isCodingPhase, cameraOn, localVideoRef.current]);

  useEffect(() => { return () => { audioQueueRef.current?.stop(); }; }, []);

  const triggerNextScriptStep = () => {
    if (scriptedQuestionsRef.current && scriptedQuestionsRef.current.length > 0) {
      isIntroTriggeredRef.current = true;
      const nextStep = scriptedQuestionsRef.current.shift();
      const textToSpeak = typeof nextStep === 'string' ? nextStep : nextStep.text;

      addTranscriptEntry({ time: elapsedSeconds, speaker: 'interviewer', text: textToSpeak });
      if (!audioQueueRef.current) audioQueueRef.current = new AudioQueue(() => setIsSpeaking(false), avatarRef);
      setIsSpeaking(true);
      audioQueueRef.current.add(textToSpeak);
      audioQueueRef.current.signalEndTurn();

      if (typeof nextStep === 'object') {
        if (nextStep.coding) {
          // Delay flip to ensure audio starts and avatar transition is handled
          setTimeout(() => {
            setIsCodingPhase(true);
            setQuestionIndex(3);
          }, 5000);
        }
        if (nextStep.end) {
          setTimeout(() => handleFinish(), 5000);
        }
      }
      return true;
    }
    return false;
  };

  const handleChatStream = async (inputText: string, ignoreScore: boolean = false, forceCoding: boolean = false) => {
    if (!sessionId) return;
    if (audioQueueRef.current) audioQueueRef.current.stop();
    avatarRef.current?.stop();
    const turnId = ++currentTurnIdRef.current;

    // Director Mode Scripted Flow Override
    if (triggerNextScriptStep()) return;

    try {
      if (!audioQueueRef.current) audioQueueRef.current = new AudioQueue(() => setIsSpeaking(false), avatarRef);
      const chatRes = await fetch('http://127.0.0.1:8080/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text: inputText, question_index: questionIndex, session_id: sessionId, timestamp_sec: elapsedSeconds, resume_text: resumeText, job_text: jobText, interviewer_persona: interviewerPersona, pressure_score: pressureScore, pressure_trend: pressureTrend, history: transcript, code: code, force_coding: forceCoding }) });
      if (!chatRes.ok) throw new Error(`Chat API error: ${chatRes.status}`);
      const reader = chatRes.body?.getReader();
      if (!reader) throw new Error("No reader");
      const decoder = new TextDecoder();
      let fullSentence = ""; let sentenceBuffer = ""; let streamBuffer = "";
      addTranscriptEntry({ time: elapsedSeconds, speaker: 'interviewer', text: "" });
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        streamBuffer += decoder.decode(value, { stream: true });
        const lines = streamBuffer.split('\n');
        streamBuffer = lines.pop() || "";
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const dataStr = line.substring(6);
            let data;
            try { data = JSON.parse(dataStr); } catch { continue; }
            if (data.error) { updateLastTranscriptText(`[ERROR: ${data.error}]`); break; }
            if (data.token) {
              fullSentence += data.token; sentenceBuffer += data.token;
              // Strip debug score tag from display
              const displaySentence = fullSentence.replace(/\[SCORE:\s*\d+\.?\d*\]/gi, "").trim();
              updateLastTranscriptText(displaySentence);
              if (/[,.!?;\n:]$/.test(sentenceBuffer.trim()) && sentenceBuffer.trim().length > 15) {
                const fragmentForTTS = sentenceBuffer.replace(/\[SCORE:\s*\d+\.?\d*\]/gi, "").trim();
                sentenceBuffer = "";
                setIsSpeaking(true);
                if (turnId === currentTurnIdRef.current && audioQueueRef.current) audioQueueRef.current.add(fragmentForTTS);
              }
            } else if (data.done) {
              setQuestionIndex(data.next_index);
              const finalDisplay = data.full_text?.replace(/\[SCORE:\s*\d+\.?\d*\]/gi, "").trim() || fullSentence.replace(/\[SCORE:\s*\d+\.?\d*\]/gi, "").trim();
              updateLastTranscriptText(finalDisplay);
              if (data.is_coding_phase !== undefined) setIsCodingPhase(data.is_coding_phase);
              if (!data.skip_scoring && data.quality_score !== undefined && !ignoreScore) updateEloScore(data.quality_score);
              if (audioQueueRef.current && turnId === currentTurnIdRef.current) audioQueueRef.current.signalEndTurn();
              if (data.is_finished) setTimeout(() => handleFinish(), 5000);
            }
          }
        }
      }
      if (sentenceBuffer.trim().length > 0 && audioQueueRef.current) audioQueueRef.current.add(sentenceBuffer.trim());
    } catch (err) {
      console.error("Chat stream failed:", err);
      setLiveAlert("AI response failed. Please try again.");
    } finally {
      if (audioQueueRef.current && turnId === currentTurnIdRef.current) audioQueueRef.current.signalEndTurn();
    }
  };

  const processTurn = async (audioBlob: Blob | null, videoBlob: Blob | null) => {
    if (!sessionId || !audioBlob) { if (!audioBlob) alert("No audio recorded."); return; }
    setIsProcessing(true);
    if (!audioQueueRef.current) audioQueueRef.current = new AudioQueue(() => setIsSpeaking(false), avatarRef);
    audioQueueRef.current.stop();
    try {
      const formData = new FormData();
      formData.append('audio', audioBlob);
      if (videoBlob) formData.append('video', videoBlob);
      formData.append('session_id', sessionId);
      formData.append('timestamp_sec', elapsedSeconds.toString());
      const streamRes = await fetch('http://127.0.0.1:8080/api/stream-process', { method: 'POST', body: formData });
      const streamData = await streamRes.json();
      if (streamData.text) {
        addTranscriptEntry({ time: elapsedSeconds, speaker: 'user', text: streamData.text });
        updatePressureScore(scorePerformance(streamData.text));
        await handleChatStream(streamData.text);
      }
    } catch (err) { console.error("Turn processing failed:", err); } finally { setIsProcessing(false); }
  };

  const startRecording = () => {
    if (!streamRef.current) { alert("No media stream. Enable camera or microphone first."); return; }
    try {
      const getMimeType = (type: 'audio' | 'video') => {
        const types = type === 'audio' ? ['audio/webm;codecs=opus', 'audio/webm', 'audio/ogg', 'audio/mp4'] : ['video/webm;codecs=vp8,opus', 'video/webm;codecs=h264,opus', 'video/webm', 'video/mp4'];
        return types.find(t => MediaRecorder.isTypeSupported(t)) || '';
      };
      const audioTracks = streamRef.current.getAudioTracks();
      const videoTracks = streamRef.current.getVideoTracks();
      if (audioTracks.length === 0 && videoTracks.length === 0) throw new Error("No active tracks.");
      if (audioTracks.length > 0) {
        audioChunksRef.current = [];
        const audioRecorder = new MediaRecorder(new MediaStream(audioTracks), getMimeType('audio') ? { mimeType: getMimeType('audio') } : {});
        audioRecorder.ondataavailable = (e) => { if (e.data.size > 0) audioChunksRef.current.push(e.data); };
        audioRecorder.start(); audioRecorderRef.current = audioRecorder;
      }
      if (videoTracks.length > 0) {
        videoChunksRef.current = [];
        const videoRecorder = new MediaRecorder(new MediaStream(videoTracks), getMimeType('video') ? { mimeType: getMimeType('video') } : {});
        videoRecorder.ondataavailable = (e) => { if (e.data.size > 0) videoChunksRef.current.push(e.data); };
        videoRecorder.start(); videoRecorderRef.current = videoRecorder;
      }
      setIsRecording(true);
    } catch (err: any) {
      [audioRecorderRef, videoRecorderRef].forEach(ref => { if (ref.current?.state === "recording") ref.current.stop(); ref.current = null; });
      alert(`Recording error: ${err.message}`);
    }
  };

  const stopRecording = () => {
    const hasAudio = !!audioRecorderRef.current; const hasVideo = !!videoRecorderRef.current;
    const activeRecorders = [audioRecorderRef.current, videoRecorderRef.current].filter(r => r !== null);
    if (activeRecorders.length === 0) { setIsRecording(false); return; }
    let stoppedCount = 0;
    const onRecorderStop = () => {
      stoppedCount++;
      if (stoppedCount === activeRecorders.length) {
        const audioBlob = hasAudio ? new Blob(audioChunksRef.current, { type: audioChunksRef.current[0]?.type || 'audio/webm' }) : null;
        const videoBlob = hasVideo ? new Blob(videoChunksRef.current, { type: videoChunksRef.current[0]?.type || 'video/webm' }) : null;
        processTurn(audioBlob, videoBlob);
      }
    };
    activeRecorders.forEach(r => { r!.onstop = onRecorderStop; r!.stop(); });
    audioRecorderRef.current = null; videoRecorderRef.current = null; setIsRecording(false);
  };

  const handleStartInterviewCountdown = () => {
    if (countdown !== null) return;
    setCountdown(3); let current = 3;
    const ticker = setInterval(() => {
      current -= 1; setCountdown(current);
      if (current <= 0) {
        clearInterval(ticker);
        setTimeout(() => setCountdown(null), 1500);
        if (interviewStartedRef.current) return;
        interviewStartedRef.current = true;
        startInterview(); setIsReady(true); startWebRTC();
      }
    }, 1000);
  };

  const handleToggleCamera = async () => {
    try {
      if (!streamRef.current) {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: micOn });
        streamRef.current = stream;
        if (localVideoRef.current) localVideoRef.current.srcObject = stream;
        setCameraOn(true);
      } else {
        const videoTracks = streamRef.current.getVideoTracks();
        if (videoTracks.length === 0) {
          const videoStream = await navigator.mediaDevices.getUserMedia({ video: true });
          streamRef.current.addTrack(videoStream.getVideoTracks()[0]); setCameraOn(true);
        } else { const newState = !cameraOn; videoTracks.forEach(t => { t.enabled = newState; }); setCameraOn(newState); }
      }
    } catch (err: any) { alert(err.name === "NotAllowedError" ? "Camera permission denied." : `Camera error: ${err.message}`); }
  };

  const handleToggleMic = async () => {
    try {
      if (!streamRef.current) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: cameraOn });
        streamRef.current = stream;
        if (localVideoRef.current) localVideoRef.current.srcObject = stream;
        setMicOn(true);
      } else {
        const audioTracks = streamRef.current.getAudioTracks();
        if (audioTracks.length === 0) {
          const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
          streamRef.current.addTrack(audioStream.getAudioTracks()[0]); setMicOn(true);
        } else { const newState = !micOn; audioTracks.forEach(t => { t.enabled = newState; }); setMicOn(newState); }
      }
    } catch (err: any) { alert(err.name === "NotAllowedError" ? "Microphone permission denied." : `Mic error: ${err.message}`); }
  };

  const startWebRTC = async () => {
    if (!streamRef.current) { setConnStatus("failed"); return; }
    try {
      setConnStatus("connecting");
      const pc = new RTCPeerConnection({ iceServers: [{ urls: "stun:stun.l.google.com:19302" }, { urls: "turn:openrelay.metered.ca:80", username: "openrelayproject", credential: "openrelayproject" }, { urls: "turn:openrelay.metered.ca:443", username: "openrelayproject", credential: "openrelayproject" }], iceTransportPolicy: "all" });
      pcRef.current = pc; (window as any)._pc = pc;
      const dc = pc.createDataChannel("inference"); dcRef.current = dc;
      dc.onopen = () => { setConnStatus("connected"); dc.send("ping"); };
      dc.onmessage = (event) => {
        try {
          if (typeof event.data === "string" && event.data.startsWith("pong")) return;
          const msg = JSON.parse(event.data);
          if (msg.type === "video_inference") {
            const conf = Math.round((msg.NEURAL_CONFIDENCE ?? msg.confidence ?? 0.5) * 100);
            const msgGaze = Math.round((msg.GAZE_STABILITY ?? msg.gaze ?? 0.8) * 100);
            const msgFidget = Math.round((msg.KINETIC_FIDGET ?? msg.fidget ?? 0.1) * 100);

            if (Math.random() > 0.9) {
              console.log("[DEBUG] Video Inference:", { raw: msg, parsed: { conf, msgGaze, msgFidget } });
            }

            setConfidence(conf); setGazeScore(msgGaze); setFidget(msgFidget);
            addBiometricPoint({ time: Math.round(msg.timestamp / 1000), gazeScore: msgGaze, confidence: conf, fidgetIndex: msgFidget, stressSpike: conf < 40 });
          }
          if (msg.type === "audio_inference") {
            const audioConf = Math.round(msg.confidence * 100);
            setConfidence(prev => Math.round((prev + audioConf) / 2));

            if (msg.transcript?.trim()) {
              addTranscriptEntry({ time: elapsedSeconds, speaker: "user", text: msg.transcript.trim() });
              setIsSpeaking(false);
            }

            addBiometricPoint({
              time: elapsedSeconds,
              gazeScore,
              confidence: audioConf,
              fidgetIndex: fidget,
              stressSpike: audioConf < 40
            });
          }
        } catch { /* non-JSON */ }
      };
      streamRef.current.getTracks().forEach(track => pc.addTrack(track, streamRef.current!));
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      const res = await fetch("/api/offer", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sdp: offer.sdp, type: offer.type }) });
      if (!res.ok) throw new Error(`Backend ${res.status}`);
      await pc.setRemoteDescription(new RTCSessionDescription(await res.json()));
    } catch { setConnStatus("failed"); }
  };

  useEffect(() => { if (!isReady) return; const interval = setInterval(() => setElapsedSeconds(s => s + 1), 1000); return () => clearInterval(interval); }, [isReady]);
  useEffect(() => { if (phase === "live") setIsReady(true); }, [phase]);
  useEffect(() => {
    if (!isReady || isIntroTriggeredRef.current) return;

    // Director Mode Script: Pull the first item from the script if loaded
    if (triggerNextScriptStep()) return;

    if (transcript.length > 0 && transcript[0].speaker === "interviewer") {
      isIntroTriggeredRef.current = true;
      const firstText = transcript[0].text;
      if (firstText) {
        if (!audioQueueRef.current) audioQueueRef.current = new AudioQueue(() => setIsSpeaking(false), avatarRef);
        setIsSpeaking(true);
        audioQueueRef.current.add(firstText);
        audioQueueRef.current.signalEndTurn();
      }
    }
  }, [isReady]);
  useEffect(() => { if (transcriptRef.current) setTimeout(() => { if (transcriptRef.current) transcriptRef.current.scrollTop = transcriptRef.current.scrollHeight; }, 50); }, [transcript]);
  useEffect(() => { return () => { streamRef.current?.getTracks().forEach(t => t.stop()); }; }, []);

  // ─── DEBUG COMMANDS (Console Control) ─────────────────────────────────────────
  useEffect(() => {
    if (typeof window !== "undefined") {
      const debugObj = {
        // AI Control
        speak: (text: string) => {
          if (!audioQueueRef.current) audioQueueRef.current = new AudioQueue(() => setIsSpeaking(false), avatarRef);
          addTranscriptEntry({ time: elapsedSeconds, speaker: 'interviewer', text });
          setIsSpeaking(true);
          audioQueueRef.current.add(text);
          audioQueueRef.current.signalEndTurn();
        },
        injectQuestion: (text: string) => {
          if (!audioQueueRef.current) audioQueueRef.current = new AudioQueue(() => setIsSpeaking(false), avatarRef);
          addTranscriptEntry({ time: elapsedSeconds, speaker: 'interviewer', text });
          setIsSpeaking(true);
          audioQueueRef.current.add(text);
          audioQueueRef.current.signalEndTurn();
        },
        stopSpeech: () => {
          audioQueueRef.current?.stop();
          avatarRef.current?.stop();
          setIsSpeaking(false);
        },

        // Biometrics Control
        setGaze: (val: number) => setGazeScore(val),
        setConfidence: (val: number) => setConfidence(val),
        setFidget: (val: number) => setFidget(val),
        setPressure: (val: number) => {
          useInterviewStore.setState({ pressureScore: val });
        },

        // Interview Flow
        start: async () => {
          if (avatarRef.current) {
            console.log("[AceIt] Waiting for avatar to load...");
            await avatarRef.current.waitForLoad();
          }
          if (isReady && scriptedQuestionsRef.current && scriptedQuestionsRef.current.length > 0) {
            triggerNextScriptStep();
          } else {
            handleStartInterviewCountdown();
          }
        },
        finish: () => handleFinish(),
        loadScript: (questions: (string | { text: string, coding?: boolean, end?: boolean })[]) => {
          scriptedQuestionsRef.current = questions;
          console.log(`[AceIt] Loaded script with ${questions.length} steps.`);
        },
        skipQuestion: (customMsg?: string) => {
          const prompt = customMsg ? `[SYSTEM: The user has skipped the current question. Please pivot and ask specifically about: ${customMsg}]` : undefined;
          handleSkipQuestion(prompt);
        },
        makeEasier: (customMsg?: string) => {
          const prompt = customMsg ? `[SYSTEM: The candidate requested to make it easier. Specifically, they want help with: ${customMsg}]` : undefined;
          handleMakeEasier(prompt);
        },
        forceCoding: () => handleSkipToCoding(),

        // Simulation & Direct Control
        forceAiSpeech: (text: string) => {
          if (!audioQueueRef.current) audioQueueRef.current = new AudioQueue(() => setIsSpeaking(false), avatarRef);
          addTranscriptEntry({ time: elapsedSeconds, speaker: 'interviewer', text });
          setIsSpeaking(true);
          audioQueueRef.current.add(text);
          audioQueueRef.current.signalEndTurn();
        },
        forceUserAnswer: async (text: string) => {
          addTranscriptEntry({ time: elapsedSeconds, speaker: 'user', text });
          updatePressureScore((text.length % 100)); // basic fake score
          await handleChatStream(text);
        },
        simulateUserAnswer: async (text: string) => {
          addTranscriptEntry({ time: elapsedSeconds, speaker: 'user', text });
          updatePressureScore((text.length % 100));
          await handleChatStream(text);
        },
        simulateAiThinking: (state: boolean) => setIsProcessing(state),
        setElo: (val: number) => useInterviewStore.setState({ elo: val }),
        setQuestionIndex: (idx: number) => setQuestionIndex(idx),

        // Settings & Customization
        toggleCamera: () => handleToggleCamera(),
        toggleMic: () => handleToggleMic(),
        setInterviewer: (id: string) => {
          const interviewer = interviewers.find(i => i.id === id);
          if (interviewer) {
            useInterviewStore.getState().setInterviewerPersona(id);
            useInterviewStore.getState().setInterviewerModel(interviewer.model || "");
            useInterviewStore.getState().setInterviewerVoice(interviewer.voice || "");
            return `Switched to ${interviewer.name}`;
          }
          return `Interviewer ID "${id}" not found.`;
        },
        setInterviewerModel: (url: string) => useInterviewStore.getState().setInterviewerModel(url),
        clearTranscript: () => useInterviewStore.getState().setTranscript([]),

        // Status & Metadata
        getStatus: () => ({
          phase,
          isReady,
          isSpeaking,
          isProcessing,
          isRecording,
          elapsedSeconds,
          pressureScore,
          gazeScore,
          confidence,
          fidget,
          sessionId,
          interviewerPersona
        }),

        help: () => {
          console.log("%c--- ACE_IT DEBUG CONSOLE ---", "color:#5fc8ff;font-weight:bold;font-size:1.2rem;");
          console.log("Control the agent and interview flow directly from the console.");
          console.log("%cAI CONTROL:", "color:#9b6fff;font-weight:bold;");
          console.log("  debug.speak(text)          - Make the AI speak specific text and add to transcript");
          console.log("  debug.injectQuestion(text) - Functionally identical to speak()");
          console.log("  debug.stopSpeech()         - Immediately stop all AI audio");
          console.log("  debug.simulateAiThinking(b)- Toggle 'Thinking' status UI");
          console.log("%cBIOMETRICS (0-100):", "color:#2de6a4;font-weight:bold;");
          console.log("  debug.setGaze(val)         - Set Gaze Stability score");
          console.log("  debug.setConfidence(val)   - Set Neural Confidence score");
          console.log("  debug.setFidget(val)       - Set Kinetic Fidget score");
          console.log("  debug.setPressure(val)     - Force Response Grade (Pressure)");
          console.log("%cINTERVIEW FLOW:", "color:#ffb340;font-weight:bold;");
          console.log("  debug.start()              - Trigger 3-sec countdown & start");
          console.log("  debug.loadScript([...])    - Auto-pilot interview sequence");
          console.log("  debug.skipQuestion(msg?)   - Skip current question, AI pivots (optional target msg)");
          console.log("  debug.makeEasier(msg?)     - Reduce difficulty, AI pivots (optional target msg)");
          console.log("  debug.forceCoding()        - Jump to Python coding phase");
          console.log("  debug.finish()             - End interview and go to report");
          console.log("%cDIRECT CONTROL:", "color:#ff4d6d;font-weight:bold;");
          console.log("  debug.forceAiSpeech(t)     - Force AI to say something and add to transcript");
          console.log("  debug.forceUserAnswer(t)   - Simulate user message and trigger AI pivot");
          console.log("  debug.setElo(val)          - Set internal ELO score");
          console.log("  debug.setQuestionIndex(i)  - Change current question sequence number");
          console.log("  debug.toggleCamera()       - Toggle local camera track");
          console.log("  debug.toggleMic()          - Toggle local mic track");
          console.log("  debug.setInterviewer(id)   - Change interviewer persona");
          console.log("  debug.clearTranscript()    - Wipe current session transcript");
          console.log("  debug.getStatus()          - Print current session state");
          return "Ready for command.";
        }
      };

      (window as any).debug = debugObj;
      (window as any).debugSpeak = debugObj.speak; // Backward compatibility
      console.log("%c[AceIt] Debug console initialized. Type 'debug.help()' for commands.", "color:#5fc8ff;font-weight:bold;");
    }
  }, [
    phase, isReady, isSpeaking, isProcessing, isRecording, elapsedSeconds,
    pressureScore, gazeScore, confidence, fidget, transcript, sessionId, interviewerPersona
  ]);

  const handleFinish = async () => {
    console.log("[AceIt] Finalizing session... checking avatar status.");
    if (avatarRef.current) {
      await avatarRef.current.waitForSpeechDone();
    }
    console.log("[AceIt] Speech complete. Stopping tracks.");
    streamRef.current?.getTracks().forEach(t => t.stop());
    dcRef.current?.close(); pcRef.current?.close();
    finishInterview();
    if (userId && sessionId) {
      try {
        const avgGaze = biometrics.length > 0 ? Math.round(biometrics.reduce((s: number, d: any) => s + (d.gazeScore || 0), 0) / biometrics.length) : 0;
        const avgConf = biometrics.length > 0 ? Math.round(biometrics.reduce((s: number, d: any) => s + (d.confidence || 0), 0) / biometrics.length) : 0;
        const avgCalm = biometrics.length > 0 ? Math.round(100 - biometrics.reduce((s: number, d: any) => s + (d.fidgetIndex || 0), 0) / biometrics.length) : 100;
        await fetch("http://127.0.0.1:8080/api/save-session", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ session_id: sessionId, user_id: userId, role, company, score: Math.round(pressureScore), gaze: avgGaze, confidence: avgConf, composure: avgCalm, spikes: biometrics.filter(d => d.stressSpike).length, date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) }) });
      } catch (err) { console.error("Auto-save failed:", err); }
    }
    setTimeout(() => { setPhase("finished"); router.push(`/report?session_id=${sessionId}`); }, 5000);
  };

  const handleSkipQuestion = async (customPrompt?: string) => {
    const lastQuestion = [...transcript].reverse().find(e => e.speaker === 'interviewer');
    if (lastQuestion && sessionId) {
      addSkippedQuestion(lastQuestion.text);
      fetch("http://127.0.0.1:8080/api/log-skip", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ session_id: sessionId, question: lastQuestion.text, timestamp_sec: (Date.now() - (interviewStartTime || Date.now())) / 1000 }) }).catch(console.error);
    }
    if (isRecording) {
      [audioRecorderRef, videoRecorderRef].forEach(ref => { if (ref.current?.state !== 'inactive') { ref.current!.onstop = null; ref.current!.stop(); } ref.current = null; });
      audioChunksRef.current = []; videoChunksRef.current = []; setIsRecording(false);
    }
    audioQueueRef.current?.stop();
    setIsProcessing(true);
    try {
      const prompt = customPrompt || "[SYSTEM: The user has skipped this question. Please pivot and ask a different, relevant interview question instead.]";
      await handleChatStream(prompt, true);
    }
    finally { setIsProcessing(false); }
    setLiveAlert("Question skipped — AI is pivoting..."); setTimeout(() => setLiveAlert(null), 3000);
  };

  const handleMakeEasier = async (customPrompt?: string) => {
    if (isRecording) {
      [audioRecorderRef, videoRecorderRef].forEach(ref => { if (ref.current?.state !== 'inactive') { ref.current!.onstop = null; ref.current!.stop(); } ref.current = null; });
      audioChunksRef.current = []; videoChunksRef.current = []; setIsRecording(false);
    }
    audioQueueRef.current?.stop();
    makeEasier();
    let degree = "slight difficulty reduction";
    if (pressureScore < 50) degree = "moderate difficulty reduction (break into smaller steps, add hints)";
    if (pressureScore < 10) degree = "significant difficulty reduction (simplest version, beginner-friendly)";
    setIsProcessing(true);
    try {
      const prompt = customPrompt || `[SYSTEM: The candidate has requested an easier question. Please regenerate with a ${degree}. Do NOT comment on this adjustment.]`;
      await handleChatStream(prompt, true);
    }
    finally { setIsProcessing(false); }
    setLiveAlert("Simplifying question..."); setTimeout(() => setLiveAlert(null), 3000);
  };

  const handleSkipToCoding = async () => {
    const lastQuestion = [...transcript].reverse().find(e => e.speaker === 'interviewer');
    if (lastQuestion && sessionId) {
      addSkippedQuestion(lastQuestion.text);
      fetch("http://127.0.0.1:8080/api/log-skip", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ session_id: sessionId, question: lastQuestion.text, timestamp_sec: (Date.now() - (interviewStartTime || Date.now())) / 1000 }) }).catch(console.error);
    }
    if (isRecording) {
      [audioRecorderRef, videoRecorderRef].forEach(ref => { if (ref.current?.state !== 'inactive') { ref.current!.onstop = null; ref.current!.stop(); } ref.current = null; });
      audioChunksRef.current = []; videoChunksRef.current = []; setIsRecording(false);
    }
    audioQueueRef.current?.stop();
    setIsCodingPhase(true); setQuestionIndex(3);
    setIsProcessing(true);
    try { await handleChatStream("[SYSTEM: The user has requested to skip directly to the live coding challenge. Start your response exactly with the phrase 'Let's move on to the coding question.' followed by the python programming task description. Do not include any other conversational filler, pleasantries, or empathy tokens. NO FLUFF. Just and only: 'Let's move on to the coding question.' + the task details.]", true, true); }
    finally { setIsProcessing(false); }
    setLiveAlert("Initiating coding challenge..."); setTimeout(() => setLiveAlert(null), 3000);
  };

  const formatTime = (s: number) => `${Math.floor(s / 60).toString().padStart(2, "0")}:${Math.floor(s % 60).toString().padStart(2, "0")}`;

  if (phase === "processing") {
    return (
      <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "1.5rem", background: "#060810" }}>
        <GlobalStyles />
        <div style={{ position: "relative", width: "56px", height: "56px" }}>
          <div style={{ position: "absolute", inset: 0, border: "2px solid rgba(95,200,255,0.1)", borderRadius: "50%" }} />
          <div style={{ position: "absolute", inset: 0, border: "2px solid transparent", borderTopColor: "#5fc8ff", borderRadius: "50%", animation: "spin 0.9s linear infinite" }} />
        </div>
        <div style={{ fontFamily: "var(--mono)", fontSize: "0.72rem", color: "rgba(255,255,255,0.3)", letterSpacing: "0.16em" }}>GENERATING REPORT...</div>
      </div>
    );
  }

  const interviewerName = interviewers.find(i => i.id === interviewerPersona)?.name || "Technical Interviewer";

  return (
    <div style={{ height: "100vh", maxHeight: "100vh", display: "grid", gridTemplateRows: "64px 1fr", background: "var(--bg)", position: "relative", overflow: "hidden" }}>
      <GlobalStyles />

      {countdown !== null && <CountdownOverlay countdown={countdown} />}

      {/* Live alert toast */}
      {liveAlert && (
        <div style={{ position: "fixed", top: "80px", left: "50%", transform: "translateX(-50%)", zIndex: 40, background: "rgba(6,8,16,0.9)", backdropFilter: "blur(16px)", border: "1px solid rgba(95,200,255,0.2)", borderRadius: "10px", padding: "0.65rem 1.25rem", fontFamily: "var(--mono)", fontSize: "0.7rem", color: "#5fc8ff", letterSpacing: "0.06em", boxShadow: "0 8px 32px rgba(95,200,255,0.1)", animation: "fadeUp 0.3s ease" }}>
          {liveAlert}
        </div>
      )}

      {/* ── TOP COMMAND BAR ── */}
      <header style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", padding: "0 1.75rem", display: "flex", alignItems: "center", justifyContent: "space-between", background: "rgba(6,8,16,0.9)", backdropFilter: "blur(20px)", position: "sticky", top: 0, zIndex: 30 }}>

        {/* Left cluster */}
        <div style={{ display: "flex", alignItems: "center", gap: "1.25rem" }}>
          {/* Live dot */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.25rem 0.6rem", borderRadius: "6px", background: "rgba(255,77,109,0.08)", border: "1px solid rgba(255,77,109,0.2)" }}>
            <div style={{ width: "5px", height: "5px", borderRadius: "50%", background: "#ff4d6d", boxShadow: "0 0 8px #ff4d6d", animation: "blink 1.5s ease-in-out infinite" }} />
            <span style={{ fontFamily: "var(--mono)", fontSize: "0.55rem", color: "#ff4d6d", letterSpacing: "0.14em" }}>LIVE</span>
          </div>
          <ConnectionBadge status={connStatus} />
          {/* Logo */}
          <div style={{ fontFamily: "var(--display)", fontWeight: 900, fontSize: "1.1rem", letterSpacing: "-0.04em", marginLeft: "0.25rem" }}>
            Ace<span style={{ background: "linear-gradient(135deg,#5fc8ff,#9b6fff)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>It</span>
          </div>
        </div>

        {/* Center: timer */}
        <div style={{ fontFamily: "var(--mono)", fontSize: "1.4rem", fontWeight: 600, letterSpacing: "0.08em", color: isReady ? "var(--text)" : "rgba(255,255,255,0.15)", transition: "color 0.4s ease", textShadow: isReady ? "0 0 20px rgba(95,200,255,0.2)" : "none" }}>
          {isReady ? formatTime(elapsedSeconds) : "--:--"}
        </div>

        {/* Right: action buttons */}
        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
          {isReady && (
            <>
              <button className="btn-ghost" onClick={() => handleMakeEasier()}>Make Easier</button>
              <button className="btn-ghost" onClick={() => handleSkipQuestion()}>Skip Question</button>
            </>
          )}
          {!isCodingPhase && isReady && (
            <button onClick={handleSkipToCoding} style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", background: "rgba(45,230,164,0.08)", color: "#2de6a4", fontFamily: "var(--mono)", fontWeight: 600, fontSize: "0.72rem", padding: "0.5rem 1rem", borderRadius: "8px", border: "1px solid rgba(45,230,164,0.2)", cursor: "pointer", transition: "all 0.2s", letterSpacing: "0.04em" }}>
              Skip to Coding
            </button>
          )}
          <button className="btn-danger" onClick={handleFinish}>End Interview</button>
        </div>
      </header>

      {/* ── MAIN ── */}
      <main style={{ display: "grid", gridTemplateColumns: isCodingPhase ? "1.5fr minmax(320px, 1fr)" : "1fr minmax(320px, 22.5rem)", gap: "1.25rem", padding: "1.25rem 1.75rem", overflow: "hidden", position: "relative", zIndex: 1, minHeight: 0 }}>

        {/* ── LEFT COLUMN ── */}
        {isCodingPhase ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <span style={{ fontFamily: "var(--mono)", fontSize: "0.55rem", color: "rgba(255,255,255,0.2)", letterSpacing: "0.16em" }}>LIVE_CODING_CHALLENGE</span>
                <div style={{ width: "5px", height: "5px", borderRadius: "50%", background: "#2de6a4", boxShadow: "0 0 6px #2de6a4", animation: "blink 2s ease-in-out infinite" }} />
              </div>
              <button onClick={() => runPython(code)} disabled={!isReady || isLoading || isRunning} className="btn-primary">
                ▶ RUN CODE
              </button>
            </div>
            <div style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column", gap: "0.875rem" }}>
              <div style={{ flex: "1 1 60%", minHeight: "200px", borderRadius: "14px", overflow: "hidden", border: "1px solid rgba(255,255,255,0.07)", position: "relative" }}>
                <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "1px", background: "linear-gradient(90deg,transparent,rgba(45,230,164,0.4),transparent)", zIndex: 1 }} />
                <CodeEditor initialValue={code} onChange={setCode} />
              </div>
              <div style={{ flex: "0 0 160px", minHeight: "100px", borderRadius: "14px", overflow: "hidden", border: "1px solid rgba(255,255,255,0.07)" }}>
                <ConsoleOutput stdout={stdout} stderr={stderr} isAwaitingInput={isAwaitingInput} prompt={pythonPrompt} onSendInput={sendInput} isRunning={isRunning} onClear={() => { }} />
              </div>
            </div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            {/* Video grid */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.25rem", flex: "0 0 auto" }}>
              {/* Avatar card */}
              <div className="card" style={{ aspectRatio: "1/1" }}>
                <AvatarPanel isSpeaking={isSpeaking} isProcessing={isProcessing} avatarRef={avatarRef} onAudioStart={() => setIsSpeaking(true)} onAudioEnd={() => { }} pressureScore={pressureScore} pressureTrend={pressureTrend} interviewerModel={interviewerModel || "/models/business_girl.glb"} interviewerName={interviewerName} />
              </div>
              {/* Camera card */}
              <div className="card" style={{ aspectRatio: "1/1" }}>
                <CameraPanel videoRef={localVideoRef} cameraOn={cameraOn} micOn={micOn} onToggleCamera={handleToggleCamera} onToggleMic={handleToggleMic} isRecording={isRecording} isProcessing={isProcessing} isSpeaking={isSpeaking} onStartRecording={startRecording} onStopRecording={stopRecording} onStartInterview={handleStartInterviewCountdown} isReady={isReady} countdown={countdown} gazeScore={gazeScore} confidence={confidence} fidget={fidget} />
              </div>
            </div>

            {/* HUD Dashboard */}
            <div style={{ background: "rgba(255,255,255,0.018)", backdropFilter: "blur(20px)", borderRadius: "16px", border: "1px solid rgba(255,255,255,0.07)", padding: "1.25rem 1.5rem", display: "flex", flexDirection: "column", gap: "1rem", position: "relative", overflow: "hidden" }}>
              <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "1px", background: "linear-gradient(90deg,transparent,rgba(95,200,255,0.25),rgba(155,111,255,0.25),transparent)" }} />

              {/* Label row */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontFamily: "var(--mono)", fontSize: "0.52rem", color: "rgba(255,255,255,0.18)", letterSpacing: "0.18em" }}>BIOMETRIC_HUD</span>
                <div style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
                  <div style={{ width: "4px", height: "4px", borderRadius: "50%", background: "#2de6a4", animation: "blink 2s ease-in-out infinite" }} />
                  <span style={{ fontFamily: "var(--mono)", fontSize: "0.48rem", color: "rgba(45,230,164,0.5)", letterSpacing: "0.12em" }}>STREAMING</span>
                </div>
              </div>

              {/* Metric rings */}
              <div style={{ display: "flex", justifyContent: "space-around", alignItems: "center", padding: "0.25rem 0" }}>
                <HUDMetric label="GAZE_STABILITY" value={gazeScore} color={gazeScore > 70 ? "#2de6a4" : "#ffcc00"} glowColor={gazeScore > 70 ? "rgba(45,230,164,0.5)" : "rgba(255,204,0,0.4)"} />
                <div style={{ width: "1px", height: "50px", background: "rgba(255,255,255,0.04)" }} />
                <HUDMetric label="NEURAL_CONFIDENCE" value={confidence} color={confidence > 70 ? "#5fc8ff" : "#ff8800"} glowColor={confidence > 70 ? "rgba(95,200,255,0.5)" : "rgba(255,136,0,0.4)"} />
                <div style={{ width: "1px", height: "50px", background: "rgba(255,255,255,0.04)" }} />
                <HUDMetric label="KINETIC_FIDGET" value={fidget} color={fidget > 60 ? "#9b6fff" : "#ff4d6d"} glowColor={fidget > 60 ? "rgba(155,111,255,0.5)" : "rgba(255,77,109,0.4)"} />
              </div>
              <OverallGradeBar score={pressureScore} trend={pressureTrend} />
            </div>
          </div>
        )}

        {/* ── RIGHT COLUMN ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem", overflow: "hidden", minHeight: 0 }}>

          {isCodingPhase ? (
            /* Coding phase: Avatar + Camera + Coding Task */
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem", flex: 1, minHeight: 0 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.875rem", flexShrink: 0 }}>
                {/* Avatar card */}
                <div className="card" style={{ aspectRatio: "1/1" }}>
                  <AvatarPanel isSpeaking={isSpeaking} isProcessing={isProcessing} avatarRef={avatarRef} onAudioStart={() => setIsSpeaking(true)} onAudioEnd={() => { }} pressureScore={pressureScore} pressureTrend={pressureTrend} interviewerModel={interviewerModel || "/models/business_girl.glb"} interviewerName={interviewerName} />
                </div>
                {/* Camera card */}
                <div className="card" style={{ aspectRatio: "1/1" }}>
                  <CameraPanel videoRef={localVideoRef} cameraOn={cameraOn} micOn={micOn} onToggleCamera={handleToggleCamera} onToggleMic={handleToggleMic} isRecording={isRecording} isProcessing={isProcessing} isSpeaking={isSpeaking} onStartRecording={startRecording} onStopRecording={stopRecording} onStartInterview={handleStartInterviewCountdown} isReady={isReady} countdown={countdown} gazeScore={gazeScore} confidence={confidence} fidget={fidget} />
                </div>
              </div>

              {/* Dedicated Task Display */}
              <CodingTask transcript={transcript} />
            </div>
          ) : (
            /* Regular interview phase: Panels + Transcript */
            <>
              {/* Transcript panel */}
              <div className="card" style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column", padding: "1.125rem", minHeight: 0 }}>
                {/* Header */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <span style={{ fontFamily: "var(--mono)", fontSize: "0.52rem", color: "rgba(255,255,255,0.18)", letterSpacing: "0.18em" }}>LIVE_TRANSCRIPT</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
                    <div style={{ width: "4px", height: "4px", borderRadius: "50%", background: "#5fc8ff", animation: isReady ? "blink 2s ease-in-out infinite" : "none" }} />
                    <span style={{ fontFamily: "var(--mono)", fontSize: "0.48rem", color: isReady ? "rgba(95,200,255,0.4)" : "rgba(255,255,255,0.12)", letterSpacing: "0.12em" }}>{isReady ? "ACTIVE" : "WAITING"}</span>
                  </div>
                </div>

                {/* Messages */}
                <div ref={transcriptRef} style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: "0.875rem", paddingRight: "0.25rem" }}>
                  {transcript.length === 0 ? (
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flex: 1, gap: "0.75rem", opacity: 0.3 }}>
                      <div style={{ width: "32px", height: "32px", borderRadius: "50%", border: "1px solid rgba(255,255,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "rgba(255,255,255,0.3)" }} />
                      </div>
                      <span style={{ fontFamily: "var(--mono)", fontSize: "0.6rem", color: "rgba(255,255,255,0.25)", letterSpacing: "0.1em", textAlign: "center" }}>{isReady ? "Listening..." : "Enable camera & mic to begin"}</span>
                    </div>
                  ) : (
                    transcript.map((entry, i) => (
                      <div key={i} className="fade-up" style={{ display: "flex", gap: "0.65rem", alignItems: "flex-start" }}>
                        {/* Speaker badge */}
                        <div style={{ flexShrink: 0, marginTop: "1px", padding: "0.15rem 0.45rem", borderRadius: "4px", background: entry.speaker === "interviewer" ? "rgba(95,200,255,0.1)" : "rgba(155,111,255,0.1)", border: `1px solid ${entry.speaker === "interviewer" ? "rgba(95,200,255,0.2)" : "rgba(155,111,255,0.2)"}` }}>
                          <span style={{ fontFamily: "var(--mono)", fontSize: "0.5rem", fontWeight: 600, color: entry.speaker === "interviewer" ? "#5fc8ff" : "#9b6fff", letterSpacing: "0.1em" }}>
                            {entry.speaker === "interviewer" ? "AI" : "YOU"}
                          </span>
                        </div>
                        <p style={{ fontSize: "0.82rem", lineHeight: 1.6, color: entry.speaker === "user" ? "rgba(232,237,245,0.9)" : "rgba(232,237,245,0.6)", fontFamily: "var(--display)", fontWeight: entry.speaker === "user" ? 500 : 400 }}>
                          {entry.text}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}

export default function InterviewPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: "100vh", background: "#060810", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <style>{`@import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@500&display=swap');`}</style>
        <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "0.7rem", color: "rgba(95,200,255,0.5)", letterSpacing: "0.2em" }}>LOADING INTERVIEW ENVIRONMENT...</span>
      </div>
    }>
      <PythonProvider>
        <InterviewContent />
      </PythonProvider>
    </Suspense>
  );
}