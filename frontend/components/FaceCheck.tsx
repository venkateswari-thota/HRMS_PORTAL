'use client';
import { useRef, useState, useEffect } from 'react';
import { Camera, CameraOff, Loader2, CheckCircle, XCircle, Eye } from 'lucide-react';

interface FaceCheckProps {
    referenceDescriptors: string[] | null; // Not used anymore - backend loads from S3
    onMatchSuccess: () => void;
    onMatchFail: () => void;
    employeeName: string;
}

export default function FaceCheck({
    referenceDescriptors,
    onMatchSuccess,
    onMatchFail,
    employeeName
}: FaceCheckProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const streamRef = useRef<MediaStream | null>(null);

    const [isCameraActive, setIsCameraActive] = useState(false);
    const [status, setStatus] = useState<string>('Ready to start face verification');
    const [isMatching, setIsMatching] = useState(false);
    const [blinkDetected, setBlinkDetected] = useState(false);
    const [faceMatched, setFaceMatched] = useState(false);
    const [matchConfidence, setMatchConfidence] = useState<number>(0);

    /**
     * Start camera automatically when component mounts
     */
    useEffect(() => {
        startCamera();
        return () => stopCamera();
    }, []);

    const startCamera = async () => {
        try {
            setStatus('📹 Starting camera...');
            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    width: { ideal: 640 },
                    height: { ideal: 480 },
                    facingMode: 'user'
                }
            });

            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                streamRef.current = stream;
                setIsCameraActive(true);
                setStatus('✅ Camera ready. Click "Verify Face" to start matching.');
            }
        } catch (error) {
            console.error('❌ Camera error:', error);
            setStatus('❌ Camera access denied. Please allow camera permissions.');
        }
    };

    const stopCamera = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
        setIsCameraActive(false);
    };

    const captureAndMatch = async () => {
        if (!videoRef.current || !canvasRef.current) {
            setStatus('❌ Camera not ready');
            return;
        }

        setIsMatching(true);
        setStatus('📸 Capturing image...');

        try {
            // Capture frame from video
            const canvas = canvasRef.current;
            const video = videoRef.current;

            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;

            const ctx = canvas.getContext('2d');
            if (!ctx) {
                throw new Error('Could not get canvas context');
            }

            ctx.drawImage(video, 0, 0);

            // Convert to base64
            const base64Image = canvas.toDataURL('image/jpeg', 0.95);

            setStatus('🔍 Matching face with reference images...');

            // Send to backend
            const token = localStorage.getItem('emp_token');
            const response = await fetch('http://localhost:8000/attendance/match-face', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    image: base64Image
                })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.detail || 'Face matching failed');
            }

            const result = await response.json();

            console.log('🎯 Face match result:', result);

            // Update UI with results
            if (result.blink_detection) {
                setBlinkDetected(result.blink_detection.is_blinking);
            }

            setMatchConfidence(result.confidence || 0);

            if (result.matched) {
                setFaceMatched(true);
                setStatus(`✅ Face matched! Confidence: ${result.confidence}%`);

                // Wait a moment to show success, then call success callback
                setTimeout(() => {
                    onMatchSuccess();
                }, 1500);
            } else {
                setFaceMatched(false);
                setStatus(`❌ ${result.reason || result.message || 'Face not matched'}`);

                // Call failure callback after showing error
                setTimeout(() => {
                    onMatchFail();
                }, 2000);
            }

        } catch (error: any) {
            console.error('❌ Face matching error:', error);
            setStatus(`❌ Error: ${error.message}`);
            setFaceMatched(false);

            setTimeout(() => {
                onMatchFail();
            }, 2000);
        } finally {
            setIsMatching(false);
        }
    };

    return (
        <div className="w-full max-w-2xl mx-auto">
            {/* Video Feed */}
            <div className="relative bg-black rounded-lg overflow-hidden mb-4">
                <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-auto"
                    style={{ transform: 'scaleX(-1)' }} // Mirror effect
                />
                <canvas ref={canvasRef} className="hidden" />

                {/* Overlay indicators */}
                {isCameraActive && (
                    <div className="absolute top-4 right-4 flex gap-2">
                        {/* Blink indicator */}
                        <div className={`px-3 py-1 rounded-full text-sm font-medium flex items-center gap-2 ${blinkDetected
                            ? 'bg-green-500 text-white'
                            : 'bg-gray-700 text-gray-300'
                            }`}>
                            <Eye className="w-4 h-4" />
                            {blinkDetected ? 'Blink Detected' : 'Waiting for blink'}
                        </div>

                        {/* Match confidence */}
                        {matchConfidence > 0 && (
                            <div className={`px-3 py-1 rounded-full text-sm font-medium ${matchConfidence >= 70
                                ? 'bg-green-500 text-white'
                                : matchConfidence >= 50
                                    ? 'bg-yellow-500 text-white'
                                    : 'bg-red-500 text-white'
                                }`}>
                                {matchConfidence.toFixed(1)}% Match
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Status Message */}
            <div className={`p-4 rounded-lg mb-4 text-center font-medium ${status.includes('✅')
                ? 'bg-green-100 text-green-800'
                : status.includes('❌')
                    ? 'bg-red-100 text-red-800'
                    : 'bg-blue-100 text-blue-800'
                }`}>
                {status}
            </div>

            {/* Controls */}
            <div className="flex gap-3">
                {!isCameraActive ? (
                    <button
                        onClick={startCamera}
                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 px-6 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors"
                    >
                        <Camera className="w-5 h-5" />
                        Start Camera
                    </button>
                ) : (
                    <>
                        <button
                            onClick={captureAndMatch}
                            disabled={isMatching}
                            className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white py-3 px-6 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors"
                        >
                            {isMatching ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Verifying...
                                </>
                            ) : (
                                <>
                                    <CheckCircle className="w-5 h-5" />
                                    Verify Face
                                </>
                            )}
                        </button>

                        <button
                            onClick={stopCamera}
                            disabled={isMatching}
                            className="bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white py-3 px-6 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors"
                        >
                            <CameraOff className="w-5 h-5" />
                            Stop
                        </button>
                    </>
                )}
            </div>

            {/* Match Result */}
            {faceMatched && (
                <div className="mt-4 p-4 bg-green-100 border-2 border-green-500 rounded-lg flex items-center gap-3">
                    <CheckCircle className="w-6 h-6 text-green-600" />
                    <div>
                        <p className="font-bold text-green-800">Face Matched Successfully!</p>
                        <p className="text-sm text-green-700">Welcome, {employeeName}</p>
                    </div>
                </div>
            )}
        </div>
    );
}
