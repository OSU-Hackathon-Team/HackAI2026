"use client";
import { useRef, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth, useClerk } from "@clerk/nextjs";
import {
ComposedChart, Line, XAxis, YAxis, CartesianGrid,
Tooltip, ReferenceLine, ResponsiveContainer, Legend, Area
} from "recharts";
import { useInterviewStore } from "@/store/useInterviewStore";
import { MOCK_BIOMETRICS, MOCK_TRANSCRIPT, MOCK_SESSION } from "@/lib/mockData";
// ─── CUSTOM TOOLTIP ───────────────────────────────────────────────────────────
function CustomTooltip({ active, payload, label }: any) {
if (!active || !payload?.length) return null;
return (
<div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "10px", padding: "0.75rem 1rem", fontFamily: "var(--font-mono)", fontSize: "0.78rem" }}>
<div className="label" style={{ marginBottom: "0.4rem" }}>{label}s INTO INTERVIEW</div>
{payload.map((p: any) => (
<div key={p.dataKey} style={{ color: p.color, marginBottom: "0.15rem" }}>
{p.name}: <strong>{p.value}%</strong>
</div>
      ))}
<div style={{ color: "var(--muted)", marginTop: "0.4rem", fontSize: "0.7rem" }}>Click to jump to this moment</div>
</div>
  );
}
// ─── STAT CARD ────────────────────────────────────────────────────────────────
function StatCard({ label, value, sub, color }: { label: string; value: string; sub: string; color: string }) {
return (
<div className="card" style={{ borderLeft: `3px solid ${color}` }}>
<div className="label">{label}</div>
<div style={{ fontSize: "2.5rem", fontWeight: 800, color, lineHeight: 1.1, margin: "0.4rem 0" }}>{value}</div>
<div style={{ fontFamily: "var(--font-mono)", fontSize: "0.78rem", color: "var(--muted)" }}>{sub}</div>
</div>
  );
}
// ─── TRANSCRIPT ROW ───────────────────────────────────────────────────────────
function TranscriptRow({ entry, isStressZone, onJump }: {
entry: typeof MOCK_TRANSCRIPT[0];
isStressZone: boolean;
onJump: (time: number) => void;
}) {
return (
<div
onClick={() => onJump(entry.time)}
style={{
display: "flex", gap: "1rem", padding: "0.75rem", borderRadius: "8px", cursor: "pointer",
background: isStressZone ? "rgba(255,77,109,0.05)" : "transparent",
border: `1px solid ${isStressZone ? "rgba(255,77,109,0.2)" : "transparent"}`,
transition: "all 0.15s ease",
      }}
onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.04)")}
onMouseLeave={(e) => (e.currentTarget.style.background = isStressZone ? "rgba(255,77,109,0.05)" : "transparent")}
>
<div style={{ fontFamily: "var(--font-mono)", fontSize: "0.75rem", color: "var(--muted)", whiteSpace: "nowrap", paddingTop: "2px" }}>
{String(Math.floor(entry.time / 60)).padStart(2, "0")}:{String(entry.time % 60).padStart(2, "0")}
</div>
<div style={{ fontFamily: "var(--font-mono)", fontSize: "0.7rem", fontWeight: 700, color: entry.speaker === "interviewer" ? "var(--accent)" : "var(--accent2)", paddingTop: "2px", width: "24px", flexShrink: 0 }}>
{entry.speaker === "interviewer" ? "AI" : "YOU"}
</div>
<p style={{ fontSize: "0.875rem", lineHeight: 1.55, color: isStressZone ? "rgba(232,237,245,0.9)" : "rgba(232,237,245,0.7)" }}>
{entry.text}
{isStressZone && <span style={{ marginLeft: "0.5rem", fontSize: "0.75rem", color: "var(--danger)" }}>⚠ stress zone</span>}
</p>
</div>
  );
}
// ─── COACHING ICON ────────────────────────────────────────────────────────────
function CoachingIcon({ src, alt, color }: { src: string; alt: string; color: string }) {
  return (
    <div style={{ width: "22px", height: "22px", flexShrink: 0 }}>
      <img src={src} alt={alt} style={{ width: "100%", height: "100%", objectFit: "contain", filter: "brightness(0) invert(1) opacity(0.85)" }} />
    </div>
  );
}
// ─── MAIN PAGE ────────────────────────────────────────────────────────────────
export default function ReportPage() {
const router = useRouter();
const { biometrics, transcript, reset } = useInterviewStore();
const videoRef = useRef<HTMLVideoElement>(null);
const [activeTimestamp, setActiveTimestamp] = useState<number | null>(null);
// Use real store data if available, fall back to mock
const data = biometrics.length > 0 ? biometrics : MOCK_BIOMETRICS;
const txData = transcript.length > 0 ? transcript : MOCK_TRANSCRIPT;
const session = MOCK_SESSION;
// Compute averages
const avgGaze = Math.round(data.reduce((s, d) => s + d.gazeScore, 0) / data.length);
const avgConf = Math.round(data.reduce((s, d) => s + d.confidence, 0) / data.length);
const avgCalm = Math.round(100 - data.reduce((s, d) => s + d.fidgetIndex, 0) / data.length);
const overall = Math.round((avgGaze + avgConf + avgCalm) / 3);
const spikeCount = data.filter((d) => d.stressSpike).length;
const spikeTimestamps = new Set(data.filter((d) => d.stressSpike).map((d) => d.time));
// ── Jump to timestamp in video ──
const jumpToTime = (time: number) => {
setActiveTimestamp(time);
if (videoRef.current) {
videoRef.current.currentTime = time;
videoRef.current.play().catch(() => {});
    }
// Scroll to video
videoRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  };
// ── Chart click handler ──
const handleChartClick = (chartData: any) => {
if (chartData?.activePayload?.[0]) {
jumpToTime(chartData.activePayload[0].payload.time);
    }
  };
const { isSignedIn } = useAuth();
const { openSignIn } = useClerk();
const searchParams = useSearchParams();

// If user just signed in and was trying to export, auto-trigger print
useEffect(() => {
  if (isSignedIn && searchParams.get("action") === "export") {
    // Small delay to let the page fully render after redirect
    setTimeout(() => window.print(), 500);
    // Clean up the URL param
    router.replace("/report");
  }
}, [isSignedIn, searchParams]);

const requireAuth = (action: () => void) => {
  if (isSignedIn) {
    action();
  } else {
    openSignIn({ afterSignInUrl: "/report?action=export" });
  }
};

const handleReset = () => {
  if (isSignedIn) {
    reset();
    router.push("/upload");
  } else {
    openSignIn({ afterSignInUrl: "/dashboard" });
  }
};

const handleExport = () => requireAuth(() => {
  window.print();
});
// Determine score color
const scoreColor = overall >= 80 ? "var(--success)" : overall >= 60 ? "var(--accent)" : "var(--danger)";
return (
<div style={{ minHeight: "100vh", background: "var(--bg)", padding: "2rem" }}>
<div style={{ maxWidth: "1100px", margin: "0 auto" }}>
{/* ── HEADER ── */}
<div className="fade-up" style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "2.5rem" }}>
<div>
<div className="label" style={{ color: "var(--accent)", marginBottom: "0.5rem" }}>◆ INTERVIEW COMPLETE</div>
<h1 style={{ fontSize: "clamp(1.8rem, 4vw, 3rem)", fontWeight: 800, letterSpacing: "-0.03em" }}>
{session.role}
</h1>
<div style={{ fontFamily: "var(--font-mono)", fontSize: "0.85rem", color: "var(--muted)", marginTop: "0.4rem" }}>
{session.company} · {session.date} · {Math.floor(session.duration / 60)}m {session.duration % 60}s
</div>
</div>
<div style={{ textAlign: "right" }}>
<div className="label">OVERALL SCORE</div>
<div style={{ fontSize: "4rem", fontWeight: 800, color: scoreColor, lineHeight: 1 }}>{overall}</div>
<div className="label">/100</div>
</div>
</div>
{/* ── STAT CARDS ── */}
<div className="fade-up" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "1rem", marginBottom: "2rem", animationDelay: "0.05s" }}>
<StatCard label="GAZE STABILITY" value={`${avgGaze}%`} sub="avg across session" color="var(--accent)" />
<StatCard label="VOICE CONFIDENCE" value={`${avgConf}%`} sub="tone & pacing" color="var(--accent2)" />
<StatCard label="COMPOSURE" value={`${avgCalm}%`} sub="low fidget index" color="var(--success)" />
<StatCard label="STRESS SPIKES" value={`${spikeCount}`} sub="moments flagged" color="var(--danger)" />
</div>
{/* ── BIOMETRIC CHART ── */}
<div className="card fade-up" style={{ marginBottom: "2rem", animationDelay: "0.1s" }}>
<div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
<div>
<div className="label" style={{ marginBottom: "0.25rem" }}>PERFORMANCE TIMELINE</div>
<p style={{ fontFamily: "var(--font-mono)", fontSize: "0.78rem", color: "var(--muted)" }}>
                Click any point on the graph to jump to that moment in your recording
