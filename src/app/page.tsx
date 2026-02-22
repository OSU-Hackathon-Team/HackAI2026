// "use client";
// import { useEffect, useRef, useState } from "react";
// import Link from "next/link";
// import { SignInButton, SignUpButton, SignedIn, SignedOut, UserButton, useUser } from "@clerk/nextjs";
// import { useRouter } from "next/navigation";

// function useScrollReveal() {
//   const ref = useRef<HTMLDivElement>(null);
//   const [visible, setVisible] = useState(false);
//   useEffect(() => {
//     const el = ref.current;
//     if (!el) return;
//     const observer = new IntersectionObserver(
//       ([entry]) => { if (entry.isIntersecting) { setVisible(true); observer.disconnect(); } },
//       { threshold: 0.15 }
//     );
//     observer.observe(el);
//     return () => observer.disconnect();
//   }, []);
//   return { ref, visible };
// }

// function SkillBar({ label, value, color, visible }: { label: string; value: number; color: string; visible: boolean }) {
//   return (
//     <div style={{ marginBottom: "1.5rem" }}>
//       <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
//         <span style={{ fontSize: "0.85rem", fontFamily: "var(--mono)", color: "#8899aa" }}>{label}</span>
//         <span style={{ fontSize: "0.85rem", fontFamily: "var(--mono)", color }}>{value}%</span>
//       </div>
//       <div style={{ height: "5px", background: "#1e2a3a", borderRadius: "99px", overflow: "hidden" }}>
//         <div style={{ height: "100%", borderRadius: "99px", background: color, width: visible ? `${value}%` : "0%", transition: "width 1.2s cubic-bezier(0.16, 1, 0.3, 1)", boxShadow: `0 0 12px ${color}88` }} />
//       </div>
//     </div>
//   );
// }

// function FeatureCard({ icon, title, desc, accent }: { icon: string; title: string; desc: string; accent: string }) {
//   return (
//     <div style={{ background: "#0e1420", border: "1px solid #1e2a3a", borderRadius: "16px", padding: "1.75rem", borderTop: `2px solid ${accent}`, transition: "transform 0.2s ease, box-shadow 0.2s ease" }}
//       onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(-3px)"; (e.currentTarget as HTMLElement).style.boxShadow = `0 12px 40px ${accent}22`; }}
//       onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(0)"; (e.currentTarget as HTMLElement).style.boxShadow = "none"; }}
//     >
//       <div style={{ width: "36px", height: "36px", marginBottom: "1rem" }}>
//         <img src={icon} alt={title} style={{ width: "100%", height: "100%", objectFit: "contain", filter: "brightness(0) invert(1) opacity(0.85)" }} />
//       </div>
//       <div style={{ fontWeight: 700, fontSize: "1rem", marginBottom: "0.5rem", color: "#e8edf5" }}>{title}</div>
//       <div style={{ fontSize: "0.85rem", lineHeight: 1.65, color: "#5a6a82", fontFamily: "var(--mono)" }}>{desc}</div>
//     </div>
//   );
// }

// function TeamCard({ name, title, domain, accent, imageSrc, skills }: { name: string; title: string; domain: string; accent: string; imageSrc: string; skills: string[] }) {
//   return (
//     <div style={{ background: "#0e1420", border: "1px solid #1e2a3a", borderRadius: "16px", padding: "1.75rem", display: "flex", flexDirection: "column", gap: "1.25rem", borderTop: `2px solid ${accent}`, transition: "transform 0.2s ease, box-shadow 0.2s ease" }}
//       onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(-3px)"; (e.currentTarget as HTMLElement).style.boxShadow = `0 12px 40px ${accent}18`; }}
//       onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(0)"; (e.currentTarget as HTMLElement).style.boxShadow = "none"; }}
//     >
//       <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
//         <div style={{ width: "52px", height: "52px", borderRadius: "50%", flexShrink: 0, overflow: "hidden", border: `2px solid ${accent}40`, boxShadow: `0 0 20px ${accent}20` }}>
//           <img src={imageSrc} alt={name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
//         </div>
//         <div>
//           <div style={{ fontWeight: 700, fontSize: "1rem", color: "#e8edf5", letterSpacing: "-0.02em" }}>{name}</div>
//           <div style={{ fontSize: "0.65rem", color: accent, fontFamily: "var(--mono)", letterSpacing: "0.08em", textTransform: "uppercase" }}>{title}</div>
//         </div>
//       </div>
//       <p style={{ fontSize: "0.8rem", color: "#5a6a82", fontFamily: "var(--mono)", lineHeight: 1.7 }}>{domain}</p>
//       <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
//         {skills.map(skill => (
//           <span key={skill} style={{ fontSize: "0.62rem", fontFamily: "var(--mono)", letterSpacing: "0.06em", padding: "0.2rem 0.6rem", borderRadius: "4px", background: `${accent}0e`, border: `1px solid ${accent}28`, color: accent }}>{skill}</span>
//         ))}
//       </div>
//     </div>
//   );
// }

// function FaqItem({ q, a }: { q: string; a: string }) {
//   const [open, setOpen] = useState(false);
//   return (
//     <div style={{ borderBottom: "1px solid #1e2a3a", padding: "1.25rem 0" }}>
//       <button onClick={() => setOpen(!open)} style={{ width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center", background: "none", border: "none", cursor: "pointer", textAlign: "left", gap: "1rem" }}>
//         <span style={{ fontWeight: 600, fontSize: "0.95rem", color: "#e8edf5", fontFamily: "var(--display)" }}>{q}</span>
//         <span style={{ color: "#00e5ff", fontSize: "1.2rem", flexShrink: 0, transition: "transform 0.2s", transform: open ? "rotate(45deg)" : "rotate(0deg)" }}>+</span>
//       </button>
//       <div style={{ overflow: "hidden", maxHeight: open ? "200px" : "0", transition: "max-height 0.35s cubic-bezier(0.16, 1, 0.3, 1)" }}>
//         <p style={{ paddingTop: "0.75rem", fontSize: "0.85rem", lineHeight: 1.7, color: "#5a6a82", fontFamily: "var(--mono)" }}>{a}</p>
//       </div>
//     </div>
//   );
// }

// function MockUI() {
//   return (
//     <div style={{ width: "100%", maxWidth: "860px", margin: "0 auto" }}>
//       <div style={{ background: "#0e1420", borderRadius: "16px", border: "1px solid #1e2a3a", boxShadow: "0 24px 80px rgba(0,229,255,0.08)", overflow: "hidden" }}>
//         <div style={{ background: "#080b12", borderBottom: "1px solid #1e2a3a", padding: "0.75rem 1.25rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
//           <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#ff5f57" }} />
//           <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#febc2e" }} />
//           <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#28c840" }} />
//           <div style={{ flex: 1, textAlign: "center", fontSize: "0.72rem", color: "#5a6a82", fontFamily: "var(--mono)" }}>aceit.app/interview</div>
//         </div>
//         <div style={{ display: "grid", gridTemplateColumns: "1fr 280px", minHeight: "300px" }}>
//           <div style={{ background: "linear-gradient(135deg, #080b12, #0e1420)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "2rem", gap: "1rem" }}>
//             <div style={{ width: "80px", height: "80px", borderRadius: "50%", background: "linear-gradient(135deg, #7b61ff, #00e5ff)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 0 40px rgba(0,229,255,0.25)" }}>
//               <img src="/robot.png" alt="AI Interviewer" style={{ width: "48px", height: "48px", objectFit: "contain", filter: "brightness(0) invert(1) opacity(0.9)" }} />
//             </div>
//             <div style={{ color: "#e8edf5", fontWeight: 600, fontSize: "0.9rem" }}>AI Interviewer</div>
//             <div style={{ background: "rgba(0,229,255,0.08)", border: "1px solid rgba(0,229,255,0.25)", borderRadius: "99px", padding: "0.25rem 0.75rem", fontSize: "0.65rem", color: "#00e5ff", fontFamily: "var(--mono)" }}>● SPEAKING</div>
//             <div style={{ display: "flex", gap: "1.5rem", marginTop: "0.5rem" }}>
//               {[["GAZE", "88", "#00e5ff"], ["CONF", "82", "#7b61ff"], ["CALM", "91", "#00e096"]].map(([l, v, c]) => (
//                 <div key={l} style={{ textAlign: "center" }}>
//                   <svg width="48" height="48" viewBox="0 0 48 48">
//                     <circle cx="24" cy="24" r="18" fill="none" stroke="#1e2a3a" strokeWidth="3" />
//                     <circle cx="24" cy="24" r="18" fill="none" stroke={c} strokeWidth="3" strokeDasharray={`${2 * Math.PI * 18 * parseInt(v) / 100} ${2 * Math.PI * 18}`} strokeLinecap="round" transform="rotate(-90 24 24)" />
//                     <text x="24" y="28" textAnchor="middle" fill={c} fontSize="9" fontFamily="monospace" fontWeight="600">{v}</text>
//                   </svg>
//                   <div style={{ fontSize: "0.5rem", color: "#5a6a82", letterSpacing: "0.12em", fontFamily: "monospace" }}>{l}</div>
//                 </div>
//               ))}
//             </div>
//           </div>
//           <div style={{ padding: "1.25rem", display: "flex", flexDirection: "column", gap: "0.75rem", borderLeft: "1px solid #1e2a3a" }}>
//             <div style={{ fontSize: "0.62rem", letterSpacing: "0.12em", color: "#5a6a82", fontFamily: "var(--mono)", textTransform: "uppercase" }}>Live Transcript</div>
//             {[
//               { s: "AI", t: "Tell me about a challenging project you've worked on.", c: "#00e5ff" },
//               { s: "YOU", t: "Sure — I built a real-time pipeline processing 10k events/sec...", c: "#7b61ff" },
//               { s: "AI", t: "How did you handle failure states?", c: "#00e5ff" },
//             ].map((m, i) => (
//               <div key={i} style={{ display: "flex", gap: "0.5rem" }}>
//                 <span style={{ fontSize: "0.6rem", fontFamily: "var(--mono)", fontWeight: 700, color: m.c, paddingTop: "2px", flexShrink: 0 }}>{m.s}</span>
//                 <p style={{ fontSize: "0.75rem", lineHeight: 1.5, color: "#8899aa", fontFamily: "var(--mono)" }}>{m.t}</p>
//               </div>
//             ))}
//             <div style={{ marginTop: "auto", background: "rgba(255,77,109,0.08)", border: "1px solid rgba(255,77,109,0.25)", borderRadius: "8px", padding: "0.5rem 0.75rem", fontSize: "0.68rem", color: "#ff4d6d", fontFamily: "var(--mono)" }}>⚠ Maintain eye contact</div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }

