"use client";

import React, { useRef, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth, useClerk, useUser } from "@clerk/nextjs";
import Link from "next/link";
import {
  XAxis, YAxis, Tooltip,
  ResponsiveContainer, Area, AreaChart,
  CartesianGrid,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  BarChart, Bar,
} from "recharts";
import { useInterviewStore } from "@/store/useInterviewStore";
import { IntelligenceReport } from "@/components/IntelligenceReport";

// ─── PALETTE ─────────────────────────────────────────────────────────────────
const C = {
  bg: "#05071a",
  navy: "#0d1225",
  navyLight: "#111830",
  card: "rgba(5, 7, 26, 0.4)",
  cardBorder: "rgba(99,102,241,0.14)",
  cardBorderHover: "rgba(99,102,241,0.32)",
  cyan: "#22d3ee",
  teal: "#00f2ff", // Neon Cyan
  pink: "#ff00ea", // Neon Pink
  violet: "#818cf8",
  violetDeep: "#6366f1",
  purple: "#7b5ea7",
  green: "#caff00", // Acid Green
  white: "#ffffff",
  offwhite: "#c4ceee",
  muted: "rgba(255, 255, 255, 0.3)",
  dim: "rgba(196,206,238,0.25)",
  danger: "#ff00ea",
  warn: "#fbbf24",
  border: "rgba(0, 242, 255, 0.15)",
};