</p>
</div>
<div style={{ display: "flex", gap: "1rem" }}>
<div style={{ fontFamily: "var(--font-mono)", fontSize: "0.72rem", color: "var(--accent)" }}>— Gaze</div>
<div style={{ fontFamily: "var(--font-mono)", fontSize: "0.72rem", color: "var(--accent2)" }}>— Confidence</div>
<div style={{ fontFamily: "var(--font-mono)", fontSize: "0.72rem", color: "var(--success)" }}>— Composure</div>
</div>
</div>
<ResponsiveContainer width="100%" height={260}>
<ComposedChart data={data} onClick={handleChartClick} style={{ cursor: "pointer" }}>
<defs>
<linearGradient id="gazeGrad" x1="0" y1="0" x2="0" y2="1">
<stop offset="5%" stopColor="var(--accent)" stopOpacity={0.15} />
<stop offset="95%" stopColor="var(--accent)" stopOpacity={0} />
</linearGradient>
</defs>
<CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
<XAxis dataKey="time" tickFormatter={(v) => `${v}s`} tick={{ fill: "var(--muted)", fontSize: 11, fontFamily: "var(--font-mono)" }} axisLine={false} tickLine={false} />
<YAxis domain={[0, 100]} tickFormatter={(v) => `${v}`} tick={{ fill: "var(--muted)", fontSize: 11, fontFamily: "var(--font-mono)" }} axisLine={false} tickLine={false} />
<Tooltip content={<CustomTooltip />} />
<Area type="monotone" dataKey="gazeScore" fill="url(#gazeGrad)" stroke="none" />
<Line type="monotone" dataKey="gazeScore" name="Gaze" stroke="var(--accent)" strokeWidth={2} dot={false} activeDot={{ r: 5, fill: "var(--accent)" }} />
<Line type="monotone" dataKey="confidence" name="Confidence" stroke="var(--accent2)" strokeWidth={2} dot={false} activeDot={{ r: 5, fill: "var(--accent2)" }} />
<Line type="monotone" dataKey="fidgetIndex" name="Composure" stroke="var(--success)" strokeWidth={2} dot={false} activeDot={{ r: 5, fill: "var(--success)" }} />
{/* Stress spike reference lines */}
{data.filter((d) => d.stressSpike).map((d) => (
<ReferenceLine key={d.time} x={d.time} stroke="var(--danger)" strokeDasharray="4 3" strokeWidth={1.5}
label={{ value: "⚠", fill: "var(--danger)", fontSize: 12, position: "top" }}
/>
              ))}
{/* Active timestamp line */}
{activeTimestamp !== null && (
<ReferenceLine x={activeTimestamp} stroke="rgba(255,255,255,0.5)" strokeWidth={2} />
              )}
