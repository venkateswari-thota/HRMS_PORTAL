'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { apiRequest } from '@/lib/api';
import { Send, AlertTriangle, Camera, MapPin, Loader2, CheckCircle, RefreshCcw } from 'lucide-react';

export default function RequestSignInPage() {
    const router = useRouter();
    const [reason, setReason] = useState('');
    const [currentLoc, setCurrentLoc] = useState({ lat: 0, lng: 0 });
    const [statusMsg, setStatusMsg] = useState('');
    const [loading, setLoading] = useState(false);
    const [failureMode, setFailureMode] = useState<'location' | 'face' | 'both'>('location');

    // Camera state
    const [isCameraActive, setIsCameraActive] = useState(false);
    const [capturedImage, setCapturedImage] = useState<string | null>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const [requestType, setRequestType] = useState('CHECK_IN');

    // Stream Ref
    const streamRef = useRef<MediaStream | null>(null);

    useEffect(() => {
        const mode = sessionStorage.getItem('failure_mode') as 'location' | 'face' | 'both';
        if (mode) setFailureMode(mode);

        const type = sessionStorage.getItem('request_type');
        if (type) setRequestType(type);

        // Auto-capture location if needed
        if (mode === 'location' || mode === 'both') {
            captureLocation();
        }

        return () => stopCamera(); // Cleanup on unmount
    }, []);

    // Effect to attach stream when camera is active
    useEffect(() => {
        if (isCameraActive && videoRef.current && streamRef.current) {
            videoRef.current.srcObject = streamRef.current;
        }
    }, [isCameraActive]);

    const captureLocation = () => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (pos) => setCurrentLoc({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
                (err) => console.error(err),
                { enableHighAccuracy: true }
            );
        }
    };

    const startCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'user' }
            });
            streamRef.current = stream;
            setIsCameraActive(true);
        } catch (err) {
            console.error("Camera access denied", err);
            alert("Please allow camera access to take a verification photo.");
        }
    };

    const takePhoto = () => {
        if (videoRef.current && canvasRef.current) {
            const video = videoRef.current;
            const canvas = canvasRef.current;
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const ctx = canvas.getContext('2d');
            ctx?.drawImage(video, 0, 0);
            const dataUrl = canvas.toDataURL('image/jpeg');
            setCapturedImage(dataUrl);
            stopCamera();
        }
    };

    const stopCamera = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
        setIsCameraActive(false);
    };

    const handleSubmit = async () => {
        if (!reason.trim()) {
            setStatusMsg('⚠️ Please provide a reason.');
            return;
        }

        if ((failureMode === 'face' || failureMode === 'both') && !capturedImage) {
            setStatusMsg('⚠️ Please capture a verification photo.');
            return;
        }

        if ((failureMode === 'location' || failureMode === 'both') && currentLoc.lat === 0) {
            setStatusMsg('⚠️ Please capture your live location.');
            return;
        }

        setLoading(true);
        try {
            const token = localStorage.getItem('emp_token');
            await apiRequest('/attendance/request', 'POST', {
                type: requestType,
                reason: reason,
                lat: currentLoc.lat,
                lng: currentLoc.lng,
                location_failure: failureMode === 'location' || failureMode === 'both',
                face_failure: failureMode === 'face' || failureMode === 'both',
                current_location_coordinates: `${currentLoc.lat}, ${currentLoc.lng}`,
                face_image: capturedImage
            }, token || '');

            setStatusMsg('✅ Request Submitted Successfully! Admin will be notified.');
            setTimeout(() => router.push('/employee/home'), 2000);
        } catch (e: any) {
            setStatusMsg('❌ Failed: ' + e.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto my-10 p-8 bg-white rounded-3xl shadow-2xl border border-red-50">
            <div className="text-center mb-8">
                <div className="mx-auto w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mb-4 transition-transform hover:scale-110">
                    <AlertTriangle className="text-red-500" size={32} />
                </div>
                <h1 className="text-3xl font-black text-gray-900">Attendance Exception</h1>
                <p className="text-gray-500 font-medium">
                    {failureMode === 'location' ? 'Location Verification Required' :
                        failureMode === 'face' ? 'Photo Identification Required' :
                            'Bilateral Verification Required'}
                </p>
            </div>

            <div className="space-y-8">
                {/* 3 Steps Indicator */}
                <div className="flex items-center justify-between px-4 py-3 bg-gray-50 rounded-2xl border border-gray-100">
                    <div className="flex flex-col items-center gap-1">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${reason.trim() ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-500'}`}>
                            {reason.trim() ? <CheckCircle size={14} /> : 1}
                        </div>
                        <span className="text-[10px] font-bold text-gray-400 uppercase">Reason</span>
                    </div>
                    <div className="h-px flex-1 bg-gray-200 mx-2"></div>
                    <div className="flex flex-col items-center gap-1">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${currentLoc.lat !== 0 ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-500'}`}>
                            {currentLoc.lat !== 0 ? <CheckCircle size={14} /> : 2}
                        </div>
                        <span className="text-[10px] font-bold text-gray-400 uppercase">Location</span>
                    </div>
                    <div className="h-px flex-1 bg-gray-200 mx-2"></div>
                    <div className="flex flex-col items-center gap-1">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${capturedImage ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-500'}`}>
                            {capturedImage ? <CheckCircle size={14} /> : 3}
                        </div>
                        <span className="text-[10px] font-bold text-gray-400 uppercase">Identity</span>
                    </div>
                </div>

                {/* Reason Field */}
                <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
                        Reason for Exception <span className="text-red-500">*</span>
                    </label>
                    <textarea
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        placeholder="e.g. GPS signal low, Wearing safety glasses, client site visit..."
                        className="w-full h-24 p-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-red-500/10 focus:border-red-500 outline-none resize-none transition-all font-medium"
                    />
                </div>

                <div className="grid gap-6">
                    {/* Location Part */}
                    {(failureMode === 'location' || failureMode === 'both') && (
                        <div className="p-6 bg-blue-50/50 rounded-2xl border border-blue-100 space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                                        <MapPin className="text-blue-600" size={20} />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-gray-800">Live Location</h3>
                                        <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest">Auto-Captured coordinates</p>
                                    </div>
                                </div>
                                <button onClick={captureLocation} className="p-2 hover:bg-blue-100 rounded-full transition-colors text-blue-600 cursor-pointer">
                                    <RefreshCcw size={18} />
                                </button>
                            </div>
                            <div className="flex gap-4">
                                <div className={`flex-1 p-3 rounded-xl border text-center font-mono text-sm font-bold transition-all ${currentLoc.lat !== 0 ? 'bg-white border-green-200 text-green-700' : 'bg-gray-100 border-gray-200 text-gray-400'}`}>
                                    {currentLoc.lat === 0 ? '---.------' : currentLoc.lat.toFixed(6)}
                                </div>
                                <div className={`flex-1 p-3 rounded-xl border text-center font-mono text-sm font-bold transition-all ${currentLoc.lng !== 0 ? 'bg-white border-green-200 text-green-700' : 'bg-gray-100 border-gray-200 text-gray-400'}`}>
                                    {currentLoc.lng === 0 ? '---.------' : currentLoc.lng.toFixed(6)}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Face Part: Refined Camera UX */}
                    {(failureMode === 'face' || failureMode === 'both') && (
                        <div className="p-6 bg-slate-900 rounded-3xl border border-slate-800 shadow-xl space-y-4 overflow-hidden relative">
                            <div className="flex items-center gap-3 border-b border-white/10 pb-4">
                                <div className="w-10 h-10 bg-blue-500/20 rounded-xl flex items-center justify-center">
                                    <Camera className="text-blue-400" size={20} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-white">Visual Verification</h3>
                                    <p className="text-[10px] text-blue-400 uppercase font-black tracking-widest">Live Security Feed</p>
                                </div>
                            </div>

                            <div className="relative aspect-video bg-black rounded-2xl overflow-hidden border border-white/5 ring-1 ring-white/10 group">
                                {!capturedImage ? (
                                    <>
                                        {isCameraActive ? (
                                            <>
                                                <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover scale-x-[-1]" />
                                                <div className="absolute inset-0 border-[20px] border-black/10 pointer-events-none"></div>
                                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 border-2 border-white/20 rounded-full flex items-center justify-center animate-pulse">
                                                    <div className="w-full h-w-full border border-white/5 rounded-full"></div>
                                                </div>

                                                <button
                                                    onClick={takePhoto}
                                                    className="absolute bottom-6 left-1/2 -translate-x-1/2 px-8 py-3 bg-white text-slate-900 font-bold rounded-full shadow-2xl hover:bg-blue-50 transition-all flex items-center gap-2 cursor-pointer active:scale-95 group-hover:scale-105"
                                                >
                                                    <Camera size={20} />
                                                    CAPTURE
                                                </button>
                                            </>
                                        ) : (
                                            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 text-white/40">
                                                <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center">
                                                    <Camera size={32} />
                                                </div>
                                                <button
                                                    onClick={startCamera}
                                                    className="px-8 py-3 bg-blue-600 text-white rounded-full font-bold hover:bg-blue-700 transition-all cursor-pointer shadow-lg active:scale-95"
                                                >
                                                    TAKE PICTURE
                                                </button>
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <div className="relative w-full h-full animate-in zoom-in-95 duration-500">
                                        <img src={capturedImage} className="w-full h-full object-cover grayscale" alt="Verification" />
                                        <div className="absolute inset-0 bg-blue-500/10 mix-blend-overlay"></div>
                                        <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2 text-green-400 font-bold text-xs uppercase tracking-widest">
                                                    <CheckCircle size={14} />
                                                    Identity Captured
                                                </div>
                                                <button
                                                    onClick={() => setCapturedImage(null)}
                                                    className="px-3 py-1 bg-white/10 hover:bg-white/20 text-white rounded-md text-[10px] font-bold transition-colors cursor-pointer"
                                                >
                                                    RE-CAPTURE
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                            <canvas ref={canvasRef} className="hidden" />
                        </div>
                    )}
                </div>

                {statusMsg && (
                    <div className={`p-4 rounded-2xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-2 ${statusMsg.includes('Success') ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-red-50 text-red-700 border border-red-100'
                        }`}>
                        {statusMsg.includes('Success') ? <CheckCircle size={20} /> : <AlertTriangle size={20} />}
                        <span className="font-bold text-sm">{statusMsg}</span>
                    </div>
                )}

                <div className="flex gap-4 pt-4">
                    <button
                        onClick={() => router.back()}
                        className="flex-1 py-4 bg-gray-100 font-black text-gray-500 rounded-2xl hover:bg-gray-200 transition-all active:scale-95 cursor-pointer"
                    >
                        CANCEL
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={loading || !reason.trim() || ((failureMode === 'location' || failureMode === 'both') && currentLoc.lat === 0) || ((failureMode === 'face' || failureMode === 'both') && !capturedImage)}
                        className="flex-[2] py-4 bg-red-600 font-black text-white rounded-2xl hover:bg-red-700 transition-all shadow-xl shadow-red-500/20 flex items-center justify-center gap-2 active:scale-95 disabled:bg-gray-200 disabled:shadow-none disabled:text-gray-400 cursor-pointer disabled:cursor-not-allowed uppercase tracking-wider"
                    >
                        {loading ? <Loader2 className="animate-spin" /> : <><Send size={20} /> Submit Exception</>}
                    </button>
                </div>
            </div>
        </div>
    );
}