// // ─── 3D TESTIMONIALS CLOUD ────────────────────────────────────────────────────
// const TESTIMONIALS = [
//   { initial: "S", name: "Suchith M.", role: "ECE Student → NVIDIA Intern", accent: "#00e5ff", text: "The gaze feedback was eye-opening. I didn't realize I look away when I'm thinking — now I consciously anchor my eyes and it makes a huge difference." },
//   { initial: "J", name: "Jacob B.", role: "Career Switcher → SWE at Stripe", accent: "#7b61ff", text: "Being able to click on a stress spike and immediately hear what I was saying at that moment is genuinely brilliant." },
//   { initial: "C", name: "Cooper B.", role: "CS Student", accent: "#00e096", text: "I went in cold for my first interview and bombed it. After three sessions with AceIt my confidence scores jumped from 54 to 83." },
//   { initial: "D", name: "Darquavius S.", role: "Masters Student → Meta", accent: "#ff4d6d", text: "The AI interviewer asked me things I didn't expect — it had clearly read my resume carefully. Much harder than the real interview, honestly." },
//   { initial: "A", name: "Aisha K.", role: "PM → Google L4", accent: "#febc2e", text: "I used to freeze when asked about weaknesses. AceIt replayed three moments where my voice dropped — and helped me reframe them completely." },
//   { initial: "R", name: "Rohan P.", role: "Bootcamp Grad → Shopify", accent: "#00e5ff", text: "Seeing my fidget index spike exactly when I was asked a system design question was humbling. But also incredibly useful." },
//   { initial: "M", name: "Maya T.", role: "New Grad → Coinbase", accent: "#7b61ff", text: "The voice confidence breakdown showed I rush when nervous. I practiced slowing down and my offer came two weeks later." },
//   { initial: "L", name: "Leo B.", role: "PhD → Quant at Jane Street", accent: "#00e096", text: "It caught that I avoid eye contact right after technical explanations. That's gold-level feedback you'd only get from a professional coach." },
// ];

// // rx/ry = horizontal/vertical radius (vw/vh)
// // duration = time for one full orbit
// // delay = start position in the orbit (0 to -duration)
// const CARD_CONFIG = [
//   { rx: 42, ry: 22, dur: "45s", delay: "0s", rot: -4 },
//   { rx: 32, ry: 15, dur: "52s", delay: "-8s", rot: 5 },
//   { rx: 48, ry: 25, dur: "58s", delay: "-20s", rot: -6 },
//   { rx: 36, ry: 18, dur: "50s", delay: "-32s", rot: 3 },
//   { rx: 28, ry: 12, dur: "65s", delay: "-12s", rot: 7 },
//   { rx: 45, ry: 20, dur: "55s", delay: "-40s", rot: -4 },
// ];

// function TestimonialsCloud() {
//   // Use a subset of testimonials for the marquee
//   const items = TESTIMONIALS.slice(0, 6);

//   return (
//     <>
//       <style>{`
//         @keyframes marquee {
//           0% { transform: translateX(0); }
//           100% { transform: translateX(-50%); }
//         }
//         .marquee-container {
//           display: flex;
//           width: max-content;
//           animation: marquee 40s linear infinite;
//         }
//         .marquee-container:hover {
//           animation-play-state: paused;
//         }
//         .testimonial-card-inner {
//           transition: transform 0.3s cubic-bezier(0.2, 0, 0.2, 1), box-shadow 0.3s ease;
//           cursor: default;
//           width: 320px;
//           flex-shrink: 0;
//           margin-right: 2.5rem;
//         }
//         .testimonial-card-inner:hover {
//           transform: translateY(-8px) scale(1.02) !important;
//           z-index: 10;
//         }
//       `}</style>

//       <section style={{
//         position: "relative",
//         padding: "8rem 0",
//         overflow: "hidden",
//         background: "var(--surface)",
//         borderTop: "1px solid var(--border)",
//         borderBottom: "1px solid var(--border)",
//         minHeight: "580px",
//         display: "flex",
//         flexDirection: "column",
//         justifyContent: "center",
//       }}>

//         <div style={{
//           position: "absolute", inset: 0, pointerEvents: "none",
//           background: "radial-gradient(circle at 20% 50%, rgba(0,229,255,0.03) 0%, transparent 50%), radial-gradient(circle at 80% 50%, rgba(123,97,255,0.03) 0%, transparent 50%)",
//         }} />

//         <div style={{
//           position: "relative", zIndex: 30,
//           textAlign: "center",
//           marginBottom: "5rem",
//           pointerEvents: "none",
//         }}>
//           <div style={{ fontSize: "0.65rem", fontFamily: "var(--mono)", color: "var(--cyan)", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: "0.6rem" }}>04 — Reviews</div>
//           <h2 style={{ fontSize: "clamp(1.8rem, 3vw, 2.6rem)", fontWeight: 800, letterSpacing: "-0.03em", color: "var(--text)" }}>Success from the source</h2>
//           <p style={{ color: "var(--muted)", fontSize: "0.9rem", marginTop: "0.75rem", fontFamily: "var(--mono)" }}>Hover to pause the line</p>
//         </div>

//         <div style={{ position: "relative", width: "100%", overflow: "hidden" }}>
//           <div className="marquee-container">
//             {[...items, ...items].map((t, i) => (
//               <div
//                 key={i}
//                 className="testimonial-card-inner"
//                 style={{
//                   background: "#0b1220",
//                   border: "1px solid rgba(255,255,255,0.06)",
//                   borderTop: `2px solid ${t.accent}`,
//                   borderRadius: "16px",
//                   padding: "1.5rem",
//                   boxShadow: `0 8px 32px ${t.accent}08, 0 2px 8px rgba(0,0,0,0.5)`,
//                 }}
//                 onMouseEnter={e => {
//                   (e.currentTarget as HTMLElement).style.boxShadow = `0 20px 60px ${t.accent}2a, 0 4px 12 rgba(0,0,0,0.6)`;
//                 }}
//                 onMouseLeave={e => {
//                   (e.currentTarget as HTMLElement).style.boxShadow = `0 8px 32px ${t.accent}08, 0 2px 8px rgba(0,0,0,0.5)`;
//                 }}
//               >
//                 <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.25rem" }}>
//                   <div style={{
//                     width: "40px", height: "40px", borderRadius: "50%",
//                     background: `${t.accent}12`, border: `1px solid ${t.accent}30`,
//                     display: "flex", alignItems: "center", justifyContent: "center",
//                     color: t.accent, fontWeight: 700, fontSize: "0.9rem", flexShrink: 0,
//                   }}>
//                     {t.initial}
//                   </div>
//                   <div>
//                     <div style={{ fontWeight: 700, fontSize: "0.85rem", color: "#d4dce8", lineHeight: 1.2 }}>{t.name}</div>
//                     <div style={{ fontSize: "0.65rem", color: "#4a5870", fontFamily: "var(--mono)", marginTop: "3px" }}>{t.role}</div>
//                   </div>
//                 </div>
//                 <p style={{ fontSize: "0.82rem", lineHeight: 1.7, color: "#8a9ab0", fontFamily: "var(--mono)" }}>"{t.text}"</p>
//               </div>
//             ))}
//           </div>

//           <div style={{
//             position: "absolute", inset: 0, pointerEvents: "none", zIndex: 20,
//             background: "linear-gradient(to right, var(--surface) 0%, transparent 15%, transparent 85%, var(--surface) 100%)",
//           }} />
//         </div>
//       </section>
//     </>
//   );
// }

// export default function LandingPage() {
//   const { user, isLoaded } = useUser();
//   const router = useRouter();

//   useEffect(() => {
//     if (isLoaded && user) {
//       router.push("/dashboard");
//     }
//   }, [user, isLoaded, router]);

//   const personalizedRef = useScrollReveal();
//   const feedbackRef = useScrollReveal();
//   const featuresRef = useScrollReveal();
//   const teamRef = useScrollReveal();
//   const faqRef = useScrollReveal();
//   const ctaRef = useScrollReveal();
//   const heroMockRef = useRef<HTMLDivElement>(null);

//   useEffect(() => {
//     const onScroll = () => {
//       if (!heroMockRef.current) return;
//       heroMockRef.current.style.transform = `translateY(-${Math.min(window.scrollY * 0.3, 80)}px)`;
//     };
//     window.addEventListener("scroll", onScroll, { passive: true });
//     return () => window.removeEventListener("scroll", onScroll);
//   }, []);

//   return (
//     <>
//       <style>{`
//         @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=DM+Mono:wght@400;500&display=swap');
//         :root { --display: 'Syne', sans-serif; --mono: 'DM Mono', monospace; --bg: #080b12; --surface: #0e1420; --border: #1e2a3a; --cyan: #00e5ff; --purple: #7b61ff; --green: #00e096; --pink: #ff4d6d; --text: #e8edf5; --muted: #5a6a82; }
//         * { box-sizing: border-box; margin: 0; padding: 0; }
//         html { scroll-behavior: smooth; }
//         body { background: var(--bg); color: var(--text); font-family: var(--display); overflow-x: hidden; }
//         body::before { content: ""; position: fixed; inset: 0; background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E"); pointer-events: none; z-index: 999; opacity: 0.35; }
//         .lp-reveal { opacity: 0; transform: translateY(20px); transition: opacity 0.5s ease-out, transform 0.5s ease-out; }
//         .lp-reveal.visible { opacity: 1; transform: translateY(0); }
//         .nav-link { color: var(--muted); text-decoration: none; font-size: 0.875rem; font-weight: 500; transition: color 0.15s ease; font-family: var(--mono); letter-spacing: 0.04em; }
//         .nav-link:hover { color: var(--cyan); }
//         .btn-primary { display: inline-flex; align-items: center; gap: 0.5rem; background: var(--cyan); color: var(--bg); font-family: var(--display); font-weight: 700; font-size: 0.9rem; padding: 0.8rem 1.75rem; border-radius: 8px; border: none; cursor: pointer; text-decoration: none; letter-spacing: 0.02em; transition: all 0.2s ease; box-shadow: 0 0 24px rgba(0,229,255,0.25); }
//         .btn-primary:hover { filter: brightness(1.1); transform: translateY(-2px); box-shadow: 0 8px 32px rgba(0,229,255,0.35); }
//         .btn-ghost { display: inline-flex; align-items: center; gap: 0.5rem; background: transparent; color: var(--muted); font-family: var(--mono); font-weight: 500; font-size: 0.85rem; padding: 0.7rem 1.25rem; border-radius: 8px; border: 1px solid var(--border); cursor: pointer; text-decoration: none; transition: all 0.2s ease; }
//         .btn-ghost:hover { border-color: var(--cyan); color: var(--cyan); }
//         @keyframes heroFadeUp { from { opacity: 0; transform: translateY(32px); } to { opacity: 1; transform: translateY(0); } }
//         @keyframes orbPulse { 0%,100% { transform: scale(1) translate(-50%,-50%); opacity:.5; } 50% { transform: scale(1.12) translate(-45%,-48%); opacity:.85; } }
//         @keyframes orbPulse2 { 0%,100% { transform: scale(1) translate(-50%,-50%); opacity:.3; } 50% { transform: scale(1.18) translate(-55%,-52%); opacity:.6; } }
//         @keyframes scanLine { 0% { transform:translateY(-100%); opacity:0; } 8% { opacity:.8; } 92% { opacity:.8; } 100% { transform:translateY(100vh); opacity:0; } }
//         @keyframes gridFadeIn { from { opacity:0; } to { opacity:1; } }
//         @keyframes mockSlideUp { from { opacity:0; transform:translateY(56px); } to { opacity:1; transform:translateY(0); } }
//         .hero-grid  { opacity:0; animation: gridFadeIn 2s ease 0.2s forwards; }
//         .scan-line  { animation: scanLine 3.5s ease-in-out 0.6s forwards; }
//         .hero-badge { opacity:0; animation: heroFadeUp 1s cubic-bezier(.16,1,.3,1) .5s forwards; }
//         .hero-h1    { opacity:0; animation: heroFadeUp 1.1s cubic-bezier(.16,1,.3,1) .9s forwards; }
//         .hero-sub   { opacity:0; animation: heroFadeUp 1s cubic-bezier(.16,1,.3,1) 1.35s forwards; }
//         .hero-cta   { opacity:0; animation: heroFadeUp 1s cubic-bezier(.16,1,.3,1) 1.7s forwards; }
//         .hero-mock  { opacity:0; animation: mockSlideUp 1.2s cubic-bezier(.16,1,.3,1) 2.1s forwards; }
//       `}</style>