</ComposedChart>
</ResponsiveContainer>
</div>
{/* ── VIDEO + TRANSCRIPT ── */}
<div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem", marginBottom: "2rem" }}>
{/* Video playback */}
<div className="fade-up" style={{ animationDelay: "0.15s" }}>
<div className="label" style={{ marginBottom: "0.75rem" }}>INTERVIEW RECORDING</div>
<div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "12px", aspectRatio: "16/9", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
{/* Real video: swap src with actual recording URL from your storage */}
<video
ref={videoRef}
controls
style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "12px" }}
>
{/* TODO: <source src={recordingUrl} type="video/webm" /> */}
</video>
{/* Placeholder overlay when no video */}
<div style={{ position: "absolute", textAlign: "center", pointerEvents: "none" }}>
<div style={{ fontSize: "2rem", marginBottom: "0.5rem", opacity: 0.3 }}>▶</div>
<div className="label" style={{ opacity: 0.4 }}>Recording will appear here</div>
</div>
</div>
{activeTimestamp !== null && (
<div className="label" style={{ marginTop: "0.5rem", color: "var(--accent)" }}>
                → Jumped to {activeTimestamp}s
</div>
            )}
</div>
{/* Transcript */}
<div className="card fade-up" style={{ overflow: "hidden", display: "flex", flexDirection: "column", padding: "1rem", animationDelay: "0.2s" }}>
<div className="label" style={{ marginBottom: "0.75rem" }}>TRANSCRIPT — click any line to jump</div>
<div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: "0.25rem" }}>
{txData.map((entry, i) => {
const entryStress = [...spikeTimestamps].some(
                  (t) => Math.abs(t - entry.time) < 8
                );
return (
<TranscriptRow
key={i}
entry={entry}
isStressZone={entryStress}
onJump={jumpToTime}
/>
                );
              })}
