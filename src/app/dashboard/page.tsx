// "use client";
// import { useEffect, useState } from "react";
// import Link from "next/link";
// import { UserButton, useUser } from "@clerk/nextjs";


// function scoreColor(score: number) {
//   if (score >= 80) return "#00e096";
//   if (score >= 65) return "#00e5ff";
//   return "#ff4d6d";
// }

// function ScoreRing({ value, color, size = 52 }: { value: number; color: string; size?: number }) {
//   const r = (size - 6) / 2;
//   const circ = 2 * Math.PI * r;
//   const fill = (value / 100) * circ;
//   return (
//     <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
//       <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#1e2a3a" strokeWidth="3" />
//       <circle
//         cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth="3"
//         strokeDasharray={`${fill} ${circ}`} strokeLinecap="round"
//         transform={`rotate(-90 ${size / 2} ${size / 2})`}
//         style={{ transition: "stroke-dasharray 1s cubic-bezier(0.16,1,0.3,1)" }}
//       />
//       <text x={size / 2} y={size / 2 + 4} textAnchor="middle" fill={color}
//         fontSize={size * 0.22} fontFamily="DM Mono, monospace" fontWeight="600">{value}</text>
//     </svg>
//   );
// }

// function SessionCard({ session, index }: { session: any; index: number }) {
//   const color = scoreColor(session.score);
//   return (
//     <div
//       style={{
//         background: "#0e1420",
//         border: "1px solid #1e2a3a",
//         borderRadius: "16px",
//         padding: "1.5rem",
//         borderLeft: `3px solid ${color}`,
//         cursor: "pointer",
//         transition: "transform 0.2s ease, box-shadow 0.2s ease",
//         animationDelay: `${index * 0.08}s`,
//       }}
//       className="session-card"
//       onMouseEnter={e => {
//         (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)";
//         (e.currentTarget as HTMLElement).style.boxShadow = `0 12px 40px ${color}18`;
//       }}
//       onMouseLeave={e => {
//         (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
//         (e.currentTarget as HTMLElement).style.boxShadow = "none";
//       }}
//     >
//       {/* Top row */}
//       <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.25rem" }}>
//         <div>
//           <div style={{ fontWeight: 700, fontSize: "1rem", color: "#e8edf5", letterSpacing: "-0.02em", marginBottom: "0.2rem" }}>
//             {session.role}
//           </div>
//           <div style={{ fontSize: "0.72rem", color: "#5a6a82", fontFamily: "DM Mono, monospace" }}>
//             {session.company} · {session.date} · {session.duration}
//           </div>
//         </div>
//         <div style={{ textAlign: "right" }}>
//           <div style={{ fontSize: "2rem", fontWeight: 800, color, lineHeight: 1 }}>{session.score}</div>
//           <div style={{ fontSize: "0.6rem", color: "#5a6a82", fontFamily: "DM Mono, monospace", letterSpacing: "0.1em" }}>/100</div>
//         </div>
//       </div>

//       {/* Metric rings */}
//       <div style={{ display: "flex", gap: "1.5rem", marginBottom: "1.25rem" }}>
//         {[
//           { label: "GAZE", value: session.gaze, color: "#00e5ff" },
//           { label: "CONF", value: session.confidence, color: "#7b61ff" },
//           { label: "CALM", value: session.composure, color: "#00e096" },
//         ].map(m => (
//           <div key={m.label} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.3rem" }}>
//             <ScoreRing value={m.value} color={m.color} size={48} />
//             <span style={{ fontSize: "0.5rem", color: "#5a6a82", fontFamily: "DM Mono, monospace", letterSpacing: "0.12em" }}>{m.label}</span>
//           </div>
//         ))}
//         <div style={{ marginLeft: "auto", display: "flex", alignItems: "center" }}>
//           <div style={{ background: "rgba(255,77,109,0.08)", border: "1px solid rgba(255,77,109,0.2)", borderRadius: "6px", padding: "0.3rem 0.6rem", fontSize: "0.68rem", color: "#ff4d6d", fontFamily: "DM Mono, monospace" }}>
//             {session.spikes} stress spike{session.spikes !== 1 ? "s" : ""}
//           </div>
//         </div>
//       </div>

