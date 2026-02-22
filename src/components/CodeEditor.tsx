"use client";
import React, { useState, useEffect, useRef } from "react";
import { createEditor, PrismEditor } from "prism-code-editor";

// Basic editor styles
import "prism-code-editor/layout.css";
import "prism-code-editor/scrollbar.css";
// Theme
import "prism-code-editor/themes/vs-code-dark.css";

// Load Python language
import "prism-code-editor/prism/languages/python";

// Extensions
import { matchBrackets } from "prism-code-editor/match-brackets";
import { indentGuides } from "prism-code-editor/guides";
import { defaultCommands } from "prism-code-editor/commands";

export const CodeEditor = ({ initialValue, onChange }: { initialValue: string; onChange: (val: string) => void }) => {
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

export const ConsoleOutput = ({
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