</div>
</div>
</div>
{/* ── COACHING NOTES ── */}
<div className="card fade-up" style={{ marginBottom: "2rem", animationDelay: "0.25s" }}>
<div className="label" style={{ marginBottom: "1rem" }}>AI COACHING INSIGHTS</div>
<div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
{[
              { icon: "/eye.png", title: "Eye Contact", body: `You maintained strong gaze (${avgGaze}% avg) but dropped significantly at the 10s and 40s marks — both coincided with complex technical questions. Practice looking up when thinking.`, tone: "var(--accent)" },
              { icon: "/microphone.png", title: "Voice Confidence", body: `Your confidence score dipped during the "difficult problem" question. Slow down your speaking pace — rushing signals anxiety more than pausing does.`, tone: "var(--accent2)" },
              { icon: "/palm.png", title: "Body Language", body: `${spikeCount} stress spikes detected. The worst occurred at the ${data.find(d=>d.stressSpike)?.time ?? "?"}s mark. Try anchoring your hands on the desk to reduce visible fidgeting.`, tone: "var(--danger)" },
              { icon: "/muscle.png", title: "Strengths", body: `Strong recovery — after each stress spike your scores returned to baseline within 10 seconds. Your technical answer on caching (Redis) was delivered with high confidence.`, tone: "var(--success)" },
            ].map((item) => (
<div key={item.title} style={{ padding: "1rem", background: "rgba(255,255,255,0.02)", borderRadius: "10px", borderLeft: `2px solid ${item.tone}` }}>
<div style={{ marginBottom: "0.4rem", fontWeight: 700, display: "flex", alignItems: "center", gap: "0.5rem" }}>
<CoachingIcon src={item.icon} alt={item.title} color={item.tone} />
<span style={{ color: item.tone }}>{item.title}</span>
</div>
<p style={{ fontSize: "0.84rem", lineHeight: 1.6, color: "rgba(232,237,245,0.7)", fontFamily: "var(--font-mono)" }}>{item.body}</p>
</div>
            ))}
</div>
</div>
{/* ── FOOTER ACTIONS ── */}
<div className="fade-up" style={{ display: "flex", gap: "1rem", justifyContent: "center", animationDelay: "0.3s" }}>
<button className="btn-primary" onClick={handleReset}>
            ↺ New Interview
</button>
<button onClick={handleExport} style={{ background: "transparent", border: "1px solid var(--border)", color: "var(--text)", fontFamily: "var(--font-display)", fontWeight: 600, fontSize: "0.85rem", padding: "0.75rem 1.5rem", borderRadius: "8px", cursor: "pointer", letterSpacing: "0.05em" }}>
            Export Report
</button>
<button onClick={() => router.push("/dashboard")} style={{ background: "transparent", border: "1px solid var(--border)", color: "var(--muted)", fontFamily: "var(--font-display)", fontWeight: 600, fontSize: "0.85rem", padding: "0.75rem 1.5rem", borderRadius: "8px", cursor: "pointer", letterSpacing: "0.05em", transition: "all 0.15s ease" }}
  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "var(--accent)"; (e.currentTarget as HTMLElement).style.color = "var(--accent)"; }}
  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "var(--border)"; (e.currentTarget as HTMLElement).style.color = "var(--muted)"; }}
>
            ← Back to Dashboard
</button>
</div>
</div>
</div>
  );
}