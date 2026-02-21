"use client";
import { useRef, useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAuth, useClerk, useUser } from "@clerk/nextjs";
import Link from "next/link";
import {
  ComposedChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ReferenceLine, ResponsiveContainer, Area
} from "recharts";
import { useInterviewStore } from "@/store/useInterviewStore";
import ReactMarkdown from "react-markdown";
import { IntelligenceReport } from "@/components/IntelligenceReport";

// ─── TYPES ────────────────────────────────────────────────────────────────────
export interface BiometricDataPoint {
  time: number;        // seconds into interview
  gazeScore: number;   // 0–100
  confidence: number;  // 0–100
  fidgetIndex: number; // 0–100 (lower = calmer)
  fillerCount?: number;
  tone?: number;
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

// ─── STAT CARD ────────────────────────────────────────────────────────────────
function StatCard({ label, value, sub, color }: { label: string; value: string; sub: string; color: string }) {
  return (
    <div style={{
      padding: "2rem",
      background: "transparent",
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
      borderRight: "1px solid var(--border)"
    }}>
      <div className="label" style={{ color: "var(--muted)", fontWeight: 800, fontSize: "0.6rem", letterSpacing: "0.2em" }}>{label}</div>
      <div style={{ fontSize: "3.5rem", fontWeight: 400, color: color, lineHeight: 1, margin: "0.5rem 0", fontFamily: "var(--font-display)" }}>{value}</div>
      <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.55rem", color: "var(--muted)", letterSpacing: "0.1em" }}>{sub}</div>
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
        display: "flex", gap: "1.25rem", padding: "1rem", borderRadius: "12px", cursor: "pointer",
        background: isStressZone ? "rgba(255,77,109,0.08)" : "rgba(255,255,255,0.02)",
        border: `1px solid ${isStressZone ? "rgba(255,77,109,0.25)" : "rgba(255,255,255,0.05)"}`,
        transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
        marginRight: "0.5rem"
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = "rgba(255,255,255,0.06)";
        e.currentTarget.style.transform = "translateX(4px)";
        e.currentTarget.style.borderColor = "var(--accent)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = isStressZone ? "rgba(255,77,109,0.08)" : "rgba(255,255,255,0.02)";
        e.currentTarget.style.transform = "none";
        e.currentTarget.style.borderColor = isStressZone ? "rgba(255,77,109,0.25)" : "rgba(255,255,255,0.05)";
      }}
    >
      <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.75rem", color: "var(--accent)", whiteSpace: "nowrap", paddingTop: "4px", width: "40px" }}>
        {String(Math.floor(entry.time / 60)).padStart(2, "0")}:{String(entry.time % 60).padStart(2, "0")}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
        <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.6rem", fontWeight: 800, color: entry.speaker === "interviewer" ? "var(--accent2)" : "var(--success)", textTransform: "uppercase", letterSpacing: "0.1em" }}>
          {entry.speaker === "interviewer" ? "ACEIT-AI" : "CANDIDATE"}
        </div>
        <p style={{ fontSize: "0.9rem", lineHeight: 1.6, color: isStressZone ? "#fff" : "var(--text-dim)", fontFamily: "var(--font-body)" }}>
          {entry.text}
          {isStressZone && <span style={{ marginLeft: "0.75rem", fontSize: "0.65rem", padding: "0.1rem 0.4rem", background: "var(--danger)", borderRadius: "4px", color: "#fff", fontWeight: 800 }}>STRESS ZONE</span>}
        </p>
      </div>
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

// ─── SPEECH CHART COMPONENT ──────────────────────────────────────────────────
function InternalSpeechChart({ data, activeTimestamp, onChartClick }: BiometricChartProps) {
  const handleClick = (chartData: any) => {
    if (chartData?.activePayload?.[0] && onChartClick) {
      onChartClick(chartData.activePayload[0].payload.time);
    }
  };

  return (
    <div className="card" style={{ marginBottom: "2rem", padding: "1.5rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
        <div>
          <h2 style={{ fontSize: "1.1rem", fontWeight: 600, color: "var(--text)", marginBottom: "0.4rem" }}>Speech & Tone Evolution</h2>
          <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.75rem", color: "var(--muted)" }}>
            Tracking filler words (bars) and performance tone (line)
          </p>
        </div>
        <div style={{ display: "flex", gap: "1.25rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
            <div style={{ width: "8px", height: "8px", background: "var(--accent)" }} />
            <span style={{ fontSize: "0.65rem", fontFamily: "var(--font-mono)", color: "var(--muted)" }}>FILLERS</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
            <div style={{ width: "8px", height: "2px", background: "var(--accent2)" }} />
            <span style={{ fontSize: "0.65rem", fontFamily: "var(--font-mono)", color: "var(--muted)" }}>TONE (0-100)</span>
          </div>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={280}>
        <ComposedChart data={data} onClick={handleClick} style={{ cursor: "pointer" }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
          <XAxis
            dataKey="time"
            tickFormatter={(v) => `${v}s`}
            tick={{ fill: "var(--muted)", fontSize: 10, fontFamily: "var(--font-mono)" }}
            axisLine={false} tickLine={false}
          />
          <YAxis
            tick={{ fill: "var(--muted)", fontSize: 10, fontFamily: "var(--font-mono)" }}
            axisLine={false} tickLine={false}
          />
          <Tooltip content={<CustomTooltip />} />
          <Area type="step" dataKey="fillerCount" fill="var(--accent)" fillOpacity={0.2} stroke="var(--accent)" strokeWidth={1} name="Fillers" />
          <Line type="monotone" dataKey={(d) => (d.tone || 0.5) * 100} name="Tone" stroke="var(--accent2)" strokeWidth={2} dot={false} />

          {activeTimestamp != null && (
            <ReferenceLine x={activeTimestamp} stroke="var(--text)" strokeWidth={1} strokeDasharray="3 3" />
          )}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

// ─── MAIN REPORT PAGE ────────────────────────────────────────────────────────
export default function ReportPage() {
  const router = useRouter();
  const { biometrics = [], transcript = [], sessionId, aiCoachingReport, setAiCoachingReport, setBiometrics, setTranscript, reset } = useInterviewStore();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [activeTimestamp, setActiveTimestamp] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isFetchingReport, setIsFetchingReport] = useState(false);
  const searchParams = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
  const urlSessionId = searchParams?.get("session_id");
  const autoSave = searchParams?.get("auto_save");
  const [sessionDetails, setSessionDetails] = useState<any>(null);

  // Fetch real session data if sessionId is present
  useEffect(() => {
    const idToUse = sessionId || urlSessionId;
    if (idToUse && !aiCoachingReport && !isFetchingReport) {
      setIsFetchingReport(true);
      fetch(`/api/session/${idToUse}/data`)
        .then(res => res.json())
        .then(data => {
          if (data.report?.report_markdown) {
            setAiCoachingReport(data.report.report_markdown);
          }
          if (data.metadata) {
            setSessionDetails(data.metadata);
          }
          if (data.keyframes && data.keyframes.length > 0) {
            const mappedBiometrics: any[] = [];
            const mappedTranscript: any[] = [];

            data.keyframes.forEach((kf: any) => {
              // Map Biometrics (only if metrics are present)
              if (kf.overall_confidence_score !== null || kf.gaze_score !== null) {
                mappedBiometrics.push({
                  time: kf.timestamp_sec,
                  gazeScore: Math.round((kf.gaze_score ?? 0.8) * 100),
                  confidence: Math.round((kf.overall_confidence_score ?? 0.5) * 100),
                  fidgetIndex: Math.round((kf.fidget_index ?? 0.1) * 100),
                  fillerCount: kf.filler_words_count ?? 0,
                  tone: kf.sentiment_score ?? 0.5,
                  stressSpike: kf.severity === "critical"
                });
              }

              // Map Transcript items
              if (kf.interviewer_question) {
                mappedTranscript.push({ time: kf.timestamp_sec, speaker: "interviewer", text: kf.interviewer_question });
              }
              if (kf.associated_transcript) {
                mappedTranscript.push({ time: kf.timestamp_sec, speaker: "user", text: kf.associated_transcript });
              }
              if (kf.ai_response) {
                mappedTranscript.push({ time: kf.timestamp_sec + 0.5, speaker: "interviewer", text: kf.ai_response });
              }
            });

            // Sort by time
            mappedBiometrics.sort((a, b) => a.time - b.time);
            mappedTranscript.sort((a, b) => a.time - b.time);

            setBiometrics(mappedBiometrics);
            setTranscript(mappedTranscript);
          }
        })
        .catch(err => console.error("Failed to fetch session data", err))
        .finally(() => setIsFetchingReport(false));
    }
  }, [sessionId, urlSessionId, aiCoachingReport, setAiCoachingReport, setBiometrics, setTranscript, isFetchingReport]);

  const { user, isLoaded: isUserLoaded } = useUser();


  // Use real store data if available, or sessionDetails, or fallback to empty
  const data = sessionDetails?.biometrics || ((biometrics && biometrics.length > 0) ? biometrics : []);
  const txData = sessionDetails?.transcript || ((transcript && transcript.length > 0) ? transcript : []);

  // Use metadata if available
  const displayRole = sessionDetails?.role || (sessionId ? useInterviewStore.getState().role : "Interview");
  const displayCompany = sessionDetails?.company || (sessionId ? useInterviewStore.getState().company : "AceIt");
  const displayDate = sessionDetails?.date || new Date().toLocaleDateString();

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
        role: displayRole,
        company: displayCompany,
        date: displayDate,
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
    <div style={{ minHeight: "100vh", background: "var(--bg)", padding: "4rem 2rem" }}>
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        {/* ── HEADER ── */}
        <header style={{
          display: "flex", justifyContent: "space-between", alignItems: "flex-end",
          marginBottom: "6rem", position: "relative"
        }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.5rem" }}>
              <Link href="/" onClick={reset} style={{
                color: "var(--muted)", fontSize: "0.65rem", textDecoration: "none",
                display: "flex", alignItems: "center", gap: "0.5rem",
                fontFamily: "var(--font-mono)", letterSpacing: "0.15em",
                fontWeight: 800
              }}>
                <span style={{ fontSize: "1rem" }}>←</span> / RETURN_TO_BASE
              </Link>
            </div>
            <h1 style={{
              fontSize: "clamp(4.5rem, 8vw, 6.5rem)", fontWeight: 400, letterSpacing: "-0.02em",
              color: "#fff", fontFamily: "var(--font-display)", lineHeight: 0.8,
              textTransform: "uppercase"
            }}>
              {displayRole} <br />
              <span style={{ color: "var(--accent)" }}>PERFORMANCE_REP</span>
            </h1>
            <div style={{
              fontFamily: "var(--font-mono)", fontSize: "0.65rem", color: "var(--muted)",
              marginTop: "2.5rem", display: "flex", alignItems: "center", gap: "1.5rem",
              letterSpacing: "0.15em"
            }}>
              <span style={{ padding: "0.25rem 0.75rem", border: "1px solid var(--border)", color: "var(--accent)" }}>
                ID / {sessionId || urlSessionId || "DEMO_SYS"}
              </span>
              <span style={{ color: "var(--text-dim)" }}>{displayCompany.toUpperCase()}</span>
              <span style={{ color: "var(--text-dim)" }}>{displayDate.toUpperCase()}</span>
            </div>
          </div>
          <div style={{ display: "flex", gap: "1.5rem" }}>
            <div style={{
              padding: "1.5rem 3rem", textAlign: "right",
              borderRight: "4px solid var(--accent)",
              background: "linear-gradient(90deg, transparent, rgba(202,255,0,0.03))"
            }}>
              <div style={{ fontSize: "0.6rem", color: "var(--muted)", fontWeight: 800, letterSpacing: "0.3em", marginBottom: "0.5rem" }}>SESSION_QUOTIENT</div>
              <div style={{ fontSize: "4.5rem", fontWeight: 400, color: scoreColor, fontFamily: "var(--font-display)", lineHeight: 1 }}>
                {data.length > 0 ? `${overall}%` : "--%"}
              </div>
            </div>
          </div>
        </header>

        {/* ── STAT CARDS ── */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "1px", background: "var(--border)", marginBottom: "4rem", border: "1px solid var(--border)" }}>
          <StatCard label="GAZE_STABILITY" value={`${avgGaze}%`} sub="INDEX / STABLE" color="var(--accent)" />
          <StatCard label="VOCAL_AUTHORITY" value={`${avgConf}%`} sub="RESONANCE / PEAK" color="var(--accent)" />
          <StatCard label="CORE_COMPOSURE" value={`${avgCalm}%`} sub="FIDGET / LOW" color="var(--accent)" />
          <StatCard label="STRESS_SPIKES" value={`${spikeCount}`} sub="CRITICAL_EVENTS" color="var(--danger)" />
        </div>

        {/* ── PERFORMANCE CHARTS ── */}
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "1.5rem", marginBottom: "6rem" }}>
          <InternalBiometricChart data={safeData} activeTimestamp={activeTimestamp} onChartClick={jumpToTime} />
          <InternalSpeechChart data={safeData} activeTimestamp={activeTimestamp} onChartClick={jumpToTime} />
        </div>

        {/* ── AI COACHING REPORT ── */}
        <section style={{ marginBottom: "8rem" }}>
          {aiCoachingReport ? (
            <IntelligenceReport content={aiCoachingReport} />
          ) : isFetchingReport ? (
            <div style={{ padding: "10rem 2rem", textAlign: "center" }}>
              <div style={{
                width: "48px", height: "48px", border: "2px solid rgba(202,255,0,0.1)",
                borderTopColor: "var(--accent)", borderRadius: "50%",
                animation: "spin 1s linear infinite",
                margin: "0 auto 3rem"
              }} />
              <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.8rem", letterSpacing: "0.3em", color: "var(--accent)" }}>SYNCHRONIZING_NEURAL_PATTERNS...</div>
            </div>
          ) : (
            <div style={{
              padding: "10rem 2rem", textAlign: "center", border: "1px solid var(--border)",
              background: "rgba(255,255,255,0.01)"
            }}>
              <h3 style={{ color: "#fff", marginBottom: "1rem", fontFamily: "var(--font-display)", fontSize: "2rem" }}>Intelligence Offline</h3>
              <p style={{ color: "var(--text-dim)", fontFamily: "var(--font-mono)", fontSize: "0.7rem" }}>RESUME SESSION TO DOWNLOAD ANALYSIS</p>
            </div>
          )}
        </section>

        {/* ── TRANSCRIPT & QUICK INSIGHTS ── */}
        <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: "4rem", marginBottom: "6rem" }}>
          <div style={{ background: "rgba(255,255,255,0.01)", padding: "2.5rem", border: "1px solid var(--border)" }}>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.65rem", color: "var(--accent)", fontWeight: 800, letterSpacing: "0.3em", marginBottom: "2rem" }}>SESSION_LOGS</div>
            <div style={{ maxHeight: "600px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
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

          <div style={{ display: "flex", flexDirection: "column", gap: "4rem" }}>
            <div>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.65rem", color: "var(--accent)", fontWeight: 800, letterSpacing: "0.3em", marginBottom: "2rem" }}>NEURAL_OPTIMIZATION</div>
              <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
                {[
                  { icon: "/eye.png", title: "Visual Foundation", body: `Maintained baseline gaze (${avgGaze}%) but efficiency dropped during technical spikes.`, tone: "var(--accent)" },
                  { icon: "/microphone.png", title: "Vocal Authority", body: `Confidence micro-variations detected. Lower your pitch during conclusions.`, tone: "var(--accent)" },
                  { icon: "/palm.png", title: "Kinetic Control", body: `Stress markers found at ${spikeCount} intervals. Reset your fidget index mid-stream.`, tone: "var(--danger)" },
                ].map((item) => (
                  <div key={item.title} style={{ paddingBottom: "1.5rem", borderBottom: "1px solid var(--border)" }}>
                    <div style={{ marginBottom: "1rem", fontWeight: 800, display: "flex", alignItems: "center", gap: "1rem", fontFamily: "var(--font-display)", letterSpacing: "0.05em", color: "#fff", fontSize: "1.25rem" }}>
                      {item.title.toUpperCase()}
                    </div>
                    <p style={{ fontSize: "0.95rem", lineHeight: 1.6, color: "var(--text-dim)", fontFamily: "var(--font-body)" }}>{item.body}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── FOOTER ACTIONS ── */}
        <div style={{ display: "flex", gap: "1rem", justifyContent: "center", paddingTop: "4rem", borderTop: "1px solid var(--border)" }}>
          <button className="btn-ghost" onClick={reset} style={{ color: "var(--text-dim)", borderColor: "var(--border)", fontFamily: "var(--font-mono)", fontSize: "0.7rem" }}>↺ / NEW_SESSION</button>
          {!urlSessionId && (
            <button
              onClick={handleSave}
              disabled={isSaving}
              style={{
                background: "var(--accent)",
                color: "#000",
                padding: "0.75rem 2rem",
                fontFamily: "var(--font-mono)",
                fontSize: "0.7rem",
                fontWeight: 800,
                border: "none",
                cursor: "pointer",
                boxShadow: "0 0 30px rgba(202,255,0,0.2)"
              }}
            >
              {isSaving ? "SYNCING..." : "SAVE_TO_CLOUD"}
            </button>
          )}
          <button className="btn-ghost" onClick={handleExport} style={{ fontFamily: "var(--font-mono)", letterSpacing: "0.04em", fontSize: "0.7rem" }}>
            / EXPORT_PDF
          </button>
        </div>
      </div>
    </div>
  );
}
