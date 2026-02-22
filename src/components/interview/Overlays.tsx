"use client";
import React from "react";

interface CountdownOverlayProps {
    countdown: number;
}

export function CountdownOverlay({ countdown }: CountdownOverlayProps) {
    const isGoodLuck = countdown === 0;
    return (
        <div className="fixed inset-0 z-[1000] flex flex-col items-center justify-center gap-8 bg-slate-950/80 backdrop-blur-2xl transition-all duration-500">
            {/* Background Pulse */}
            <div className={`absolute h-[600px] w-[600px] rounded-full opacity-10 blur-[100px] transition-colors duration-1000 ${isGoodLuck ? 'bg-emerald-500' : 'bg-blue-500'}`} />

            <div
                className={`
          text-9xl font-black font-mono tabular-nums tracking-tighter transition-all duration-300
          ${isGoodLuck ? 'text-emerald-400 scale-110 drop-shadow-[0_0_50px_rgba(16,185,129,0.5)]' : 'text-white drop-shadow-[0_0_30px_rgba(255,255,255,0.2)]'}
        `}
            >
                {isGoodLuck ? "GO!" : countdown}
            </div>

            {!isGoodLuck && (
                <div className="flex flex-col items-center gap-2 animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <span className="text-sm font-mono font-bold uppercase tracking-[0.4em] text-slate-500">
                        Calibrating Sensors
                    </span>
                    <div className="h-1 w-48 rounded-full bg-slate-900 overflow-hidden">
                        <div
                            className="h-full bg-blue-500 transition-all duration-1000 ease-linear"
                            style={{ width: `${((3 - countdown) / 3) * 100}%` }}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}

interface ConnectionBadgeProps {
    status: "connecting" | "connected" | "failed" | "mock";
}

export function ConnectionBadge({ status }: ConnectionBadgeProps) {
    const configs = {
        connecting: { color: "bg-amber-500", label: "LINK_ESTABLISHING" },
        connected: { color: "bg-emerald-500", label: "LINK_STABLE" },
        failed: { color: "bg-rose-500", label: "LINK_FAULT" },
        mock: { color: "bg-slate-500", label: "LOCAL_ONLY" },
    };

    const config = configs[status];

    return (
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/50 border border-white/5 backdrop-blur-sm">
            <div className={`h-1.5 w-1.5 rounded-full animate-pulse ${config.color}`} />
            <span className="text-[10px] font-mono font-bold text-slate-400 tracking-wider">
                {config.label}
            </span>
        </div>
    );
}
