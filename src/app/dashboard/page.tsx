"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { UserButton, useUser } from "@clerk/nextjs";


function scoreColor(score: number) {
  if (score >= 80) return "#00e096";
  if (score >= 65) return "#00e5ff";
  return "#ff4d6d";
}

function ScoreRing({ value, color, size = 52 }: { value: number; color: string; size?: number }) {
  const r = (size - 6) / 2;
  const circ = 2 * Math.PI * r;
  const fill = (value / 100) * circ;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#1e2a3a" strokeWidth="3" />
      <circle
        cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth="3"
        strokeDasharray={`${fill} ${circ}`} strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        style={{ transition: "stroke-dasharray 1s cubic-bezier(0.16,1,0.3,1)" }}
      />
      <text x={size / 2} y={size / 2 + 4} textAnchor="middle" fill={color}
        fontSize={size * 0.22} fontFamily="DM Mono, monospace" fontWeight="600">{value}</text>
    </svg>
  );
}

function SessionCard({ session, index }: { session: any; index: number }) {
  const color = scoreColor(session.score);
  return (
    <div
      style={{
        background: "#0e1420",
        border: "1px solid #1e2a3a",
        borderRadius: "16px",
        padding: "1.5rem",
        borderLeft: `3px solid ${color}`,
        cursor: "pointer",
        transition: "transform 0.2s ease, box-shadow 0.2s ease",
        animationDelay: `${index * 0.08}s`,
      }}
      className="session-card"
      onMouseEnter={e => {
        (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)";
        (e.currentTarget as HTMLElement).style.boxShadow = `0 12px 40px ${color}18`;
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
        (e.currentTarget as HTMLElement).style.boxShadow = "none";
      }}
    >
      {/* Top row */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.25rem" }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: "1rem", color: "#e8edf5", letterSpacing: "-0.02em", marginBottom: "0.2rem" }}>
            {session.role}
          </div>
          <div style={{ fontSize: "0.72rem", color: "#5a6a82", fontFamily: "DM Mono, monospace" }}>
            {session.company} · {session.date} · {session.duration}
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: "2rem", fontWeight: 800, color, lineHeight: 1 }}>{session.score}</div>
          <div style={{ fontSize: "0.6rem", color: "#5a6a82", fontFamily: "DM Mono, monospace", letterSpacing: "0.1em" }}>/100</div>
        </div>
      </div>

      {/* Metric rings */}
      <div style={{ display: "flex", gap: "1.5rem", marginBottom: "1.25rem" }}>
        {[
          { label: "GAZE", value: session.gaze, color: "#00e5ff" },
          { label: "CONF", value: session.confidence, color: "#7b61ff" },
          { label: "CALM", value: session.composure, color: "#00e096" },
        ].map(m => (
          <div key={m.label} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.3rem" }}>
            <ScoreRing value={m.value} color={m.color} size={48} />
            <span style={{ fontSize: "0.5rem", color: "#5a6a82", fontFamily: "DM Mono, monospace", letterSpacing: "0.12em" }}>{m.label}</span>
          </div>
        ))}
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center" }}>
          <div style={{ background: "rgba(255,77,109,0.08)", border: "1px solid rgba(255,77,109,0.2)", borderRadius: "6px", padding: "0.3rem 0.6rem", fontSize: "0.68rem", color: "#ff4d6d", fontFamily: "DM Mono, monospace" }}>
            {session.spikes} stress spike{session.spikes !== 1 ? "s" : ""}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <Link
          href={`/report?session_id=${session.id}`}
          style={{ fontSize: "0.75rem", fontFamily: "DM Mono, monospace", color: "#5a6a82", textDecoration: "none", display: "flex", alignItems: "center", gap: "0.3rem", transition: "color 0.15s ease" }}
          onMouseEnter={e => (e.currentTarget.style.color = "#00e5ff")}
          onMouseLeave={e => (e.currentTarget.style.color = "#5a6a82")}
        >
          View full report →
        </Link>
      </div>
    </div>
  );
}