//       {/* Footer */}
//       <div style={{ display: "flex", justifyContent: "flex-end" }}>
//         <Link
//           href={`/report?session_id=${session.id}`}
//           style={{ fontSize: "0.75rem", fontFamily: "DM Mono, monospace", color: "#5a6a82", textDecoration: "none", display: "flex", alignItems: "center", gap: "0.3rem", transition: "color 0.15s ease" }}
//           onMouseEnter={e => (e.currentTarget.style.color = "#00e5ff")}
//           onMouseLeave={e => (e.currentTarget.style.color = "#5a6a82")}
//         >
//           View full report →
//         </Link>
//       </div>
//     </div>
//   );
// }

// function StatPill({ label, value, color }: { label: string; value: string; color: string }) {
//   return (
//     <div style={{ background: "#0e1420", border: "1px solid #1e2a3a", borderRadius: "12px", padding: "1.25rem 1.5rem", display: "flex", flexDirection: "column", gap: "0.3rem" }}>
//       <div style={{ fontSize: "0.6rem", fontFamily: "DM Mono, monospace", color: "#5a6a82", letterSpacing: "0.12em", textTransform: "uppercase" }}>{label}</div>
//       <div style={{ fontSize: "1.8rem", fontWeight: 800, color, lineHeight: 1 }}>{value}</div>
//     </div>
//   );
// }

// export default function DashboardPage() {
//   const { user, isLoaded: isUserLoaded } = useUser();
//   const [mounted, setMounted] = useState(false);
//   const [sessions, setSessions] = useState<any[]>([]);
//   const [loading, setLoading] = useState(true);

//   useEffect(() => { setMounted(true); }, []);

//   useEffect(() => {
//     if (user?.id) {
//       fetch(`http://127.0.0.1:8080/api/get-sessions?user_id=${user.id}`)
//         .then(res => res.json())
//         .then(data => {
//           setSessions(data.data || []);
//           setLoading(false);
//         })
//         .catch(err => {
//           console.error("Error fetching sessions:", err);
//           setLoading(false);
//         });
//     } else if (isUserLoaded && !user) {
//       setLoading(false);
//     }
//   }, [user, isUserLoaded]);

//   const displaySessions = sessions.length > 0 ? sessions : [];
//   const avgScore = displaySessions.length > 0 ? Math.round(displaySessions.reduce((s, r) => s + r.score, 0) / displaySessions.length) : 0;
//   const bestScore = displaySessions.length > 0 ? Math.max(...displaySessions.map(r => r.score)) : 0;
//   const totalSessions = displaySessions.length;

//   const avgGaze = displaySessions.length > 0 ? Math.round(displaySessions.reduce((s, r) => s + r.gaze, 0) / displaySessions.length) : 0;
//   const avgConf = displaySessions.length > 0 ? Math.round(displaySessions.reduce((s, r) => s + r.confidence, 0) / displaySessions.length) : 0;
//   const avgCalm = displaySessions.length > 0 ? Math.round(displaySessions.reduce((s, r) => s + r.composure, 0) / displaySessions.length) : 0;

//   const firstName = user?.firstName ?? "there";

//   return (
//     <>
//       <style>{`
//         @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=DM+Mono:wght@400;500&display=swap');
//         :root {
//           --display: 'Syne', sans-serif;
//           --mono: 'DM Mono', monospace;
//           --bg: #080b12;
//           --surface: #0e1420;
//           --border: #1e2a3a;
//           --cyan: #00e5ff;
//           --purple: #7b61ff;
//           --green: #00e096;
//           --pink: #ff4d6d;
//           --text: #e8edf5;
//           --muted: #5a6a82;
//         }
//         * { box-sizing: border-box; margin: 0; padding: 0; }
//         body { background: var(--bg); color: var(--text); font-family: 'Syne', sans-serif; overflow-x: hidden; }
//         body::before {
//           content: "";
//           position: fixed; inset: 0;
//           background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E");
//           pointer-events: none; z-index: 999; opacity: 0.35;
//         }

