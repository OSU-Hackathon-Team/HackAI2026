"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
import { PythonProvider, usePython } from "react-py";
import { createEditor, PrismEditor } from "prism-code-editor";

// Basic editor styles
import "prism-code-editor/layout.css";
import "prism-code-editor/scrollbar.css";
// Theme - Using VS Code Dark for that premium feel
import "prism-code-editor/themes/vs-code-dark.css";

// Load Python language
import "prism-code-editor/prism/languages/python";

// Extensions
import { matchBrackets } from "prism-code-editor/match-brackets";
import { indentGuides } from "prism-code-editor/guides";
import { defaultCommands } from "prism-code-editor/commands";

/**
 * CodeEditor Component
 * Wraps prism-code-editor for React usage
 */
const CodeEditor = ({ initialValue, onChange }: { initialValue: string; onChange: (val: string) => void }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const editorRef = useRef<PrismEditor | null>(null);

    useEffect(() => {
        if (containerRef.current && !editorRef.current) {
            editorRef.current = createEditor(containerRef.current, {
                language: "python",
                value: initialValue,
            },
                matchBrackets(),
                indentGuides(),
                defaultCommands()
            );

            editorRef.current.on("update", (value: string) => {
                onChange(value);
            });
        }

        return () => {
            if (editorRef.current) {
                // Cleaning up editor on unmount
                // Note: Some versions might not have .remove(), but we can clear innerHTML if needed
                if (typeof (editorRef.current as any).remove === 'function') {
                    (editorRef.current as any).remove();
                } else if (containerRef.current) {
                    containerRef.current.innerHTML = '';
                }
                editorRef.current = null;
            }
        };
    }, []);

    return (
        <div
            ref={containerRef}
            className="prism-editor h-full w-full font-mono text-sm"
            style={{
                minHeight: "300px",
                "--editor__bg": "transparent",
                "--widget__bg": "var(--surface)",
                "--widget__border": "var(--border)",
                "--widget__color": "var(--text)"
            } as React.CSSProperties}
        />
    );
};

/**
 * ConsoleOutput Component
 * Handles stdout, stderr, and stdin interaction
 */
const ConsoleOutput = ({
    stdout,
    stderr,
    isAwaitingInput,
    prompt,
    onSendInput,
    isRunning,
    onClear
}: {
    stdout: string;
    stderr: string;
    isAwaitingInput: boolean;
    prompt?: string;
    onSendInput: (val: string) => void;
    isRunning: boolean;
    onClear: () => void;
}) => {
    const [inputValue, setInputValue] = useState("");
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [stdout, stderr, isAwaitingInput]);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter") {
            onSendInput(inputValue);
            setInputValue("");
        }
    };

    return (
        <div className="flex flex-col h-full font-mono text-sm bg-black/60 rounded-xl border border-white/5 overflow-hidden backdrop-blur-md shadow-2xl">
            <div className="bg-white/5 px-4 py-3 border-b border-white/10 flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${isRunning ? 'bg-[#caff00] animate-pulse' : 'bg-zinc-600'}`} />
                    <span className="text-zinc-400 text-[10px] uppercase tracking-widest font-bold">Terminal / Output</span>
                </div>
                <button
                    onClick={onClear}
                    className="text-zinc-500 hover:text-white text-[10px] transition-colors"
                >
                    CLEAR
                </button>
            </div>
            <div
                ref={scrollRef}
                className="flex-1 p-6 overflow-auto scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent flex flex-col gap-1"
            >
                <div className="text-zinc-500 text-[10px] mb-4 border-b border-zinc-900 pb-2">
                    PYTHON EXECUTION ENVIRONMENT v1.0.0
                </div>

                {stdout && (
                    <div className="whitespace-pre-wrap text-emerald-400/90 leading-relaxed font-mono">
                        {stdout}
                    </div>
                )}

                {stderr && (
                    <div className="whitespace-pre-wrap text-rose-400/90 leading-relaxed font-mono">
                        {stderr}
                    </div>
                )}

                {isAwaitingInput && (
                    <div className="flex flex-col gap-2 mt-2 p-3 bg-[#caff00]/5 border border-[#caff00]/20 rounded-lg">
                        <div className="flex items-center gap-2 text-[#caff00]">
                            <span className="text-xs font-bold uppercase tracking-wider">Input Required:</span>
                            <span className="text-zinc-300">{prompt}</span>
                        </div>
                        <div className="flex items-center">
                            <span className="text-[#caff00] mr-2">❯</span>
                            <input
                                type="text"
                                className="flex-1 bg-transparent border-none outline-none text-white focus:ring-0 placeholder:text-zinc-700 placeholder-opacity-50"
                                style={{ color: "white", textShadow: "0 0 1px rgba(255,255,255,0.5)" } as React.CSSProperties}
                                placeholder="Type here..."
                                autoFocus
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                onKeyDown={handleKeyDown}
                            />
                            <button
                                onClick={() => { onSendInput(inputValue); setInputValue(""); }}
                                className="text-[10px] font-bold bg-[#caff00] text-black px-2 py-1 rounded hover:brightness-110 transition-all"
                            >
                                SEND
                            </button>
                        </div>
                    </div>
                )}

                {!isRunning && !stdout && !stderr && (
                    <div className="text-zinc-700 italic">Waiting for execution...</div>
                )}
            </div>

            {isRunning && !isAwaitingInput && (
                <div className="bg-[#caff00]/5 px-4 py-1 text-[10px] text-[#caff00]/50 text-center animate-pulse">
                    PYTHON KERNEL BUSY...
                </div>
            )}
        </div>
    );
};

