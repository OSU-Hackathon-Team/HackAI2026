"use client";
import { useRef, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth, useClerk, useUser } from "@clerk/nextjs";
import {
  ComposedChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ReferenceLine, ResponsiveContainer, Area
} from "recharts";
import { useInterviewStore } from "@/store/useInterviewStore";
import { MOCK_BIOMETRICS, MOCK_TRANSCRIPT, MOCK_SESSION } from "@/lib/mockData";

// ─── TYPES ────────────────────────────────────────────────────────────────────
export interface BiometricDataPoint {
  time: number;        // seconds into interview
  gazeScore: number;   // 0–100
  confidence: number;  // 0–100
  fidgetIndex: number; // 0–100 (lower = calmer)
  stressSpike?: boolean;
}

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

// ─── COMPONENT ────────────────────────────────────────────────────────────────
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
  entry: any;
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
    <div style={{ width: "24px", height: "24px", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", background: `${color}15`, borderRadius: "6px", border: `1px solid ${color}30` }}>
      <img src={src} alt={alt} style={{ width: "14px", height: "14px", objectFit: "contain", filter: "brightness(1.2)" }} />
    </div>
  );
}

interface BiometricChartProps {
  data: BiometricDataPoint[];
  activeTimestamp: number | null;
  onChartClick: (time: number) => void;
}

