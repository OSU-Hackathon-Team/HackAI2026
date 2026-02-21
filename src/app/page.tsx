"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { SignInButton, SignUpButton, SignedIn, SignedOut, UserButton } from "@clerk/nextjs";

function useScrollReveal() {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); observer.disconnect(); } },
      { threshold: 0.15 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return { ref, visible };
}

function SkillBar({ label, value, color, visible }: { label: string; value: number; color: string; visible: boolean }) {
  return (
    <div style={{ marginBottom: "1.5rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
        <span style={{ fontSize: "0.85rem", fontFamily: "var(--mono)", color: "#8899aa" }}>{label}</span>
        <span style={{ fontSize: "0.85rem", fontFamily: "var(--mono)", color }}>{value}%</span>
      </div>
      <div style={{ height: "5px", background: "#1e2a3a", borderRadius: "99px", overflow: "hidden" }}>
        <div style={{
          height: "100%", borderRadius: "99px", background: color,
          width: visible ? `${value}%` : "0%",
          transition: "width 1.2s cubic-bezier(0.16, 1, 0.3, 1)",
          boxShadow: `0 0 12px ${color}88`,
        }} />
      </div>
    </div>
  );
}

function FeatureCard({ icon, title, desc, accent }: { icon: string; title: string; desc: string; accent: string }) {
  return (
    <div style={{
      background: "#0e1420", border: "1px solid #1e2a3a", borderRadius: "16px", padding: "1.75rem",
      borderTop: `2px solid ${accent}`,
      transition: "transform 0.2s ease, box-shadow 0.2s ease",
    }}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(-3px)"; (e.currentTarget as HTMLElement).style.boxShadow = `0 12px 40px ${accent}22`; }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(0)"; (e.currentTarget as HTMLElement).style.boxShadow = "none"; }}
    >
      <div style={{ width: "36px", height: "36px", marginBottom: "1rem" }}>
        <img src={icon} alt={title} style={{ width: "100%", height: "100%", objectFit: "contain", filter: "brightness(0) invert(1) opacity(0.85)" }} />
      </div>
      <div style={{ fontWeight: 700, fontSize: "1rem", marginBottom: "0.5rem", color: "#e8edf5" }}>{title}</div>
      <div style={{ fontSize: "0.85rem", lineHeight: 1.65, color: "#5a6a82", fontFamily: "var(--mono)" }}>{desc}</div>
    </div>
  );
}

