"use client";
import React from "react";
import dynamic from "next/dynamic";
import { AvatarHandle } from "@/components/Avatar";

const Avatar = dynamic(() => import("@/components/Avatar"), { ssr: false });

interface AvatarPanelProps {
    isSpeaking: boolean;
    isProcessing: boolean;
    avatarRef: React.RefObject<AvatarHandle | null>;
    onAudioStart: () => void;
    onAudioEnd: () => void;
    interviewerModel: string;
    interviewerName: string;
    children?: React.ReactNode; // For PressureGauge
}

export default function AvatarPanel({
    isSpeaking,
    isProcessing,
    avatarRef,
    onAudioStart,
    onAudioEnd,
    interviewerModel,
    interviewerName,
    children
}: AvatarPanelProps) {
    return (
        <div className="relative flex flex-1 w-full flex-col items-center justify-center bg-slate-950 overflow-hidden">
            {/* Background Grid */}
            <div className="absolute inset-0 opacity-20 bg-[linear-gradient(rgba(37,99,235,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(37,99,235,0.05)_1px,transparent_1px)] bg-[length:40px_40px]" />

            {/* Avatar Content */}
            <div className="relative z-10 w-full h-full">
                <Avatar
                    ref={avatarRef}
                    onAudioStart={onAudioStart}
                    onAudioEnd={onAudioEnd}
                    modelUrl={interviewerModel}
                    cameraZoom={1}
                />
            </div>

            {/* Session Info Overlay */}
            <div className="absolute top-6 right-6 z-20 flex flex-col items-end gap-1">
                <div className="text-[10px] font-mono font-black text-white tracking-[0.3em] uppercase">
                    {interviewerName.toUpperCase().replace(/\s+/g, "_")}
                </div>
                <div className={`text-[9px] font-mono font-bold tracking-widest ${isSpeaking ? 'text-emerald-400' : isProcessing ? 'text-blue-400' : 'text-slate-500'}`}>
                    STATUS // {isSpeaking ? "TRANSMITTING" : isProcessing ? "SYNCING_CONTEXT" : "MONITORING"}
                </div>
            </div>

            {/* Bottom Overlay (Pressure Gauge) */}
            <div className="absolute bottom-0 left-0 right-0 z-20">
                {children}
            </div>
        </div>
    );
}