//         .fade-up {
//           opacity: 0;
//           transform: translateY(16px);
//           animation: fadeUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
//         }
//         @keyframes fadeUp {
//           to { opacity: 1; transform: translateY(0); }
//         }

//         .session-card {
//           opacity: 0;
//           animation: fadeUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
//         }

//         .nav-link {
//           color: var(--muted); text-decoration: none; font-size: 0.8rem;
//           font-weight: 500; transition: color 0.15s ease;
//           font-family: 'DM Mono', monospace; letter-spacing: 0.04em;
//         }
//         .nav-link:hover { color: var(--cyan); }

//         .btn-primary {
//           display: inline-flex; align-items: center; gap: 0.5rem;
//           background: var(--cyan); color: var(--bg);
//           font-family: 'Syne', sans-serif; font-weight: 700; font-size: 0.9rem;
//           padding: 0.75rem 1.5rem; border-radius: 8px; border: none;
//           cursor: pointer; text-decoration: none; letter-spacing: 0.02em;
//           transition: all 0.2s ease; box-shadow: 0 0 24px rgba(0,229,255,0.2);
//           white-space: nowrap;
//         }
//         .btn-primary:hover { filter: brightness(1.1); transform: translateY(-2px); box-shadow: 0 8px 32px rgba(0,229,255,0.35); }
//       `}</style>

//       {/* ── NAV ── */}
//       <nav style={{
//         position: "sticky", top: 0, zIndex: 100,
//         background: "rgba(8,11,18,0.85)", backdropFilter: "blur(16px)",
//         borderBottom: "1px solid #1e2a3a", padding: "0 2.5rem",
//         height: "64px", display: "flex", alignItems: "center", justifyContent: "space-between",
//       }}>
//         <Link href="/" style={{ fontWeight: 800, fontSize: "1.2rem", letterSpacing: "-0.03em", color: "#e8edf5", textDecoration: "none" }}>
//           Ace<span style={{ color: "var(--cyan)" }}>It</span>
//         </Link>
//         <div style={{ display: "flex", gap: "2rem", alignItems: "center" }}>
//           <span style={{ fontSize: "0.72rem", fontFamily: "DM Mono, monospace", color: "#5a6a82", letterSpacing: "0.06em" }}>DASHBOARD</span>
//           <Link href="/interviewer-selection" className="btn-primary" style={{ fontSize: "0.82rem", padding: "0.55rem 1.1rem" }}>
//             + New Interview
//           </Link>
//           <UserButton afterSignOutUrl="/" />
//         </div>
//       </nav>

//       <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "3rem 2rem 6rem" }}>

//         {/* ── GREETING ── */}
//         <div className="fade-up" style={{ marginBottom: "3rem", animationDelay: "0.05s" }}>
//           <div style={{ fontSize: "0.65rem", fontFamily: "DM Mono, monospace", color: "var(--cyan)", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: "0.75rem" }}>
//             ◆ Welcome back
//           </div>
//           <h1 style={{ fontSize: "clamp(2rem, 4vw, 3rem)", fontWeight: 800, letterSpacing: "-0.04em", lineHeight: 1.1, marginBottom: "0.5rem" }}>
//             Hey, {firstName}.
//           </h1>
//           <p style={{ fontSize: "0.9rem", color: "#5a6a82", fontFamily: "DM Mono, monospace" }}>
//             Here's how your interview prep is going.
//           </p>
//         </div>

//         {/* ── STATS ROW ── */}
//         <div className="fade-up" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "1rem", marginBottom: "3rem", animationDelay: "0.1s" }}>
//           <StatPill label="Avg Performance" value={`${avgScore}%`} color="var(--cyan)" />
//           <StatPill label="Lifetime Gaze" value={`${avgGaze}%`} color="var(--cyan)" />
//           <StatPill label="Lifetime Conf" value={`${avgConf}%`} color="var(--purple)" />
//           <StatPill label="Lifetime Calm" value={`${avgCalm}%`} color="var(--green)" />
//         </div>