function TestimonialCard({ name, role, text, initial, accent }: { name: string; role: string; text: string; initial: string; accent: string }) {
  return (
    <div style={{
      background: "#0e1420", border: "1px solid #1e2a3a", borderRadius: "16px",
      padding: "1.5rem", minWidth: "300px", maxWidth: "340px", flexShrink: 0,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1rem" }}>
        <div style={{ width: "38px", height: "38px", borderRadius: "50%", background: `${accent}22`, border: `1px solid ${accent}44`, display: "flex", alignItems: "center", justifyContent: "center", color: accent, fontWeight: 700, fontSize: "0.9rem", flexShrink: 0 }}>
          {initial}
        </div>
        <div>
          <div style={{ fontWeight: 700, fontSize: "0.875rem", color: "#e8edf5" }}>{name}</div>
          <div style={{ fontSize: "0.72rem", color: "#5a6a82", fontFamily: "var(--mono)" }}>{role}</div>
        </div>
      </div>
      <p style={{ fontSize: "0.85rem", lineHeight: 1.65, color: "#8899aa", fontFamily: "var(--mono)" }}>"{text}"</p>
    </div>
  );
}

function TeamCard({ name, title, domain, accent, imageSrc, skills }: {
  name: string; title: string; domain: string;
  accent: string; imageSrc: string; skills: string[];
}) {
  return (
    <div style={{
      background: "#0e1420", border: "1px solid #1e2a3a", borderRadius: "16px",
      padding: "1.75rem", display: "flex", flexDirection: "column", gap: "1.25rem",
      borderTop: `2px solid ${accent}`,
      transition: "transform 0.2s ease, box-shadow 0.2s ease",
    }}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(-3px)"; (e.currentTarget as HTMLElement).style.boxShadow = `0 12px 40px ${accent}18`; }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(0)"; (e.currentTarget as HTMLElement).style.boxShadow = "none"; }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
        <div style={{ width: "52px", height: "52px", borderRadius: "50%", flexShrink: 0, overflow: "hidden", border: `2px solid ${accent}40`, boxShadow: `0 0 20px ${accent}20` }}>
          <img src={imageSrc} alt={name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        </div>
        <div>
          <div style={{ fontWeight: 700, fontSize: "1rem", color: "#e8edf5", letterSpacing: "-0.02em" }}>{name}</div>
          <div style={{ fontSize: "0.65rem", color: accent, fontFamily: "var(--mono)", letterSpacing: "0.08em", textTransform: "uppercase" }}>{title}</div>
        </div>
      </div>
      <p style={{ fontSize: "0.8rem", color: "#5a6a82", fontFamily: "var(--mono)", lineHeight: 1.7 }}>{domain}</p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
        {skills.map(skill => (
          <span key={skill} style={{ fontSize: "0.62rem", fontFamily: "var(--mono)", letterSpacing: "0.06em", padding: "0.2rem 0.6rem", borderRadius: "4px", background: `${accent}0e`, border: `1px solid ${accent}28`, color: accent }}>{skill}</span>
        ))}
      </div>
    </div>
  );
}

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ borderBottom: "1px solid #1e2a3a", padding: "1.25rem 0" }}>
      <button onClick={() => setOpen(!open)} style={{ width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center", background: "none", border: "none", cursor: "pointer", textAlign: "left", gap: "1rem" }}>
        <span style={{ fontWeight: 600, fontSize: "0.95rem", color: "#e8edf5", fontFamily: "var(--display)" }}>{q}</span>
        <span style={{ color: "#00e5ff", fontSize: "1.2rem", flexShrink: 0, transition: "transform 0.2s", transform: open ? "rotate(45deg)" : "rotate(0deg)" }}>+</span>
      </button>
      <div style={{ overflow: "hidden", maxHeight: open ? "200px" : "0", transition: "max-height 0.35s cubic-bezier(0.16, 1, 0.3, 1)" }}>
        <p style={{ paddingTop: "0.75rem", fontSize: "0.85rem", lineHeight: 1.7, color: "#5a6a82", fontFamily: "var(--mono)" }}>{a}</p>
      </div>
    </div>
  );
}

