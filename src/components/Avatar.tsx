"use client";
import * as THREE from "three";
import { useEffect, useRef, useState, useImperativeHandle, forwardRef } from "react";
import { TalkingHead } from "@met4citizen/talkinghead";
import { LipsyncEn } from "@met4citizen/talkinghead/modules/lipsync-en.mjs";



interface AvatarProps {
    modelUrl?: string;
    onAudioEnd?: () => void;
    onAudioStart?: () => void;
    cameraZoom?: number;
}

export interface AvatarHandle {
    speak: (audioUrl: string, text: string) => Promise<void>;
}

const Avatar = forwardRef<AvatarHandle, AvatarProps>(({
    modelUrl = "/models/beard_man.glb",
    onAudioEnd,
    onAudioStart,
    cameraZoom = 0
}, ref) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const headRef = useRef<any>(null);
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        if (!containerRef.current) return;

        let isMounted = true;

        // TalkingHead expects the element to be available
        const head = new TalkingHead(containerRef.current, {
            lipsyncModules: [], // We'll register manually to bypass dynamic import issues
            pcmSampleRate: 44100,
            cameraView: 'head',
            cameraDistance: -Math.abs(cameraZoom), // negative distance zooms in
            cameraRotateEnable: false,
            cameraPanEnable: false,
            cameraZoomEnable: false
        }) as any;

        // Manually register English lipsync module
        const lipsyncEn = new LipsyncEn();
        head.lipsync['en'] = lipsyncEn;

        // Ensure default lipsync is set to 'en'
        head.opt.lipsyncLang = 'en';

        // Patch TalkingHead instance to prevent crashes during disposal or early state transitions
        // This addresses the "Cannot read properties of undefined (reading 'clone')" error
        const originalSetPoseFromTemplate = head.setPoseFromTemplate;
        head.setPoseFromTemplate = function (template: any, ms: number) {
            try {
                // Ensure poseBase has all required properties from poseDelta to avoid .clone() on undefined
                if (this.poseDelta?.props && this.poseBase?.props) {
                    Object.keys(this.poseDelta.props).forEach(key => {
                        if (!this.poseBase.props[key]) {
                            if (key.endsWith('.quaternion')) {
                                this.poseBase.props[key] = new THREE.Quaternion();
                            } else if (key.endsWith('.scale') || key.endsWith('.position')) {
                                this.poseBase.props[key] = new THREE.Vector3(1, 1, 1);
                            }
                        }
                    });
                }
                return originalSetPoseFromTemplate.call(this, template, ms);
            } catch (e) {
                console.warn("[Avatar] Suppressed setPoseFromTemplate error:", e);
            }
        };

        headRef.current = head;

        const loadAvatar = async () => {
            try {
                // Pre-warm the AudioContext
                if (head.audioCtx && head.audioCtx.state === 'suspended') {
                    await head.audioCtx.resume();
                }

                await new Promise(resolve => setTimeout(resolve, 50));
                if (!isMounted) return;

                await head.showAvatar({
                    url: modelUrl,
                    body: 'M',
                    avatarMood: 'neutral',
                    lipsyncLang: 'en'
                });

                if (isMounted) {
                    setIsLoaded(true);
                    console.log("[Avatar] Model loaded successfully:", modelUrl);
                    console.log("[Avatar] Available visemes:", Object.keys(head.mtAvatar || {}).filter(k => k.startsWith('viseme_')));
                }
            } catch (err) {
                console.error("[Avatar] Failed to load model:", err);
            }
        };

        loadAvatar();

        return () => {
            isMounted = false;
            if (headRef.current) {
                console.log("[Avatar] Cleaning up instance...");
                try {
                    const h = headRef.current;
                    h.stop();
                    h.dispose();
                } catch (e) {
                    console.warn("[Avatar] Disposal error (suppressed):", e);
                }
                headRef.current = null;
            }
        };
    }, [modelUrl]);

    useImperativeHandle(ref, () => ({
        speak: async (audioUrl: string, text: string) => {
            const head = headRef.current;
            if (!head || !isLoaded) {
                console.warn("[Avatar] speak() called but avatar not ready");
                return;
            }

            try {
                // Ensure audio context is running
                if (head.audioCtx && head.audioCtx.state === 'suspended') {
                    await head.audioCtx.resume();
                }

                const res = await fetch(audioUrl);
                const arrayBuffer = await res.arrayBuffer();
                const audioBuffer = await head.audioCtx.decodeAudioData(arrayBuffer);
                const durationMs = audioBuffer.duration * 1000;

                // Split text into words for better viseme timing
                const words = text.trim().split(/\s+/);
                const wordDur = durationMs / Math.max(1, words.length);
                const wtimes = words.map((_, i) => i * wordDur);
                const wdurations = new Array(words.length).fill(wordDur);

                console.log(`[Avatar] Speak: "${text.substring(0, 40)}${text.length > 40 ? '...' : ''}"`);

                // Diagnostic: check if visemes are being generated
                const testVis = head.lipsync['en'].wordsToVisemes(words[0] || "hello");
                if (!testVis || !testVis.visemes?.length) {
                    console.warn("[Avatar] Lipsync module returned no visemes for first word!");
                }

                if (onAudioStart) onAudioStart();

                // Add a small delay before speaking to ensure UI updates or other operations complete
                await new Promise(resolve => setTimeout(resolve, 50));

                head.speakAudio({
                    audio: audioBuffer,
                    words: words,
                    wtimes: wtimes,
                    wdurations: wdurations
                }, { lipsyncLang: 'en' });

                setTimeout(() => {
                    if (onAudioEnd) onAudioEnd();
                }, durationMs);

            } catch (err) {
                console.error("[Avatar] Speech failed:", err);
                if (onAudioEnd) onAudioEnd();
            }
        }
    }));

    return (
        <div style={{ width: "100%", height: "100%", position: "relative" }}>
            <div
                ref={containerRef}
                style={{ width: "100%", height: "100%" }}
            />
            {!isLoaded && (
                <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.5)", color: "#fff", backdropFilter: "blur(4px)" }}>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem" }}>
                        <div style={{ width: "30px", height: "30px", border: "2px solid #fff", borderTopColor: "transparent", borderRadius: "50%", animation: "spin-avatar 1s linear infinite" }} />
                        <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.8rem", letterSpacing: "0.1em" }}>INITIALIZING AVATAR</span>
                    </div>
                </div>
            )}
            <style dangerouslySetInnerHTML={{
                __html: `
                @keyframes spin-avatar { to { transform: rotate(360deg); } }
            `}} />
        </div>
    );
});

Avatar.displayName = "Avatar";

export default Avatar;