//         {/* ── START NEW CTA ── */}
//         <div className="fade-up" style={{
//           background: "linear-gradient(135deg, rgba(0,229,255,0.06), rgba(123,97,255,0.06))",
//           border: "1px solid rgba(0,229,255,0.15)", borderRadius: "16px",
//           padding: "2rem 2.5rem", marginBottom: "3rem",
//           display: "flex", alignItems: "center", justifyContent: "space-between", gap: "2rem",
//           animationDelay: "0.15s",
//         }}>
//           <div>
//             <div style={{ fontWeight: 700, fontSize: "1.1rem", color: "#e8edf5", marginBottom: "0.4rem" }}>
//               Ready for your next session?
//             </div>
//             <p style={{ fontSize: "0.82rem", color: "#5a6a82", fontFamily: "DM Mono, monospace", lineHeight: 1.6 }}>
//               Upload a new resume or job description and start practicing in seconds.
//             </p>
//           </div>
//           <Link href="/interviewer-selection" className="btn-primary">
//             Start Interview →
//           </Link>
//         </div>

//         {/* ── PAST SESSIONS ── */}
//         <div className="fade-up" style={{ animationDelay: "0.2s" }}>
//           <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
//             <div>
//               <div style={{ fontSize: "0.65rem", fontFamily: "DM Mono, monospace", color: "var(--muted)", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: "0.3rem" }}>
//                 Past Sessions
//               </div>
//               <h2 style={{ fontSize: "1.3rem", fontWeight: 800, letterSpacing: "-0.03em" }}>
//                 {totalSessions} interview{totalSessions !== 1 ? "s" : ""} completed
//               </h2>
//             </div>
//           </div>

//           {loading ? (
//             <div style={{ textAlign: "center", padding: "5rem 2rem" }}>
//               <div style={{ fontSize: "0.85rem", color: "#5a6a82", fontFamily: "DM Mono, monospace" }}>
//                 Loading your sessions...
//               </div>
//             </div>
//           ) : displaySessions.length === 0 ? (
//             <div style={{ textAlign: "center", padding: "5rem 2rem", border: "1px dashed #1e2a3a", borderRadius: "16px" }}>
//               <div style={{ fontSize: "0.85rem", color: "#5a6a82", fontFamily: "DM Mono, monospace" }}>
//                 No sessions yet — start your first interview above.
//               </div>
//             </div>
//           ) : (
//             <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
//               {displaySessions.map((session, i) => (
//                 <SessionCard key={session.id} session={session} index={i} />
//               ))}
//             </div>
//           )}
//         </div>

//       </div>
//     </>
//   );
// }
"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { UserButton, useUser } from "@clerk/nextjs";

function scoreColor(score: number) {
  if (score >= 80) return "#2de6a4";
  if (score >= 65) return "#5fc8ff";
  return "#ff5fa0";
}

function ScoreRing({ value, color, size = 52 }: { value: number; color: string; size?: number }) {
  const r = (size - 6) / 2;
  const circ = 2 * Math.PI * r;
  const fill = (value / 100) * circ;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="3" />
      <circle
        cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth="3"
        strokeDasharray={`${fill} ${circ}`} strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        style={{ transition: "stroke-dasharray 1s cubic-bezier(0.16,1,0.3,1)", filter: `drop-shadow(0 0 4px ${color}99)` }}
      />
      <text x={size / 2} y={size / 2 + 4} textAnchor="middle" fill={color}
        fontSize={size * 0.22} fontFamily="IBM Plex Mono, monospace" fontWeight="600">{value}</text>
    </svg>
  );
}

