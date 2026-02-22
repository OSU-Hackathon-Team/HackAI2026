"use client";
import React from "react";
import ReactMarkdown from "react-markdown";

interface IntelligenceReportProps {
    content: string;
}

const C = {
    teal: "#00f2ff",
    pink: "#ff00ea",
    green: "#caff00",
    white: "#ffffff",
    muted: "rgba(255, 255, 255, 0.3)",
    border: "rgba(0, 242, 255, 0.15)",
    card: "rgba(5, 7, 26, 0.6)",
};

export function IntelligenceReport({ content }: IntelligenceReportProps) {
    // Split by horizontal rules
    const segments = content.split(/\n---\n|\n---+\n/).filter(s => s.trim().length > 0);

    // If only one segment or no separators, try to split by TIMESTAMP:
    let finalSegments = segments;
    if (segments.length <= 2 && content.includes("TIMESTAMP:")) {
        const parts = content.split(/\n(?=\*\*TIMESTAMP:\*\*|\*\*TIMESTAMP:)/);
        if (parts.length > 1) {
            finalSegments = parts.map(p => p.trim()).filter(p => p.length > 0);
        }
    }

    const isAnalysis = (text: string) => text.includes("TIMESTAMP:") || text.includes("WHAT YOU DID:");
    const summarySegment = finalSegments.find(s => !isAnalysis(s));
    const analysisSegments = finalSegments.filter(s => isAnalysis(s));

    return (
        <div style={{ display: "grid", gridTemplateColumns: "350px 1fr", gap: "3rem", alignItems: "flex-start" }}>
            {/* ── LEFT: EXECUTIVE OVERVIEW ── */}
            <aside style={{ position: "sticky", top: "2rem", display: "flex", flexDirection: "column", gap: "2rem" }}>
                <div className="fade-up">
                    <div style={{ fontFamily: "var(--font-mono)", color: C.teal, fontSize: "0.6rem", letterSpacing: "0.4em", fontWeight: 800, marginBottom: "0.75rem" }}>
                        [ ANALYSIS_ENG_V3 ]
                    </div>
                    <h2 style={{ fontFamily: "var(--font-display)", fontSize: "2.8rem", fontWeight: 900, lineHeight: 0.9, color: "#fff", textTransform: "uppercase", margin: 0 }}>
                        EXECUTIVE<br /><span style={{ color: C.teal }}>SUMMARY</span>
                    </h2>
                </div>

                {summarySegment && (
                    <div className="fade-up" style={{ animationDelay: "0.1s", background: C.card, padding: "1.5rem", borderLeft: `3px solid ${C.teal}`, borderRight: `1px solid ${C.border}`, borderTop: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}`, borderRadius: "0px" }}>
                        <ReactMarkdown components={{
                            p: ({ node, ...props }) => <p style={{ marginBottom: "1rem", fontFamily: "var(--font-body)", fontSize: "0.95rem", lineHeight: 1.6, color: "rgba(255,255,255,0.7)" }} {...props} />,
                            strong: ({ ...props }) => <strong style={{ color: C.teal, fontWeight: 700 }} {...props} />
                        }}>
                            {summarySegment}
                        </ReactMarkdown>
                    </div>
                )}

                <div className="fade-up" style={{ animationDelay: "0.2s" }}>
                    <div style={{ border: `1px solid ${C.border}`, padding: "1.25rem", background: "rgba(0,242,255,0.03)", position: "relative" }}>
                        <div style={{ position: "absolute", top: -1, left: -1, width: 8, height: 8, borderTop: `2px solid ${C.teal}`, borderLeft: `2px solid ${C.teal}` }} />
                        <div style={{ position: "absolute", bottom: -1, right: -1, width: 8, height: 8, borderBottom: `2px solid ${C.teal}`, borderRight: `2px solid ${C.teal}` }} />
                        <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.55rem", color: C.muted, marginBottom: "0.75rem", letterSpacing: "0.2em" }}>SYSTEM_DIAGNOSTICS</div>
                        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                            <MetricItem label="SEMANTIC_STABILITY" value="OPTIMAL" />
                            <MetricItem label="EMOTIONAL_FLIGHT" value="RESTRAINED" />
                            <MetricItem label="RESPONSE_LATENCY" value="NOMINAL" />
                        </div>
                    </div>
                </div>
            </aside>

            {/* ── RIGHT: COMPARATIVE FEEDBACK TIMELINE ── */}
            <main style={{ position: "relative" }}>
                <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: "1px", background: `linear-gradient(180deg, ${C.teal}, transparent)`, opacity: 0.2 }} />
                <div style={{ display: "flex", flexDirection: "column", gap: "4rem", paddingLeft: "2.5rem" }}>
                    {analysisSegments.map((segment, idx) => (
                        <div key={idx} className="fade-up" style={{ animationDelay: `${0.3 + (idx * 0.1)}s`, position: "relative" }}>
                            <div style={{ position: "absolute", left: "-2.5rem", top: "1rem", width: "10px", height: "10px", background: C.teal, boxShadow: `0 0 10px ${C.teal}`, transform: "translateX(-50%)" }} />

                            <ReactMarkdown
                                components={{
                                    strong: ({ node, ...props }) => {
                                        const text = String(props.children).trim();
                                        const tags = ["TIMESTAMP:", "GRADE:", "WHAT YOU DID:", "WHAT YOU SHOULD HAVE DONE:", "COACH_NOTE:"];
                                        if (tags.includes(text)) {
                                            const isVs = text === "WHAT YOU DID:" || text === "WHAT YOU SHOULD HAVE DONE:";
                                            const color = text === "GRADE:" ? C.pink : text === "COACH_NOTE:" ? C.green : C.teal;
                                            return (
                                                <div style={{
                                                    fontFamily: "var(--font-mono)", fontSize: "0.55rem", fontWeight: 800,
                                                    letterSpacing: "0.2em", color, marginBottom: "0.5rem",
                                                    marginTop: isVs ? "0.5rem" : "1.25rem", opacity: 0.6
                                                }}>
                                                    {text.replace(':', '')}
                                                </div>
                                            );
                                        }
                                        return <strong style={{ color: "#fff", fontWeight: 700 }} {...props} />;
                                    },
                                    p: ({ node, children, ...props }) => {
                                        const textNode = React.Children.toArray(children)[0];
                                        const text = typeof textNode === "string" ? textNode.trim() : "";

                                        if (/^\d{2}:\d{2}$/.test(text)) {
                                            return <div style={{ fontFamily: "var(--font-display)", fontSize: "3rem", color: "#fff", lineHeight: 1, margin: "0.5rem 0 0.5rem" }}>{text}</div>;
                                        }
                                        // Detect Grade
                                        const gradePattern = /^[A-F][+-]?$/;
                                        if (text.length <= 2 && gradePattern.test(text)) {
                                            return <div style={{ fontFamily: "var(--font-display)", fontSize: "2rem", color: C.pink, marginBottom: "1rem" }}>{text}</div>;
                                        }

                                        return <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "0.95rem", lineHeight: 1.6, fontFamily: "var(--font-body)", marginBottom: "1.25rem" }} {...props} />;
                                    }
                                }}
                            >
                                {segment.trim()}
                            </ReactMarkdown>
                        </div>
                    ))}
                </div>
            </main>
        </div>
    );
}

function MetricItem({ label, value }: { label: string; value: string }) {
    return (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.55rem", color: C.muted, letterSpacing: "0.1em" }}>{label}</span>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.6rem", color: "#fff", fontWeight: 800 }}>{value}</span>
        </div>
    );
}