function StatPill({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div style={{ background: "#0e1420", border: "1px solid #1e2a3a", borderRadius: "12px", padding: "1.25rem 1.5rem", display: "flex", flexDirection: "column", gap: "0.3rem" }}>
      <div style={{ fontSize: "0.6rem", fontFamily: "DM Mono, monospace", color: "#5a6a82", letterSpacing: "0.12em", textTransform: "uppercase" }}>{label}</div>
      <div style={{ fontSize: "1.8rem", fontWeight: 800, color, lineHeight: 1 }}>{value}</div>
    </div>
  );
}

export default function DashboardPage() {
  const { user, isLoaded: isUserLoaded } = useUser();
  const [mounted, setMounted] = useState(false);
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (user?.id) {
      fetch(`http://127.0.0.1:8080/api/get-sessions?user_id=${user.id}`)
        .then(res => res.json())
        .then(data => {
          setSessions(data.data || []);
          setLoading(false);
        })
        .catch(err => {
          console.error("Error fetching sessions:", err);
          setLoading(false);
        });
    } else if (isUserLoaded && !user) {
      setLoading(false);
    }
  }, [user, isUserLoaded]);

  const displaySessions = sessions.length > 0 ? sessions : [];
  const avgScore = displaySessions.length > 0 ? Math.round(displaySessions.reduce((s, r) => s + r.score, 0) / displaySessions.length) : 0;
  const bestScore = displaySessions.length > 0 ? Math.max(...displaySessions.map(r => r.score)) : 0;
  const totalSessions = displaySessions.length;

  const avgGaze = displaySessions.length > 0 ? Math.round(displaySessions.reduce((s, r) => s + r.gaze, 0) / displaySessions.length) : 0;
  const avgConf = displaySessions.length > 0 ? Math.round(displaySessions.reduce((s, r) => s + r.confidence, 0) / displaySessions.length) : 0;
  const avgCalm = displaySessions.length > 0 ? Math.round(displaySessions.reduce((s, r) => s + r.composure, 0) / displaySessions.length) : 0;

  const firstName = user?.firstName ?? "there";

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=DM+Mono:wght@400;500&display=swap');
        :root {
          --display: 'Syne', sans-serif;
          --mono: 'DM Mono', monospace;
          --bg: #080b12;
          --surface: #0e1420;
          --border: #1e2a3a;
          --cyan: #00e5ff;
          --purple: #7b61ff;
          --green: #00e096;
          --pink: #ff4d6d;
          --text: #e8edf5;
          --muted: #5a6a82;
        }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: var(--bg); color: var(--text); font-family: 'Syne', sans-serif; overflow-x: hidden; }
        body::before {
          content: "";
          position: fixed; inset: 0;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E");
          pointer-events: none; z-index: 999; opacity: 0.35;
        }

        .fade-up {
          opacity: 0;
          transform: translateY(16px);
          animation: fadeUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        @keyframes fadeUp {
          to { opacity: 1; transform: translateY(0); }
        }

        .session-card {
          opacity: 0;
          animation: fadeUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        .nav-link {
          color: var(--muted); text-decoration: none; font-size: 0.8rem;
          font-weight: 500; transition: color 0.15s ease;
          font-family: 'DM Mono', monospace; letter-spacing: 0.04em;
        }
        .nav-link:hover { color: var(--cyan); }

        .btn-primary {
          display: inline-flex; align-items: center; gap: 0.5rem;
          background: var(--cyan); color: var(--bg);
          font-family: 'Syne', sans-serif; font-weight: 700; font-size: 0.9rem;
          padding: 0.75rem 1.5rem; border-radius: 8px; border: none;
          cursor: pointer; text-decoration: none; letter-spacing: 0.02em;
          transition: all 0.2s ease; box-shadow: 0 0 24px rgba(0,229,255,0.2);
          white-space: nowrap;
        }
        .btn-primary:hover { filter: brightness(1.1); transform: translateY(-2px); box-shadow: 0 8px 32px rgba(0,229,255,0.35); }
      `}</style>

      {/* ── NAV ── */}
      <nav style={{
        position: "sticky", top: 0, zIndex: 100,
        background: "rgba(8,11,18,0.85)", backdropFilter: "blur(16px)",
        borderBottom: "1px solid #1e2a3a", padding: "0 2.5rem",
        height: "64px", display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <Link href="/" style={{ fontWeight: 800, fontSize: "1.2rem", letterSpacing: "-0.03em", color: "#e8edf5", textDecoration: "none" }}>
          Ace<span style={{ color: "var(--cyan)" }}>It</span>
        </Link>
        <div style={{ display: "flex", gap: "2rem", alignItems: "center" }}>
          <span style={{ fontSize: "0.72rem", fontFamily: "DM Mono, monospace", color: "#5a6a82", letterSpacing: "0.06em" }}>DASHBOARD</span>
          <Link href="/interviewer-selection" className="btn-primary" style={{ fontSize: "0.82rem", padding: "0.55rem 1.1rem" }}>
            + New Interview
          </Link>
          <UserButton afterSignOutUrl="/" />
        </div>
      </nav>

      <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "3rem 2rem 6rem" }}>

        {/* ── GREETING ── */}
        <div className="fade-up" style={{ marginBottom: "3rem", animationDelay: "0.05s" }}>
          <div style={{ fontSize: "0.65rem", fontFamily: "DM Mono, monospace", color: "var(--cyan)", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: "0.75rem" }}>
            ◆ Welcome back
          </div>
          <h1 style={{ fontSize: "clamp(2rem, 4vw, 3rem)", fontWeight: 800, letterSpacing: "-0.04em", lineHeight: 1.1, marginBottom: "0.5rem" }}>
            Hey, {firstName}.
          </h1>
          <p style={{ fontSize: "0.9rem", color: "#5a6a82", fontFamily: "DM Mono, monospace" }}>
            Here's how your interview prep is going.
          </p>
        </div>

        {/* ── STATS ROW ── */}
        <div className="fade-up" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "1rem", marginBottom: "3rem", animationDelay: "0.1s" }}>
          <StatPill label="Avg Performance" value={`${avgScore}%`} color="var(--cyan)" />
          <StatPill label="Lifetime Gaze" value={`${avgGaze}%`} color="var(--cyan)" />
          <StatPill label="Lifetime Conf" value={`${avgConf}%`} color="var(--purple)" />
          <StatPill label="Lifetime Calm" value={`${avgCalm}%`} color="var(--green)" />
        </div>

        {/* ── START NEW CTA ── */}
        <div className="fade-up" style={{
          background: "linear-gradient(135deg, rgba(0,229,255,0.06), rgba(123,97,255,0.06))",
          border: "1px solid rgba(0,229,255,0.15)", borderRadius: "16px",
          padding: "2rem 2.5rem", marginBottom: "3rem",
          display: "flex", alignItems: "center", justifyContent: "space-between", gap: "2rem",
          animationDelay: "0.15s",
        }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: "1.1rem", color: "#e8edf5", marginBottom: "0.4rem" }}>
              Ready for your next session?
            </div>
            <p style={{ fontSize: "0.82rem", color: "#5a6a82", fontFamily: "DM Mono, monospace", lineHeight: 1.6 }}>
              Upload a new resume or job description and start practicing in seconds.
            </p>
          </div>
          <Link href="/interviewer-selection" className="btn-primary">
            Start Interview →
          </Link>
        </div>

        {/* ── PAST SESSIONS ── */}
        <div className="fade-up" style={{ animationDelay: "0.2s" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
            <div>
              <div style={{ fontSize: "0.65rem", fontFamily: "DM Mono, monospace", color: "var(--muted)", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: "0.3rem" }}>
                Past Sessions
              </div>
              <h2 style={{ fontSize: "1.3rem", fontWeight: 800, letterSpacing: "-0.03em" }}>
                {totalSessions} interview{totalSessions !== 1 ? "s" : ""} completed
              </h2>
            </div>
          </div>

          {loading ? (
            <div style={{ textAlign: "center", padding: "5rem 2rem" }}>
              <div style={{ fontSize: "0.85rem", color: "#5a6a82", fontFamily: "DM Mono, monospace" }}>
                Loading your sessions...
              </div>
            </div>
          ) : displaySessions.length === 0 ? (
            <div style={{ textAlign: "center", padding: "5rem 2rem", border: "1px dashed #1e2a3a", borderRadius: "16px" }}>
              <div style={{ fontSize: "0.85rem", color: "#5a6a82", fontFamily: "DM Mono, monospace" }}>
                No sessions yet — start your first interview above.
              </div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {displaySessions.map((session, i) => (
                <SessionCard key={session.id} session={session} index={i} />
              ))}
            </div>
          )}
        </div>

      </div>
    </>
  );
}