function SessionCard({ session, index }: { session: any; index: number }) {
  const color = scoreColor(session.score);
  const scoreLabel = session.score >= 80 ? "Strong" : session.score >= 65 ? "Good" : "Needs Work";

  return (
    <div
      className="session-card"
      style={{ animationDelay: `${index * 0.07}s` }}
      onMouseEnter={e => {
        const el = e.currentTarget as HTMLElement;
        el.style.transform = "translateY(-3px)";
        el.style.boxShadow = `0 20px 60px ${color}15`;
        el.style.borderColor = `${color}30`;
      }}
      onMouseLeave={e => {
        const el = e.currentTarget as HTMLElement;
        el.style.transform = "translateY(0)";
        el.style.boxShadow = "none";
        el.style.borderColor = "rgba(255,255,255,0.07)";
      }}
    >
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "1px", background: `linear-gradient(90deg, transparent, ${color}60, transparent)` }} />

      {/* Top row */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.5rem" }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 800, fontSize: "1.05rem", color: "#e8edf5", letterSpacing: "-0.03em", marginBottom: "0.3rem", fontFamily: "var(--display)" }}>
            {session.role}
          </div>
          <div style={{ fontSize: "0.68rem", color: "#3a4a62", fontFamily: "var(--mono)", letterSpacing: "0.04em" }}>
            {session.company} · {session.date} · {session.duration}
          </div>
        </div>
        <div style={{ textAlign: "right", flexShrink: 0, marginLeft: "1.5rem" }}>
          <div style={{ fontSize: "2.4rem", fontWeight: 900, color, lineHeight: 1, letterSpacing: "-0.04em", fontFamily: "var(--display)", textShadow: `0 0 30px ${color}40` }}>
            {session.score}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", justifyContent: "flex-end", marginTop: "0.25rem" }}>
            <span style={{ fontSize: "0.52rem", color: "#2a3a52", fontFamily: "var(--mono)", letterSpacing: "0.1em" }}>/100</span>
            <span style={{ fontSize: "0.52rem", color, fontFamily: "var(--mono)", letterSpacing: "0.08em", background: `${color}12`, border: `1px solid ${color}25`, padding: "0.1rem 0.45rem", borderRadius: "4px" }}>{scoreLabel}</span>
          </div>
        </div>
      </div>

      <div style={{ height: "1px", background: "rgba(255,255,255,0.04)", marginBottom: "1.25rem" }} />

      {/* Metrics + actions */}
      <div style={{ display: "flex", gap: "1.5rem", alignItems: "center" }}>
        {[
          { label: "GAZE", value: session.gaze, color: "#5fc8ff" },
          { label: "CONF", value: session.confidence, color: "#9b6fff" },
          { label: "CALM", value: session.composure, color: "#2de6a4" },
        ].map(m => (
          <div key={m.label} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.35rem" }}>
            <ScoreRing value={m.value} color={m.color} size={48} />
            <span style={{ fontSize: "0.48rem", color: "#2a3a52", fontFamily: "var(--mono)", letterSpacing: "0.14em" }}>{m.label}</span>
          </div>
        ))}

        <div style={{ marginLeft: "auto", display: "flex", flexDirection: "column", gap: "0.5rem", alignItems: "flex-end" }}>
          <div style={{ background: "rgba(255,95,160,0.06)", border: "1px solid rgba(255,95,160,0.18)", borderRadius: "8px", padding: "0.3rem 0.75rem", fontSize: "0.62rem", color: "#ff5fa0", fontFamily: "var(--mono)" }}>
            {session.spikes} stress spike{session.spikes !== 1 ? "s" : ""}
          </div>
          <Link
            href={`/report?session_id=${session.id}`}
            style={{ fontSize: "0.68rem", fontFamily: "var(--mono)", color: "#2a3a52", textDecoration: "none", display: "flex", alignItems: "center", gap: "0.3rem", transition: "color 0.15s ease" }}
            onMouseEnter={e => (e.currentTarget.style.color = "#5fc8ff")}
            onMouseLeave={e => (e.currentTarget.style.color = "#2a3a52")}
          >
            View report →
          </Link>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, color, sub }: { label: string; value: string; color: string; sub?: string }) {
  return (
    <div className="stat-card">
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "1px", background: `linear-gradient(90deg, transparent, ${color}50, transparent)` }} />
      <div style={{ fontSize: "0.56rem", fontFamily: "var(--mono)", color: "#1a2a3a", letterSpacing: "0.16em", textTransform: "uppercase", marginBottom: "0.75rem" }}>{label}</div>
      <div style={{ fontSize: "2rem", fontWeight: 900, color, lineHeight: 1, letterSpacing: "-0.04em", fontFamily: "var(--display)", textShadow: `0 0 24px ${color}35` }}>{value}</div>
      {sub && <div style={{ fontSize: "0.58rem", color: "#1a2a3a", fontFamily: "var(--mono)", marginTop: "0.4rem" }}>{sub}</div>}
    </div>
  );
}

