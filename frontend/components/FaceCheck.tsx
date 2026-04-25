'use client';
import { useRef, useState, useEffect } from 'react';
import { Camera, CameraOff, Loader2, CheckCircle, AlertTriangle, Eye, Sun, Moon, ShieldCheck } from 'lucide-react';
import * as faceapi from '@vladmandic/face-api';

interface FaceCheckProps {
    hasFaceData: boolean | null;
    onMatchSuccess: (image?: string) => void;
    onMatchFail: (image?: string) => void;
    employeeName: string;
}

export default function FaceCheck({
    hasFaceData,
    onMatchSuccess,
    onMatchFail,
    employeeName
}: FaceCheckProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const detectionInterval = useRef<NodeJS.Timeout | null>(null);

    const [isCameraActive, setIsCameraActive] = useState(false);
    const [status, setStatus] = useState<string>('Initializing security modules...');
    const [isMatching, setIsMatching] = useState(false);
    const [modelsLoaded, setModelsLoaded] = useState(false);
    
    // Liveness & Quality States
    const [blinkCount, setBlinkCount] = useState(0);
    const [livenessPassed, setLivenessPassed] = useState(false);
    const [lightingQuality, setLightingQuality] = useState<'low' | 'good' | 'harsh'>('good');
    const [faceDetected, setFaceDetected] = useState(false);

    useEffect(() => {
        const loadModels = async () => {
            try {
                const MODEL_URL = '/models';
                await Promise.all([
                    faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
                    faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
                ]);
                setModelsLoaded(true);
                startCamera();
            } catch (err) {
                console.error("❌ Failed to load face models:", err);
                setStatus("❌ System Error: Could not load security modules.");
            }
        };
        loadModels();
        return () => {
            stopCamera();
            if (detectionInterval.current) clearInterval(detectionInterval.current);
        };
    }, []);

    const startCamera = async () => {
        try {
            setStatus('📹 Starting camera...');
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { width: 640, height: 480, facingMode: 'user' }
            });

            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                streamRef.current = stream;
                setIsCameraActive(true);
                setStatus('✅ Camera active. Please blink to prove liveness.');
                startSecurityLoop();
            }
        } catch (error) {
            setStatus('❌ Camera access denied.');
        }
    };

    const stopCamera = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
        setIsCameraActive(false);
    };

    /**
     * SECURITY LOOP: Tracks landmarks for blinks and checks lighting
     */
    const startSecurityLoop = () => {
        if (detectionInterval.current) clearInterval(detectionInterval.current);
        
        let isClosed = false;

        detectionInterval.current = setInterval(async () => {
            if (!videoRef.current || !modelsLoaded) return;

            const detection = await faceapi.detectSingleFace(
                videoRef.current, 
                new faceapi.TinyFaceDetectorOptions()
            ).withFaceLandmarks();

            if (!detection) {
                setFaceDetected(false);
                return;
            }
            setFaceDetected(true);

            // A. Blink Detection (Eye Aspect Ratio logic)
            const landmarks = detection.landmarks;
            const leftEye = landmarks.getLeftEye();
            const rightEye = landmarks.getRightEye();

            const getEAR = (eye: any) => {
                const p2_p6 = Math.sqrt(Math.pow(eye[1].x - eye[5].x, 2) + Math.pow(eye[1].y - eye[5].y, 2));
                const p3_p5 = Math.sqrt(Math.pow(eye[2].x - eye[4].x, 2) + Math.pow(eye[2].y - eye[4].y, 2));
                const p1_p4 = Math.sqrt(Math.pow(eye[0].x - eye[3].x, 2) + Math.pow(eye[0].y - eye[3].y, 2));
                return (p2_p6 + p3_p5) / (2.0 * p1_p4);
            };

            const ear = (getEAR(leftEye) + getEAR(rightEye)) / 2;
            
            if (ear < 0.22) {
                isClosed = true;
            } else if (isClosed) {
                isClosed = false;
                setBlinkCount(prev => {
                    const next = prev + 1;
                    if (next >= 1) setLivenessPassed(true);
                    return next;
                });
            }

            // B. Lighting Check
            analyzeLighting();
        }, 150);
    };

    const analyzeLighting = () => {
        if (!videoRef.current || !canvasRef.current) return;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.drawImage(videoRef.current, 0, 0, 10, 10);
        const data = ctx.getImageData(0, 0, 10, 10).data;
        let brightness = 0;
        for (let i = 0; i < data.length; i += 4) {
            brightness += (data[i] + data[i+1] + data[i+2]) / 3;
        }
        brightness /= 100;

        if (brightness < 40) setLightingQuality('low');
        else if (brightness > 220) setLightingQuality('harsh');
        else setLightingQuality('good');
    };

    const captureAndMatch = async () => {
        if (!livenessPassed) return;

        setIsMatching(true);
        setStatus('📸 Securely capturing...');

        try {
            const canvas = canvasRef.current!;
            const video = videoRef.current!;
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            canvas.getContext('2d')?.drawImage(video, 0, 0);
            const base64Image = canvas.toDataURL('image/jpeg', 0.95);

            const token = localStorage.getItem('emp_token');
            const response = await fetch('/api/attendance/match-face', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ image: base64Image })
            });

            const result = await response.json();
            if (result.matched) {
                setStatus(`✅ Verified! Confidence: ${result.confidence}%`);
                setTimeout(() => onMatchSuccess(base64Image), 1500);
            } else {
                setStatus(`❌ Match Failed: ${result.reason || 'Authentication denied'}`);
                setTimeout(() => onMatchFail(base64Image), 2000);
            }
        } catch (error: any) {
            setStatus(`❌ Error: ${error.message}`);
            onMatchFail();
        } finally {
            setIsMatching(false);
        }
    };

    return (
        <div className="w-full max-w-2xl mx-auto space-y-4">
            <div className="relative bg-black rounded-3xl overflow-hidden shadow-2xl border-4 border-gray-800">
                <video ref={videoRef} autoPlay playsInline muted className="w-full h-auto" style={{ transform: 'scaleX(-1)' }} />
                <canvas ref={canvasRef} className="hidden" />

                {/* Secure Overlay */}
                <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute top-4 left-4 right-4 flex justify-between">
                        <div className="flex flex-col gap-2">
                            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl backdrop-blur-md border ${livenessPassed ? 'bg-green-500/20 border-green-500/50 text-green-400' : 'bg-black/40 border-white/20 text-white/70'}`}>
                                <Eye size={16} />
                                <span className="text-[10px] font-bold uppercase tracking-wider">
                                    {livenessPassed ? 'Liveness Verified' : `Blink to Start (${blinkCount}/1)`}
                                </span>
                            </div>
                            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl backdrop-blur-md border ${lightingQuality === 'good' ? 'bg-blue-500/20 border-blue-500/50 text-blue-400' : 'bg-yellow-500/20 border-yellow-500/50 text-yellow-400'}`}>
                                {lightingQuality === 'low' ? <Moon size={16} /> : <Sun size={16} />}
                                <span className="text-[10px] font-bold uppercase tracking-wider">
                                    Lighting: {lightingQuality}
                                </span>
                            </div>
                        </div>
                        {livenessPassed && <div className="bg-green-500 text-white p-2 rounded-full shadow-lg h-fit"><ShieldCheck size={20} /></div>}
                    </div>

                    {!faceDetected && isCameraActive && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-[2px]">
                            <p className="text-white font-bold text-xs uppercase tracking-widest animate-pulse">Position your face in frame</p>
                        </div>
                    )}
                </div>
            </div>

            <div className={`p-4 rounded-xl text-center font-bold text-sm border transition-all ${
                status.includes('✅') ? 'bg-green-50 border-green-200 text-green-700' : 
                status.includes('❌') ? 'bg-red-50 border-red-200 text-red-700' : 
                'bg-blue-50 border-blue-200 text-blue-700'
            }`}>
                {status}
            </div>

            <div className="flex gap-4">
                <button
                    onClick={captureAndMatch}
                    disabled={!livenessPassed || isMatching || !faceDetected}
                    className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:from-gray-300 disabled:to-gray-400 text-white py-4 px-8 rounded-xl font-bold uppercase tracking-widest shadow-xl transition-all active:scale-95 disabled:cursor-not-allowed"
                >
                    {isMatching ? <Loader2 className="animate-spin mx-auto" /> : 'Confirm Identity'}
                </button>
            </div>
        </div>
    );
}
