"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useInterviewStore } from "@/store/useInterviewStore";
import Link from "next/link";

const DIFFICULTY_MAP: Record<string, number> = {
    "Easy": 1,
    "Medium": 2,
    "Medium/Hard": 2.5,
    "Hard": 3,
    "Very Hard": 4,
    "Insane": 5,
};

const SECTORS = [
    { id: "tech", name: "Technology", icon: "💻", desc: "Software, hardware, AI, internet services, cybersecurity, etc.", color: "var(--cyan)" },
    { id: "health", name: "Healthcare", icon: "🏥", desc: "Hospitals, pharmaceuticals, biotech, medical devices, health insurance.", color: "#ff8a65" },
    { id: "finance", name: "Financial Services", icon: "💰", desc: "Banking, investing, fintech, payments, asset management.", color: "var(--pink)" },
    { id: "industrial", name: "Industrial / Real Economy", icon: "🏗️", desc: "Manufacturing, energy, transportation, construction, agriculture, utilities.", color: "#4db6ac" },
];

const INTERVIEWERS = [
    { id: "01_tech_pragmatist", sector: "tech", name: "The Pragmatic Lead", role: "Software Engineering", difficulty: "Medium", traits: "Practical, Direct", color: "var(--cyan)" },
    { id: "02_quant_trader", sector: "finance", name: "The Intense Quant", role: "Finance / Trading", difficulty: "Very Hard", traits: "Aggressive, Analytical", color: "var(--pink)" },
    { id: "03_hr_recruiter", sector: "tech", name: "The Empathetic Recruiter", role: "Human Resources", difficulty: "Easy", traits: "Warm, Supportive", color: "var(--green)" },
    { id: "04_startup_founder", sector: "tech", name: "The Visionary Founder", role: "Startup / Tech", difficulty: "Hard", traits: "Energetic, Demanding", color: "var(--purple)" },
    { id: "05_medical_chief", sector: "health", name: "The Medical Chief", role: "Healthcare", difficulty: "Hard", traits: "Risk-Averse, Ethical", color: "#ff8a65" },
    { id: "06_creative_director", sector: "tech", name: "The Creative Director", role: "Design / Arts", difficulty: "Medium", traits: "Intuitive, Visual", color: "#ce93d8" },
    { id: "07_seasoned_lawyer", sector: "industrial", name: "The Seasoned Lawyer", role: "Legal", difficulty: "Hard", traits: "Skeptical, Precise", color: "#90a4ae" },
    { id: "08_sales_director", sector: "finance", name: "The Sales Director", role: "Sales / Business", difficulty: "Medium", traits: "Charismatic, Results-Driven", color: "#ffd54f" },
    { id: "09_mechanical_lead", sector: "industrial", name: "The Mechanical Lead", role: "Engineering", difficulty: "Medium", traits: "Structural, Logical", color: "#4db6ac" },
    { id: "10_data_scientist", sector: "tech", name: "The Data Scientist", role: "Data / AI", difficulty: "Hard", traits: "Theoretical, Curious", color: "#7986cb" },
    { id: "11_meta_hacker", sector: "tech", name: "The Meta Hacker", role: "Security / Systems", difficulty: "Insane", traits: "Brilliant, Chaotic", color: "#00e5ff" },
    { id: "12_river_manager", sector: "industrial", name: "The Operation Manager", role: "Logistics", difficulty: "Medium", traits: "Efficient, Strict", color: "#81c784" },
    { id: "13_orchard_perfectionist", sector: "industrial", name: "The Quality Lead", role: "Manufacturing", difficulty: "Hard", traits: "Meticulous, Stubborn", color: "#aed581" },
    { id: "14_searchco_architect", sector: "tech", name: "The Search Architect", role: "Big Tech", difficulty: "Very Hard", traits: "Scale-Obsessed, Cold", color: "#64b5f6" },
    { id: "15_streamflix_chaos", sector: "tech", name: "The Chaos Engineer", role: "SRE / Cloud", difficulty: "Hard", traits: "Panic-Driven, Sharp", color: "#e57373" },
    { id: "16_cyber_red_teamer", sector: "tech", name: "The Red Teamer", role: "Cybersecurity", difficulty: "Very Hard", traits: "Invasive, Cunning", color: "#ba68c8" },
    { id: "17_devops_evangelist", sector: "tech", name: "The DevOps Zealot", role: "Infrastructure", difficulty: "Medium", traits: "Process-Heavy, Loud", color: "#4fc3f7" },
    { id: "18_kernel_hacker", sector: "tech", name: "The Kernel Guru", role: "Low-Level Systems", difficulty: "Very Hard", traits: "Minimalist, Deep", color: "#a1887f" },
    { id: "19_ml_postdoc", sector: "tech", name: "The ML Researcher", role: "Academic AI", difficulty: "Hard", traits: "Nuanced, Skeptical", color: "#dce775" },
    { id: "20_google_engineer", sector: "tech", name: "The L6 Engineer", role: "Big Tech G", difficulty: "Hard", traits: "Standardized, Methodical", color: "#4285f4" },
    { id: "21_microsoft_architect", sector: "tech", name: "The Enterprise Architect", role: "Big Tech M", difficulty: "Hard", traits: "Complex, Scalable", color: "#0078d4" },
];

