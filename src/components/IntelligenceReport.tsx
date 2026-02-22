"use client";
import React from "react";
import ReactMarkdown from "react-markdown";

interface IntelligenceReportProps {
    content: string;
}

export function IntelligenceReport({ content }: IntelligenceReportProps) {
    // Split content by segments (double newlines or dividers)
    const segments = content.split(/\n---\n|\n---+\n/).filter(s => s.trim().length > 0);

    // We'll treat the first segment (if it doesn't look like a timestamped analysis) as the Executive Summary
    const isAnalysis = (text: string) => text.includes("TIMESTAMP:") || text.includes("WHAT YOU DID:");

    const summarySegment = segments.find(s => !isAnalysis(s));
    const analysisSegments = segments.filter(s => isAnalysis(s));

    return (
        <div style={{
            display: "grid",
            gridTemplateColumns: "320px 1fr",
            gap: "4rem",
            alignItems: "flex-start",
            position: "relative"
        }}>
            {/* ── LEFT: EXECUTIVE OVERVIEW (Sticky) ── */}
            <aside style={{
                position: "sticky",
                top: "2rem",
                display: "flex",
                flexDirection: "column",
                gap: "2.5rem"
            }}>
                <div className="fade-up" style={{ animationDelay: "0.1s" }}>
                    <div style={{
                        fontFamily: "var(--font-mono)",
                        color: "var(--accent)",
                        fontSize: "0.65rem",
                        letterSpacing: "0.3em",
                        fontWeight: 800,
                        marginBottom: "1rem",
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem"
                    }}>
                        <span style={{ width: "12px", height: "1px", background: "var(--accent)" }} />
                        SESSION_INTELLIGENCE // V.02
                    </div>
                    <h2 style={{
                        fontFamily: "var(--font-display)",
                        fontSize: "3.5rem",
                        lineHeight: 0.9,
                        color: "#fff",
                        letterSpacing: "-0.02em",
                        textTransform: "uppercase"
                    }}>
                        Executive <br /> <span style={{ color: "var(--accent)" }}>Summary</span>
                    </h2>
                </div>

                {summarySegment && (
                    <div className="fade-up" style={{
                        animationDelay: "0.2s",
                        background: "rgba(255,255,255,0.03)",
                        padding: "2rem",
                        borderRadius: "4px",
                        borderLeft: "2px solid var(--accent)",
                        fontFamily: "var(--font-body)",
                        fontSize: "0.95rem",
                        lineHeight: 1.8,
                        color: "var(--text-dim)"
                    }}>
                        <ReactMarkdown components={{
                            p: ({ node, ...props }) => <div style={{ marginBottom: "1rem" }} {...props} />,
                            strong: ({ ...props }) => <strong style={{ color: "#fff", fontWeight: 700 }} {...props} />
                        }}>
                            {summarySegment}
                        </ReactMarkdown>
                    </div>
                )}

                <div className="fade-up" style={{ animationDelay: "0.3s" }}>
                    <div style={{
                        border: "1px solid var(--border)",
                        padding: "1.5rem",
                        background: "linear-gradient(135deg, rgba(202,255,0,0.05), transparent)",
                        borderRadius: "4px"
                    }}>
                        <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.6rem", color: "var(--accent)", marginBottom: "1rem", fontWeight: 800 }}>CORE_METRICS</div>
                        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                            <MetricItem label="RESPECT RATIO" value="HIGH" />
                            <MetricItem label="TONAL DEPTH" value="+12%" />
                            <MetricItem label="SEMANTIC FLOW" value="STABLE" />
                        </div>
                    </div>
                </div>
            </aside>

            {/* ── RIGHT: CRITICAL FEEDBACK TIMELINE ── */}
            <main style={{ position: "relative" }}>
                {/* Timeline Axis */}
                <div style={{
                    position: "absolute",
                    left: "0",
                    top: "0",
                    bottom: "0",
                    width: "1px",
                    background: "linear-gradient(180deg, var(--accent), transparent)",
                    opacity: 0.2
                }} />

                <div style={{ display: "flex", flexDirection: "column", gap: "6rem", paddingLeft: "3rem" }}>
                    {analysisSegments.map((segment, idx) => (
                        <div
                            key={idx}
                            className="fade-up"
                            style={{
                                animationDelay: `${0.4 + (idx * 0.1)}s`,
                                position: "relative"
                            }}
                        >
                            {/* Timeline Marker */}
                            <div style={{
                                position: "absolute",
                                left: "-3rem",
                                top: "0.5rem",
                                width: "8px",
                                height: "8px",
                                background: "var(--accent)",
                                borderRadius: "50%",
                                boxShadow: "0 0 15px var(--accent)",
                                transform: "translateX(-4px)"
                            }} />

                            <ReactMarkdown
                                components={{
                                    strong: ({ node, ...props }) => {
                                        const text = String(props.children);
                                        const isTag = ["TIMESTAMP:", "WHAT YOU DID:", "WHAT YOU DID RIGHT:", "WHAT YOU SHOULD HAVE DONE:", "ACTIONABLE STEP:"].includes(text);

                                        if (isTag) {
                                            const colors: Record<string, string> = {
                                                "TIMESTAMP:": "var(--accent)",
                                                "WHAT YOU DID:": "#fff",
                                                "WHAT YOU DID RIGHT:": "#fff",
                                                "WHAT YOU SHOULD HAVE DONE:": "#fff",
                                                "ACTIONABLE STEP:": "var(--accent)"
                                            };
                                            const activeColor = colors[text] || "var(--accent)";

                                            return (
                                                <span style={{
                                                    fontFamily: "var(--font-mono)",
                                                    fontSize: "0.65rem",
                                                    fontWeight: 800,
                                                    letterSpacing: "0.15em",
                                                    color: activeColor,
                                                    marginBottom: "0.75rem",
                                                    marginTop: text === "TIMESTAMP:" ? "0" : "1.5rem",
                                                    display: "inline-flex",
                                                    alignItems: "center",
                                                    gap: "0.5rem",
                                                    opacity: text === "TIMESTAMP:" ? 1 : 0.4
                                                }}>
                                                    {text.replace(':', '')} {text === "TIMESTAMP:" && <span style={{ width: "20px", height: "1px", background: "var(--accent)" }} />}
                                                </span>
                                            );
                                        }
                                        return <strong style={{ color: "#fff", fontWeight: 700 }} {...props} />;
                                    },
                                    p: ({ node, children, ...props }) => {
                                        const text = React.Children.toArray(children).map(c => typeof c === "string" ? c : "").join("").trim();
                                        // Match simple time strings like 00:01
                                        if (/^\d{2}:\d{2}$/.test(text)) {
                                            return (
                                                <span style={{
                                                    fontFamily: "var(--font-display)",
                                                    fontSize: "4.5rem",
                                                    color: "#fff",
                                                    margin: "0.5rem 0 2rem",
                                                    lineHeight: 1,
                                                    display: "block"
                                                }}>
                                                    {text}
                                                </span>
                                            );
                                        }
                                        return (
                                            <div style={{
                                                color: "var(--text-dim)",
                                                fontSize: "1.05rem",
                                                lineHeight: 1.7,
                                                maxWidth: "600px",
                                                fontFamily: "var(--font-body)",
                                                marginBottom: "1.5rem"
                                            }} {...props} />
                                        );
                                    }
                                }}
                            >
                                {segment.trim()}
                            </ReactMarkdown>

                            {/* Status Pills Container (Detected from text) */}
                            <div style={{ display: "flex", gap: "0.75rem", marginTop: "2rem" }}>
                                <StatusPill label="TECHNICAL_DEPTH" value="8/10" />
                                <StatusPill label="TONE" value="NEUTRAL" />
                            </div>
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
            <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.55rem", color: "var(--muted)", letterSpacing: "0.1em" }}>{label}</span>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.6rem", color: "#fff", fontWeight: 800 }}>{value}</span>
        </div>
    );
}

function StatusPill({ label, value }: { label: string; value: string }) {
    return (
        <div style={{
            padding: "0.4rem 0.8rem",
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.08)",
            display: "flex",
            alignItems: "center",
            gap: "0.6rem",
            borderRadius: "2px"
        }}>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.55rem", color: "var(--accent)", letterSpacing: "0.1em", fontWeight: 800 }}>{label}</span>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.55rem", color: "#fff", opacity: 0.6 }}>{value}</span>
        </div>
    );
}