function MockUI() {
  return (
    <div style={{ width: "100%", maxWidth: "860px", margin: "0 auto" }}>
      <div style={{ background: "#0e1420", borderRadius: "16px", border: "1px solid #1e2a3a", boxShadow: "0 24px 80px rgba(0,229,255,0.08)", overflow: "hidden" }}>
        <div style={{ background: "#080b12", borderBottom: "1px solid #1e2a3a", padding: "0.75rem 1.25rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#ff5f57" }} />
          <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#febc2e" }} />
          <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#28c840" }} />
          <div style={{ flex: 1, textAlign: "center", fontSize: "0.72rem", color: "#5a6a82", fontFamily: "var(--mono)" }}>aceit.app/interview</div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 280px", minHeight: "300px" }}>
          <div style={{ background: "linear-gradient(135deg, #080b12, #0e1420)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "2rem", gap: "1rem" }}>
            <div style={{ width: "80px", height: "80px", borderRadius: "50%", background: "linear-gradient(135deg, #7b61ff, #00e5ff)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 0 40px rgba(0,229,255,0.25)" }}>
                <img src="/robot.png" alt="AI Interviewer" style={{ width: "48px", height: "48px", objectFit: "contain", filter: "brightness(0) invert(1) opacity(0.9)" }} />
              </div>
            <div style={{ color: "#e8edf5", fontWeight: 600, fontSize: "0.9rem" }}>AI Interviewer</div>
            <div style={{ background: "rgba(0,229,255,0.08)", border: "1px solid rgba(0,229,255,0.25)", borderRadius: "99px", padding: "0.25rem 0.75rem", fontSize: "0.65rem", color: "#00e5ff", fontFamily: "var(--mono)" }}>● SPEAKING</div>
            <div style={{ display: "flex", gap: "1.5rem", marginTop: "0.5rem" }}>
              {[["GAZE", "88", "#00e5ff"], ["CONF", "82", "#7b61ff"], ["CALM", "91", "#00e096"]].map(([l, v, c]) => (
                <div key={l} style={{ textAlign: "center" }}>
                  <svg width="48" height="48" viewBox="0 0 48 48">
                    <circle cx="24" cy="24" r="18" fill="none" stroke="#1e2a3a" strokeWidth="3" />
                    <circle cx="24" cy="24" r="18" fill="none" stroke={c} strokeWidth="3" strokeDasharray={`${2 * Math.PI * 18 * parseInt(v) / 100} ${2 * Math.PI * 18}`} strokeLinecap="round" transform="rotate(-90 24 24)" />
                    <text x="24" y="28" textAnchor="middle" fill={c} fontSize="9" fontFamily="monospace" fontWeight="600">{v}</text>
                  </svg>
                  <div style={{ fontSize: "0.5rem", color: "#5a6a82", letterSpacing: "0.12em", fontFamily: "monospace" }}>{l}</div>
                </div>
              ))}
            </div>
          </div>
          <div style={{ padding: "1.25rem", display: "flex", flexDirection: "column", gap: "0.75rem", borderLeft: "1px solid #1e2a3a" }}>
            <div style={{ fontSize: "0.62rem", letterSpacing: "0.12em", color: "#5a6a82", fontFamily: "var(--mono)", textTransform: "uppercase" }}>Live Transcript</div>
            {[
              { s: "AI", t: "Tell me about a challenging project you've worked on.", c: "#00e5ff" },
              { s: "YOU", t: "Sure — I built a real-time pipeline processing 10k events/sec...", c: "#7b61ff" },
              { s: "AI", t: "How did you handle failure states?", c: "#00e5ff" },
            ].map((m, i) => (
              <div key={i} style={{ display: "flex", gap: "0.5rem" }}>
                <span style={{ fontSize: "0.6rem", fontFamily: "var(--mono)", fontWeight: 700, color: m.c, paddingTop: "2px", flexShrink: 0 }}>{m.s}</span>
                <p style={{ fontSize: "0.75rem", lineHeight: 1.5, color: "#8899aa", fontFamily: "var(--mono)" }}>{m.t}</p>
              </div>
            ))}
            <div style={{ marginTop: "auto", background: "rgba(255,77,109,0.08)", border: "1px solid rgba(255,77,109,0.25)", borderRadius: "8px", padding: "0.5rem 0.75rem", fontSize: "0.68rem", color: "#ff4d6d", fontFamily: "var(--mono)" }}>⚠ Maintain eye contact</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LandingPage() {
  const personalizedRef = useScrollReveal();
  const feedbackRef = useScrollReveal();
  const featuresRef = useScrollReveal();
  const testimonialsRef = useScrollReveal();
  const teamRef = useScrollReveal();
  const faqRef = useScrollReveal();
  const ctaRef = useScrollReveal();

  const heroMockRef = useRef<HTMLDivElement>(null);

  const [heroLoaded, setHeroLoaded] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setHeroLoaded(true), 100);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      if (!heroMockRef.current) return;
      const translateY = Math.min(window.scrollY * 0.3, 80);
      heroMockRef.current.style.transform = `translateY(-${translateY}px)`;
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

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
        html { scroll-behavior: smooth; }
        body { background: var(--bg); color: var(--text); font-family: var(--display); overflow-x: hidden; }
        body::before {
          content: "";
          position: fixed; inset: 0;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E");
          pointer-events: none; z-index: 999; opacity: 0.35;
        }

        .lp-reveal { opacity: 0; transform: translateY(20px); transition: opacity 0.5s ease-out, transform 0.5s ease-out; }
        .lp-reveal.visible { opacity: 1; transform: translateY(0); }

        .nav-link { color: var(--muted); text-decoration: none; font-size: 0.875rem; font-weight: 500; transition: color 0.15s ease; font-family: var(--mono); letter-spacing: 0.04em; }
        .nav-link:hover { color: var(--cyan); }

        .btn-primary {
          display: inline-flex; align-items: center; gap: 0.5rem;
          background: var(--cyan); color: var(--bg);
          font-family: var(--display); font-weight: 700; font-size: 0.9rem;
          padding: 0.8rem 1.75rem; border-radius: 8px; border: none;
          cursor: pointer; text-decoration: none; letter-spacing: 0.02em;
          transition: all 0.2s ease; box-shadow: 0 0 24px rgba(0,229,255,0.25);
        }
        .btn-primary:hover { filter: brightness(1.1); transform: translateY(-2px); box-shadow: 0 8px 32px rgba(0,229,255,0.35); }

        .btn-ghost {
          display: inline-flex; align-items: center; gap: 0.5rem;
          background: transparent; color: var(--muted);
          font-family: var(--mono); font-weight: 500; font-size: 0.85rem;
          padding: 0.7rem 1.25rem; border-radius: 8px; border: 1px solid var(--border);
          cursor: pointer; text-decoration: none; transition: all 0.2s ease;
        }
        .btn-ghost:hover { border-color: var(--cyan); color: var(--cyan); }

        @keyframes heroFadeUp {
          from { opacity: 0; transform: translateY(32px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes orbPulse {
          0%, 100% { transform: scale(1) translate(-50%, -50%); opacity: 0.5; }
          50%       { transform: scale(1.12) translate(-45%, -48%); opacity: 0.85; }
        }
        @keyframes orbPulse2 {
          0%, 100% { transform: scale(1) translate(-50%, -50%); opacity: 0.3; }
          50%       { transform: scale(1.18) translate(-55%, -52%); opacity: 0.6; }
        }
        @keyframes scanLine {
          0%   { transform: translateY(-100%); opacity: 0; }
          8%   { opacity: 0.8; }
          92%  { opacity: 0.8; }
          100% { transform: translateY(100vh); opacity: 0; }
        }
        @keyframes gridFadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes mockSlideUp {
          from { opacity: 0; transform: translateY(56px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        .hero-grid {
          opacity: 0;
          animation: gridFadeIn 2s ease 0.2s forwards;
        }
        .scan-line {
          animation: scanLine 3.5s ease-in-out 0.6s forwards;
        }
        .hero-badge {
          opacity: 0;
          animation: heroFadeUp 1s cubic-bezier(0.16, 1, 0.3, 1) 0.5s forwards;
        }
        .hero-h1 {
          opacity: 0;
          animation: heroFadeUp 1.1s cubic-bezier(0.16, 1, 0.3, 1) 0.9s forwards;
        }
        .hero-sub {
          opacity: 0;
          animation: heroFadeUp 1s cubic-bezier(0.16, 1, 0.3, 1) 1.35s forwards;
        }
        .hero-cta {
          opacity: 0;
          animation: heroFadeUp 1s cubic-bezier(0.16, 1, 0.3, 1) 1.7s forwards;
        }
        .hero-mock {
          opacity: 0;
          animation: mockSlideUp 1.2s cubic-bezier(0.16, 1, 0.3, 1) 2.1s forwards;
        }
      `}</style>

      {/* ── NAV ── */}
      <nav style={{ position: "sticky", top: 0, zIndex: 100, background: "rgba(8,11,18,0.85)", backdropFilter: "blur(16px)", borderBottom: "1px solid #1e2a3a", padding: "0 2.5rem", height: "64px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ fontWeight: 800, fontSize: "1.2rem", letterSpacing: "-0.03em" }}>
          Ace<span style={{ color: "var(--cyan)" }}>It</span>
        </div>
        <div style={{ display: "flex", gap: "2.5rem" }}>
          <a href="#features" className="nav-link">Features</a>
          <a href="#feedback" className="nav-link">How it works</a>
          <a href="#team" className="nav-link">Team</a>
          <a href="#faq" className="nav-link">FAQ</a>
        </div>
        <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
          <SignedOut>
            <SignInButton mode="modal">
              <button className="btn-ghost">Log in</button>
            </SignInButton>
            <SignUpButton mode="modal">
              <button className="btn-primary">Start free →</button>
            </SignUpButton>
          </SignedOut>
          <SignedIn>
            <Link href="/upload" className="btn-primary">Start interview →</Link>
            <UserButton afterSignOutUrl="/" />
          </SignedIn>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section style={{ minHeight: "100vh", position: "relative", display: "flex", flexDirection: "column", alignItems: "center", padding: "6rem 2rem 0", textAlign: "center", overflow: "hidden" }}>
        <div className="hero-grid" style={{
          position: "absolute", inset: 0, zIndex: 0,
          backgroundImage: "linear-gradient(rgba(0,229,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(0,229,255,0.04) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
          maskImage: "radial-gradient(ellipse 80% 60% at 50% 40%, black 20%, transparent 80%)",
          WebkitMaskImage: "radial-gradient(ellipse 80% 60% at 50% 40%, black 20%, transparent 80%)",
        }} />
        <div className="scan-line" style={{
          position: "absolute", left: 0, right: 0, height: "2px", zIndex: 1,
          background: "linear-gradient(90deg, transparent, rgba(0,229,255,0.6), transparent)",
          pointerEvents: "none",
        }} />
        <div style={{
          position: "absolute", width: "600px", height: "600px", borderRadius: "50%", zIndex: 0,
          background: "radial-gradient(circle, rgba(0,229,255,0.1) 0%, transparent 70%)",
          top: "10%", left: "50%",
          transformOrigin: "0 0",
          animation: "orbPulse 6s ease-in-out infinite",
          pointerEvents: "none",
        }} />
        <div style={{
          position: "absolute", width: "500px", height: "500px", borderRadius: "50%", zIndex: 0,
          background: "radial-gradient(circle, rgba(123,97,255,0.1) 0%, transparent 70%)",
          top: "20%", left: "55%",
          transformOrigin: "0 0",
          animation: "orbPulse2 8s ease-in-out infinite",
          pointerEvents: "none",
        }} />
        <div style={{ position: "relative", zIndex: 2, display: "flex", flexDirection: "column", alignItems: "center" }}>
          <div className="hero-badge" style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", background: "rgba(0,229,255,0.06)", border: "1px solid rgba(0,229,255,0.18)", borderRadius: "6px", padding: "0.3rem 0.9rem", marginBottom: "2rem" }}>
            <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "var(--cyan)", display: "inline-block", boxShadow: "0 0 6px var(--cyan)" }} />
            <span style={{ fontSize: "0.72rem", color: "var(--cyan)", fontFamily: "var(--mono)", letterSpacing: "0.08em" }}>MULTIMODAL CONFIDENCE ANALYSIS — NOW LIVE</span>
          </div>
          <h1 className="hero-h1" style={{ fontSize: "clamp(3rem, 7vw, 6rem)", fontWeight: 800, lineHeight: 1.02, letterSpacing: "-0.04em", color: "var(--text)", maxWidth: "820px", marginBottom: "1.5rem" }}>
            Ace your next<br />
            <span style={{ color: "var(--cyan)", textShadow: "0 0 60px rgba(0,229,255,0.4)" }}>interview.</span>
          </h1>
          <p className="hero-sub" style={{ fontSize: "1.1rem", color: "var(--muted)", maxWidth: "500px", lineHeight: 1.75, marginBottom: "2.5rem", fontFamily: "var(--mono)" }}>
            AI-powered mock interviews that analyze your voice, gaze, and body language in real-time — then coach you to close the gap.
          </p>
          <div className="hero-cta" style={{ display: "flex", gap: "1rem", alignItems: "center", marginBottom: "5rem" }}>
            <Link href="/upload" className="btn-primary">Start my interview →</Link>
            <span style={{ fontSize: "0.78rem", color: "var(--muted)", fontFamily: "var(--mono)" }}>No account needed</span>
          </div>
          <div className="hero-mock" ref={heroMockRef} style={{ width: "100%", maxWidth: "900px" }}>
            <MockUI />
          </div>
        </div>
      </section>

      {/* ── PERSONALIZED ── */}
      <section id="features" style={{ padding: "10rem 2rem", maxWidth: "1100px", margin: "0 auto" }}>
        <div ref={personalizedRef.ref} className={`lp-reveal ${personalizedRef.visible ? "visible" : ""}`} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "5rem", alignItems: "center" }}>
          <div style={{ background: "var(--surface)", borderRadius: "16px", border: "1px solid var(--border)", padding: "1.5rem" }}>
            <div style={{ fontSize: "0.65rem", fontFamily: "var(--mono)", color: "var(--muted)", marginBottom: "1rem", letterSpacing: "0.12em", textTransform: "uppercase" }}>Session Context</div>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {[
                { icon: "/file.png", title: "CV uploaded", sub: "resume_2025.pdf · 142 KB", color: "var(--cyan)" },
                { icon: "/briefcase.png", title: "Job listing imported", sub: "Software Engineer · Stripe", color: "var(--green)" },
              ].map((item) => (
                <div key={item.title} style={{ display: "flex", alignItems: "center", gap: "0.75rem", background: "#080b12", borderRadius: "10px", padding: "0.75rem 1rem", border: "1px solid var(--border)" }}>
                  <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: `${item.color}14`, border: `1px solid ${item.color}30`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <img src={item.icon} alt={item.title} style={{ width: "18px", height: "18px", objectFit: "contain", filter: "brightness(0) invert(1) opacity(0.8)" }} />
                  </div>
                  <div>
                    <div style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--text)" }}>{item.title}</div>
                    <div style={{ fontSize: "0.68rem", color: "var(--muted)", fontFamily: "var(--mono)" }}>{item.sub}</div>
                  </div>
                  <div style={{ marginLeft: "auto", fontSize: "0.75rem", color: "var(--green)" }}>✓</div>
                </div>
              ))}
            </div>
            <div style={{ marginTop: "1rem", padding: "0.75rem 1rem", background: "rgba(0,229,255,0.04)", borderRadius: "10px", border: "1px dashed rgba(0,229,255,0.2)" }}>
              <div style={{ fontSize: "0.72rem", color: "var(--cyan)", fontFamily: "var(--mono)" }}>✦ Generating bespoke interview persona...</div>
            </div>
          </div>
          <div>
            <div style={{ fontSize: "0.65rem", fontFamily: "var(--mono)", color: "var(--cyan)", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: "1rem" }}>01 — Personalization</div>
            <h2 style={{ fontSize: "clamp(1.8rem, 3vw, 2.6rem)", fontWeight: 800, lineHeight: 1.15, letterSpacing: "-0.03em", color: "var(--text)", marginBottom: "1.25rem" }}>Instant personalised interviews</h2>
            <p style={{ fontSize: "0.95rem", color: "var(--muted)", lineHeight: 1.8, marginBottom: "1.75rem", fontFamily: "var(--mono)" }}>
              Upload your resume and paste any job description. AceIt generates a bespoke interviewer with tailored technical and behavioral questions — specific to the exact role.
            </p>
            <Link href="/upload" className="btn-primary" style={{ fontSize: "0.85rem", padding: "0.65rem 1.25rem" }}>Try it now →</Link>
          </div>
        </div>
      </section>

      {/* ── FEEDBACK ── */}
      <section id="feedback" style={{ padding: "8rem 2rem", background: "var(--surface)", borderTop: "1px solid var(--border)", borderBottom: "1px solid var(--border)" }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
          <div ref={feedbackRef.ref} className={`lp-reveal ${feedbackRef.visible ? "visible" : ""}`} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "5rem", alignItems: "center" }}>
            <div>
              <div style={{ fontSize: "0.65rem", fontFamily: "var(--mono)", color: "var(--cyan)", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: "1rem" }}>02 — Feedback</div>
              <h2 style={{ fontSize: "clamp(1.8rem, 3vw, 2.6rem)", fontWeight: 800, lineHeight: 1.15, letterSpacing: "-0.03em", color: "var(--text)", marginBottom: "1.25rem" }}>Get actionable, constructive feedback</h2>
              <p style={{ fontSize: "0.95rem", color: "var(--muted)", lineHeight: 1.8, fontFamily: "var(--mono)" }}>
                Every session produces a timestamped report that cross-references your transcript with biometric signals — so you know exactly when and why your confidence dipped.
              </p>
            </div>
            <div style={{ background: "#080b12", borderRadius: "16px", padding: "2rem", border: "1px solid var(--border)" }}>
              <div style={{ fontSize: "0.62rem", fontFamily: "var(--mono)", color: "var(--muted)", marginBottom: "1.5rem", letterSpacing: "0.12em", textTransform: "uppercase" }}>Performance Breakdown</div>
              <SkillBar label="Communication" value={87} color="var(--cyan)" visible={feedbackRef.visible} />
              <SkillBar label="Confidence" value={74} color="var(--purple)" visible={feedbackRef.visible} />
              <SkillBar label="Problem solving" value={91} color="var(--green)" visible={feedbackRef.visible} />
              <SkillBar label="Technical ability" value={82} color="var(--cyan)" visible={feedbackRef.visible} />
            </div>
          </div>
        </div>
      </section>

      {/* ── FEATURES GRID ── */}
      <section style={{ padding: "10rem 2rem", maxWidth: "1100px", margin: "0 auto" }}>
        <div ref={featuresRef.ref} className={`lp-reveal ${featuresRef.visible ? "visible" : ""}`}>
          <div style={{ textAlign: "center", marginBottom: "4rem" }}>
            <div style={{ fontSize: "0.65rem", fontFamily: "var(--mono)", color: "var(--cyan)", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: "1rem" }}>03 — Features</div>
            <h2 style={{ fontSize: "clamp(1.8rem, 3vw, 2.6rem)", fontWeight: 800, lineHeight: 1.15, letterSpacing: "-0.03em", color: "var(--text)" }}>Practice makes perfect</h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "1.25rem" }}>
            <FeatureCard icon="/microphone.png" title="Voice chat" accent="var(--cyan)" desc="Speak naturally with an AI interviewer powered by GPT-4o and ElevenLabs — sub-500ms response time, no typing required." />
            <FeatureCard icon="/robot.png" title="Powerful interviewer" accent="var(--purple)" desc="Your resume and job description shape a bespoke interviewer that asks questions specific to your experience and the role." />
            <FeatureCard icon="/bar-chart.png" title="Constructive feedback" accent="var(--green)" desc="Timestamped coaching tied to the exact moment you looked away, rushed your words, or showed stress in your posture." />
            <FeatureCard icon="/chart.png" title="Get better" accent="var(--pink)" desc="Track gaze stability, voice confidence, and composure across sessions and watch your scores improve over time." />
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section style={{ padding: "8rem 0", background: "var(--surface)", borderTop: "1px solid var(--border)", borderBottom: "1px solid var(--border)", overflow: "hidden" }}>
        <div ref={testimonialsRef.ref} className={`lp-reveal ${testimonialsRef.visible ? "visible" : ""}`}>
          <div style={{ textAlign: "center", marginBottom: "3rem", padding: "0 2rem" }}>
            <div style={{ fontSize: "0.65rem", fontFamily: "var(--mono)", color: "var(--cyan)", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: "1rem" }}>04 — Reviews</div>
            <h2 style={{ fontSize: "clamp(1.8rem, 3vw, 2.6rem)", fontWeight: 800, letterSpacing: "-0.03em", color: "var(--text)" }}>What people are saying</h2>
          </div>
          <div style={{ display: "flex", gap: "1.25rem", padding: "0 2rem", overflowX: "auto", paddingBottom: "1rem" }}>
            <TestimonialCard initial="S" name="Suchith M." role="ECE Student → NVIDIA Intern" accent="var(--cyan)" text="The gaze feedback was eye-opening. I didn't realize I look away when I'm thinking — now I consciously anchor my eyes and it makes a huge difference." />
            <TestimonialCard initial="J" name="Jacob B." role="Career Switcher → SWE at Stripe" accent="var(--purple)" text="Being able to click on a stress spike and immediately hear what I was saying at that moment is genuinely brilliant." />
            <TestimonialCard initial="C" name="Cooper B." role="CS Student" accent="var(--green)" text="I went in cold for my first interview and bombed it. After three sessions with AceIt my confidence scores jumped from 54 to 83." />
            <TestimonialCard initial="D" name="Darquavius Shingledingus III" role="Masters Student → Meta" accent="var(--pink)" text="The AI interviewer asked me things I didn't expect — it had clearly read my resume carefully. Much harder than the real interview, honestly." />
          </div>
        </div>
      </section>

      {/* ── TEAM ── */}
      <section id="team" style={{ padding: "10rem 2rem", maxWidth: "1100px", margin: "0 auto" }}>
        <div ref={teamRef.ref} className={`lp-reveal ${teamRef.visible ? "visible" : ""}`}>
          <div style={{ textAlign: "center", marginBottom: "4rem" }}>
            <div style={{ fontSize: "0.65rem", fontFamily: "var(--mono)", color: "var(--cyan)", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: "1rem" }}>05 — Team</div>
            <h2 style={{ fontSize: "clamp(1.8rem, 3vw, 2.6rem)", fontWeight: 800, letterSpacing: "-0.03em", color: "var(--text)", marginBottom: "1rem" }}>
              Built by engineers,<br />for candidates.
            </h2>
            <p style={{ fontSize: "0.875rem", color: "var(--muted)", fontFamily: "var(--mono)", maxWidth: "480px", margin: "0 auto", lineHeight: 1.75 }}>
              Four people. One hackathon. A shared belief that interview prep should be as sophisticated as the interviews themselves.
            </p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "1.25rem" }}>
            <TeamCard name="Konrád" imageSrc="/konrad.png" title="Systems & Frontend Architect" accent="var(--cyan)" domain="Builds the infrastructure that holds everything together — WebRTC signaling, global state orchestration, and the synchronized analytics dashboard." skills={["Next.js", "WebRTC", "Zustand", "Recharts", "Supabase"]} />
            <TeamCard name="Jason" imageSrc="/jason.png" title="Audio & Intelligence Orchestrator" accent="var(--purple)" domain="Runs the conversational brain — RAG ingestion, cascading GPT-4o streams, ElevenLabs voice synthesis, and Whisper word-level timestamps." skills={["FastAPI", "GPT-4o", "Whisper", "ElevenLabs", "LangChain"]} />
            <TeamCard name="Mitch" imageSrc="/mitch.png" title="Computer Vision Engineer" accent="var(--green)" domain="Extracts meaning from 468 facial landmarks in real time — gaze vectors, head pose, and fidget index — streamed live via WebRTC DataChannels." skills={["MediaPipe", "OpenCV", "Flask", "PyTorch", "NumPy"]} />
            <TeamCard name="Rocky" imageSrc="/rocky.png" title="Business Lead" accent="var(--pink)" domain="Keeps the team pointed at what matters — market positioning, pitch deck, user testimonials, and making sure the demo lands with the judges." skills={["Strategy", "Pitch Deck", "User Research", "Data"]} />
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section id="faq" style={{ padding: "8rem 2rem", background: "var(--surface)", borderTop: "1px solid var(--border)", borderBottom: "1px solid var(--border)" }}>
        <div style={{ maxWidth: "680px", margin: "0 auto" }}>
          <div ref={faqRef.ref} className={`lp-reveal ${faqRef.visible ? "visible" : ""}`}>
            <div style={{ textAlign: "center", marginBottom: "3rem" }}>
              <div style={{ fontSize: "0.65rem", fontFamily: "var(--mono)", color: "var(--cyan)", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: "1rem" }}>06 — FAQ</div>
              <h2 style={{ fontSize: "clamp(1.8rem, 3vw, 2.6rem)", fontWeight: 800, letterSpacing: "-0.03em", color: "var(--text)" }}>Common questions</h2>
            </div>
            <FaqItem q="How does the AI analyze my body language?" a="AceIt runs MediaPipe facial landmark detection in your browser at 30fps, tracking 468 3D points to derive gaze direction, head pose, and fidget index — all processed locally with no video leaving your device." />
            <FaqItem q="What kind of questions will I be asked?" a="Questions are generated by GPT-4o based on your specific resume and job posting. Expect a mix of behavioral (STAR-format) and technical questions tailored to the role and your experience level." />
            <FaqItem q="Is my video or audio stored?" a="No. All biometric processing happens in your browser. Only anonymized metric scores (gaze, confidence, fidget index) are stored in your session — never raw video or audio." />
            <FaqItem q="How long is a typical session?" a="Most sessions run 10–20 minutes. You control when to end the interview, and your report is generated immediately after." />
            <FaqItem q="Do I need to install anything?" a="No. AceIt runs entirely in your browser. You just need a webcam and microphone." />
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section style={{ background: "var(--bg)", padding: "10rem 2rem", textAlign: "center" }}>
        <div ref={ctaRef.ref} className={`lp-reveal ${ctaRef.visible ? "visible" : ""}`}>
          <div style={{ fontSize: "0.65rem", fontFamily: "var(--mono)", color: "var(--cyan)", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: "1.5rem" }}>◆ Ready when you are</div>
          <h2 style={{ fontSize: "clamp(2.5rem, 5vw, 4.5rem)", fontWeight: 800, letterSpacing: "-0.04em", color: "var(--text)", marginBottom: "1rem", lineHeight: 1.05, textShadow: "0 0 80px rgba(0,229,255,0.15)" }}>
            Get the job of<br />your dreams.
          </h2>
          <p style={{ fontSize: "1rem", color: "var(--muted)", marginBottom: "2.5rem", fontFamily: "var(--mono)" }}>No fluff. No filler. Just better interviews.</p>
          <Link href="/upload" className="btn-primary" style={{ fontSize: "1rem", padding: "1rem 2.5rem" }}>Start for free →</Link>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ background: "#080b12", borderTop: "1px solid var(--border)", padding: "2.5rem 2rem" }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
          <div style={{ fontWeight: 800, fontSize: "1.1rem", letterSpacing: "-0.03em" }}>Ace<span style={{ color: "var(--cyan)" }}>It</span></div>
          <div style={{ display: "flex", gap: "2rem" }}>
            <a href="#features" className="nav-link">Features</a>
            <a href="#team" className="nav-link">Team</a>
            <a href="#faq" className="nav-link">FAQ</a>
            <Link href="/upload" className="nav-link">Start interview</Link>
          </div>
          <div style={{ fontSize: "0.72rem", color: "var(--muted)", fontFamily: "var(--mono)" }}>© 2026 AceIt · Built for good interviews</div>
        </div>
      </footer>
    </>
  );
}