//       {/* ── NAV ── */}
//       <nav style={{ position: "sticky", top: 0, zIndex: 100, background: "rgba(8,11,18,0.85)", backdropFilter: "blur(16px)", borderBottom: "1px solid #1e2a3a", padding: "0 2.5rem", height: "64px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
//         <div style={{ fontWeight: 800, fontSize: "1.2rem", letterSpacing: "-0.03em" }}>Ace<span style={{ color: "var(--cyan)" }}>It</span></div>
//         <div style={{ display: "flex", gap: "2.5rem" }}>
//           <a href="#features" className="nav-link">Features</a>
//           <a href="#feedback" className="nav-link">How it works</a>
//           <a href="#team" className="nav-link">Team</a>
//           <a href="#faq" className="nav-link">FAQ</a>
//         </div>
//         <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
//           <SignedOut>
//             <SignInButton mode="modal"><button className="btn-ghost">Log in</button></SignInButton>
//             <SignUpButton mode="modal"><button className="btn-primary">Start free →</button></SignUpButton>
//           </SignedOut>
//           <SignedIn>
//             <Link href="/interviewer-selection" className="btn-primary">Start interview →</Link>
//             <UserButton afterSignOutUrl="/" />
//           </SignedIn>
//         </div>
//       </nav>

//       {/* ── HERO ── */}
//       <section style={{ minHeight: "100vh", position: "relative", display: "flex", flexDirection: "column", alignItems: "center", padding: "6rem 2rem 0", textAlign: "center", overflow: "hidden" }}>
//         <div className="hero-grid" style={{ position: "absolute", inset: 0, zIndex: 0, backgroundImage: "linear-gradient(rgba(0,229,255,0.04) 1px,transparent 1px),linear-gradient(90deg,rgba(0,229,255,0.04) 1px,transparent 1px)", backgroundSize: "60px 60px", maskImage: "radial-gradient(ellipse 80% 60% at 50% 40%,black 20%,transparent 80%)", WebkitMaskImage: "radial-gradient(ellipse 80% 60% at 50% 40%,black 20%,transparent 80%)" }} />
//         <div className="scan-line" style={{ position: "absolute", left: 0, right: 0, height: "2px", zIndex: 1, background: "linear-gradient(90deg,transparent,rgba(0,229,255,0.6),transparent)", pointerEvents: "none" }} />
//         <div style={{ position: "absolute", width: "600px", height: "600px", borderRadius: "50%", zIndex: 0, background: "radial-gradient(circle,rgba(0,229,255,0.1) 0%,transparent 70%)", top: "10%", left: "50%", transformOrigin: "0 0", animation: "orbPulse 6s ease-in-out infinite", pointerEvents: "none" }} />
//         <div style={{ position: "absolute", width: "500px", height: "500px", borderRadius: "50%", zIndex: 0, background: "radial-gradient(circle,rgba(123,97,255,0.1) 0%,transparent 70%)", top: "20%", left: "55%", transformOrigin: "0 0", animation: "orbPulse2 8s ease-in-out infinite", pointerEvents: "none" }} />
//         <div style={{ position: "relative", zIndex: 2, display: "flex", flexDirection: "column", alignItems: "center" }}>
//           <div className="hero-badge" style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", background: "rgba(0,229,255,0.06)", border: "1px solid rgba(0,229,255,0.18)", borderRadius: "6px", padding: "0.3rem 0.9rem", marginBottom: "2rem" }}>
//             <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "var(--cyan)", display: "inline-block", boxShadow: "0 0 6px var(--cyan)" }} />
//             <span style={{ fontSize: "0.72rem", color: "var(--cyan)", fontFamily: "var(--mono)", letterSpacing: "0.08em" }}>MULTIMODAL CONFIDENCE ANALYSIS — NOW LIVE</span>
//           </div>
//           <h1 className="hero-h1" style={{ fontSize: "clamp(3rem,7vw,6rem)", fontWeight: 800, lineHeight: 1.02, letterSpacing: "-0.04em", color: "var(--text)", maxWidth: "820px", marginBottom: "1.5rem" }}>
//             Ace your next<br /><span style={{ color: "var(--cyan)", textShadow: "0 0 60px rgba(0,229,255,0.4)" }}>interview.</span>
//           </h1>
//           <p className="hero-sub" style={{ fontSize: "1.1rem", color: "var(--muted)", maxWidth: "500px", lineHeight: 1.75, marginBottom: "2.5rem", fontFamily: "var(--mono)" }}>
//             AI-powered mock interviews that analyze your voice, gaze, and body language in real-time — then coach you to close the gap.
//           </p>
//           <div className="hero-cta" style={{ display: "flex", gap: "1rem", alignItems: "center", marginBottom: "5rem" }}>
//             <Link href="/interviewer-selection" className="btn-primary">Start my interview →</Link>
//             <span style={{ fontSize: "0.78rem", color: "var(--muted)", fontFamily: "var(--mono)" }}>No account needed</span>
//           </div>
//           <div className="hero-mock" ref={heroMockRef} style={{ width: "100%", maxWidth: "900px" }}><MockUI /></div>
//         </div>
//       </section>

//       {/* ── PERSONALIZED ── */}
//       <section id="features" style={{ padding: "10rem 2rem", maxWidth: "1100px", margin: "0 auto" }}>
//         <div ref={personalizedRef.ref} className={`lp-reveal ${personalizedRef.visible ? "visible" : ""}`} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "5rem", alignItems: "center" }}>
//           <div style={{ background: "var(--surface)", borderRadius: "16px", border: "1px solid var(--border)", padding: "1.5rem" }}>
//             <div style={{ fontSize: "0.65rem", fontFamily: "var(--mono)", color: "var(--muted)", marginBottom: "1rem", letterSpacing: "0.12em", textTransform: "uppercase" }}>Session Context</div>
//             <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
//               {[
//                 { icon: "/file.png", title: "CV uploaded", sub: "resume_2025.pdf · 142 KB", color: "var(--cyan)" },
//                 { icon: "/briefcase.png", title: "Job listing imported", sub: "Software Engineer · Stripe", color: "var(--green)" },
//               ].map((item) => (
//                 <div key={item.title} style={{ display: "flex", alignItems: "center", gap: "0.75rem", background: "#080b12", borderRadius: "10px", padding: "0.75rem 1rem", border: "1px solid var(--border)" }}>
//                   <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: `${item.color}14`, border: `1px solid ${item.color}30`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
//                     <img src={item.icon} alt={item.title} style={{ width: "18px", height: "18px", objectFit: "contain", filter: "brightness(0) invert(1) opacity(0.8)" }} />
//                   </div>
//                   <div>
//                     <div style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--text)" }}>{item.title}</div>
//                     <div style={{ fontSize: "0.68rem", color: "var(--muted)", fontFamily: "var(--mono)" }}>{item.sub}</div>
//                   </div>
//                   <div style={{ marginLeft: "auto", fontSize: "0.75rem", color: "var(--green)" }}>✓</div>
//                 </div>
//               ))}
//             </div>
//             <div style={{ marginTop: "1rem", padding: "0.75rem 1rem", background: "rgba(0,229,255,0.04)", borderRadius: "10px", border: "1px dashed rgba(0,229,255,0.2)" }}>
//               <div style={{ fontSize: "0.72rem", color: "var(--cyan)", fontFamily: "var(--mono)" }}>✦ Generating bespoke interview persona...</div>
//             </div>
//           </div>
//           <div>
//             <div style={{ fontSize: "0.65rem", fontFamily: "var(--mono)", color: "var(--cyan)", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: "1rem" }}>01 — Personalization</div>
//             <h2 style={{ fontSize: "clamp(1.8rem,3vw,2.6rem)", fontWeight: 800, lineHeight: 1.15, letterSpacing: "-0.03em", color: "var(--text)", marginBottom: "1.25rem" }}>Instant personalised interviews</h2>
//             <p style={{ fontSize: "0.95rem", color: "var(--muted)", lineHeight: 1.8, marginBottom: "1.75rem", fontFamily: "var(--mono)" }}>Upload your resume and paste any job description. AceIt generates a bespoke interviewer with tailored technical and behavioral questions — specific to the exact role.</p>
//             <Link href="/interviewer-selection" className="btn-primary" style={{ fontSize: "0.85rem", padding: "0.65rem 1.25rem" }}>Try it now →</Link>
//           </div>
//         </div>
//       </section>

