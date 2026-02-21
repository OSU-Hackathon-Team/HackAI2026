'use client';

import { useState, useRef, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { Mic, Square, Loader2, Activity, Volume2, FastForward } from 'lucide-react';

export default function TestAudioPage() {
    const [sessionId, setSessionId] = useState('');
    const [isRecording, setIsRecording] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);

    const [questionIndex, setQuestionIndex] = useState(0);
    const [keyframes, setKeyframes] = useState<any[]>([]);
    const [currentResponse, setCurrentResponse] = useState<any>(null);

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);

    useEffect(() => {
        // Generate a random fake session ID on mount
        setSessionId(Math.random().toString(36).substring(2, 15));
    }, []);

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
            setCurrentResponse(null);
        } catch (err) {
            console.error('Error accessing microphone:', err);
            alert('Error accessing microphone. Please check permissions.');
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
            mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
        }
    };

    const processAudio = async (audioBlob: Blob) => {
        setIsProcessing(true);
        const formData = new FormData();
        formData.append('audio', audioBlob, 'recording.webm');
        formData.append('session_id', sessionId);
        formData.append('timestamp_sec', questionIndex.toString()); // Using Q-index as a proxy for time in this simple test

        try {
            // 1. Send to stream-process to get transcript + metrics
            const streamRes = await fetch('http://127.0.0.1:5000/stream-process', {
                method: 'POST',
                body: formData,
            });
            const streamData = await streamRes.json();

            if (streamData.text) {

                // 2. Log keyframe locally to render charts
                const newKeyframe = {
                    question: `Q${questionIndex + 1}`,
                    transcript: streamData.text,
                    confidence: Math.round(streamData.metrics.confidence_score * 100),
                    pacing: Math.round(streamData.metrics.pacing_wpm),
                    pitch: Math.round(streamData.metrics.pitch_score * 100)
                };

                setKeyframes(prev => [...prev, newKeyframe]);

                // 3. Send to Chat endpoint
                const chatRes = await fetch('http://127.0.0.1:5000/chat', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ text: streamData.text, question_index: questionIndex, session_id: sessionId }),
                });
                const chatData = await chatRes.json();

                setCurrentResponse({
                    transcript: streamData.text,
                    aiResponse: chatData.ai_response,
                    metrics: streamData.metrics,
                    isFinished: chatData.is_finished
                });

                if (chatData.next_index) {
                    setQuestionIndex(chatData.next_index);
                }

                // 4. TTS for AI response
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
            }
        } catch (error) {
            console.error('Error processing audio pipeline:', error);
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-950 text-white p-8 font-sans pb-24">
            <div className="max-w-4xl mx-auto space-y-8">
                <div>
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-emerald-400 mb-2">
                        Multimodal Interview Test
                    </h1>
                    <p className="text-gray-400">
                        Session ID: <span className="font-mono text-gray-500">{sessionId}</span>
                    </p>
                </div>

                {/* Recording Controls */}
                <div className="bg-gray-900 border border-gray-800 p-8 rounded-xl shadow-lg flex flex-col items-center justify-center space-y-6">
                    <button
                        onClick={isRecording ? stopRecording : startRecording}
                        className={`w-32 h-32 rounded-full flex items-center justify-center transition-all duration-300 shadow-xl ${isRecording
                            ? 'bg-red-500/20 text-red-500 hover:bg-red-500/30 ring-4 ring-red-500/50 animate-pulse'
                            : 'bg-emerald-500/20 text-emerald-500 hover:bg-emerald-500/30 hover:scale-105 ring-4 ring-emerald-500/50'
                            }`}
                    >
                        {isRecording ? <Square size={48} className="fill-current" /> : <Mic size={48} />}
                    </button>

                    <div className="text-sm font-medium text-gray-400 flex items-center gap-2">
                        {isProcessing ? (
                            <><Loader2 className="animate-spin w-4 h-4" /> Analyzing Biometrics & AI Response...</>
                        ) : isRecording ? (
                            <><Activity className="animate-pulse w-4 h-4 text-red-500" /> Listening to Answer for Question {questionIndex + 1}...</>
                        ) : (
                            'Click microphone to start answering'
                        )}
                    </div>
                </div>

                {/* Current Answer Metrics (Live Gauge) */}
                {currentResponse && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-gray-900 p-6 rounded-xl border border-gray-800 space-y-4">
                            <h2 className="text-xl font-semibold border-b border-gray-800 pb-2">Last Answer Analysis</h2>

                            <div className="space-y-4">
                                {/* Confidence Bar */}
                                <div>
                                    <div className="flex justify-between text-sm mb-1">
                                        <span className="text-gray-400">Audio Confidence</span>
                                        <span className="font-bold text-emerald-400">{Math.round(currentResponse.metrics.confidence_score * 100)}%</span>
                                    </div>
                                    <div className="w-full bg-gray-800 rounded-full h-2">
                                        <div
                                            className="bg-emerald-400 h-2 rounded-full transition-all duration-1000"
                                            style={{ width: `${Math.round(currentResponse.metrics.confidence_score * 100)}%` }}
                                        ></div>
                                    </div>
                                </div>

                                {/* Pacing Bar */}
                                <div>
                                    <div className="flex justify-between text-sm mb-1">
                                        <span className="text-gray-400">Pacing (WPM)</span>
                                        <span className="font-bold text-blue-400">{Math.round(currentResponse.metrics.pacing_wpm)} / 200</span>
                                    </div>
                                    <div className="w-full bg-gray-800 rounded-full h-2">
                                        <div
                                            className={`h-2 rounded-full transition-all duration-1000 ${currentResponse.metrics.pacing_wpm > 180 ? 'bg-red-400' : 'bg-blue-400'}`}
                                            style={{ width: `${Math.min(100, Math.round((currentResponse.metrics.pacing_wpm / 200) * 100))}%` }}
                                        ></div>
                                    </div>
                                </div>
                            </div>

                            <div className="pt-4 border-t border-gray-800">
                                <p className="text-sm text-gray-300 italic">"{currentResponse.transcript}"</p>
                            </div>
                        </div>

                        <div className="bg-gray-900 p-6 rounded-xl border border-blue-900/50 space-y-4">
                            <h2 className="text-xl font-semibold border-b border-gray-800 pb-2 text-blue-400">AI Interviewer</h2>
                            <p className="text-gray-200">{currentResponse.aiResponse}</p>
                            {currentResponse.isFinished && (
                                <div className="mt-4 inline-block px-3 py-1 bg-emerald-500/20 text-emerald-400 rounded-full text-sm font-medium">
                                    Interview Complete
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Session Timeline Charts */}
                {keyframes.length > 0 && (
                    <div className="bg-gray-900 p-6 rounded-xl border border-gray-800 space-y-6">
                        <h2 className="text-2xl font-bold border-b border-gray-800 pb-4">Session Analytics Timeline</h2>

                        <div className="h-72 w-full mt-4">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={keyframes} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                                    <XAxis dataKey="question" stroke="#9CA3AF" />
                                    <YAxis stroke="#9CA3AF" />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#111827', borderColor: '#374151', color: '#fff' }}
                                        itemStyle={{ color: '#fff' }}
                                    />
                                    <Legend />
                                    <Line type="monotone" name="Confidence (%)" dataKey="confidence" stroke="#34D399" strokeWidth={3} activeDot={{ r: 8 }} />
                                    <Line type="monotone" name="Pitch Stability" dataKey="pitch" stroke="#60A5FA" strokeWidth={2} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>

                        <div className="h-64 w-full mt-8">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={keyframes} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                                    <XAxis dataKey="question" stroke="#9CA3AF" />
                                    <YAxis stroke="#9CA3AF" />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#111827', borderColor: '#374151', color: '#fff' }}
                                        cursor={{ fill: '#1F2937' }}
                                    />
                                    <Legend />
                                    <Bar dataKey="pacing" name="Pacing (WPM)" fill="#818CF8" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
}