export default function DashboardPage() {
  const { user, isLoaded: isUserLoaded } = useUser();
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.id) {
      fetch(`http://127.0.0.1:8080/api/get-sessions?user_id=${user.id}`)
        .then(res => res.json())
        .then(data => { setSessions(data.data || []); setLoading(false); })
        .catch(() => setLoading(false));
    } else if (isUserLoaded && !user) {
      setLoading(false);
    }
  }, [user, isUserLoaded]);

  const ds = sessions;
  const avg = (key: string) => ds.length > 0 ? Math.round(ds.reduce((s: number, r: any) => s + r[key], 0) / ds.length) : 0;
  const avgScore = avg("score");
  const bestScore = ds.length > 0 ? Math.max(...ds.map((r: any) => r.score)) : 0;
  const avgGaze = avg("gaze");
  const avgConf = avg("confidence");
  const avgCalm = avg("composure");
  const firstName = user?.firstName ?? "there";
  const trend = ds.length >= 2 ? ds[0].score - ds[1].score : null;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800;900&family=IBM+Plex+Mono:wght@400;500&display=swap');

        :root {
          --display: 'Outfit', sans-serif;
          --mono: 'IBM Plex Mono', monospace;
          --bg: #060810;
          --cyan: #5fc8ff;
          --purple: #9b6fff;
          --green: #2de6a4;
          --pink: #ff5fa0;
          --text: #e8edf5;
        }

        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: var(--bg); color: var(--text); font-family: var(--display); overflow-x: hidden; }

        body::before {
          content: ""; position: fixed; inset: 0;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E");
          pointer-events: none; z-index: 999; opacity: 0.28;
        }

        body::after {
          content: ""; position: fixed; inset: 0;
          background:
            radial-gradient(ellipse 50% 40% at 80% 10%, rgba(155,111,255,0.05) 0%, transparent 60%),
            radial-gradient(ellipse 40% 35% at 10% 80%, rgba(95,200,255,0.04) 0%, transparent 60%);
          pointer-events: none; z-index: 0;
        }

        @keyframes fadeUp { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
        @keyframes blink { 0%,100% { opacity:1; } 50% { opacity:0.2; } }

        .fade-up { opacity:0; animation: fadeUp 0.65s cubic-bezier(0.16,1,0.3,1) forwards; }

        .session-card {
          opacity: 0;
          position: relative; overflow: hidden;
          background: rgba(255,255,255,0.02);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 20px; padding: 1.75rem;
          cursor: pointer;
          transition: transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease;
          animation: fadeUp 0.55s cubic-bezier(0.16,1,0.3,1) forwards;
        }

        .stat-card {
          position: relative; overflow: hidden;
          background: rgba(255,255,255,0.02);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 20px; padding: 1.5rem 1.75rem;
        }

        .nav-link {
          color: #2a3a52; text-decoration: none; font-size: 0.78rem;
          font-weight: 500; transition: color 0.15s ease;
          font-family: var(--mono); letter-spacing: 0.05em;
        }
        .nav-link:hover { color: var(--cyan); }

        .btn-primary {
          display: inline-flex; align-items: center; gap: 0.5rem;
          background: linear-gradient(135deg, #5fc8ff, #9b6fff);
          color: #060810; font-family: var(--display); font-weight: 800; font-size: 0.88rem;
          padding: 0.75rem 1.5rem; border-radius: 10px; border: none;
          cursor: pointer; text-decoration: none; letter-spacing: -0.01em;
          transition: all 0.2s ease;
          box-shadow: 0 0 28px rgba(95,200,255,0.18), 0 0 60px rgba(155,111,255,0.1);
          white-space: nowrap;
        }
        .btn-primary:hover { transform: translateY(-2px); box-shadow: 0 8px 36px rgba(95,200,255,0.28); filter: brightness(1.05); }

        .grad-text {
          background: linear-gradient(135deg, #5fc8ff 0%, #9b6fff 60%, #ff5fa0 100%);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
        }

        .sec-label {
          font-size: 0.56rem; font-family: var(--mono); letter-spacing: 0.18em;
          text-transform: uppercase; color: #1a2a3a; margin-bottom: 0.5rem;
          display: flex; align-items: center; gap: 0.5rem;
        }
        .sec-label::before { content: ""; display: block; width: 16px; height: 1px; background: linear-gradient(90deg, var(--cyan), transparent); }
      `}</style>

      {/* ── NAV ── */}
      <nav style={{
        position: "sticky", top: 0, zIndex: 100,
        background: "rgba(6,8,16,0.88)", backdropFilter: "blur(20px) saturate(1.5)",
        borderBottom: "1px solid rgba(255,255,255,0.05)",
        padding: "0 3rem", height: "68px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <Link href="/" style={{ fontWeight: 900, fontSize: "1.3rem", letterSpacing: "-0.04em", textDecoration: "none", fontFamily: "var(--display)" }}>
          Ace<span className="grad-text">It</span>
        </Link>
        <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
          <div style={{ fontSize: "0.58rem", fontFamily: "var(--mono)", color: "#1a2a3a", letterSpacing: "0.18em", marginRight: "0.75rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <span style={{ width: "4px", height: "4px", borderRadius: "50%", background: "#5fc8ff", display: "inline-block", animation: "blink 2s ease-in-out infinite" }} />
            DASHBOARD
          </div>
          <Link href="/interviewer-selection" className="btn-primary" style={{ fontSize: "0.8rem", padding: "0.6rem 1.2rem" }}>
            + New Interview
          </Link>
          <div style={{ marginLeft: "0.25rem" }}>
            <UserButton afterSignOutUrl="/" />
          </div>
        </div>
      </nav>

      <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "4rem 2.5rem 8rem", position: "relative", zIndex: 1 }}>

        {/* ── GREETING ── */}
        <div className="fade-up" style={{ marginBottom: "3.5rem", animationDelay: "0.05s" }}>
          <div style={{ fontSize: "0.56rem", fontFamily: "var(--mono)", color: "#5fc8ff", letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <span style={{ width: "16px", height: "1px", background: "linear-gradient(90deg, #5fc8ff, transparent)", display: "inline-block" }} />
            Welcome back
          </div>
          <h1 style={{ fontSize: "clamp(2.5rem, 5vw, 4.5rem)", fontWeight: 900, letterSpacing: "-0.05em", lineHeight: 1.0, fontFamily: "var(--display)" }}>
            Hey, <span className="grad-text">{firstName}.</span>
          </h1>
          <p style={{ fontSize: "0.82rem", color: "#2a3a52", fontFamily: "var(--mono)", marginTop: "0.75rem" }}>
            Here's how your interview prep is going.
          </p>
        </div>

        {/* ── STATS ── */}
        <div className="fade-up" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(165px, 1fr))", gap: "1rem", marginBottom: "2.5rem", animationDelay: "0.1s" }}>
          <StatCard label="Avg Score" value={`${avgScore}`} color="#5fc8ff" sub="overall performance" />
          <StatCard label="Best Session" value={`${bestScore}`} color="#9b6fff" sub="personal best" />
          <StatCard label="Avg Gaze" value={`${avgGaze}%`} color="#5fc8ff" />
          <StatCard label="Avg Confidence" value={`${avgConf}%`} color="#9b6fff" />
          <StatCard label="Avg Composure" value={`${avgCalm}%`} color="#2de6a4" />
        </div>

        {/* ── TREND ── */}
        {trend !== null && (
          <div className="fade-up" style={{ marginBottom: "2rem", animationDelay: "0.13s" }}>
            <div style={{
              background: trend >= 0 ? "rgba(45,230,164,0.04)" : "rgba(255,95,160,0.04)",
              border: `1px solid ${trend >= 0 ? "rgba(45,230,164,0.15)" : "rgba(255,95,160,0.15)"}`,
              borderRadius: "14px", padding: "0.9rem 1.5rem",
              display: "flex", alignItems: "center", gap: "0.75rem",
            }}>
              <span style={{ fontSize: "1rem", color: trend >= 0 ? "#2de6a4" : "#ff5fa0" }}>{trend >= 0 ? "↑" : "↓"}</span>
              <span style={{ fontSize: "0.75rem", fontFamily: "var(--mono)", color: trend >= 0 ? "#2de6a4" : "#ff5fa0" }}>
                {trend >= 0 ? `+${trend}` : trend} points from last session
              </span>
              <span style={{ fontSize: "0.65rem", fontFamily: "var(--mono)", color: "#1a2a3a", marginLeft: "auto" }}>
                {trend >= 0 ? "Keep the momentum." : "Keep practicing — you've got this."}
              </span>
            </div>
          </div>
        )}

        {/* ── CTA BANNER ── */}
        <div className="fade-up" style={{ marginBottom: "4rem", animationDelay: "0.16s" }}>
          <div style={{
            background: "rgba(255,255,255,0.015)", border: "1px solid rgba(255,255,255,0.07)",
            borderRadius: "20px", padding: "2rem 2.5rem",
            display: "flex", alignItems: "center", justifyContent: "space-between", gap: "2rem",
            position: "relative", overflow: "hidden",
          }}>
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "1px", background: "linear-gradient(90deg, transparent, rgba(95,200,255,0.4), rgba(155,111,255,0.4), transparent)" }} />
            <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 50% 100% at 0% 50%, rgba(95,200,255,0.04) 0%, transparent 60%)", pointerEvents: "none" }} />
            <div style={{ position: "relative" }}>
              <div style={{ fontWeight: 900, fontSize: "1.1rem", color: "#e8edf5", marginBottom: "0.4rem", fontFamily: "var(--display)", letterSpacing: "-0.03em" }}>
                Ready for your next session?
              </div>
              <p style={{ fontSize: "0.76rem", color: "#2a3a52", fontFamily: "var(--mono)", lineHeight: 1.65 }}>
                Upload a resume or job description and start practicing in seconds.
              </p>
            </div>
            <Link href="/interviewer-selection" className="btn-primary" style={{ flexShrink: 0 }}>
              Start Interview →
            </Link>
          </div>
        </div>

        {/* ── PAST SESSIONS ── */}
        <div className="fade-up" style={{ animationDelay: "0.2s" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "1.75rem" }}>
            <div>
              <div className="sec-label">Past Sessions</div>
              <h2 style={{ fontSize: "1.5rem", fontWeight: 900, letterSpacing: "-0.04em", fontFamily: "var(--display)" }}>
                {ds.length} interview{ds.length !== 1 ? "s" : ""} completed
              </h2>
            </div>
            {ds.length > 0 && (
              <span style={{ fontSize: "0.62rem", fontFamily: "var(--mono)", color: "#1a2a3a" }}>most recent first</span>
            )}
          </div>

          {loading ? (
            <div style={{ textAlign: "center", padding: "6rem 2rem", border: "1px solid rgba(255,255,255,0.04)", borderRadius: "20px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.6rem" }}>
                <span style={{ width: "5px", height: "5px", borderRadius: "50%", background: "#5fc8ff", display: "inline-block", animation: "blink 1s ease-in-out infinite" }} />
                <span style={{ fontSize: "0.78rem", color: "#1a2a3a", fontFamily: "var(--mono)" }}>Loading your sessions...</span>
              </div>
            </div>
          ) : ds.length === 0 ? (
            <div style={{ textAlign: "center", padding: "6rem 2rem", border: "1px dashed rgba(255,255,255,0.05)", borderRadius: "20px" }}>
              <div style={{ fontSize: "2rem", marginBottom: "1rem" }}>🎯</div>
              <div style={{ fontSize: "0.88rem", color: "#2a3a52", fontFamily: "var(--mono)", marginBottom: "0.4rem" }}>No sessions yet</div>
              <div style={{ fontSize: "0.72rem", color: "#1a2a3a", fontFamily: "var(--mono)" }}>Start your first interview above to see your progress here.</div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {ds.map((session: any, i: number) => (
                <SessionCard key={session.id} session={session} index={i} />
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}