//       {/* ── FEEDBACK ── */}
//       <section id="feedback" style={{ padding: "8rem 2rem", background: "var(--surface)", borderTop: "1px solid var(--border)", borderBottom: "1px solid var(--border)" }}>
//         <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
//           <div ref={feedbackRef.ref} className={`lp-reveal ${feedbackRef.visible ? "visible" : ""}`} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "5rem", alignItems: "center" }}>
//             <div>
//               <div style={{ fontSize: "0.65rem", fontFamily: "var(--mono)", color: "var(--cyan)", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: "1rem" }}>02 — Feedback</div>
//               <h2 style={{ fontSize: "clamp(1.8rem,3vw,2.6rem)", fontWeight: 800, lineHeight: 1.15, letterSpacing: "-0.03em", color: "var(--text)", marginBottom: "1.25rem" }}>Get actionable, constructive feedback</h2>
//               <p style={{ fontSize: "0.95rem", color: "var(--muted)", lineHeight: 1.8, fontFamily: "var(--mono)" }}>Every session produces a timestamped report that cross-references your transcript with biometric signals — so you know exactly when and why your confidence dipped.</p>
//             </div>
//             <div style={{ background: "#080b12", borderRadius: "16px", padding: "2rem", border: "1px solid var(--border)" }}>
//               <div style={{ fontSize: "0.62rem", fontFamily: "var(--mono)", color: "var(--muted)", marginBottom: "1.5rem", letterSpacing: "0.12em", textTransform: "uppercase" }}>Performance Breakdown</div>
//               <SkillBar label="Communication" value={87} color="var(--cyan)" visible={feedbackRef.visible} />
//               <SkillBar label="Confidence" value={74} color="var(--purple)" visible={feedbackRef.visible} />
//               <SkillBar label="Problem solving" value={91} color="var(--green)" visible={feedbackRef.visible} />
//               <SkillBar label="Technical ability" value={82} color="var(--cyan)" visible={feedbackRef.visible} />
//             </div>
//           </div>
//         </div>
//       </section>

//       {/* ── FEATURES GRID ── */}
//       <section style={{ padding: "10rem 2rem", maxWidth: "1100px", margin: "0 auto" }}>
//         <div ref={featuresRef.ref} className={`lp-reveal ${featuresRef.visible ? "visible" : ""}`}>
//           <div style={{ textAlign: "center", marginBottom: "4rem" }}>
//             <div style={{ fontSize: "0.65rem", fontFamily: "var(--mono)", color: "var(--cyan)", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: "1rem" }}>03 — Features</div>
//             <h2 style={{ fontSize: "clamp(1.8rem,3vw,2.6rem)", fontWeight: 800, lineHeight: 1.15, letterSpacing: "-0.03em", color: "var(--text)" }}>Practice makes perfect</h2>
//           </div>
//           <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))", gap: "1.25rem" }}>
//             <FeatureCard icon="/microphone.png" title="Voice chat" accent="var(--cyan)" desc="Speak naturally with an AI interviewer powered by GPT-4o and ElevenLabs — sub-500ms response time, no typing required." />
//             <FeatureCard icon="/robot.png" title="Powerful interviewer" accent="var(--purple)" desc="Your resume and job description shape a bespoke interviewer that asks questions specific to your experience and the role." />
//             <FeatureCard icon="/bar-chart.png" title="Constructive feedback" accent="var(--green)" desc="Timestamped coaching tied to the exact moment you looked away, rushed your words, or showed stress in your posture." />
//             <FeatureCard icon="/chart.png" title="Get better" accent="var(--pink)" desc="Track gaze stability, voice confidence, and composure across sessions and watch your scores improve over time." />
//           </div>
//         </div>
//       </section>

//       {/* ── 3D TESTIMONIALS CLOUD ── */}
//       <TestimonialsCloud />

//       {/* ── TEAM ── */}
//       <section id="team" style={{ padding: "10rem 2rem", maxWidth: "1100px", margin: "0 auto" }}>
//         <div ref={teamRef.ref} className={`lp-reveal ${teamRef.visible ? "visible" : ""}`}>
//           <div style={{ textAlign: "center", marginBottom: "4rem" }}>
//             <div style={{ fontSize: "0.65rem", fontFamily: "var(--mono)", color: "var(--cyan)", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: "1rem" }}>05 — Team</div>
//             <h2 style={{ fontSize: "clamp(1.8rem,3vw,2.6rem)", fontWeight: 800, letterSpacing: "-0.03em", color: "var(--text)", marginBottom: "1rem" }}>Built by engineers,<br />for candidates.</h2>
//             <p style={{ fontSize: "0.875rem", color: "var(--muted)", fontFamily: "var(--mono)", maxWidth: "480px", margin: "0 auto", lineHeight: 1.75 }}>Four people. One hackathon. A shared belief that interview prep should be as sophisticated as the interviews themselves.</p>
//           </div>
//           <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))", gap: "1.25rem" }}>
//             <TeamCard name="Konrád" imageSrc="/konrad.png" title="Systems & Frontend Architect" accent="var(--cyan)" domain="Builds the infrastructure that holds everything together — WebRTC signaling, global state orchestration, and the synchronized analytics dashboard." skills={["Next.js", "WebRTC", "Zustand", "Recharts", "Supabase"]} />
//             <TeamCard name="Jason" imageSrc="/jason.png" title="Audio & Intelligence Orchestrator" accent="var(--purple)" domain="Runs the conversational brain — RAG ingestion, cascading GPT-4o streams, ElevenLabs voice synthesis, and Whisper word-level timestamps." skills={["FastAPI", "GPT-4o", "Whisper", "ElevenLabs", "LangChain"]} />
//             <TeamCard name="Mitch" imageSrc="/mitch.png" title="Computer Vision Engineer" accent="var(--green)" domain="Extracts meaning from 468 facial landmarks in real time — gaze vectors, head pose, and fidget index — streamed live via WebRTC DataChannels." skills={["MediaPipe", "OpenCV", "Flask", "PyTorch", "NumPy"]} />
//             <TeamCard name="Rocky" imageSrc="/rocky.png" title="Business Lead" accent="var(--pink)" domain="Keeps the team pointed at what matters — market positioning, pitch deck, user testimonials, and making sure the demo lands with the judges." skills={["Strategy", "Pitch Deck", "User Research", "Data"]} />
//           </div>
//         </div>
//       </section>

//       {/* ── FAQ ── */}
//       <section id="faq" style={{ padding: "8rem 2rem", background: "var(--surface)", borderTop: "1px solid var(--border)", borderBottom: "1px solid var(--border)" }}>
//         <div style={{ maxWidth: "680px", margin: "0 auto" }}>
//           <div ref={faqRef.ref} className={`lp-reveal ${faqRef.visible ? "visible" : ""}`}>
//             <div style={{ textAlign: "center", marginBottom: "3rem" }}>
//               <div style={{ fontSize: "0.65rem", fontFamily: "var(--mono)", color: "var(--cyan)", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: "1rem" }}>06 — FAQ</div>
//               <h2 style={{ fontSize: "clamp(1.8rem,3vw,2.6rem)", fontWeight: 800, letterSpacing: "-0.03em", color: "var(--text)" }}>Common questions</h2>
//             </div>
//             <FaqItem q="How does the AI analyze my body language?" a="AceIt runs MediaPipe facial landmark detection in your browser at 30fps, tracking 468 3D points to derive gaze direction, head pose, and fidget index — all processed locally with no video leaving your device." />
//             <FaqItem q="What kind of questions will I be asked?" a="Questions are generated by GPT-4o based on your specific resume and job posting. Expect a mix of behavioral (STAR-format) and technical questions tailored to the role and your experience level." />
//             <FaqItem q="Is my video or audio stored?" a="No. All biometric processing happens in your browser. Only anonymized metric scores (gaze, confidence, fidget index) are stored in your session — never raw video or audio." />
//             <FaqItem q="How long is a typical session?" a="Most sessions run 10–20 minutes. You control when to end the interview, and your report is generated immediately after." />
//             <FaqItem q="Do I need to install anything?" a="No. AceIt runs entirely in your browser. You just need a webcam and microphone." />
//           </div>
//         </div>
//       </section>

//       {/* ── FINAL CTA ── */}
//       <section style={{ background: "var(--bg)", padding: "10rem 2rem", textAlign: "center" }}>
//         <div ref={ctaRef.ref} className={`lp-reveal ${ctaRef.visible ? "visible" : ""}`}>
//           <div style={{ fontSize: "0.65rem", fontFamily: "var(--mono)", color: "var(--cyan)", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: "1.5rem" }}>◆ Ready when you are</div>
//           <h2 style={{ fontSize: "clamp(2.5rem,5vw,4.5rem)", fontWeight: 800, letterSpacing: "-0.04em", color: "var(--text)", marginBottom: "1rem", lineHeight: 1.05, textShadow: "0 0 80px rgba(0,229,255,0.15)" }}>Get the job of<br />your dreams.</h2>
//           <p style={{ fontSize: "1rem", color: "var(--muted)", marginBottom: "2.5rem", fontFamily: "var(--mono)" }}>No fluff. No filler. Just better interviews.</p>
//           <Link href="/interviewer-selection" className="btn-primary" style={{ fontSize: "1rem", padding: "1rem 2.5rem" }}>Start for free →</Link>
//         </div>
//       </section>

//       {/* ── FOOTER ── */}
//       <footer style={{ background: "#080b12", borderTop: "1px solid var(--border)", padding: "2.5rem 2rem" }}>
//         <div style={{ maxWidth: "1100px", margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
//           <div style={{ fontWeight: 800, fontSize: "1.1rem", letterSpacing: "-0.03em" }}>Ace<span style={{ color: "var(--cyan)" }}>It</span></div>
//           <div style={{ display: "flex", gap: "2rem" }}>
//             <a href="#features" className="nav-link">Features</a>
//             <a href="#team" className="nav-link">Team</a>
//             <a href="#faq" className="nav-link">FAQ</a>
//             <Link href="/interviewer-selection" className="nav-link">Start interview</Link>
//           </div>
//           <div style={{ fontSize: "0.72rem", color: "var(--muted)", fontFamily: "var(--mono)" }}>© 2026 AceIt · Built for good interviews</div>
//         </div>
//       </footer>
//     </>
//   );
// }

"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { SignInButton, SignUpButton, SignedIn, SignedOut, UserButton, useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";

function useScrollReveal() {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); observer.disconnect(); } },
      { threshold: 0.12 }
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
        <span style={{ fontSize: "0.78rem", fontFamily: "var(--mono)", color: "#7a8fa8", letterSpacing: "0.06em", textTransform: "uppercase" }}>{label}</span>
        <span style={{ fontSize: "0.78rem", fontFamily: "var(--mono)", color, fontWeight: 600 }}>{value}%</span>
      </div>
      <div style={{ height: "3px", background: "rgba(255,255,255,0.06)", borderRadius: "99px", overflow: "hidden" }}>
        <div style={{
          height: "100%", borderRadius: "99px", background: color,
          width: visible ? `${value}%` : "0%",
          transition: "width 1.4s cubic-bezier(0.16, 1, 0.3, 1)",
          boxShadow: `0 0 16px ${color}99`
        }} />
      </div>
    </div>
  );
}