// ─── GLOBAL STYLES ────────────────────────────────────────────────────────────
const G = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800;900&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&family=DM+Mono:wght@300;400;500&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(26px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
  @keyframes floatA {
    0%,100% { transform: scale(1) translateY(0px); opacity: 0.55; }
    50%      { transform: scale(1.07) translateY(-12px); opacity: 0.9; }
  }
  @keyframes floatB {
    0%,100% { transform: scale(1) translateY(0px); opacity: 0.45; }
    50%      { transform: scale(1.05) translateY(14px); opacity: 0.75; }
  }
  @keyframes spin { to { transform: rotate(360deg); } }
  @keyframes barGrow {
    from { width: 0%; }
  }

  .r-card {
    background: ${C.card};
    border: 1px solid ${C.border};
    box-shadow: 0 0 30px rgba(0, 242, 255, 0.05);
    border-radius: 0px; /* Boxy */
    position: relative;
    overflow: hidden;
    transition: border-color 0.3s ease, box-shadow 0.3s ease, transform 0.25s ease;
  }
  .r-card::before {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(145deg, rgba(99,102,241,0.045) 0%, transparent 55%);
    border-radius: 18px;
    pointer-events: none;
  }
  .r-card:hover {
    border-color: ${C.cardBorderHover};
    box-shadow: 0 12px 48px rgba(99,102,241,0.1);
    transform: translateY(-2px);
  }

  .stat-tile {
    background: ${C.navyLight};
    border: 1px solid rgba(99,102,241,0.1);
    border-radius: 16px;
    padding: 1.3rem 1.5rem;
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
    transition: all 0.25s ease;
  }
  .stat-tile:hover {
    border-color: rgba(34,211,238,0.28);
    box-shadow: 0 6px 28px rgba(34,211,238,0.07);
    transform: translateY(-2px);
  }

  .act-btn {
    font-family: 'DM Mono', monospace;
    font-size: 0.68rem;
    letter-spacing: 0.07em;
    padding: 0.6rem 1.35rem;
    border-radius: 10px;
    cursor: pointer;
    transition: all 0.2s ease;
    font-weight: 500;
    border: 1px solid;
    text-transform: uppercase;
  }
  .act-btn:hover { transform: translateY(-1px); }
  .act-btn:active { transform: translateY(0px); }

  .tx-row {
    border-radius: 12px;
    transition: background 0.15s ease;
    cursor: pointer;
  }
  .tx-row:hover { background: rgba(99,102,241,0.07) !important; }

  ::-webkit-scrollbar { width: 4px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: rgba(99,102,241,0.22); border-radius: 4px; }
  ::-webkit-scrollbar-thumb:hover { background: rgba(99,102,241,0.45); }
`;

// ─── AMBIENT BACKGROUND ───────────────────────────────────────────────────────
function DotGrid() {
  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none",
      backgroundImage: `radial-gradient(circle, rgba(0,242,255,0.08) 1px, transparent 1px)`,
      backgroundSize: "36px 36px",
    }} />
  );
}

function AmbientBg() {
  return (
    <>
      <DotGrid />
      <div style={{
        position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none",
        backgroundImage: `linear-gradient(rgba(99,102,241,0.035) 1px, transparent 1px),
          linear-gradient(90deg, rgba(99,102,241,0.035) 1px, transparent 1px)`,
        backgroundSize: "52px 52px",
      }} />
      <div style={{
        position: "fixed", top: -100, left: -80, width: 560, height: 560,
        background: "radial-gradient(circle, rgba(34,211,238,0.1) 0%, transparent 68%)",
        pointerEvents: "none", zIndex: 0, animation: "floatA 9s ease-in-out infinite",
      }} />
      <div style={{
        position: "fixed", bottom: -80, right: -60, width: 500, height: 500,
        background: "radial-gradient(circle, rgba(129,140,248,0.11) 0%, transparent 68%)",
        pointerEvents: "none", zIndex: 0, animation: "floatB 12s ease-in-out infinite",
      }} />
      <div style={{
        position: "fixed", top: "40%", left: "50%", transform: "translateX(-50%)",
        width: 800, height: 280,
        background: "radial-gradient(ellipse, rgba(99,102,241,0.045) 0%, transparent 70%)",
        pointerEvents: "none", zIndex: 0,
      }} />
    </>
  );
}

// ─── CHIP ─────────────────────────────────────────────────────────────────────
function Chip({ children, color = C.violet }: { children: React.ReactNode; color?: string }) {
  return (
    <span style={{
      fontFamily: "'DM Mono', monospace", fontSize: "0.58rem", letterSpacing: "0.13em",
      textTransform: "uppercase", padding: "0.2rem 0.65rem", borderRadius: 7,
      border: `1px solid ${color}40`, background: `${color}12`, color, fontWeight: 500,
    }}>{children}</span>
  );
}

// ─── CARD SECTION HEADER ─────────────────────────────────────────────────────
function CardHeader({ eye, title, color = C.violet }: { eye: string; title: string; color?: string }) {
  return (
    <div style={{ marginBottom: "1.4rem" }}>
      <Chip color={color}>{eye}</Chip>
      <div style={{
        fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: "1rem",
        color: C.white, marginTop: "0.5rem", letterSpacing: "-0.015em",
      }}>{title}</div>
    </div>
  );
}

// ─── BRACKET CORNERS ───
function ExtraCorners() {
  const s: React.CSSProperties = {
    position: "absolute", width: 16, height: 16, borderColor: C.teal, borderStyle: "solid", opacity: 0.7, zIndex: 2,
  };
  return (
    <>
      <div style={{ ...s, bottom: -1, left: -1, borderWidth: "0 0 2px 2px" }} />
      <div style={{ ...s, top: -1, right: -1, borderWidth: "2px 2px 0 0" }} />
    </>
  );
}

// ─── CHART CARD WRAPPER ───
function ChartCard({ label, delay = 0, children }: { label: string; delay?: number; children: React.ReactNode }) {
  return (
    <div
      className="r-card"
      style={{ padding: "1.5rem", animation: `fadeUp 0.6s ease both`, animationDelay: `${delay}ms` }}
    >
      <ExtraCorners />
      <div style={{
        fontFamily: "var(--font-mono)", fontSize: "0.55rem", letterSpacing: "0.25em",
        color: C.teal, marginBottom: "1.25rem", opacity: 0.8
      }}>
        {label}
      </div>
      {children}
    </div>
  );
}

// ─── HUD TOOLTIP ───
function HudTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: "#09102b", border: `1px solid rgba(99,102,241,0.28)`,
      borderRadius: 12, padding: "0.75rem 1rem",
      fontFamily: "var(--font-mono)", fontSize: "0.68rem",
      boxShadow: "0 12px 40px rgba(0,0,0,0.5)",
    }}>
      <div style={{ color: C.dim, marginBottom: 7, fontSize: "0.58rem", letterSpacing: "0.1em" }}>{label}</div>
      {payload.map((p: any) => (
        <div key={p.dataKey} style={{ color: p.color || C.cyan, display: "flex", alignItems: "center", gap: 9, marginBottom: 3 }}>
          <div style={{ width: 6, height: 6, borderRadius: "50%", background: p.color || C.cyan, flexShrink: 0 }} />
          <span style={{ color: C.muted }}>{p.name}</span>
          <strong style={{ marginLeft: "auto", paddingLeft: 8 }}>
            {typeof p.value === "number" ? Math.round(p.value) : p.value}
          </strong>
        </div>
      ))}
    </div>
  );
}


// ─── PERFORMANCE TREND ────────────────────────────────────────────────────────
function PerformanceTrendChart({ data }: { data: any[] }) {
  const chartData = data.length > 0
    ? data.map((d) => ({
      t: `${Math.floor(d.time / 60)}:${String(Math.floor(d.time % 60)).padStart(2, "0")}`,
      score: Math.round((d.gazeScore + d.confidence + Math.max(0, 100 - d.fidgetIndex)) / 3),
      gaze: d.gazeScore, confidence: d.confidence,
      composure: Math.max(0, 100 - d.fidgetIndex),
    }))
    : [
      { t: "0:00", score: 62, gaze: 58, confidence: 65, composure: 63 },
      { t: "1:30", score: 71, gaze: 72, confidence: 68, composure: 73 },
      { t: "3:00", score: 68, gaze: 65, confidence: 70, composure: 69 },
      { t: "4:30", score: 79, gaze: 80, confidence: 77, composure: 80 },
      { t: "6:00", score: 85, gaze: 87, confidence: 84, composure: 84 },
    ];

  return (
    <div className="r-card" style={{ padding: "1.75rem", animation: "fadeUp 0.6s ease both", animationDelay: "80ms" }}>
      <CardHeader eye="Live Biometrics" title="Performance Over Time" color={C.cyan} />
      <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.57rem", color: C.dim, marginBottom: "1rem" }}>
        Composite = (Gaze + Confidence + Composure) ÷ 3
      </div>
      <ResponsiveContainer width="100%" height={185}>
        <AreaChart data={chartData} margin={{ top: 4, right: 4, left: -18, bottom: 0 }}>
          <defs>
            <linearGradient id="trendGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={C.cyan} stopOpacity={0.22} />
              <stop offset="100%" stopColor={C.cyan} stopOpacity={0} />
            </linearGradient>
            <filter id="dotGlow">
              <feGaussianBlur stdDeviation="2.5" result="blur" />
              <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
          </defs>
          <CartesianGrid strokeDasharray="2 10" stroke="rgba(99,102,241,0.06)" vertical={false} />
          <XAxis dataKey="t" tick={{ fill: C.dim, fontSize: 9, fontFamily: "'DM Mono', monospace" }} axisLine={false} tickLine={false} />
          <YAxis domain={[0, 100]} tick={{ fill: C.dim, fontSize: 9, fontFamily: "'DM Mono', monospace" }} axisLine={false} tickLine={false} />
          <Tooltip content={<HudTooltip />} />
          <Area type="monotone" dataKey="score" name="Composite"
            stroke={C.cyan} strokeWidth={2.5} fill="url(#trendGrad)"
            dot={{ fill: C.cyan, r: 3.5, strokeWidth: 0, filter: "url(#dotGlow)" }}
            activeDot={{ r: 6, fill: C.cyan, strokeWidth: 0 }}
            isAnimationActive animationDuration={1400} animationEasing="ease-out" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

// ─── COMPETENCY RADAR ───
const DEFAULT_COMP = [
  { name: "Technical Depth", value: 80 },
  { name: "Communication", value: 72 },
  { name: "Confidence", value: 68 },
  { name: "Clarity", value: 75 },
];

function CompetencyRadar({ competencies }: { competencies: any[] }) {
  const data = competencies?.length > 0 ? competencies : DEFAULT_COMP;
  return (
    <ChartCard label="COMPETENCY_BREAKDOWN // SKILL MATRIX" delay={200}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
        <ResponsiveContainer width="100%" height={220}>
          <RadarChart data={data} cx="50%" cy="50%" outerRadius={70}>
            <PolarGrid stroke={C.muted} />
            <PolarAngleAxis
              dataKey="name"
              tick={{ fill: C.teal, fontSize: 9, fontFamily: "var(--font-mono)" }}
            />
            <PolarRadiusAxis
              angle={30}
              domain={[0, 100]}
              tick={false}
              axisLine={false}
            />
            <Tooltip content={<HudTooltip />} />
            <Radar
              name="Skill Matrix"
              dataKey="value"
              stroke={C.teal}
              fill={C.teal}
              fillOpacity={0.4}
              isAnimationActive={true}
            />
          </RadarChart>
        </ResponsiveContainer>
        {/* Legend */}
        <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem", width: "100%", marginTop: "0.5rem" }}>
          {data.map((d: any) => (
            <React.Fragment key={d.name}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: d.color || C.teal, boxShadow: `0 0 6px ${d.color || C.teal}` }} />
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.62rem", color: C.muted, flex: 1 }}>{d.name.toUpperCase()}</span>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.62rem", color: d.color || C.teal }}>{d.value}%</span>
              </div>
              <div style={{ height: 3, background: "rgba(129,140,248,0.1)", borderRadius: 3, overflow: "hidden" }}>
                <div style={{
                  height: "100%", width: `${d.value}%`, borderRadius: 3,
                  background: `linear-gradient(90deg, ${C.violetDeep}, ${C.violet})`,
                  transition: "width 1.2s cubic-bezier(0.4,0,0.2,1)",
                }} />
              </div>
            </React.Fragment>
          ))}
        </div>
      </div>
    </ChartCard>
  );
}

// ─── SCORE COMPARISON ─────────────────────────────────────────────────────────
function ScoreComparisonChart({ overall }: { overall: number }) {
  const score = overall > 0 ? overall : 72;
  const compData = [
    { group: "Technical", candidate: Math.round(score * 0.95), average: 65, top: 88 },
    { group: "Behavioral", candidate: Math.round(score * 1.02), average: 70, top: 90 },
    { group: "Analytical", candidate: Math.round(score * 0.98), average: 62, top: 85 },
  ];
  return (
    <ChartCard label="SCORE_COMPARISON // PERCENTILE ANALYSIS" delay={300}>
      <ResponsiveContainer width="100%" height={210}>
        <BarChart data={compData} barCategoryGap="30%" margin={{ top: 4, right: 4, left: -18, bottom: 0 }}>
          <defs>
            <linearGradient id="barCandidate" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={C.teal} stopOpacity={1} />
              <stop offset="100%" stopColor={C.pink} stopOpacity={0.8} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="2 6" stroke="rgba(0,242,255,0.05)" vertical={false} />
          <XAxis dataKey="group" tick={{ fill: C.muted, fontSize: 9, fontFamily: "var(--font-mono)" }} axisLine={false} tickLine={false} />
          <YAxis domain={[0, 100]} tick={{ fill: C.muted, fontSize: 9, fontFamily: "var(--font-mono)" }} axisLine={false} tickLine={false} />
          <Tooltip content={<HudTooltip />} />
          <Bar dataKey="candidate" name="You" fill="url(#barCandidate)" radius={0}
            isAnimationActive={true} animationBegin={300} animationDuration={900}
            label={{ position: "top", fill: C.teal, fontSize: 9, fontFamily: "var(--font-mono)", formatter: (value: any) => `${value}` }}
          />
          <Bar dataKey="average" name="Average" fill="rgba(255,0,234,0.2)" radius={0}
            isAnimationActive={true} animationBegin={400} animationDuration={900}
            label={{ position: "top", fill: C.pink, fontSize: 9, fontFamily: "var(--font-mono)", formatter: (value: any) => `${value}` }}
          />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

// ─── COMMUNICATION ANALYSIS ───────────────────────────────────────────────────
function CommunicationAnalysis({ biometrics }: { biometrics: any[] }) {
  const fillers = biometrics.reduce((s, d) => s + (d.fillerCount || 0), 0) || 4;

  return (
    <ChartCard label="COMMUNICATION_ANALYSIS // VERBAL LINT" delay={400}>
      <div style={{ display: "flex", gap: "1rem" }}>
        <div className="hud-card" style={{ padding: "1.5rem", border: "none", background: "rgba(0,0,0,0.2)", flex: 1 }}>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.5rem", color: C.muted, letterSpacing: "0.1em" }}>TOTAL_FILLER_WORDS</div>
          <div style={{ fontFamily: "var(--font-display)", fontSize: "2rem", color: C.pink }}>{fillers} <span style={{ fontSize: "0.8rem", opacity: 0.5 }}>DETECTED</span></div>
        </div>
        <div className="hud-card" style={{ padding: "1.5rem", border: "none", background: "rgba(0,0,0,0.2)", flex: 1 }}>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.5rem", color: C.muted, letterSpacing: "0.1em" }}>COMMUNICATION_STATUS</div>
          <div style={{ fontFamily: "var(--font-display)", fontSize: "1.2rem", color: fillers < 5 ? C.teal : C.pink, marginTop: "0.5rem" }}>
            {fillers < 5 ? "SYNTACTIC_CLARITY_OPTIMAL" : "SYNTACTIC_NOISE_DETECTED"}
          </div>
        </div>
      </div>
    </ChartCard>
  );
}

// ─── STAT TILE ────────────────────────────────────────────────────────────────
function StatTile({ label, value, color, sub }: { label: string; value: string; color: string; sub?: string }) {
  return (
    <div className="stat-tile">
      <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.56rem", color: C.dim, letterSpacing: "0.13em", textTransform: "uppercase" }}>{label}</div>
      <div style={{ fontFamily: "'Syne', sans-serif", fontSize: "2rem", fontWeight: 900, color, lineHeight: 1, letterSpacing: "-0.03em" }}>{value}</div>
      {sub && <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "0.68rem", color: C.muted, marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

// ─── TRANSCRIPT ROW ───────────────────────────────────────────────────────────
function TranscriptRow({ entry, isStress, onJump }: { entry: any; isStress: boolean; onJump: (t: number) => void }) {
  const isAI = entry.speaker === "interviewer";
  return (
    <div
      className="tx-row"
      onClick={() => onJump(entry.time)}
      style={{
        display: "flex", gap: "0.9rem", padding: "0.9rem 1rem",
        background: isStress ? "rgba(251,113,133,0.05)" : "transparent",
        border: `1px solid ${isStress ? "rgba(251,113,133,0.18)" : "rgba(99,102,241,0.07)"}`,
        borderRadius: 12,
      }}
    >
      <div style={{
        fontFamily: "'DM Mono', monospace", fontSize: "0.62rem", color: C.cyan,
        whiteSpace: "nowrap", paddingTop: 3, width: 38, flexShrink: 0,
      }}>
        {String(Math.floor(entry.time / 60)).padStart(2, "0")}:{String(Math.floor(entry.time % 60)).padStart(2, "0")}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{
          fontFamily: "'DM Mono', monospace", fontSize: "0.55rem", fontWeight: 500,
          letterSpacing: "0.1em", color: isAI ? C.violet : C.cyan,
          marginBottom: "0.25rem", textTransform: "uppercase",
        }}>
          {isAI ? "AceIt AI" : "Candidate"}
        </div>
        <p style={{
          fontFamily: "'DM Sans', sans-serif", fontSize: "0.86rem",
          lineHeight: 1.6, color: isStress ? C.offwhite : C.muted, margin: 0,
        }}>
          {entry.text}
          {isStress && (
            <span style={{
              marginLeft: 9, fontSize: "0.54rem", padding: "0.15rem 0.45rem",
              background: "rgba(251,113,133,0.15)", border: "1px solid rgba(251,113,133,0.35)",
              borderRadius: 5, color: C.danger, fontFamily: "'DM Mono', monospace",
              fontWeight: 700, letterSpacing: "0.08em",
            }}>STRESS</span>
          )}
        </p>
      </div>
    </div>
  );
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────
export default function ReportPage() {
  const router = useRouter();
  const {
    biometrics = [], transcript = [], sessionId, skippedQuestions = [],
    aiCoachingReport, setAiCoachingReport, setBiometrics, setTranscript, reset,
  } = useInterviewStore();

  const videoRef = useRef<HTMLVideoElement>(null);
  const [activeTimestamp, setActiveTimestamp] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isFetchingReport, setIsFetchingReport] = useState(false);
  const [sessionDetails, setSessionDetails] = useState<any>(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => { setIsMounted(true); }, []);

  const searchParams = isMounted && typeof window !== "undefined"
    ? new URLSearchParams(window.location.search) : null;
  const urlSessionId = searchParams?.get("session_id");
  const autoSave = searchParams?.get("auto_save");

  useEffect(() => {
    const idToUse = sessionId || urlSessionId;
    if (idToUse && !aiCoachingReport && !isFetchingReport) {
      setIsFetchingReport(true);
      fetch(`/api/session/${idToUse}/data`)
        .then(res => res.json())
        .then(data => {
          if (data.report?.report_markdown) setAiCoachingReport(data.report.report_markdown);
          if (data.metadata) setSessionDetails(data.metadata);
          if (data.keyframes?.length > 0) {
            const mappedBio: any[] = [], mappedTx: any[] = [];
            data.keyframes.forEach((kf: any) => {
              if (kf.overall_confidence_score !== null || kf.gaze_score !== null) {
                mappedBio.push({
                  time: kf.timestamp_sec,
                  gazeScore: Math.round((kf.gaze_score ?? 0.8) * 100),
                  confidence: Math.round((kf.overall_confidence_score ?? 0.5) * 100),
                  fidgetIndex: Math.round((kf.fidget_index ?? 0.1) * 100),
                  fillerCount: kf.filler_words_count ?? 0,
                  tone: kf.sentiment_score ?? 0.5,
                  stressSpike: kf.severity === "critical",
                });
              }
              const cleanText = (txt: string) => txt.replace(/\[SCORE:\s*\d+\.?\d*\]/gi, "").trim();
              if (kf.interviewer_question) mappedTx.push({ time: kf.timestamp_sec, speaker: "interviewer", text: cleanText(kf.interviewer_question) });
              if (kf.associated_transcript) mappedTx.push({ time: kf.timestamp_sec, speaker: "user", text: kf.associated_transcript });
              if (kf.ai_response) mappedTx.push({ time: kf.timestamp_sec + 0.5, speaker: "interviewer", text: cleanText(kf.ai_response) });
            });
            mappedBio.sort((a, b) => a.time - b.time);
            mappedTx.sort((a, b) => a.time - b.time);
            setBiometrics(mappedBio);
            setTranscript(mappedTx);
          }
        })
        .catch(err => console.error("Failed to fetch session data", err))
        .finally(() => setIsFetchingReport(false));
    }
  }, [sessionId, urlSessionId, aiCoachingReport, setAiCoachingReport, setBiometrics, setTranscript, isFetchingReport]);

  const { user, isLoaded: isUserLoaded } = useUser();
  const { isSignedIn } = useAuth();
  const { openSignIn } = useClerk();

  const safeData = sessionDetails?.biometrics || (biometrics?.length > 0 ? biometrics : []);
  const txData = sessionDetails?.transcript || (transcript?.length > 0 ? transcript : []);

  const displayRole = sessionDetails?.role || (sessionId ? useInterviewStore.getState().role : "Interview");
  const displayCompany = sessionDetails?.company || (sessionId ? useInterviewStore.getState().company : "AceIt");
  const displayDate = sessionDetails?.date || new Date().toLocaleDateString();

  const avgGaze = safeData.length > 0 ? Math.round(safeData.reduce((s: number, d: any) => s + (d.gazeScore || 0), 0) / safeData.length) : 0;
  const avgConf = safeData.length > 0 ? Math.round(safeData.reduce((s: number, d: any) => s + (d.confidence || 0), 0) / safeData.length) : 0;
  const avgCalm = safeData.length > 0 ? Math.round(100 - safeData.reduce((s: number, d: any) => s + (d.fidgetIndex || 0), 0) / safeData.length) : 100;
  const overall = sessionDetails?.score ?? (sessionId ? Math.round(useInterviewStore.getState().pressureScore) : Math.round((avgGaze + avgConf + avgCalm) / 3));
  const spikeCount = safeData.filter((d: any) => d.stressSpike).length;
  const spikeTimestamps = new Set(safeData.filter((d: any) => d.stressSpike).map((d: any) => d.time));

  let parsedCompetencies: any[] = [];
  if (aiCoachingReport) {
    try {
      const match = aiCoachingReport.match(/```json\s*([\s\S]*?)\s*```/);
      if (match?.[1]) {
        const parsed = JSON.parse(match[1]);
        if (Array.isArray(parsed) && parsed.length > 0) {
          parsedCompetencies = parsed.map((sk: any, i: number) => ({ name: sk.name || `Skill ${i + 1}`, value: sk.value || 0 }));
        }
      }
    } catch (e) { console.warn("Could not parse AI skill matrix", e); }
  }

  const recommendation = overall >= 70 ? "Proceed to Next Round" : overall >= 50 ? "Under Review" : "Not Recommended";
  const recColor = overall >= 70 ? C.green : overall >= 50 ? C.cyan : C.danger;
  const scoreColor = overall >= 70 ? C.green : overall >= 50 ? C.warn : C.danger;

  const jumpToTime = (time: number) => {
    setActiveTimestamp(time);
    if (videoRef.current) { videoRef.current.currentTime = time; videoRef.current.play().catch(() => { }); }
    videoRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  const handleReset = () => { reset(); router.push("/interviewer-selection"); };
  const handleExport = () => window.print();
  const handleSave = async () => {
    if (!user) { openSignIn({ afterSignInUrl: "/report?auto_save=true" }); return; }
    setIsSaving(true);
    try {
      const res = await fetch("http://127.0.0.1:8080/api/save-session", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_id: sessionId || urlSessionId, user_id: user.id,
          role: displayRole, company: displayCompany, date: displayDate,
          score: overall, gaze: avgGaze, confidence: avgConf, composure: avgCalm, spikes: spikeCount,
        }),
      });
      if (res.ok) router.push("/dashboard");
      else alert("Failed to save session.");
    } finally { setIsSaving(false); }
  };

  useEffect(() => {
    if (autoSave === "true" && user && isUserLoaded && !isSaving && biometrics.length > 0) handleSave();
  }, [user, isUserLoaded, autoSave]);

  return (
    <div style={{ minHeight: "100vh", background: C.bg, position: "relative", overflowX: "hidden" }}>
      <style>{G}</style>
      <AmbientBg />

      <div style={{ position: "relative", zIndex: 1, maxWidth: 1340, margin: "0 auto", padding: "2.5rem 2rem 6rem" }}>

        {/* ── TOP NAV ── */}
        <nav style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "3rem", animation: "fadeIn 0.5s ease both" }}>
          <Link href="/" onClick={reset} style={{
            display: "inline-flex", alignItems: "center", gap: "0.5rem",
            fontFamily: "'DM Mono', monospace", fontSize: "0.64rem", letterSpacing: "0.1em",
            color: C.muted, textDecoration: "none", transition: "color 0.2s", textTransform: "uppercase",
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 5l-7 7 7 7" />
            </svg>
            Return to Base
          </Link>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <Chip color={C.violet}>AI Evaluation</Chip>
            <Chip color={C.cyan}>v2.0</Chip>
          </div>
        </nav>

        {/* ── HERO ── */}
        <header style={{ marginBottom: "3rem", animation: "fadeUp 0.65s ease both" }}>
          <div style={{
            fontFamily: "'DM Mono', monospace", fontSize: "0.62rem", letterSpacing: "0.18em",
            color: C.violet, marginBottom: "1rem", textTransform: "uppercase",
          }}>
            {displayCompany} · Interview Intelligence
          </div>

          <h1 style={{
            fontFamily: "'Syne', sans-serif", fontWeight: 900,
            fontSize: "clamp(2.4rem, 5.5vw, 4.5rem)",
            lineHeight: 1.0, letterSpacing: "-0.03em", color: C.white, margin: 0,
          }}>
            AI Interview<br />
            <span style={{
              background: `linear-gradient(120deg, ${C.cyan} 0%, ${C.violet} 55%, ${C.pink} 100%)`,
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
            }}>
              Evaluation Report
            </span>
          </h1>

          <div style={{ display: "flex", gap: "2rem", marginTop: "1.75rem", flexWrap: "wrap", alignItems: "center" }}>
            {[["Report Version", "v2.0"], ["Role", displayRole], ["Date", displayDate]].map(([k, v]) => (
              <div key={k} style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.57rem", color: C.dim, textTransform: "uppercase", letterSpacing: "0.1em" }}>{k}</span>
                <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "0.84rem", color: C.offwhite, fontWeight: 500 }}>{v}</span>
              </div>
            ))}
          </div>
        </header>

        {/* ── STAT TILES ── */}
        <div style={{
          display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "0.85rem",
          marginBottom: "1.75rem", animation: "fadeUp 0.65s 70ms ease both",
        }}>
          <StatTile label="Overall Score" value={safeData.length > 0 ? `${overall}` : "—"} color={scoreColor}
            sub={overall >= 70 ? "Strong performance" : overall >= 50 ? "Needs improvement" : "Below threshold"} />
          <StatTile label="Gaze Stability" value={`${avgGaze}%`} color={C.cyan} />
          <StatTile label="Vocal Confidence" value={`${avgConf}%`} color={C.violet} />
          <StatTile label="Composure Index" value={`${avgCalm}%`} color={C.cyan} />
          <StatTile label="Stress Events" value={`${spikeCount}`} color={spikeCount > 2 ? C.danger : spikeCount > 0 ? C.warn : C.green}
            sub={spikeCount > 2 ? "High stress detected" : spikeCount > 0 ? "Minor spikes" : "Clean session"} />
        </div>

        {/* ── RECOMMENDATION BANNER ── */}
        <div style={{
          background: `linear-gradient(135deg, ${recColor}10 0%, transparent 80%)`,
          border: `1px solid ${recColor}2e`,
          borderRadius: 14, padding: "1.1rem 1.75rem",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          marginBottom: "1.75rem", animation: "fadeUp 0.65s 120ms ease both",
          flexWrap: "wrap", gap: "0.75rem",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.9rem" }}>
            <div style={{ width: 10, height: 10, borderRadius: "50%", background: recColor, boxShadow: `0 0 14px ${recColor}` }} />
            <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: "1.05rem", color: recColor, letterSpacing: "-0.01em" }}>
              {recommendation}
            </span>
          </div>
          <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.6rem", color: C.dim }}>
            Analysis Status · COMPLETED
          </span>
        </div>

        {/* ── CHARTS ── */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1.5rem", marginBottom: "2.5rem" }}>
          <PerformanceTrendChart data={safeData} />
          <CompetencyRadar competencies={parsedCompetencies} />
          <ScoreComparisonChart overall={overall} />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "1.5rem", marginBottom: "2.5rem" }}>
          <CommunicationAnalysis biometrics={safeData} />
        </div>

        {/* ── SKIPPED QUESTIONS ── */}
        {skippedQuestions.length > 0 && (
          <div className="r-card" style={{ padding: "1.75rem", marginBottom: "1.75rem", animation: "fadeUp 0.6s 300ms ease both" }}>
            <CardHeader eye="Session Metrics" title="Skipped Questions" color={C.warn} />
            <div style={{ display: "flex", flexDirection: "column", gap: "0.7rem" }}>
              {skippedQuestions.map((q, i) => (
                <div key={i} style={{
                  display: "flex", gap: "1rem", alignItems: "flex-start",
                  padding: "0.8rem 1rem",
                  background: "rgba(251,191,36,0.04)",
                  border: "1px solid rgba(251,191,36,0.12)", borderRadius: 10,
                }}>
                  <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.6rem", color: C.warn, marginTop: 2, fontWeight: 700, flexShrink: 0 }}>
                    #{String(i + 1).padStart(2, "0")}
                  </div>
                  <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "0.88rem", color: C.muted, lineHeight: 1.6 }}>{q}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── AI COACHING REPORT ── */}
        <section style={{ marginBottom: "1.75rem", animation: "fadeUp 0.6s 360ms ease both" }}>
          {aiCoachingReport ? (
            <div className="r-card" style={{ padding: "1.75rem" }}>
              <CardHeader eye="AI Coach" title="Intelligence Analysis" color={C.cyan} />
              <IntelligenceReport content={aiCoachingReport} />
            </div>
          ) : isFetchingReport ? (
            <div className="r-card" style={{ padding: "5rem 2rem", display: "flex", flexDirection: "column", alignItems: "center", gap: "1.5rem" }}>
              <div style={{
                width: 48, height: 48,
                border: `2px solid rgba(99,102,241,0.1)`,
                borderTopColor: C.violet, borderRadius: "50%",
                animation: "spin 0.85s linear infinite",
              }} />
              <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: "1.05rem", color: C.white }}>
                Synchronising Neural Patterns
              </div>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.6rem", color: C.dim, letterSpacing: "0.1em" }}>
                Generating your personalised coaching report...
              </div>
            </div>
          ) : (
            <div className="r-card" style={{ padding: "5rem 2rem", textAlign: "center" }}>
              <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: "1.5rem", color: C.white, marginBottom: "0.75rem" }}>Intelligence Offline</div>
              <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "0.88rem", color: C.muted }}>Resume an interview session to generate your AI coaching analysis.</div>
            </div>
          )}
        </section>

        {/* ── TRANSCRIPT ── */}
        {txData.length > 0 && (
          <div className="r-card" style={{ padding: "1.75rem", marginBottom: "1.75rem", animation: "fadeUp 0.6s 420ms ease both" }}>
            <CardHeader eye="Session Logs" title="Conversation Record" color={C.violet} />
            <div style={{ maxHeight: 450, overflowY: "auto", display: "flex", flexDirection: "column", gap: "0.4rem", paddingRight: "0.35rem" }}>
              {txData.map((entry: any, i: number) => {
                const isStress = [...spikeTimestamps].some((t: any) => Math.abs(t - entry.time) < 8);
                return <TranscriptRow key={i} entry={entry} isStress={isStress} onJump={jumpToTime} />;
              })}
            </div>
          </div>
        )}

        {/* ── FOOTER ACTIONS BAR ── */}
        <div style={{
          background: C.navy, border: `1px solid rgba(99,102,241,0.13)`, borderRadius: 18,
          padding: "1.3rem 1.75rem", display: "flex", alignItems: "center",
          justifyContent: "space-between", flexWrap: "wrap", gap: "1rem",
          animation: "fadeUp 0.6s 480ms ease both",
        }}>
          <div style={{ display: "flex", gap: "2rem", flexWrap: "wrap" }}>
            {[["Analysis Type", "Technical Evaluation"], ["Date", displayDate]].map(([k, v]) => (
              <div key={k}>
                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.55rem", color: C.dim, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 2 }}>{k}</div>
                <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "0.84rem", color: C.offwhite, fontWeight: 500 }}>{v}</div>
              </div>
            ))}
          </div>

          <div style={{ display: "flex", gap: "0.65rem", flexWrap: "wrap" }}>
            <button onClick={handleReset} className="act-btn" style={{
              background: "transparent", borderColor: "rgba(196,206,238,0.1)", color: C.muted,
            }}>
              + New Interview
            </button>
            {!urlSessionId && (
              <button onClick={handleSave} disabled={isSaving} className="act-btn" style={{
                background: `linear-gradient(135deg, ${C.violetDeep}, ${C.violet})`,
                borderColor: "transparent", color: "#fff",
                boxShadow: "0 4px 22px rgba(99,102,241,0.35)",
                opacity: isSaving ? 0.7 : 1,
              }}>
                {isSaving ? "Syncing..." : "Save Session"}
              </button>
            )}
            <button onClick={handleExport} className="act-btn" style={{
              background: "transparent", borderColor: "rgba(34,211,238,0.22)", color: C.cyan,
            }}>
              Export Report
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}