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
    startStream: () => Promise<void>;
    appendStream: (text: string) => Promise<number>;
    endStream: () => void;
    stop: () => void;
    isLoaded: boolean;
}

const Avatar = forwardRef<AvatarHandle, AvatarProps>(({
    modelUrl = "/models/business_girl.glb",
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
        setIsLoaded(false);

        // TalkingHead expects the element to be available
        const head = new TalkingHead(containerRef.current, {
            lipsyncModules: [], // We'll register manually to bypass dynamic import issues
            pcmSampleRate: 24000,
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

        const attemptLoad = async (): Promise<boolean> => {
            if (!isMounted) return true;

            // Attempt to resume audio context if we have user activation, 
            // but do NOT block model loading if it fails.
            if (head.audioCtx && head.audioCtx.state === 'suspended') {
                const hasActivation = (navigator as any)?.userActivation?.hasBeenActive;
                if (hasActivation) {
                    try {
                        await head.audioCtx.resume();
                    } catch (e) {
                        // Still waiting for gesture
                    }
                }
            }

            // Proceed to load the visual model regardless of audio state
            try {
                await new Promise(resolve => setTimeout(resolve, 50));
                if (!isMounted) return true;

                await head.showAvatar({
                    url: modelUrl,
                    body: 'M',
                    avatarMood: 'neutral',
                    lipsyncLang: 'en'
                });

                if (isMounted) {
                    setIsLoaded(true);
                    console.log("[Avatar] Model loaded successfully:", modelUrl);

                    // Dynamically center the camera based on the avatar's actual head bone position
                    if (head.objectHead && head.avatarHeight) {
                        try {
                            const headPos = new THREE.Vector3();
                            head.objectHead.getWorldPosition(headPos);

                            // Define target Y slightly above the head bone to include hair (approx +10cm)
                            const targetY = headPos.y + 0.1;

                            // Implement true zoom by altering the Field of View
                            const baseFov = 30; // TalkingHead default
                            const targetFov = Math.max(5, baseFov - (cameraZoom * 15));
                            head.camera.fov = targetFov;
                            head.camera.updateProjectionMatrix();

                            // Maintain camera at its default fixed distance (z=2 for head)
                            const z = 2;
                            const fovRad = targetFov * (Math.PI / 180);
                            const yOffset = targetY - (4 * head.avatarHeight / 5);
                            const dynamicCameraY = 1 - (yOffset / (z * Math.tan(fovRad / 2)));

                            console.log("[Avatar] Framing dynamic cameraY:", dynamicCameraY, "for targetY:", targetY, "FOV:", targetFov);
                            head.setView('head', {
                                cameraY: dynamicCameraY,
                                cameraDistance: 0 // Reset camera offsets, let FOV handle zoom
                            });
                        } catch (e) {
                            console.warn("[Avatar] Auto-framing camera failed", e);
                        }
                    }

                    console.log("[Avatar] Available visemes:", Object.keys(head.mtAvatar || {}).filter(k => k.startsWith('viseme_')));
                }
                return true;
            } catch (err) {
                console.error("[Avatar] Failed to load model:", err);
                return false;
            }
        };

        const initAvatar = async () => {
            // 1. Trigger initial load (Visuals + Audio attempt)
            const success = await attemptLoad();

            // 2. Background task to ensure AudioContext is eventually resumed
            const audioInterval = setInterval(async () => {
                if (!isMounted) {
                    clearInterval(audioInterval);
                    return;
                }
                if (head.audioCtx && head.audioCtx.state === 'running') {
                    clearInterval(audioInterval);
                    return;
                }

                // Only attempt resume if browser indicates a gesture has occurred
                if ((navigator as any)?.userActivation?.hasBeenActive) {
                    try {
                        await head.audioCtx.resume();
                        if (head.audioCtx.state === 'running') {
                            console.log("[Avatar] AudioContext resumed in background.");
                            clearInterval(audioInterval);
                        }
                    } catch (e) {
                        // Still blocked
                    }
                }
            }, 1000);

            // 3. One-time gesture listeners for immediate resumption
            const onGesture = async () => {
                if (head.audioCtx && head.audioCtx.state === 'suspended') {
                    try {
                        await head.audioCtx.resume();
                        console.log("[Avatar] AudioContext resumed via user gesture.");
                    } catch (e) { }
                }
                window.removeEventListener('click', onGesture);
                window.removeEventListener('keydown', onGesture);
                window.removeEventListener('touchstart', onGesture);
            };
            window.addEventListener('click', onGesture);
            window.addEventListener('keydown', onGesture);
            window.addEventListener('touchstart', onGesture);

            // 4. If loading failed (e.g. model URL error), retry visuals periodically
            if (!success) {
                const retryInterval = setInterval(async () => {
                    if (!isMounted) {
                        clearInterval(retryInterval);
                        return;
                    }
                    if (await attemptLoad()) {
                        clearInterval(retryInterval);
                    }
                }, 3000);
            }
        };

        initAvatar();

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

    // React to cameraZoom changes dynamically (fixes Next.js hot-reloading)
    useEffect(() => {
        if (!isLoaded || !headRef.current) return;
        const head = headRef.current;
        if (head.objectHead && head.avatarHeight) {
            try {
                // Implement true zoom by altering the Field of View
                const baseFov = 30; // TalkingHead default
                const targetFov = Math.max(5, baseFov - (cameraZoom * 15));
                head.camera.fov = targetFov;
                head.camera.updateProjectionMatrix();

                const headPos = new THREE.Vector3();
                head.objectHead.getWorldPosition(headPos);
                const targetY = headPos.y + 0.1;
                const z = 2;
                const fovRad = targetFov * (Math.PI / 180);
                const yOffset = targetY - (4 * head.avatarHeight / 5);
                const dynamicCameraY = 1 - (yOffset / (z * Math.tan(fovRad / 2)));

                head.setView('head', {
                    cameraY: dynamicCameraY,
                    cameraDistance: 0
                });
            } catch (e) {
                console.warn("[Avatar] Dynamic zoom re-frame failed", e);
            }
        }
    }, [cameraZoom, isLoaded]);

    useImperativeHandle(ref, () => ({
        isLoaded,
        stop: () => {
            if (headRef.current) {
                console.log("[Avatar] Force stopping speech...");
                headRef.current.stop();
            }
        },
        startStream: async () => {
            const head = headRef.current;
            if (!head || !isLoaded) return;
            try {
                if (head.audioCtx && head.audioCtx.state === 'suspended') {
                    await head.audioCtx.resume();
                }
                if (onAudioStart) onAudioStart();
            } catch (err) {
                console.error("[Avatar] startStream failed:", err);
            }
        },
        appendStream: async (text: string): Promise<number> => {
            const head = headRef.current;
            if (!head || !isLoaded) return 0;
            try {
                const res = await fetch('http://127.0.0.1:8080/api/tts', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ text })
                });

                if (!res.ok || !res.body) throw new Error(`TTS failed with ${res.status}`);

                const reader = res.body.getReader();
                const chunks: Uint8Array[] = [];
                let totalLength = 0;

                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;
                    if (value) {
                        chunks.push(value);
                        totalLength += value.length;
                    }
                }

                // Combine chunks into a single ArrayBuffer
                const combined = new Uint8Array(totalLength);
                let offset = 0;
                for (const chunk of chunks) {
                    combined.set(chunk, offset);
                    offset += chunk.length;
                }

                // Convert 16-bit PCM (little-endian) to Float32 AudioBuffer natively
                let audioBuffer: AudioBuffer | null = null;
                if (head.audioCtx) {
                    const dataView = new DataView(combined.buffer, combined.byteOffset, combined.byteLength);
                    const sampleCount = Math.floor(combined.byteLength / 2);
                    audioBuffer = head.audioCtx.createBuffer(1, sampleCount, 24000);
                    const channelData = audioBuffer.getChannelData(0);
                    for (let i = 0; i < sampleCount; i++) {
                        // getInt16(byteOffset, littleEndian)
                        const int16 = dataView.getInt16(i * 2, true);
                        channelData[i] = int16 / 32768.0;
                    }
                }

                if (!audioBuffer) throw new Error("Could not decode audio buffer");

                // Calculate word timings for lipsync
                const durationMs = audioBuffer.duration * 1000;
                const words = text.split(/\s+/).filter(w => w.trim().length > 0);
                const wtimes: number[] = [];
                const wdurations: number[] = [];
                if (words.length > 0) {
                    const wordDur = durationMs / words.length;
                    for (let i = 0; i < words.length; i++) {
                        wtimes.push(Math.round(i * wordDur));
                        wdurations.push(Math.round(wordDur));
                    }
                }

                // Enqueue in talkinghead natively using AudioBuffer
                head.speakAudio({
                    audio: audioBuffer,
                    words: words,
                    wtimes: wtimes,
                    wdurations: wdurations
                });

                return durationMs;

            } catch (err) {
                console.error("[Avatar] appendStream failed:", err);
                return 0;
            }
        },
        endStream: () => {
            if (onAudioEnd) onAudioEnd();
        }
    }), [isLoaded, onAudioStart, onAudioEnd]);

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