function FeatureCard({ icon, title, desc, accent, index }: { icon: string; title: string; desc: string; accent: string; index: number }) {
  return (
    <div
      style={{
        background: "rgba(255,255,255,0.02)",
        border: "1px solid rgba(255,255,255,0.07)",
        borderRadius: "20px",
        padding: "2rem",
        position: "relative",
        overflow: "hidden",
        transition: "transform 0.3s ease, box-shadow 0.3s ease, border-color 0.3s ease",
        animationDelay: `${index * 0.1}s`,
      }}
      onMouseEnter={e => {
        const el = e.currentTarget as HTMLElement;
        el.style.transform = "translateY(-6px)";
        el.style.boxShadow = `0 20px 60px ${accent}20`;
        el.style.borderColor = `${accent}40`;
      }}
      onMouseLeave={e => {
        const el = e.currentTarget as HTMLElement;
        el.style.transform = "translateY(0)";
        el.style.boxShadow = "none";
        el.style.borderColor = "rgba(255,255,255,0.07)";
      }}
    >
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, height: "1px",
        background: `linear-gradient(90deg, transparent, ${accent}80, transparent)`
      }} />
      <div style={{
        width: "44px", height: "44px", borderRadius: "12px", marginBottom: "1.25rem",
        background: `linear-gradient(135deg, ${accent}20, ${accent}08)`,
        border: `1px solid ${accent}30`,
        display: "flex", alignItems: "center", justifyContent: "center"
      }}>
        <img src={icon} alt={title} style={{ width: "22px", height: "22px", objectFit: "contain", filter: `brightness(0) invert(1) opacity(0.85)` }} />
      </div>
      <div style={{ fontWeight: 700, fontSize: "1.05rem", marginBottom: "0.65rem", color: "#e8edf5", fontFamily: "var(--display)", letterSpacing: "-0.02em" }}>{title}</div>
      <div style={{ fontSize: "0.82rem", lineHeight: 1.7, color: "#5a6a82", fontFamily: "var(--mono)" }}>{desc}</div>
    </div>
  );
}

function TeamCard({ name, title, domain, accent, imageSrc, skills }: { name: string; title: string; domain: string; accent: string; imageSrc: string; skills: string[] }) {
  return (
    <div
      style={{
        background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)",
        borderRadius: "20px", padding: "1.75rem",
        display: "flex", flexDirection: "column", gap: "1.25rem",
        transition: "transform 0.3s ease, box-shadow 0.3s ease, border-color 0.3s ease",
        position: "relative", overflow: "hidden",
      }}
      onMouseEnter={e => {
        const el = e.currentTarget as HTMLElement;
        el.style.transform = "translateY(-5px)";
        el.style.boxShadow = `0 24px 60px ${accent}18`;
        el.style.borderColor = `${accent}35`;
      }}
      onMouseLeave={e => {
        const el = e.currentTarget as HTMLElement;
        el.style.transform = "translateY(0)";
        el.style.boxShadow = "none";
        el.style.borderColor = "rgba(255,255,255,0.07)";
      }}
    >
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, height: "1px",
        background: `linear-gradient(90deg, transparent, ${accent}70, transparent)`
      }} />
      <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
        <div style={{
          width: "54px", height: "54px", borderRadius: "50%", flexShrink: 0, overflow: "hidden",
          border: `2px solid ${accent}40`, boxShadow: `0 0 24px ${accent}25`
        }}>
          <img src={imageSrc} alt={name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        </div>
        <div>
          <div style={{ fontWeight: 800, fontSize: "1rem", color: "#e8edf5", letterSpacing: "-0.03em", fontFamily: "var(--display)" }}>{name}</div>
          <div style={{ fontSize: "0.6rem", color: accent, fontFamily: "var(--mono)", letterSpacing: "0.1em", textTransform: "uppercase", marginTop: "2px" }}>{title}</div>
        </div>
      </div>
      <p style={{ fontSize: "0.78rem", color: "#4a5a72", fontFamily: "var(--mono)", lineHeight: 1.75 }}>{domain}</p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
        {skills.map(skill => (
          <span key={skill} style={{
            fontSize: "0.6rem", fontFamily: "var(--mono)", letterSpacing: "0.05em",
            padding: "0.2rem 0.65rem", borderRadius: "6px",
            background: `${accent}0c`, border: `1px solid ${accent}25`, color: `${accent}cc`
          }}>{skill}</span>
        ))}
      </div>
    </div>
  );
}

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", padding: "1.5rem 0" }}>
      <button
        onClick={() => setOpen(!open)}
        style={{ width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center", background: "none", border: "none", cursor: "pointer", textAlign: "left", gap: "1.5rem" }}
      >
        <span style={{ fontWeight: 700, fontSize: "1rem", color: "#c8d4e4", fontFamily: "var(--display)", letterSpacing: "-0.02em" }}>{q}</span>
        <div style={{
          width: "28px", height: "28px", borderRadius: "50%", flexShrink: 0,
          border: "1px solid rgba(100,200,255,0.3)", display: "flex", alignItems: "center", justifyContent: "center",
          color: "#5fc8ff", fontSize: "1rem", transition: "transform 0.25s, background 0.25s",
          transform: open ? "rotate(45deg)" : "rotate(0deg)",
          background: open ? "rgba(100,200,255,0.1)" : "transparent",
        }}>+</div>
      </button>
      <div style={{ overflow: "hidden", maxHeight: open ? "200px" : "0", transition: "max-height 0.4s cubic-bezier(0.16, 1, 0.3, 1)" }}>
        <p style={{ paddingTop: "1rem", fontSize: "0.85rem", lineHeight: 1.8, color: "#4a5a72", fontFamily: "var(--mono)" }}>{a}</p>
      </div>
    </div>
  );
}