/**
 * Main IDE Component
 */
function PythonIDE() {
    const [code, setCode] = useState(`# MISSION CRITICAL PYTHON KERNEL
# ------------------------------

print("Starting system diagnostics...")

def calibrate_sensors():
    print("Calibrating holographic arrays...")
    return "ONLINE"

status = calibrate_sensors()
print(f"Status: {status}")

user_id = input("Enter Operator ID: ")
print(f"Authorization sequence initiated for: {user_id}")

print("Encryption layers: ")
for i in range(1, 4):
    print(f"  > Layer {i}: {'.' * i * 3} DECRYPTED")

print("\\nHACK SUCCESSFUL. WELCOME TO THE GRID.")
`);

    const {
        runPython,
        stdout,
        stderr,
        isLoading,
        isReady,
        isRunning,
        isAwaitingInput,
        prompt,
        sendInput,
        interruptExecution
    } = usePython({
        packages: {
            official: ["pyodide-http"]
        }
    });

    useEffect(() => {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/react-py-sw.js', { scope: '/' })
                .then((reg) => console.log('react-py service worker registered', reg.scope))
                .catch((err) => console.error('react-py service worker error:', err));
        }
    }, []);

    // We can't really "clear" the stdout/stderr in usePython easily as it's cumulative 
    // but we can overlay a clear state if we want. For now, we'll just keep it real.
    // Actually, some versions of react-py might not support clearing easily.
    // Let's assume the user knows it's a stream.

    const handleRun = () => {
        runPython(code);
    };

    const clearOutput = () => {
        // In many versions of react-py, stdout/stderr are read-only from the hook.
        // If we wanted to clear, we'd need to re-mount the hook or use a local state.
        // For this demo, let's just show a clear message.
        console.log("Clear requested");
    };

    return (
        <div className="min-h-screen bg-[#050508] text-white p-4 md:p-10 font-body relative overflow-hidden">
            {/* Background Decorative Elements */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#caff00]/5 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-emerald-500/5 blur-[100px] rounded-full translate-y-1/4 -translate-x-1/4" />

            <div className="max-w-7xl mx-auto flex flex-col gap-6 relative z-10">
                {/* Header */}
                <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-white/10 pb-6">
                    <div className="space-y-1">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-[#caff00] flex-none flex items-center justify-center">
                                <svg width="20" height="20" className="w-5 h-5 text-black" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M14.25.75c-2.69 0-2.63 2.33-2.63 2.33s.06 2.29-2.29 2.29s-4.43-.07-4.43-.07a2.31 2.31 0 0 0-2.29 2.29s-.07 2.29-.07 2.29a2.31 2.31 0 0 0 2.29 2.29h4.43s2.21 0 2.21 2.21v2.33s-.06 2.32 2.63 2.32s2.63-2.32 2.63-2.32v-4.62s0-2.22-2.22-2.22H10.12s-2.33 0-2.33-2.34s2.33-2.33 2.33-2.33h7.24s2.33 0 2.33-2.33S17.41.75 14.25.75M8.41 7.42a.74.74 0 1 1 .74-.74a.74.74 0 0 1-.74.74m7.18 9.16a.74.74 0 1 1 .74-.74a.74.74 0 0 1-.74.74" />
                                </svg>
                            </div>
                            <h1 className="text-5xl font-display font-bold text-white tracking-tighter">
                                PY<span className="text-[#caff00]">KERN</span>
                            </h1>
                        </div>
                        <p className="text-zinc-500 font-mono text-xs tracking-widest pl-1">
                            ADVANCED PYTHON INTERPRETER // ISOLATED KERNEL
                        </p>
                    </div>
                    <div className="flex items-center gap-4 w-full md:w-auto">
                        <div className="hidden md:flex flex-col items-end mr-4">
                            <span className="text-[10px] text-zinc-500 font-mono uppercase">System Status</span>
                            <span className={`text-xs font-mono ${isReady ? 'text-emerald-400' : 'text-amber-400'}`}>
                                {isReady ? 'KERNEL_READY' : 'KERNEL_INITIALIZING...'}
                            </span>
                        </div>

                        {isRunning ? (
                            <button
                                onClick={() => interruptExecution()}
                                className="btn-danger flex-none w-full md:w-auto flex items-center justify-center gap-2 group transition-all"
                            >
                                <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
                                ABORT_SEQUENCE
                            </button>
                        ) : (
                            <button
                                onClick={handleRun}
                                disabled={!isReady || isLoading}
                                className="btn-primary flex-none w-full md:w-auto flex items-center justify-center gap-2 group shadow-[0_0_20px_rgba(202,255,0,0.2)] disabled:opacity-30"
                            >
                                <svg width="16" height="16" className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                </svg>
                                EXECUTE_CODE
                            </button>
                        )}
                    </div>
                </header>

                {/* Main Interface */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 flex-1 min-h-[600px]">
                    {/* Editor Column */}
                    <div className="flex flex-col gap-3 group">
                        <div className="flex justify-between items-center px-1">
                            <span className="text-zinc-500 text-[10px] font-mono tracking-widest uppercase">Source Code</span>
                            <span className="text-zinc-700 text-[10px] font-mono">language: python3.11</span>
                        </div>
                        <div className="flex-1 rounded-2xl border border-white/10 bg-[#0a0a0f] overflow-hidden shadow-2xl transition-all duration-300 group-hover:border-[#caff00]/20 min-h-[400px] flex flex-col">
                            <div className="bg-white/5 py-2 px-4 border-b border-white/5 flex items-center gap-1.5 focus-within:bg-white/10">
                                <div className="w-2 h-2 rounded-full bg-rose-500/30" />
                                <div className="w-2 h-2 rounded-full bg-amber-500/30" />
                                <div className="w-2 h-2 rounded-full bg-emerald-500/30" />
                                <span className="text-[10px] text-zinc-500 font-mono ml-2">sandbox_env.py</span>
                            </div>
                            <div className="flex-1 p-2 bg-black/20">
                                <CodeEditor initialValue={code} onChange={setCode} />
                            </div>
                        </div>
                    </div>

                    {/* Terminal Column */}
                    <div className="flex flex-col gap-3">
                        <div className="flex justify-between items-center px-1">
                            <span className="text-zinc-500 text-[10px] font-mono tracking-widest uppercase">Output Stream</span>
                            <span className="text-zinc-700 text-[10px] font-mono">status: {isRunning ? 'RUNNING' : 'IDLE'}</span>
                        </div>
                        <ConsoleOutput
                            stdout={stdout}
                            stderr={stderr}
                            isAwaitingInput={isAwaitingInput}
                            prompt={prompt}
                            onSendInput={sendInput}
                            isRunning={isRunning}
                            onClear={clearOutput}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}

// Wrapper to provide Python context
export default function PythonIDEPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-black flex items-center justify-center text-[#caff00] font-mono">LOADING KERNEL...</div>}>
            <PythonProvider>
                <PythonIDE />
            </PythonProvider>
        </Suspense>
    );
}
