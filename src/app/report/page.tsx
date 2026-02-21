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
  stressSpike: boolean;
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
export default function BiometricChart({ data, activeTimestamp, onChartClick }: BiometricChartProps) {
  const handleClick = (chartData: any) => {
    if (chartData?.activePayload?.[0] && onChartClick) {
      onChartClick(chartData.activePayload[0].payload.time);
    }
  };

  return (
    <div className="card" style={{ marginBottom: "2rem" }}>
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
        <ComposedChart data={data} onClick={handleClick} style={{ cursor: "pointer" }}>
          <defs>
            <linearGradient id="gazeGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--accent)" stopOpacity={0.15} />
              <stop offset="95%" stopColor="var(--accent)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
          <XAxis
            dataKey="time"
            tickFormatter={(v) => `${v}s`}
            tick={{ fill: "var(--muted)", fontSize: 11, fontFamily: "var(--font-mono)" }}
            axisLine={false} tickLine={false}
          />
          <YAxis
            domain={[0, 100]}
            tickFormatter={(v) => `${v}`}
            tick={{ fill: "var(--muted)", fontSize: 11, fontFamily: "var(--font-mono)" }}
            axisLine={false} tickLine={false}
          />
          <Tooltip content={<CustomTooltip />} />
          <Area type="monotone" dataKey="gazeScore" fill="url(#gazeGrad)" stroke="none" />
          <Line type="monotone" dataKey="gazeScore"   name="Gaze"       stroke="var(--accent)"  strokeWidth={2} dot={false} activeDot={{ r: 5, fill: "var(--accent)" }} />
          <Line type="monotone" dataKey="confidence"  name="Confidence" stroke="var(--accent2)" strokeWidth={2} dot={false} activeDot={{ r: 5, fill: "var(--accent2)" }} />
          <Line type="monotone" dataKey="fidgetIndex" name="Composure"  stroke="var(--success)" strokeWidth={2} dot={false} activeDot={{ r: 5, fill: "var(--success)" }} />

          {/* Stress spike markers */}
          {data.filter((d) => d.stressSpike).map((d) => (
            <ReferenceLine
              key={d.time} x={d.time}
              stroke="var(--danger)" strokeDasharray="4 3" strokeWidth={1.5}
              label={{ value: "⚠", fill: "var(--danger)", fontSize: 12, position: "top" }}
            />
          ))}

          {/* Active timestamp from transcript click */}
          {activeTimestamp != null && (
            <ReferenceLine x={activeTimestamp} stroke="rgba(255,255,255,0.5)" strokeWidth={2} />
          )}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}