function MockUI() {
  return (
    <div style={{ width: "100%", maxWidth: "880px", margin: "0 auto" }}>
      <div style={{
        background: "rgba(10,14,30,0.95)",
        borderRadius: "20px",
        border: "1px solid rgba(100,150,255,0.12)",
        boxShadow: "0 32px 100px rgba(80,100,255,0.12), 0 0 0 1px rgba(255,255,255,0.04)",
        overflow: "hidden",
        backdropFilter: "blur(20px)",
      }}>
        {/* Window chrome */}
        <div style={{
          background: "rgba(255,255,255,0.03)", borderBottom: "1px solid rgba(255,255,255,0.06)",
          padding: "0.9rem 1.5rem", display: "flex", alignItems: "center", gap: "0.6rem"
        }}>
          <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#ff5f57" }} />
          <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#febc2e" }} />
          <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#28c840" }} />
          <div style={{ flex: 1, textAlign: "center", fontSize: "0.7rem", color: "#3a4a62", fontFamily: "var(--mono)", letterSpacing: "0.06em" }}>aceit.app/interview</div>
          <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#5fc8ff", boxShadow: "0 0 6px #5fc8ff", animation: "blink 2s ease-in-out infinite" }} />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", minHeight: "320px" }}>
          {/* Left panel */}
          <div style={{
            background: "linear-gradient(135deg, rgba(10,14,30,1) 0%, rgba(20,25,50,0.8) 100%)",
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
            padding: "2.5rem", gap: "1.25rem", position: "relative", overflow: "hidden",
          }}>
            <div style={{
              position: "absolute", width: "300px", height: "300px", borderRadius: "50%",
              background: "radial-gradient(circle, rgba(95,200,255,0.06) 0%, transparent 70%)",
              top: "50%", left: "50%", transform: "translate(-50%,-50%)", pointerEvents: "none"
            }} />
            <div style={{
              width: "88px", height: "88px", borderRadius: "50%",
              background: "linear-gradient(135deg, #6040ff, #5fc8ff)",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 0 50px rgba(95,200,255,0.3), 0 0 100px rgba(96,64,255,0.2)",
              position: "relative"
            }}>
              <img src="/robot.png" alt="AI Interviewer" style={{ width: "52px", height: "52px", objectFit: "contain", filter: "brightness(0) invert(1) opacity(0.9)" }} />
            </div>
            <div style={{ color: "#c8d4e4", fontWeight: 700, fontSize: "0.9rem", fontFamily: "var(--display)", letterSpacing: "-0.02em" }}>AI Interviewer</div>
            <div style={{
              background: "rgba(95,200,255,0.08)", border: "1px solid rgba(95,200,255,0.2)",
              borderRadius: "99px", padding: "0.3rem 1rem", fontSize: "0.62rem",
              color: "#5fc8ff", fontFamily: "var(--mono)", letterSpacing: "0.1em",
              display: "flex", alignItems: "center", gap: "0.4rem"
            }}>
              <span style={{ width: "5px", height: "5px", borderRadius: "50%", background: "#5fc8ff", display: "inline-block", animation: "blink 1.5s ease-in-out infinite" }} />
              SPEAKING
            </div>
            <div style={{ display: "flex", gap: "1.75rem", marginTop: "0.5rem" }}>
              {[["GAZE", "88", "#5fc8ff"], ["CONF", "82", "#9b6fff"], ["CALM", "91", "#2de6a4"]].map(([l, v, c]) => (
                <div key={l} style={{ textAlign: "center" }}>
                  <svg width="52" height="52" viewBox="0 0 52 52">
                    <circle cx="26" cy="26" r="20" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="3" />
                    <circle cx="26" cy="26" r="20" fill="none" stroke={c} strokeWidth="3"
                      strokeDasharray={`${2 * Math.PI * 20 * parseInt(v) / 100} ${2 * Math.PI * 20}`}
                      strokeLinecap="round" transform="rotate(-90 26 26)"
                      style={{ filter: `drop-shadow(0 0 4px ${c})` }}
                    />
                    <text x="26" y="30" textAnchor="middle" fill={c} fontSize="10" fontFamily="monospace" fontWeight="700">{v}</text>
                  </svg>
                  <div style={{ fontSize: "0.5rem", color: "#3a4a62", letterSpacing: "0.14em", fontFamily: "monospace", marginTop: "2px" }}>{l}</div>
                </div>
              ))}
            </div>
          </div>
          {/* Right panel */}
          <div style={{ padding: "1.5rem", display: "flex", flexDirection: "column", gap: "0.875rem", borderLeft: "1px solid rgba(255,255,255,0.05)" }}>
            <div style={{ fontSize: "0.58rem", letterSpacing: "0.14em", color: "#3a4a62", fontFamily: "var(--mono)", textTransform: "uppercase", marginBottom: "0.25rem" }}>Live Transcript</div>
            {[
              { s: "AI", t: "Tell me about a challenging project you've worked on.", c: "#5fc8ff" },
              { s: "YOU", t: "Sure — I built a real-time pipeline processing 10k events/sec...", c: "#9b6fff" },
              { s: "AI", t: "How did you handle failure states?", c: "#5fc8ff" },
            ].map((m, i) => (
              <div key={i} style={{ display: "flex", gap: "0.6rem", padding: "0.6rem 0.75rem", borderRadius: "10px", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)" }}>
                <span style={{ fontSize: "0.58rem", fontFamily: "var(--mono)", fontWeight: 700, color: m.c, paddingTop: "3px", flexShrink: 0, letterSpacing: "0.06em" }}>{m.s}</span>
                <p style={{ fontSize: "0.73rem", lineHeight: 1.55, color: "#6a7a92", fontFamily: "var(--mono)" }}>{m.t}</p>
              </div>
            ))}
            <div style={{ marginTop: "auto", background: "rgba(255,77,109,0.06)", border: "1px solid rgba(255,77,109,0.2)", borderRadius: "10px", padding: "0.6rem 0.875rem", fontSize: "0.65rem", color: "#ff4d6d", fontFamily: "var(--mono)" }}>⚠ Maintain eye contact</div>
          </div>
        </div>
      </div>
    </div>
  );
}

const TESTIMONIALS = [
  { initial: "S", name: "Suchith M.", role: "ECE Student → NVIDIA Intern", accent: "#5fc8ff", text: "The gaze feedback was eye-opening. I didn't realize I look away when I'm thinking — now I consciously anchor my eyes and it makes a huge difference." },
  { initial: "J", name: "Jacob B.", role: "Career Switcher → SWE at Stripe", accent: "#9b6fff", text: "Being able to click on a stress spike and immediately hear what I was saying at that moment is genuinely brilliant." },
  { initial: "C", name: "Cooper B.", role: "CS Student", accent: "#2de6a4", text: "I went in cold for my first interview and bombed it. After three sessions with AceIt my confidence scores jumped from 54 to 83." },
  { initial: "D", name: "Darquavius S.", role: "Masters Student → Meta", accent: "#ff5fa0", text: "The AI interviewer asked me things I didn't expect — it had clearly read my resume carefully. Much harder than the real interview, honestly." },
  { initial: "A", name: "Aisha K.", role: "PM → Google L4", accent: "#ffb340", text: "I used to freeze when asked about weaknesses. AceIt replayed three moments where my voice dropped — and helped me reframe them completely." },
  { initial: "R", name: "Rohan P.", role: "Bootcamp Grad → Shopify", accent: "#5fc8ff", text: "Seeing my fidget index spike exactly when I was asked a system design question was humbling. But also incredibly useful." },
  { initial: "M", name: "Maya T.", role: "New Grad → Coinbase", accent: "#9b6fff", text: "The voice confidence breakdown showed I rush when nervous. I practiced slowing down and my offer came two weeks later." },
  { initial: "L", name: "Leo B.", role: "PhD → Quant at Jane Street", accent: "#2de6a4", text: "It caught that I avoid eye contact right after technical explanations. That's gold-level feedback you'd only get from a professional coach." },
];

function TestimonialsCloud() {
  const items = TESTIMONIALS.slice(0, 6);
  return (
    <>
      <style>{`
        @keyframes marquee { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
        .marquee-container { display: flex; width: max-content; animation: marquee 44s linear infinite; }
        .marquee-container:hover { animation-play-state: paused; }
        .t-card { transition: transform 0.3s cubic-bezier(0.2,0,0.2,1), box-shadow 0.3s ease; cursor: default; width: 330px; flex-shrink: 0; margin-right: 2rem; }
        .t-card:hover { transform: translateY(-10px) scale(1.02) !important; z-index: 10; }
      `}</style>
      <section style={{
        position: "relative", padding: "9rem 0", overflow: "hidden",
        background: "rgba(255,255,255,0.01)",
        borderTop: "1px solid rgba(255,255,255,0.05)",
        borderBottom: "1px solid rgba(255,255,255,0.05)",
        minHeight: "600px", display: "flex", flexDirection: "column", justifyContent: "center",
      }}>
        <div style={{ position: "absolute", inset: 0, pointerEvents: "none", background: "radial-gradient(ellipse 60% 60% at 20% 50%, rgba(95,200,255,0.03) 0%, transparent 60%), radial-gradient(ellipse 60% 60% at 80% 50%, rgba(155,111,255,0.03) 0%, transparent 60%)" }} />
        <div style={{ position: "relative", zIndex: 30, textAlign: "center", marginBottom: "5rem", pointerEvents: "none", padding: "0 2rem" }}>
          <div style={{ fontSize: "0.6rem", fontFamily: "var(--mono)", color: "#5fc8ff", letterSpacing: "0.16em", textTransform: "uppercase", marginBottom: "0.75rem" }}>04 — Reviews</div>
          <h2 style={{ fontSize: "clamp(2rem,3.5vw,3rem)", fontWeight: 800, letterSpacing: "-0.04em", color: "#e8edf5", fontFamily: "var(--display)" }}>Success from the source</h2>
          <p style={{ color: "#3a4a62", fontSize: "0.82rem", marginTop: "0.75rem", fontFamily: "var(--mono)" }}>Hover any card to pause</p>
        </div>
        <div style={{ position: "relative", width: "100%", overflow: "hidden" }}>
          <div className="marquee-container">
            {[...items, ...items].map((t, i) => (
              <div key={i} className="t-card" style={{
                background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)",
                borderRadius: "20px", padding: "1.75rem",
                position: "relative", overflow: "hidden",
              }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.boxShadow = `0 24px 60px ${t.accent}25`; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.boxShadow = "none"; }}
              >
                <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "1px", background: `linear-gradient(90deg, transparent, ${t.accent}60, transparent)` }} />
                <div style={{ display: "flex", alignItems: "center", gap: "0.875rem", marginBottom: "1.25rem" }}>
                  <div style={{ width: "42px", height: "42px", borderRadius: "50%", background: `${t.accent}12`, border: `1px solid ${t.accent}30`, display: "flex", alignItems: "center", justifyContent: "center", color: t.accent, fontWeight: 800, fontSize: "0.95rem", flexShrink: 0, fontFamily: "var(--display)" }}>{t.initial}</div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: "0.87rem", color: "#c8d4e4", fontFamily: "var(--display)", letterSpacing: "-0.02em" }}>{t.name}</div>
                    <div style={{ fontSize: "0.62rem", color: "#3a4a62", fontFamily: "var(--mono)", marginTop: "3px" }}>{t.role}</div>
                  </div>
                </div>
                <p style={{ fontSize: "0.8rem", lineHeight: 1.75, color: "#5a6a82", fontFamily: "var(--mono)" }}>"{t.text}"</p>
              </div>
            ))}
          </div>
          <div style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 20, background: "linear-gradient(to right, var(--bg) 0%, transparent 12%, transparent 88%, var(--bg) 100%)" }} />
        </div>
      </section>
    </>
  );
}

