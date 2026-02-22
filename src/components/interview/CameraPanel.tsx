"use client";
import React from "react";

interface CameraPanelProps {
    videoRef: React.RefObject<HTMLVideoElement | null>;
    cameraOn: boolean;
    micOn: boolean;
    onToggleCamera: () => void;
    onToggleMic: () => void;
    isRecording: boolean;
    isProcessing: boolean;
    isSpeaking: boolean;
    onStartRecording: () => void;
    onStopRecording: () => void;
    onStartInterview: () => void;
    isReady: boolean;
    countdown: number | null;
}

export default function CameraPanel({
    videoRef,
    cameraOn,
    micOn,
    onToggleCamera,
    onToggleMic,
    isRecording,
    isProcessing,
    isSpeaking,
    onStartRecording,
    onStopRecording,
    onStartInterview,
    isReady,
    countdown,
}: CameraPanelProps) {
    return (
        <div className="relative flex flex-1 w-full bg-slate-950 overflow-hidden group">
            {/* Video Stream */}
            <video
                ref={videoRef}
                autoPlay
                muted
                playsInline
                className={`w-full h-full object-cover transform -scale-x-100 transition-opacity duration-500 ${cameraOn ? 'opacity-100' : 'opacity-0'}`}
            />

            {/* Camera Off State */}
            {!cameraOn && (
                <div className="absolute inset-0 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm">
                    <div className="text-slate-500 font-mono text-xs uppercase tracking-widest animate-pulse">
                        Video Source Offline
                    </div>
                </div>
            )}

            {/* Scanline Effect */}
            <div className="absolute inset-0 pointer-events-none opacity-10 bg-[linear-gradient(transparent_50%,rgba(0,0,0,0.5)_50%),linear-gradient(90deg,rgba(0,0,0,0.1)_50%,transparent_50%)] bg-[length:100%_4px,4px_100%]" />

            {/* Start Button Overlay */}
            {cameraOn && !isReady && countdown === null && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-6 bg-slate-950/40 backdrop-blur-md">
                    {(!cameraOn || !micOn) ? (
                        <div className="px-6 py-3 rounded-xl border border-blue-500/30 bg-blue-500/10 text-blue-400 font-mono text-xs text-center">
                            "System check: Please enable camera and microphone access."
                        </div>
                    ) : (
                        <button
                            onClick={onStartInterview}
                            className="rounded-full bg-blue-600 px-8 py-3 font-mono text-sm font-black text-white shadow-[0_0_40px_-10px_rgba(37,99,235,0.8)] hover:bg-blue-500 hover:scale-105 active:scale-95 transition-all"
                        >
                            INITIALIZE INTERVIEW
                        </button>
                    )}
                </div>
            )}

            {/* Recording Control Overlay */}
            {cameraOn && isReady && (
                <div className="absolute inset-0 flex items-center justify-center">
                    <button
                        onClick={isRecording ? onStopRecording : onStartRecording}
                        disabled={isProcessing || isSpeaking}
                        className={`
              flex items-center gap-3 px-8 py-4 rounded-full font-mono text-xs font-black tracking-widest transition-all duration-300
              ${isRecording
                                ? "bg-rose-600 text-white shadow-[0_0_40px_-5px_rgba(225,29,72,0.6)] scale-105"
                                : "bg-blue-600 text-white shadow-[0_0_40px_-5px_rgba(37,99,235,0.6)] hover:scale-105"}
              ${(isProcessing || isSpeaking) ? "opacity-50 cursor-not-allowed grayscale" : "cursor-pointer"}
            `}
                    >
                        {isRecording && <span className="h-2 w-2 rounded-full bg-white animate-ping" />}
                        {isProcessing ? "PROCESSING_INPUT" : isSpeaking ? "AI_RESPONDING" : isRecording ? "STOP_AND_SUBMIT" : "START_RECORDING"}
                    </button>
                </div>
            )}

            {/* Indicators */}
            <div className="absolute top-4 left-4 flex gap-2">
                {isRecording && (
                    <div className="flex items-center gap-2 px-2 py-1 bg-rose-600/20 border border-rose-500/30 rounded text-rose-500 font-mono text-[9px] font-bold">
                        <span className="h-1.5 w-1.5 rounded-full bg-rose-500 animate-pulse" />
                        REC_LIVE
                    </div>
                )}
            </div>
        </div>
    );
}
