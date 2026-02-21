'use client';

import { useState, useRef } from 'react';

export default function TestAudioPage() {
    const [isRecording, setIsRecording] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [apiResponse, setApiResponse] = useState<any>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
            mediaRecorderRef.current = mediaRecorder;
            audioChunksRef.current = [];

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunksRef.current.push(event.data);
                }
            };

            mediaRecorder.onstop = async () => {
                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                await processAudio(audioBlob);
            };

            mediaRecorder.start();
            setIsRecording(true);
            setTranscript('');
            setApiResponse(null);
        } catch (err) {
            console.error('Error accessing microphone:', err);
            alert('Error accessing microphone. Please check permissions.');
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
            // Stop all tracks to release microphone
            mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
        }
    };

    const processAudio = async (audioBlob: Blob) => {
        setIsProcessing(true);
        const formData = new FormData();
        formData.append('audio', audioBlob, 'recording.webm');

        try {
            // 1. Transcribe the audio
            const transcribeRes = await fetch('http://127.0.0.1:5000/transcribe', {
                method: 'POST',
                body: formData,
            });
            const transcribeData = await transcribeRes.json();

            if (transcribeData.text) {
                setTranscript(transcribeData.text);

                // 2. Send to Chat endpoint
                const chatRes = await fetch('http://127.0.0.1:5000/chat', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ text: transcribeData.text, question_index: 0 }),
                });
                const chatData = await chatRes.json();
                setApiResponse(chatData);

                // 3. Optional: Get TTS for the response (Play it back)
                if (chatData.ai_response) {
                    const ttsRes = await fetch('http://127.0.0.1:5000/tts', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ text: chatData.ai_response }),
                    });

                    if (ttsRes.ok) {
                        const audioBlob = await ttsRes.blob();
                        const audioUrl = URL.createObjectURL(audioBlob);
                        const audio = new Audio(audioUrl);
                        audio.play();
                    }
                }
            } else {
                setTranscript('No text transcribed or error occurred.');
            }
        } catch (error) {
            console.error('Error processing audio:', error);
            setTranscript('Error processing audio pipeline.');
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-950 text-white p-8 font-sans">
            <div className="max-w-2xl mx-auto space-y-8">
                <div>
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-emerald-400 mb-2">
                        Audio Backend Test
                    </h1>
                    <p className="text-gray-400">Record a mock interview answer to test Whisper, GPT-4o, and ElevenLabs.</p>
                </div>

                <div className="bg-gray-900 border border-gray-800 p-6 rounded-xl shadow-lg flex flex-col items-center justify-center space-y-6">
                    <button
                        onClick={isRecording ? stopRecording : startRecording}
                        className={`w-32 h-32 rounded-full flex items-center justify-center text-xl font-bold transition-all duration-300 shadow-xl ${isRecording
                                ? 'bg-red-500 hover:bg-red-600 animate-pulse'
                                : 'bg-emerald-600 hover:bg-emerald-500 hover:scale-105'
                            }`}
                    >
                        {isRecording ? 'Stop' : 'Record'}
                    </button>

                    <div className="text-sm font-mono text-gray-500">
                        {isRecording ? 'Recording in progress...' : 'Click to start recording'}
                    </div>
                </div>

                {(transcript || isProcessing) && (
                    <div className="space-y-4">
                        <h2 className="text-xl font-semibold border-b border-gray-800 pb-2">Pipeline Results</h2>

                        <div className="bg-gray-900 p-4 rounded-lg border border-gray-800">
                            <h3 className="text-sm text-gray-400 mb-1">1. Your Transcript (Whisper)</h3>
                            <p className="text-gray-100">
                                {isProcessing && !transcript ? 'Transcribing...' : transcript}
                            </p>
                        </div>

                        {apiResponse && (
                            <div className="bg-gray-900 p-4 rounded-lg border border-gray-800 border-l-4 border-l-blue-500">
                                <h3 className="text-sm text-gray-400 mb-1">2. AI Interviewer (GPT-4o)</h3>
                                <p className="text-blue-50 font-medium">
                                    {apiResponse.ai_response}
                                </p>
                                <div className="mt-3 flex gap-4 text-xs text-gray-500 font-mono">
                                    <span>Next Index: {apiResponse.next_index}</span>
                                    <span>Finished: {apiResponse.is_finished ? 'Yes' : 'No'}</span>
                                </div>
                            </div>
                        )}

                        {apiResponse && (
                            <div className="bg-gray-900 p-4 rounded-lg border border-gray-800 border-l-4 border-l-emerald-500 flex items-center gap-3">
                                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                                <h3 className="text-sm text-emerald-400 font-medium">3. Playing TTS Audio (ElevenLabs)</h3>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