export default function LandingPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (isLoaded && user) router.push("/dashboard");
  }, [user, isLoaded, router]);

  const personalizedRef = useScrollReveal();
  const feedbackRef = useScrollReveal();
  const featuresRef = useScrollReveal();
  const teamRef = useScrollReveal();
  const faqRef = useScrollReveal();
  const ctaRef = useScrollReveal();
  const heroMockRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => {
      if (!heroMockRef.current) return;
      heroMockRef.current.style.transform = `translateY(-${Math.min(window.scrollY * 0.28, 80)}px)`;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800;900&family=IBM+Plex+Mono:wght@400;500&display=swap');

        :root {
          --display: 'Outfit', sans-serif;
          --mono: 'IBM Plex Mono', monospace;
          --bg: #060810;
          --surface: rgba(255,255,255,0.015);
          --border: rgba(255,255,255,0.06);
          --cyan: #5fc8ff;
          --purple: #9b6fff;
          --green: #2de6a4;
          --pink: #ff5fa0;
          --gold: #ffb340;
          --text: #e8edf5;
          --muted: #5a6a82;
        }

        * { box-sizing: border-box; margin: 0; padding: 0; }
        html { scroll-behavior: smooth; }
        body {
          background: var(--bg);
          color: var(--text);
          font-family: var(--display);
          overflow-x: hidden;
        }

        /* Subtle noise grain */
        body::before {
          content: "";
          position: fixed; inset: 0;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.045'/%3E%3C/svg%3E");
          pointer-events: none; z-index: 9999; opacity: 0.3;
        }

        /* Animated background nebula */
        body::after {
          content: "";
          position: fixed; inset: 0;
          background:
            radial-gradient(ellipse 70% 50% at 15% 20%, rgba(95,200,255,0.06) 0%, transparent 60%),
            radial-gradient(ellipse 60% 50% at 85% 70%, rgba(155,111,255,0.07) 0%, transparent 60%),
            radial-gradient(ellipse 50% 40% at 50% 50%, rgba(45,230,164,0.03) 0%, transparent 60%);
          pointer-events: none; z-index: 0; animation: nebulaDrift 20s ease-in-out infinite alternate;
        }

        @keyframes nebulaDrift {
          0% { opacity: 0.8; transform: scale(1); }
          100% { opacity: 1; transform: scale(1.05); }
        }

        @keyframes blink { 0%,100% { opacity:1; } 50% { opacity:0.3; } }

        .lp-reveal { opacity: 0; transform: translateY(24px); transition: opacity 0.65s ease-out, transform 0.65s ease-out; }
        .lp-reveal.visible { opacity: 1; transform: translateY(0); }

        .nav-link {
          color: #3a4a62; text-decoration: none; font-size: 0.82rem; font-weight: 500;
          transition: color 0.2s ease; font-family: var(--mono); letter-spacing: 0.04em;
        }
        .nav-link:hover { color: var(--cyan); }

        .btn-primary {
          display: inline-flex; align-items: center; gap: 0.5rem;
          background: linear-gradient(135deg, #5fc8ff, #9b6fff);
          color: #060810; font-family: var(--display); font-weight: 800; font-size: 0.9rem;
          padding: 0.85rem 1.85rem; border-radius: 10px; border: none; cursor: pointer;
          text-decoration: none; letter-spacing: -0.01em;
          transition: all 0.25s ease;
          box-shadow: 0 0 30px rgba(95,200,255,0.2), 0 0 60px rgba(155,111,255,0.1);
          position: relative; overflow: hidden;
        }
        .btn-primary::before {
          content: ""; position: absolute; inset: 0;
          background: linear-gradient(135deg, rgba(255,255,255,0.2), transparent);
          opacity: 0; transition: opacity 0.2s;
        }
        .btn-primary:hover { transform: translateY(-3px); box-shadow: 0 12px 40px rgba(95,200,255,0.3), 0 0 80px rgba(155,111,255,0.2); }
        .btn-primary:hover::before { opacity: 1; }

        .btn-ghost {
          display: inline-flex; align-items: center; gap: 0.5rem;
          background: transparent; color: #3a4a62; font-family: var(--mono); font-weight: 500;
          font-size: 0.8rem; padding: 0.75rem 1.35rem; border-radius: 10px;
          border: 1px solid rgba(255,255,255,0.08); cursor: pointer; text-decoration: none;
          transition: all 0.2s ease;
        }
        .btn-ghost:hover { border-color: rgba(95,200,255,0.4); color: var(--cyan); background: rgba(95,200,255,0.05); }

        @keyframes heroFadeUp { from { opacity:0; transform:translateY(36px); } to { opacity:1; transform:translateY(0); } }
        @keyframes scanLine { 0% { transform:translateY(-100%); opacity:0; } 8% { opacity:0.6; } 92% { opacity:0.6; } 100% { transform:translateY(100vh); opacity:0; } }
        @keyframes gridFadeIn { from { opacity:0; } to { opacity:1; } }
        @keyframes mockSlideUp { from { opacity:0; transform:translateY(60px); } to { opacity:1; transform:translateY(0); } }
        @keyframes floatGlow { 0%,100% { transform:scale(1) translate(-50%,-50%); opacity:0.5; } 50% { transform:scale(1.15) translate(-46%,-46%); opacity:0.9; } }
        @keyframes floatGlow2 { 0%,100% { transform:scale(1) translate(-50%,-50%); opacity:0.3; } 50% { transform:scale(1.2) translate(-54%,-54%); opacity:0.65; } }

        .hero-grid  { opacity:0; animation: gridFadeIn 2.5s ease 0.3s forwards; }
        .scan-line  { animation: scanLine 4s ease-in-out 0.8s forwards; }
        .hero-badge { opacity:0; animation: heroFadeUp 1s cubic-bezier(.16,1,.3,1) .5s forwards; }
        .hero-h1    { opacity:0; animation: heroFadeUp 1.1s cubic-bezier(.16,1,.3,1) .85s forwards; }
        .hero-sub   { opacity:0; animation: heroFadeUp 1s cubic-bezier(.16,1,.3,1) 1.3s forwards; }
        .hero-cta   { opacity:0; animation: heroFadeUp 1s cubic-bezier(.16,1,.3,1) 1.65s forwards; }
        .hero-mock  { opacity:0; animation: mockSlideUp 1.3s cubic-bezier(.16,1,.3,1) 2.1s forwards; }

        /* Gradient text utility */
        .grad-text {
          background: linear-gradient(135deg, #5fc8ff 0%, #9b6fff 50%, #ff5fa0 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        /* Section label */
        .sec-label {
          font-size: 0.6rem; font-family: var(--mono); letter-spacing: 0.18em;
          text-transform: uppercase; color: var(--cyan); margin-bottom: 1rem;
          display: flex; align-items: center; gap: 0.6rem;
        }
        .sec-label::before {
          content: ""; display: block; width: 20px; height: 1px;
          background: linear-gradient(90deg, var(--cyan), transparent);
        }
      `}</style>

      {/* ── NAV ── */}
      <nav style={{
        position: "sticky", top: 0, zIndex: 100,
        background: "rgba(6,8,16,0.8)", backdropFilter: "blur(20px) saturate(1.5)",
        borderBottom: "1px solid rgba(255,255,255,0.05)",
        padding: "0 3rem", height: "68px",
        display: "flex", alignItems: "center", justifyContent: "space-between"
      }}>
        <div style={{ fontWeight: 900, fontSize: "1.3rem", letterSpacing: "-0.04em", fontFamily: "var(--display)" }}>
          Ace<span className="grad-text">It</span>
        </div>
        <div style={{ display: "flex", gap: "2.5rem" }}>
          {["#features|Features", "#feedback|How it works", "#team|Team", "#faq|FAQ"].map(item => {
            const [href, label] = item.split("|");
            return <a key={href} href={href} className="nav-link">{label}</a>;
          })}
        </div>
        <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
          <SignedOut>
            <SignInButton mode="modal"><button className="btn-ghost">Log in</button></SignInButton>
            <SignUpButton mode="modal"><button className="btn-primary">Get started →</button></SignUpButton>
          </SignedOut>
          <SignedIn>
            <Link href="/interviewer-selection" className="btn-primary">Start interview →</Link>
            <UserButton afterSignOutUrl="/" />
          </SignedIn>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section style={{ minHeight: "100vh", position: "relative", display: "flex", flexDirection: "column", alignItems: "flex-start", justifyContent: "center", padding: "8rem 3rem 4rem", overflow: "hidden" }}>

        {/* Grid bg */}
        <div className="hero-grid" style={{
          position: "absolute", inset: 0, zIndex: 0,
          backgroundImage: "linear-gradient(rgba(95,200,255,0.035) 1px,transparent 1px),linear-gradient(90deg,rgba(95,200,255,0.035) 1px,transparent 1px)",
          backgroundSize: "80px 80px",
          maskImage: "radial-gradient(ellipse 90% 80% at 30% 40%,black 10%,transparent 80%)",
          WebkitMaskImage: "radial-gradient(ellipse 90% 80% at 30% 40%,black 10%,transparent 80%)",
        }} />

        {/* Scan line */}
        <div className="scan-line" style={{ position: "absolute", left: 0, right: 0, height: "1px", zIndex: 1, background: "linear-gradient(90deg,transparent,rgba(95,200,255,0.7),rgba(155,111,255,0.5),transparent)", pointerEvents: "none" }} />

        {/* Orbs */}
        <div style={{ position: "absolute", width: "700px", height: "700px", borderRadius: "50%", zIndex: 0, background: "radial-gradient(circle,rgba(95,200,255,0.08) 0%,transparent 65%)", top: "10%", left: "50%", transformOrigin: "0 0", animation: "floatGlow 7s ease-in-out infinite", pointerEvents: "none" }} />
        <div style={{ position: "absolute", width: "550px", height: "550px", borderRadius: "50%", zIndex: 0, background: "radial-gradient(circle,rgba(155,111,255,0.09) 0%,transparent 65%)", top: "25%", left: "62%", transformOrigin: "0 0", animation: "floatGlow2 9s ease-in-out infinite", pointerEvents: "none" }} />

        {/* Content */}
        <div style={{ position: "relative", zIndex: 2, maxWidth: "760px" }}>
          <div className="hero-badge" style={{ display: "inline-flex", alignItems: "center", gap: "0.6rem", background: "rgba(95,200,255,0.06)", border: "1px solid rgba(95,200,255,0.16)", borderRadius: "8px", padding: "0.35rem 1rem", marginBottom: "2.5rem" }}>
            <span style={{ width: "5px", height: "5px", borderRadius: "50%", background: "var(--cyan)", display: "inline-block", boxShadow: "0 0 8px var(--cyan)", animation: "blink 2s ease-in-out infinite" }} />
            <span style={{ fontSize: "0.68rem", color: "var(--cyan)", fontFamily: "var(--mono)", letterSpacing: "0.1em" }}>MULTIMODAL CONFIDENCE ANALYSIS — NOW LIVE</span>
          </div>

          <h1 className="hero-h1" style={{ fontSize: "clamp(3.5rem,7.5vw,6.5rem)", fontWeight: 900, lineHeight: 0.98, letterSpacing: "-0.05em", color: "var(--text)", marginBottom: "1.75rem" }}>
            Ace your<br />
            <span className="grad-text">next interview.</span>
          </h1>

          <p className="hero-sub" style={{ fontSize: "1.05rem", color: "#4a5a72", maxWidth: "460px", lineHeight: 1.8, marginBottom: "3rem", fontFamily: "var(--mono)" }}>
            AI-powered mock interviews that analyze your voice, gaze, and body language in real-time — then coach you to close the gap.
          </p>

          <div className="hero-cta" style={{ display: "flex", gap: "1rem", alignItems: "center", marginBottom: "6rem" }}>
            <Link href="/interviewer-selection" className="btn-primary">Start my interview →</Link>
            <span style={{ fontSize: "0.75rem", color: "#2a3a52", fontFamily: "var(--mono)" }}>No account needed</span>
          </div>
        </div>

        {/* Mock UI below */}
        <div className="hero-mock" ref={heroMockRef} style={{ width: "100%", position: "relative", zIndex: 2 }}>
          <MockUI />
        </div>
      </section>

      {/* ── STATS STRIP ── */}
      <div style={{
        borderTop: "1px solid rgba(255,255,255,0.05)", borderBottom: "1px solid rgba(255,255,255,0.05)",
        padding: "2.5rem 3rem",
        display: "flex", justifyContent: "center", gap: "5rem",
        background: "rgba(255,255,255,0.015)", position: "relative", zIndex: 1,
      }}>
        {[["10k+", "Interviews completed"], ["94%", "Report accuracy"], ["<500ms", "AI response time"], ["3x", "Faster offer rates"]].map(([val, label]) => (
          <div key={label} style={{ textAlign: "center" }}>
            <div style={{ fontSize: "1.8rem", fontWeight: 900, letterSpacing: "-0.04em", background: "linear-gradient(135deg, #5fc8ff, #9b6fff)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>{val}</div>
            <div style={{ fontSize: "0.68rem", color: "#2a3a52", fontFamily: "var(--mono)", marginTop: "0.3rem", letterSpacing: "0.04em" }}>{label}</div>
          </div>
        ))}
      </div>

      {/* ── PERSONALIZED ── */}
      <section id="features" style={{ padding: "11rem 3rem", maxWidth: "1200px", margin: "0 auto" }}>
        <div ref={personalizedRef.ref} className={`lp-reveal ${personalizedRef.visible ? "visible" : ""}`} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6rem", alignItems: "center" }}>
          {/* Card */}
          <div style={{ background: "rgba(255,255,255,0.02)", borderRadius: "24px", border: "1px solid rgba(255,255,255,0.07)", padding: "2rem", position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "1px", background: "linear-gradient(90deg, transparent, rgba(95,200,255,0.5), transparent)" }} />
            <div style={{ fontSize: "0.6rem", fontFamily: "var(--mono)", color: "#2a3a52", marginBottom: "1.25rem", letterSpacing: "0.14em", textTransform: "uppercase" }}>Session Context</div>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}>
              {[
                { icon: "/file.png", title: "CV uploaded", sub: "resume_2025.pdf · 142 KB", color: "#5fc8ff" },
                { icon: "/briefcase.png", title: "Job listing imported", sub: "Software Engineer · Stripe", color: "#2de6a4" },
              ].map((item) => (
                <div key={item.title} style={{ display: "flex", alignItems: "center", gap: "0.875rem", background: "rgba(255,255,255,0.025)", borderRadius: "12px", padding: "0.875rem 1rem", border: "1px solid rgba(255,255,255,0.06)" }}>
                  <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: `${item.color}10`, border: `1px solid ${item.color}25`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <img src={item.icon} alt={item.title} style={{ width: "18px", height: "18px", objectFit: "contain", filter: "brightness(0) invert(1) opacity(0.8)" }} />
                  </div>
                  <div>
                    <div style={{ fontSize: "0.82rem", fontWeight: 700, color: "#c8d4e4", fontFamily: "var(--display)", letterSpacing: "-0.02em" }}>{item.title}</div>
                    <div style={{ fontSize: "0.66rem", color: "#2a3a52", fontFamily: "var(--mono)" }}>{item.sub}</div>
                  </div>
                  <div style={{ marginLeft: "auto", fontSize: "0.8rem", color: "#2de6a4" }}>✓</div>
                </div>
              ))}
            </div>
            <div style={{ marginTop: "1.25rem", padding: "0.875rem 1rem", background: "rgba(95,200,255,0.04)", borderRadius: "12px", border: "1px dashed rgba(95,200,255,0.18)" }}>
              <div style={{ fontSize: "0.7rem", color: "#5fc8ff", fontFamily: "var(--mono)" }}>✦ Generating bespoke interview persona...</div>
            </div>
          </div>
          <div>
            <div className="sec-label">01 — Personalization</div>
            <h2 style={{ fontSize: "clamp(2rem,3.2vw,2.8rem)", fontWeight: 900, lineHeight: 1.1, letterSpacing: "-0.04em", color: "#e8edf5", marginBottom: "1.25rem", fontFamily: "var(--display)" }}>Instantly personalised interviews</h2>
            <p style={{ fontSize: "0.9rem", color: "#4a5a72", lineHeight: 1.85, marginBottom: "2rem", fontFamily: "var(--mono)" }}>Upload your resume and paste any job description. AceIt generates a bespoke interviewer with tailored technical and behavioral questions — specific to the exact role.</p>
            <Link href="/interviewer-selection" className="btn-primary" style={{ fontSize: "0.85rem", padding: "0.7rem 1.4rem" }}>Try it now →</Link>
          </div>
        </div>
      </section>

      {/* ── FEEDBACK ── */}
      <section id="feedback" style={{ padding: "9rem 3rem", background: "rgba(255,255,255,0.01)", borderTop: "1px solid rgba(255,255,255,0.05)", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          <div ref={feedbackRef.ref} className={`lp-reveal ${feedbackRef.visible ? "visible" : ""}`} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6rem", alignItems: "center" }}>
            <div>
              <div className="sec-label">02 — Feedback</div>
              <h2 style={{ fontSize: "clamp(2rem,3.2vw,2.8rem)", fontWeight: 900, lineHeight: 1.1, letterSpacing: "-0.04em", color: "#e8edf5", marginBottom: "1.25rem", fontFamily: "var(--display)" }}>Actionable, timestamped coaching</h2>
              <p style={{ fontSize: "0.9rem", color: "#4a5a72", lineHeight: 1.85, fontFamily: "var(--mono)" }}>Every session produces a timestamped report that cross-references your transcript with biometric signals — so you know exactly when and why your confidence dipped.</p>
            </div>
            <div style={{ background: "rgba(255,255,255,0.02)", borderRadius: "24px", padding: "2.5rem", border: "1px solid rgba(255,255,255,0.07)", position: "relative", overflow: "hidden" }}>
              <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "1px", background: "linear-gradient(90deg, transparent, rgba(155,111,255,0.5), transparent)" }} />
              <div style={{ fontSize: "0.6rem", fontFamily: "var(--mono)", color: "#2a3a52", marginBottom: "2rem", letterSpacing: "0.14em", textTransform: "uppercase" }}>Performance Breakdown</div>
              <SkillBar label="Communication" value={87} color="#5fc8ff" visible={feedbackRef.visible} />
              <SkillBar label="Confidence" value={74} color="#9b6fff" visible={feedbackRef.visible} />
              <SkillBar label="Problem solving" value={91} color="#2de6a4" visible={feedbackRef.visible} />
              <SkillBar label="Technical ability" value={82} color="#ff5fa0" visible={feedbackRef.visible} />
            </div>
          </div>
        </div>
      </section>

      {/* ── FEATURES GRID ── */}
      <section style={{ padding: "11rem 3rem", maxWidth: "1200px", margin: "0 auto" }}>
        <div ref={featuresRef.ref} className={`lp-reveal ${featuresRef.visible ? "visible" : ""}`}>
          <div style={{ textAlign: "center", marginBottom: "5rem" }}>
            <div className="sec-label" style={{ justifyContent: "center" }}>03 — Features</div>
            <h2 style={{ fontSize: "clamp(2rem,3.5vw,3rem)", fontWeight: 900, lineHeight: 1.1, letterSpacing: "-0.04em", color: "#e8edf5", fontFamily: "var(--display)" }}>Practice makes perfect</h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(250px,1fr))", gap: "1.25rem" }}>
            <FeatureCard index={0} icon="/microphone.png" title="Voice chat" accent="#5fc8ff" desc="Speak naturally with an AI interviewer powered by GPT-4o and ElevenLabs — sub-500ms response time, no typing required." />
            <FeatureCard index={1} icon="/robot.png" title="Powerful interviewer" accent="#9b6fff" desc="Your resume and job description shape a bespoke interviewer that asks questions specific to your experience and the role." />
            <FeatureCard index={2} icon="/bar-chart.png" title="Constructive feedback" accent="#2de6a4" desc="Timestamped coaching tied to the exact moment you looked away, rushed your words, or showed stress in your posture." />
            <FeatureCard index={3} icon="/chart.png" title="Get better" accent="#ff5fa0" desc="Track gaze stability, voice confidence, and composure across sessions and watch your scores improve over time." />
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <TestimonialsCloud />

      {/* ── TEAM ── */}
      <section id="team" style={{ padding: "11rem 3rem", maxWidth: "1200px", margin: "0 auto" }}>
        <div ref={teamRef.ref} className={`lp-reveal ${teamRef.visible ? "visible" : ""}`}>
          <div style={{ textAlign: "center", marginBottom: "5rem" }}>
            <div className="sec-label" style={{ justifyContent: "center" }}>05 — Team</div>
            <h2 style={{ fontSize: "clamp(2rem,3.5vw,3rem)", fontWeight: 900, letterSpacing: "-0.04em", color: "#e8edf5", marginBottom: "1rem", fontFamily: "var(--display)" }}>Built by engineers,<br />for candidates.</h2>
            <p style={{ fontSize: "0.82rem", color: "#2a3a52", fontFamily: "var(--mono)", maxWidth: "420px", margin: "0 auto", lineHeight: 1.8 }}>Four people. One hackathon. A shared belief that interview prep should be as sophisticated as the interviews themselves.</p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(250px,1fr))", gap: "1.25rem" }}>
            <TeamCard name="Konrád" imageSrc="/konrad.png" title="Systems & Frontend Architect" accent="#5fc8ff" domain="Builds the infrastructure that holds everything together — WebRTC signaling, global state orchestration, and the synchronized analytics dashboard." skills={["Next.js", "WebRTC", "Zustand", "Recharts", "Supabase"]} />
            <TeamCard name="Jason" imageSrc="/jason.png" title="Audio & Intelligence Orchestrator" accent="#9b6fff" domain="Runs the conversational brain — RAG ingestion, cascading GPT-4o streams, ElevenLabs voice synthesis, and Whisper word-level timestamps." skills={["FastAPI", "GPT-4o", "Whisper", "ElevenLabs", "LangChain"]} />
            <TeamCard name="Mitch" imageSrc="/mitch.png" title="Computer Vision Engineer" accent="#2de6a4" domain="Extracts meaning from 468 facial landmarks in real time — gaze vectors, head pose, and fidget index — streamed live via WebRTC DataChannels." skills={["MediaPipe", "OpenCV", "Flask", "PyTorch", "NumPy"]} />
            <TeamCard name="Rocky" imageSrc="/rocky.png" title="Business Lead" accent="#ff5fa0" domain="Keeps the team pointed at what matters — market positioning, pitch deck, user testimonials, and making sure the demo lands with the judges." skills={["Strategy", "Pitch Deck", "User Research", "Data"]} />
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section id="faq" style={{ padding: "9rem 3rem", background: "rgba(255,255,255,0.01)", borderTop: "1px solid rgba(255,255,255,0.05)", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
        <div style={{ maxWidth: "680px", margin: "0 auto" }}>
          <div ref={faqRef.ref} className={`lp-reveal ${faqRef.visible ? "visible" : ""}`}>
            <div style={{ textAlign: "center", marginBottom: "4rem" }}>
              <div className="sec-label" style={{ justifyContent: "center" }}>06 — FAQ</div>
              <h2 style={{ fontSize: "clamp(2rem,3.2vw,2.8rem)", fontWeight: 900, letterSpacing: "-0.04em", color: "#e8edf5", fontFamily: "var(--display)" }}>Common questions</h2>
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
      <section style={{ background: "var(--bg)", padding: "12rem 3rem", textAlign: "center", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", width: "800px", height: "800px", borderRadius: "50%", background: "radial-gradient(circle,rgba(95,200,255,0.05) 0%,transparent 65%)", top: "50%", left: "50%", transform: "translate(-50%,-50%)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", width: "600px", height: "600px", borderRadius: "50%", background: "radial-gradient(circle,rgba(155,111,255,0.06) 0%,transparent 65%)", top: "50%", left: "50%", transform: "translate(-50%,-50%)", pointerEvents: "none" }} />
        <div ref={ctaRef.ref} className={`lp-reveal ${ctaRef.visible ? "visible" : ""}`} style={{ position: "relative", zIndex: 1 }}>
          <div style={{ fontSize: "0.6rem", fontFamily: "var(--mono)", color: "#5fc8ff", letterSpacing: "0.18em", textTransform: "uppercase", marginBottom: "2rem", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.6rem" }}>
            <span style={{ width: "5px", height: "5px", borderRadius: "50%", background: "#5fc8ff", display: "inline-block", animation: "blink 2s ease-in-out infinite" }} />
            Ready when you are
          </div>
          <h2 style={{ fontSize: "clamp(3rem,7vw,6rem)", fontWeight: 900, letterSpacing: "-0.05em", color: "#e8edf5", marginBottom: "1.25rem", lineHeight: 1.0, fontFamily: "var(--display)" }}>
            Get the job of<br /><span className="grad-text">your dreams.</span>
          </h2>
          <p style={{ fontSize: "0.9rem", color: "#2a3a52", marginBottom: "3rem", fontFamily: "var(--mono)" }}>No fluff. No filler. Just better interviews.</p>
          <Link href="/interviewer-selection" className="btn-primary" style={{ fontSize: "1rem", padding: "1.1rem 2.75rem" }}>Start for free →</Link>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ background: "rgba(255,255,255,0.01)", borderTop: "1px solid rgba(255,255,255,0.05)", padding: "2.5rem 3rem" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
          <div style={{ fontWeight: 900, fontSize: "1.2rem", letterSpacing: "-0.04em", fontFamily: "var(--display)" }}>
            Ace<span className="grad-text">It</span>
          </div>
          <div style={{ display: "flex", gap: "2.5rem" }}>
            {["#features|Features", "#team|Team", "#faq|FAQ"].map(item => {
              const [href, label] = item.split("|");
              return <a key={href} href={href} className="nav-link">{label}</a>;
            })}
            <Link href="/interviewer-selection" className="nav-link">Start interview</Link>
          </div>
          <div style={{ fontSize: "0.68rem", color: "#1a2a3a", fontFamily: "var(--mono)" }}>© 2026 AceIt · Built for good interviews</div>
        </div>
      </footer>
    </>
  );
}