export default function InterviewerSelectionPage() {
    const router = useRouter();
    const { setInterviewerPersona, interviewerPersona, setRole, setCompany } = useInterviewStore();
    const [selectedSector, setSelectedSector] = useState<string | null>(null);
    const [hovered, setHovered] = useState<string | null>(null);

    const handleSelect = (inter: typeof INTERVIEWERS[0]) => {
        setInterviewerPersona(inter.id);
        setRole(inter.role);
        const sectorName = SECTORS.find(s => s.id === selectedSector)?.name || "AceIt";
        setCompany(sectorName);
        router.push("/upload");
    };

    const filteredInterviewers = selectedSector
        ? INTERVIEWERS.filter((i) => i.sector === selectedSector).sort(
            (a, b) => (DIFFICULTY_MAP[a.difficulty] || 0) - (DIFFICULTY_MAP[b.difficulty] || 0)
        )
        : [];

    return (
        <div style={{ minHeight: "100vh", background: "#080b12", color: "#e8edf5", padding: "4rem 2rem", fontFamily: "'Syne', sans-serif" }}>
            <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=DM+Mono:wght@400;500&display=swap');
        .selection-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 1.5rem;
          max-width: 1400px;
          margin: 0 auto;
        }
        .sector-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
          gap: 2rem;
          max-width: 1200px;
          margin: 0 auto;
        }
        .interviewer-card, .sector-card {
          background: #0e1420;
          border: 1px solid #1e2a3a;
          border-radius: 16px;
          padding: 1.5rem;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
          position: relative;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        .interviewer-card:hover, .sector-card:hover {
          transform: translateY(-5px);
          border-color: var(--card-color);
          box-shadow: 0 12px 40px rgba(0,0,0,0.4), 0 0 20px var(--card-color-low);
        }
        .interviewer-card.selected {
          border-color: var(--card-color);
          background: #121a2a;
          box-shadow: 0 0 30px var(--card-color-med);
        }
        .difficulty-badge {
          font-family: 'DM Mono', monospace;
          font-size: 0.65rem;
          padding: 0.2rem 0.6rem;
          border-radius: 4px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
      `}</style>

            <div style={{ maxWidth: "1400px", margin: "0 auto", marginBottom: "4rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div>
                        <Link href="/" style={{ color: "#5a6a82", textDecoration: "none", fontSize: "0.8rem", fontFamily: "'DM Mono', monospace", marginBottom: "2rem", display: "block" }}>← BACK TO HOME</Link>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", background: "rgba(0,229,255,0.06)", border: "1px solid rgba(0,229,255,0.18)", borderRadius: "6px", padding: "0.3rem 0.9rem", marginBottom: "1.5rem", width: "fit-content" }}>
                            <span style={{ fontSize: "0.72rem", color: "#00e5ff", fontFamily: "'DM Mono', monospace", letterSpacing: "0.08em" }}>
                                {!selectedSector ? "STEP 01 — CHOOSE YOUR SECTOR" : "STEP 02 — SELECT YOUR PERSONA"}
                            </span>
                        </div>
                        <h1 style={{ fontSize: "clamp(2.5rem, 5vw, 4rem)", fontWeight: 800, letterSpacing: "-0.04em", marginBottom: "1rem" }}>
                            {!selectedSector ? <>Pick your <span>industry.</span></> : <>Choose your <span>interviewer.</span></>}
                        </h1>
                        <p style={{ color: "#5a6a82", fontSize: "1.1rem", maxWidth: "600px", lineHeight: 1.6, fontFamily: "'DM Mono', monospace" }}>
                            {!selectedSector
                                ? "First, tell us which sector you are interviewing in. We'll show you relevant interviewer personas."
                                : `Showing the best ${SECTORS.find(s => s.id === selectedSector)?.name} interviewers, sorted by difficulty.`}
                        </p>
                    </div>
                    {selectedSector && (
                        <button
                            onClick={() => setSelectedSector(null)}
                            style={{ background: "none", border: "1px solid #1e2a3a", color: "#e8edf5", fontFamily: "'DM Mono', monospace", fontSize: "0.8rem", padding: "0.6rem 1.2rem", borderRadius: "8px", cursor: "pointer", transition: "all 0.2s" }}
                            onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--cyan)")}
                            onMouseLeave={(e) => (e.currentTarget.style.borderColor = "#1e2a3a")}
                        >
                            ← BACK TO SECTORS
                        </button>
                    )}
                </div>
            </div>

            {!selectedSector ? (
                <div className="sector-grid">
                    {SECTORS.map((s) => (
                        <div
                            key={s.id}
                            className="sector-card"
                            style={{ "--card-color": s.color, "--card-color-low": `${s.color}15` } as any}
                            onClick={() => setSelectedSector(s.id)}
                        >
                            <div style={{ fontSize: "2.5rem", marginBottom: "0.5rem" }}>{s.icon}</div>
                            <h3 style={{ fontSize: "1.4rem", fontWeight: 800 }}>{s.name}</h3>
                            <p style={{ fontSize: "0.9rem", color: "#5a6a82", lineHeight: 1.6, fontFamily: "'DM Mono', monospace" }}>{s.desc}</p>
                            <div style={{ marginTop: "auto", alignSelf: "flex-end" }}>
                                <div style={{ fontSize: "0.75rem", fontFamily: "'DM Mono', monospace", color: s.color }}>VIEW ROLES →</div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="selection-grid">
                    {filteredInterviewers.map((inter) => (
                        <div
                            key={inter.id}
                            className={`interviewer-card ${interviewerPersona === inter.id ? "selected" : ""}`}
                            style={{ "--card-color": inter.color, "--card-color-low": `${inter.color}15`, "--card-color-med": `${inter.color}30` } as any}
                            onClick={() => handleSelect(inter)}
                            onMouseEnter={() => setHovered(inter.id)}
                            onMouseLeave={() => setHovered(null)}
                        >
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                                <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: `${inter.color}15`, border: `1px solid ${inter.color}30`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.2rem" }}>
                                    {inter.id.startsWith("01") ? "🔧" : inter.id.startsWith("02") ? "📈" : inter.id.startsWith("03") ? "🤝" : inter.id.startsWith("04") ? "🚀" : inter.id.startsWith("05") ? "🩺" : inter.id.startsWith("06") ? "🎨" : inter.id.startsWith("07") ? "⚖️" : inter.id.startsWith("08") ? "💼" : inter.id.startsWith("09") ? "🔩" : inter.id.startsWith("10") ? "📊" : inter.id.startsWith("11") ? "💻" : inter.id.startsWith("12") ? "📦" : inter.id.startsWith("13") ? "🍎" : inter.id.startsWith("14") ? "🔍" : inter.id.startsWith("15") ? "🍿" : inter.id.startsWith("16") ? "🕵️" : inter.id.startsWith("17") ? "♾️" : inter.id.startsWith("18") ? "🐧" : inter.id.startsWith("19") ? "🎓" : inter.id.startsWith("20") ? "G" : "M"}
                                </div>
                                <div className="difficulty-badge" style={{ background: inter.difficulty.includes("Hard") ? "rgba(255,77,109,0.1)" : inter.difficulty.includes("Easy") ? "rgba(0,224,150,0.1)" : "rgba(0,229,255,0.1)", color: inter.difficulty.includes("Hard") ? "#ff4d6d" : inter.difficulty.includes("Easy") ? "#00e096" : "#00e5ff", border: `1px solid ${inter.difficulty.includes("Hard") ? "rgba(255,77,109,0.2)" : inter.difficulty.includes("Easy") ? "rgba(0,224,150,0.2)" : "rgba(0,229,255,0.2)"}` }}>
                                    {inter.difficulty}
                                </div>
                            </div>

                            <div>
                                <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#e8edf5", marginBottom: "0.25rem" }}>{inter.name}</h3>
                                <p style={{ fontSize: "0.75rem", color: "#5a6a82", fontFamily: "'DM Mono', monospace", textTransform: "uppercase", letterSpacing: "0.05em" }}>{inter.role}</p>
                            </div>

                            <div style={{ fontSize: "0.85rem", color: "#8899aa", lineHeight: 1.5, fontFamily: "'DM Mono', monospace", borderTop: "1px solid #1e2a3a", paddingTop: "0.75rem" }}>
                                <span style={{ color: inter.color, fontWeight: 600 }}>Traits:</span> {inter.traits}
                            </div>

                            <div style={{ marginTop: "auto", alignSelf: "flex-end" }}>
                                <div style={{ fontSize: "0.7rem", fontFamily: "'DM Mono', monospace", color: hovered === inter.id ? inter.color : "transparent", transition: "color 0.2s" }}>SELECT PERSONA →</div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
