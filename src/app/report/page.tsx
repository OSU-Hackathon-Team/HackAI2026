"use client";
import {
  ComposedChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ReferenceLine, ResponsiveContainer, Area
} from "recharts";

// ─── TYPES ────────────────────────────────────────────────────────────────────
export interface BiometricDataPoint {
  time: number;        // seconds into interview
  gazeScore: number;   // 0–100
  confidence: number;  // 0–100
  fidgetIndex: number; // 0–100 (lower = calmer)
  stressSpike?: boolean;
}

interface BiometricChartProps {
  data: BiometricDataPoint[];
  activeTimestamp?: number | null;
  onChartClick?: (time: number) => void;
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
import { useState, useMemo } from "react";
import { useInterviewStore } from "@/store/useInterviewStore";
import Link from "next/link";

export default function ReportPage() {
  const { biometrics, transcript, sessionId, reset } = useInterviewStore();
  const [activeTime, setActiveTime] = useState<number | null>(null);

  const avgGaze = useMemo(() => biometrics.length ? Math.round(biometrics.reduce((a, b) => a + b.gazeScore, 0) / biometrics.length) : 0, [biometrics]);
  const avgConf = useMemo(() => biometrics.length ? Math.round(biometrics.reduce((a, b) => a + b.confidence, 0) / biometrics.length) : 0, [biometrics]);
  const avgCalm = useMemo(() => biometrics.length ? Math.round(100 - (biometrics.reduce((a, b) => a + b.fidgetIndex, 0) / biometrics.length)) : 0, [biometrics]);

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", padding: "2rem" }}>
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>

        {/* Header */}
        <header style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "3rem" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.5rem" }}>
              <Link href="/" onClick={reset} style={{ color: "var(--muted)", fontSize: "0.8rem", textDecoration: "none", display: "flex", alignItems: "center", gap: "0.4rem" }}>
                ← BACK TO HOME
              </Link>
            </div>
            <h1 style={{ fontSize: "2.5rem", fontWeight: 800, letterSpacing: "-0.02em", color: "var(--text)" }}>Interview Report</h1>
            <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.85rem", color: "var(--muted)", marginTop: "0.5rem" }}>
              SESSION ID: <span style={{ color: "var(--accent)" }}>{sessionId || "DEMO_UNITS"}</span>
            </p>
          </div>
          <div style={{ display: "flex", gap: "1.5rem" }}>
            <div className="card" style={{ padding: "1rem 1.5rem", textAlign: "center", minWidth: "120px" }}>
              <div style={{ fontSize: "0.65rem", color: "var(--muted)", fontWeight: 700, letterSpacing: "0.1em", marginBottom: "0.25rem" }}>OVERALL SCORE</div>
              <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--accent)" }}>{Math.round((avgGaze + avgConf + avgCalm) / 3)}%</div>
            </div>
          </div>
        </header>

        {/* Stats Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1.5rem", marginBottom: "2rem" }}>
          <div className="card" style={{ padding: "1.5rem" }}>
            <div className="label" style={{ marginBottom: "0.75rem" }}>AVERAGE GAZE</div>
            <div style={{ fontSize: "2rem", fontWeight: 800, color: "var(--text)" }}>{avgGaze}%</div>
            <div style={{ width: "100%", height: "4px", background: "rgba(255,255,255,0.05)", borderRadius: "2px", marginTop: "1rem" }}>
              <div style={{ width: `${avgGaze}%`, height: "100%", background: "var(--accent)", borderRadius: "2px" }} />
            </div>
          </div>
          <div className="card" style={{ padding: "1.5rem" }}>
            <div className="label" style={{ marginBottom: "0.75rem" }}>AVG CONFIDENCE</div>
            <div style={{ fontSize: "2rem", fontWeight: 800, color: "var(--text)" }}>{avgConf}%</div>
            <div style={{ width: "100%", height: "4px", background: "rgba(255,255,255,0.05)", borderRadius: "2px", marginTop: "1rem" }}>
              <div style={{ width: `${avgConf}%`, height: "100%", background: "var(--accent2)", borderRadius: "2px" }} />
            </div>
          </div>
          <div className="card" style={{ padding: "1.5rem" }}>
            <div className="label" style={{ marginBottom: "0.75rem" }}>COMPOSURE</div>
            <div style={{ fontSize: "2rem", fontWeight: 800, color: "var(--text)" }}>{avgCalm}%</div>
            <div style={{ width: "100%", height: "4px", background: "rgba(255,255,255,0.05)", borderRadius: "2px", marginTop: "1rem" }}>
              <div style={{ width: `${avgCalm}%`, height: "100%", background: "var(--success)", borderRadius: "2px" }} />
            </div>
          </div>
        </div>

        {/* Chart Section */}
        <InternalBiometricChart data={biometrics} activeTimestamp={activeTime} onChartClick={setActiveTime} />