// ─── INTERNAL CHART COMPONENT ────────────────────────────────────────────────
function InternalBiometricChart({ data, activeTimestamp, onChartClick }: BiometricChartProps) {
  const handleClick = (chartData: any) => {
    if (chartData?.activePayload?.[0] && onChartClick) {
      onChartClick(chartData.activePayload[0].payload.time);
    }
  };

  const chartData = data || [];

  return (
    <div className="card" style={{ marginBottom: "2rem", padding: "1.5rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
        <div>
          <h2 style={{ fontSize: "1.1rem", fontWeight: 600, color: "var(--text)", marginBottom: "0.4rem" }}>Performance Timeline</h2>
          <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.75rem", color: "var(--muted)" }}>
            Click markers to sync transcript with biometric peaks
          </p>
        </div>
        <div style={{ display: "flex", gap: "1.25rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
            <div style={{ width: "8px", height: "2px", background: "var(--accent)" }} />
            <span style={{ fontSize: "0.65rem", fontFamily: "var(--font-mono)", color: "var(--muted)" }}>GAZE</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
            <div style={{ width: "8px", height: "2px", background: "var(--accent2)" }} />
            <span style={{ fontSize: "0.65rem", fontFamily: "var(--font-mono)", color: "var(--muted)" }}>CONFIDENCE</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
            <div style={{ width: "8px", height: "2px", background: "var(--success)" }} />
            <span style={{ fontSize: "0.65rem", fontFamily: "var(--font-mono)", color: "var(--muted)" }}>CALM</span>
          </div>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={280}>
        <ComposedChart data={chartData} onClick={handleClick} style={{ cursor: "pointer" }}>
          <defs>
            <linearGradient id="gazeGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--accent)" stopOpacity={0.1} />
              <stop offset="95%" stopColor="var(--accent)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
          <XAxis
            dataKey="time"
            tickFormatter={(v) => `${v}s`}
            tick={{ fill: "var(--muted)", fontSize: 10, fontFamily: "var(--font-mono)" }}
            axisLine={false} tickLine={false}
          />
          <YAxis
            domain={[0, 100]}
            tick={{ fill: "var(--muted)", fontSize: 10, fontFamily: "var(--font-mono)" }}
            axisLine={false} tickLine={false}
          />
          <Tooltip content={<CustomTooltip />} />
          <Area type="monotone" dataKey="gazeScore" fill="url(#gazeGrad)" stroke="none" />
          <Line type="monotone" dataKey="gazeScore" name="Gaze" stroke="var(--accent)" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
          <Line type="monotone" dataKey="confidence" name="Confidence" stroke="var(--accent2)" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
          <Line type="monotone" dataKey="fidgetIndex" name="Composure" stroke="var(--success)" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />

          {chartData.filter((d: any) => d.stressSpike).map((d: any) => (
            <ReferenceLine
              key={d.time} x={d.time}
              stroke="var(--danger)" strokeDasharray="4 4" strokeWidth={1}
              label={{ value: "STRESS", fill: "var(--danger)", fontSize: 9, position: "top", fontFamily: "var(--font-mono)" }}
            />
          ))}

          {activeTimestamp != null && (
            <ReferenceLine x={activeTimestamp} stroke="var(--text)" strokeWidth={1} strokeDasharray="3 3" />
          )}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

// ─── MAIN REPORT PAGE ────────────────────────────────────────────────────────
import { useMemo } from "react";
import Link from "next/link";

export default function ReportPage() {
  const router = useRouter();
  const { biometrics = [], transcript = [], sessionId, reset } = useInterviewStore();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [activeTimestamp, setActiveTimestamp] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const searchParams = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
  const urlSessionId = searchParams?.get("session_id");
  const autoSave = searchParams?.get("auto_save");
  const [sessionDetails, setSessionDetails] = useState<any>(null);

  const { user, isLoaded: isUserLoaded } = useUser();

  // Load session from URL if provided (for viewing past sessions)
  useEffect(() => {
    if (urlSessionId) {
      fetch(`http://127.0.0.1:8080/api/get-session-details?session_id=${urlSessionId}`)
        .then(res => res.json())
        .then(data => setSessionDetails(data.data))
        .catch(err => console.error("Error loading session:", err));
    }
  }, [urlSessionId]);

  // Use real store data if available, or sessionDetails, or fallback to mock
  const data = sessionDetails?.biometrics || ((biometrics && biometrics.length > 0) ? biometrics : MOCK_BIOMETRICS);
  const txData = sessionDetails?.transcript || ((transcript && transcript.length > 0) ? transcript : MOCK_TRANSCRIPT);
  const session = sessionDetails ? {
    role: sessionDetails.role,
    company: sessionDetails.company,
    date: sessionDetails.date
  } : MOCK_SESSION;

  // Compute averages safely
  const safeData = data || [];
  const avgGaze = safeData.length > 0 ? Math.round(safeData.reduce((s: number, d: any) => s + (d.gazeScore || 0), 0) / safeData.length) : 0;
  const avgConf = safeData.length > 0 ? Math.round(safeData.reduce((s: number, d: any) => s + (d.confidence || 0), 0) / safeData.length) : 0;
  const avgCalm = safeData.length > 0 ? Math.round(100 - (safeData.reduce((s: number, d: any) => s + (d.fidgetIndex || 0), 0) / safeData.length)) : 100;
  const overall = Math.round((avgGaze + avgConf + avgCalm) / 3);
  const spikeCount = safeData.filter((d: any) => d.stressSpike).length;
  const spikeTimestamps = new Set(safeData.filter((d: any) => d.stressSpike).map((d: any) => d.time));

  // ── Jump to timestamp in video ──
  const jumpToTime = (time: number) => {
    setActiveTimestamp(time);
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      videoRef.current.play().catch(() => { });
    }
    videoRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  const { isSignedIn } = useAuth();
  const { openSignIn } = useClerk();

  const requireAuth = (action: () => void) => {
    if (isSignedIn) {
      action();
    } else {
      openSignIn({ afterSignInUrl: "/dashboard" });
    }
  };

  const handleReset = () => {
    reset();
    router.push("/interviewer-selection");
  };

  const handleExport = () => {
    window.print();
  };

  const handleSave = async () => {
    if (!user) {
      openSignIn({ afterSignInUrl: "/report?auto_save=true" });
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        user_id: user.id,
        role: session.role,
        company: session.company,
        date: session.date,
        duration: "Demo Duration", // Could be calculated
        score: overall,
        gaze: avgGaze,
        confidence: avgConf,
        composure: avgCalm,
        spikes: spikeCount,
        transcript: txData,
        biometrics: data
      };

      const res = await fetch("http://127.0.0.1:8080/api/save-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        router.push("/dashboard");
      } else {
        alert("Failed to save session.");
      }
    } catch (error) {
      console.error("Save error:", error);
    } finally {
      setIsSaving(false);
    }
  };

  // Auto-save logic after login redirect
  useEffect(() => {
    if (autoSave === "true" && user && isUserLoaded && !isSaving && biometrics.length > 0) {
      handleSave();
    }
  }, [user, isUserLoaded, autoSave]);

  // Determine score color
  const scoreColor = overall >= 80 ? "var(--success)" : overall >= 60 ? "var(--accent)" : "var(--danger)";

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", padding: "2rem" }}>
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        {/* ── HEADER ── */}
        <header style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "3rem" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.5rem" }}>
              <Link href="/" onClick={reset} style={{ color: "var(--muted)", fontSize: "0.8rem", textDecoration: "none", display: "flex", alignItems: "center", gap: "0.4rem" }}>
                ← BACK TO HOME
              </Link>
            </div>
            <h1 style={{ fontSize: "clamp(1.8rem, 4vw, 3rem)", fontWeight: 800, letterSpacing: "-0.02em", color: "var(--text)" }}>
              {session.role} Report
            </h1>
            <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.85rem", color: "var(--muted)", marginTop: "0.5rem" }}>
              SESSION ID: <span style={{ color: "var(--accent)" }}>{sessionId || "DEMO_UNITS"}</span> · {session.company} · {session.date}
            </p>
          </div>
          <div style={{ display: "flex", gap: "1.5rem" }}>
            <div className="card" style={{ padding: "1rem 1.5rem", textAlign: "center", minWidth: "120px" }}>
              <div style={{ fontSize: "0.65rem", color: "var(--muted)", fontWeight: 700, letterSpacing: "0.1em", marginBottom: "0.25rem" }}>OVERALL SCORE</div>
              <div style={{ fontSize: "1.5rem", fontWeight: 800, color: scoreColor }}>{overall}%</div>
            </div>
          </div>
        </header>

        {/* ── STAT CARDS ── */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "1.5rem", marginBottom: "2rem" }}>
          <StatCard label="GAZE STABILITY" value={`${avgGaze}%`} sub="avg across session" color="var(--accent)" />
          <StatCard label="VOICE CONFIDENCE" value={`${avgConf}%`} sub="tone & pacing" color="var(--accent2)" />
          <StatCard label="COMPOSURE" value={`${avgCalm}%`} sub="low fidget index" color="var(--success)" />
          <StatCard label="STRESS SPIKES" value={`${spikeCount}`} sub="moments flagged" color="var(--danger)" />
        </div>

        {/* ── BIOMETRIC CHART ── */}
        <InternalBiometricChart data={safeData} activeTimestamp={activeTimestamp} onChartClick={jumpToTime} />

        {/* ── VIDEO + TRANSCRIPT ── */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2rem", marginBottom: "2rem" }}>
          <div className="card" style={{ padding: "1.5rem" }}>
            <div className="label" style={{ marginBottom: "1.25rem" }}>SESSION TRANSCRIPT</div>
            <div style={{ maxHeight: "500px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "0.25rem" }}>
              {txData.map((entry: any, i: number) => {
                const entryStress = [...spikeTimestamps].some((t: any) => Math.abs(t - entry.time) < 8);
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

          <div className="card" style={{ padding: "1.5rem" }}>
            <div className="label" style={{ marginBottom: "1.25rem" }}>AI COACHING INSIGHTS</div>
            <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              {[
                { icon: "/eye.png", title: "Eye Contact", body: `You maintained strong gaze (${avgGaze}% avg) but dropped significantly at key technical explanations. Practice looking up when thinking.`, tone: "var(--accent)" },
                { icon: "/microphone.png", title: "Voice Confidence", body: `Your confidence score dipped during the behavioral section. Slow down your speaking pace — rushing signals anxiety more than pausing does.`, tone: "var(--accent2)" },
                { icon: "/palm.png", title: "Body Language", body: `${spikeCount} stress spikes detected. Try anchoring your hands on the desk to reduce visible fidgeting.`, tone: "var(--danger)" },
                { icon: "/muscle.png", title: "Strengths", body: `Strong recovery — after each stress spike your scores returned to baseline within 10 seconds. Excellent technical delivery.`, tone: "var(--success)" },
              ].map((item) => (
                <div key={item.title} style={{ padding: "1rem", background: "rgba(255,255,255,0.02)", borderRadius: "10px", borderLeft: `2px solid ${item.tone}` }}>
                  <div style={{ marginBottom: "0.4rem", fontWeight: 700, display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <CoachingIcon src={item.icon} alt={item.title} color={item.tone} />
                    <span style={{ color: item.tone, fontSize: "0.85rem" }}>{item.title}</span>
                  </div>
                  <p style={{ fontSize: "0.8rem", lineHeight: 1.6, color: "rgba(232,237,245,0.7)", fontFamily: "var(--font-mono)" }}>{item.body}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── FOOTER ACTIONS ── */}
        <div style={{ display: "flex", gap: "1rem", justifyContent: "center" }}>
          <button className="btn-ghost" onClick={handleReset} style={{ color: "var(--text)", borderColor: "var(--border)" }}>↺ New Interview</button>
          {!urlSessionId && (
            <button
              className="btn-primary"
              onClick={handleSave}
              disabled={isSaving}
              style={{ background: "#00e096", boxShadow: "0 0 20px rgba(0, 224, 150, 0.25)", color: "var(--bg)" }}
            >
              {isSaving ? "Saving..." : "Save to Dashboard"}
            </button>
          )}
          <button className="btn-ghost" onClick={handleExport} style={{ fontFamily: "var(--font-mono)", letterSpacing: "0.04em" }}>
            <span style={{ marginRight: "0.5rem" }}>📄</span> Export PDF
          </button>
        </div>
      </div>
    </div>
  );
}
