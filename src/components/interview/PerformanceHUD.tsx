"use client";
import React from "react";
import { TrendingUp, Activity } from "lucide-react";

interface HUDMetricProps {
    label: string;
    value: number;
    color: string;
}

function HUDMetric({ label, value, color }: HUDMetricProps) {
    const r = 24;
    const circ = 2 * Math.PI * r;
    const offset = circ - (Math.max(0, Math.min(100, value)) / 100) * circ;

    return (
        <div className="flex flex-col items-center gap-2 group">
            <div className="relative h-16 w-16">
                {/* Background Ring */}
                <svg width="64" height="64" viewBox="0 0 64 64" className="absolute left-0 top-0">
                    <circle cx="32" cy="32" r={r} fill="none" stroke="currentColor" strokeWidth="3" className="text-white/5" />
                    <circle
                        cx="32"
                        cy="32"
                        r={r}
                        fill="none"
                        stroke={color}
                        strokeWidth="3"
                        strokeDasharray={circ}
                        strokeDashoffset={offset}
                        strokeLinecap="round"
                        transform="rotate(-90 32 32)"
                        className="transition-all duration-1000 ease-in-out"
                        style={{ filter: `drop-shadow(0 0 8px ${color}66)` }}
                    />
                </svg>
                {/* Value Label */}
                <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-sm font-black font-mono text-white tracking-tighter">
                        {Math.round(value)}%
                    </span>
                </div>
            </div>
            <span className="text-[9px] font-mono font-bold uppercase tracking-[0.2em] text-slate-500 group-hover:text-slate-300 transition-colors">
                {label}
            </span>
        </div>
    );
}

interface PressureGaugeProps {
    score: number;
    trend: "rising" | "falling" | "stable";
}

export function PressureGauge({ score, trend }: PressureGaugeProps) {
    const getDifficultyLabel = (s: number) => {
        if (s < 20) return { label: "SUPPORTIVE", color: "text-emerald-400", bg: "bg-emerald-500" };
        if (s < 50) return { label: "STANDARD", color: "text-blue-400", bg: "bg-blue-500" };
        if (s < 75) return { label: "RIGOROUS", color: "text-amber-400", bg: "bg-amber-500" };
        return { label: "ELITE", color: "text-rose-500", bg: "bg-rose-500" };
    };

    const difficulty = getDifficultyLabel(score);
    const trendIcon = trend === "rising" ? "▲" : trend === "falling" ? "▼" : "─";

    return (
        <div className="w-full border-t border-white/5 bg-slate-950/80 px-6 py-4 backdrop-blur-md">
            <div className="flex items-center justify-between mb-3">
                <div className="flex flex-col">
                    <span className="text-[10px] font-mono font-bold tracking-widest text-slate-500 uppercase">
                        Difficulty Context
                    </span>
                    <div className="flex items-center gap-2">
                        <span className={`text-xs font-black font-mono tracking-wider ${difficulty.color}`}>
                            {difficulty.label}
                        </span>
                        <span className="text-[10px] text-slate-600">STATE_ORCHESTRATOR</span>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className="flex flex-col items-end">
                        <div className="flex items-center gap-2">
                            <span className={`text-[10px] font-bold ${trend === 'rising' ? 'text-rose-500' : trend === 'falling' ? 'text-emerald-500' : 'text-slate-500'}`}>
                                {trendIcon}
                            </span>
                            <span className="text-xl font-black font-mono text-white tabular-nums">
                                {Math.round(score)}<span className="text-xs text-slate-600 ml-1">/100</span>
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Progress Bar */}
            <div className="relative h-1.5 w-full rounded-full bg-slate-900 overflow-hidden">
                <div
                    className={`h-full rounded-full transition-all duration-1000 ease-out ${difficulty.bg}`}
                    style={{
                        width: `${score}%`,
                        boxShadow: `0 0 15px currentColor`
                    }}
                />
            </div>
        </div>
    );
}

interface PerformanceHUDProps {
    gazeScore: number;
    confidence: number;
    fidget: number;
    className?: string;
}

export default function PerformanceHUD({ gazeScore, confidence, fidget, className = "" }: PerformanceHUDProps) {
    return (
        <div className={`flex items-center justify-center gap-10 px-8 py-6 ${className}`}>
            <HUDMetric label="Gaze" value={gazeScore} color="#3b82f6" />
            <HUDMetric label="Confidence" value={confidence} color="#10b981" />
            <HUDMetric label="Body Comp" value={100 - fidget} color="#6366f1" />
        </div>
    );
}