        {/* Detailed Analysis Split */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2rem" }}>

          {/* Transcript */}
          <div className="card" style={{ padding: "1.5rem", display: "flex", flexDirection: "column", maxHeight: "600px" }}>
            <div className="label" style={{ marginBottom: "1.25rem" }}>SESSION TRANSCRIPT</div>
            <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: "1rem" }}>
              {transcript.map((entry, i) => (
                <div
                  key={i}
                  onClick={() => setActiveTime(entry.time)}
                  style={{
                    padding: "0.75rem",
                    borderRadius: "8px",
                    background: activeTime === entry.time ? "rgba(255,255,255,0.03)" : "transparent",
                    cursor: "pointer",
                    transition: "background 0.2s ease"
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.4rem" }}>
                    <span style={{ fontSize: "0.65rem", fontFamily: "var(--font-mono)", fontWeight: 800, color: entry.speaker === "interviewer" ? "var(--accent)" : "var(--accent2)" }}>
                      {entry.speaker.toUpperCase()}
                    </span>
                    <span style={{ fontSize: "0.65rem", fontFamily: "var(--font-mono)", color: "var(--muted)" }}>{entry.time}s</span>
                  </div>
                  <p style={{ fontSize: "0.85rem", lineHeight: 1.5, color: activeTime === entry.time ? "var(--text)" : "rgba(232,237,245,0.8)" }}>
                    {entry.text}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* AI Feedback Placeholder */}
          <div className="card" style={{ padding: "1.5rem" }}>
            <div className="label" style={{ marginBottom: "1.25rem" }}>AI COACHING REPORT</div>
            <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
              <div style={{ padding: "1rem", borderRadius: "10px", background: "rgba(0,229,255,0.05)", border: "1px solid rgba(0,229,255,0.1)" }}>
                <p style={{ fontSize: "0.85rem", lineHeight: 1.6, color: "rgba(232,237,245,0.9)" }}>
                  Our AI is currently finalizing your comprehensive report. Check your server terminal for the full deep-dive analysis!
                </p>
                <div style={{ marginTop: "1rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  <div style={{ height: "8px", width: "100%", background: "rgba(255,255,255,0.03)", borderRadius: "4px" }} />
                  <div style={{ height: "8px", width: "90%", background: "rgba(255,255,255,0.03)", borderRadius: "4px" }} />
                  <div style={{ height: "8px", width: "40%", background: "rgba(255,255,255,0.03)", borderRadius: "4px" }} />
                </div>
              </div>

              <div>
                <h4 style={{ fontSize: "0.8rem", fontWeight: 700, marginBottom: "0.75rem", letterSpacing: "0.05em" }}>KEY IMPROVEMENTS</h4>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                  <div style={{ borderLeft: "2px solid var(--accent)", paddingLeft: "1rem" }}>
                    <div style={{ fontSize: "0.75rem", fontWeight: 700, marginBottom: "0.2rem" }}>EYE CONTACT</div>
                    <p style={{ fontSize: "0.7rem", color: "var(--muted)" }}>Maintain steady gaze when answering technical questions.</p>
                  </div>
                  <div style={{ borderLeft: "2px solid var(--accent2)", paddingLeft: "1rem" }}>
                    <div style={{ fontSize: "0.75rem", fontWeight: 700, marginBottom: "0.2rem" }}>VERBAL CONFIDENCE</div>
                    <p style={{ fontSize: "0.7rem", color: "var(--muted)" }}>Try to reduce filler words when explaining complex architectural choices.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
