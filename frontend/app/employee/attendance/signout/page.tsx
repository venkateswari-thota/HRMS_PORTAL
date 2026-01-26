'use client';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { apiRequest } from '@/lib/api';
import GeoGuard from '@/components/attendance/GeoGuard';
import Link from 'next/link';
import { AlertTriangle, CheckCircle, Camera, MapPin, Loader2, Clock } from 'lucide-react';
import dynamic from 'next/dynamic';

const FaceCheck = dynamic(() => import('@/components/FaceCheck'), { ssr: false, loading: () => <div className="text-center p-4">Loading camera...</div> });

export default function AttendanceSignOut() {
    const router = useRouter();
    const [locationStatus, setLocationStatus] = useState<'pending' | 'passed' | 'failed'>('pending');
    const [faceStatus, setFaceStatus] = useState<'pending' | 'passed' | 'failed'>('pending');
    const [currentLoc, setCurrentLoc] = useState({ lat: 0, lng: 0 });
    const [capturedImage, setCapturedImage] = useState<string | null>(null);
    const [showCamera, setShowCamera] = useState(false);
    const [statusMsg, setStatusMsg] = useState('');
    const [serverTime, setServerTime] = useState('');
    const [empName, setEmpName] = useState('Employee');
    const [loading, setLoading] = useState(true);
    const [isCheckingOut, setIsCheckingOut] = useState(false);
    const [isLocationChecking, setIsLocationChecking] = useState(false);

    const [referenceDescriptors, setReferenceDescriptors] = useState<any>(null);
    const [employeeName, setEmployeeName] = useState('');

    const [workLocation, setWorkLocation] = useState({
        lat: 0,
        lng: 0,
        radius: 0
    });

    const mockTgtLat = 17.42275;
    const mockTgtLng = 78.45315;
    const mockRadius = 1000;

    useEffect(() => {
        const init = async () => {
            const token = localStorage.getItem('emp_token');
            if (!token) { router.push('/auth/employee/signin'); return; }

            const storedName = localStorage.getItem('emp_name');
            if (storedName) setEmpName(storedName);

            try {
                const empInfo = await apiRequest('/attendance/me/info', 'GET', null, token);
                setWorkLocation({
                    lat: empInfo.work_lat,
                    lng: empInfo.work_lng,
                    radius: empInfo.geofence_radius
                });
                setEmployeeName(empInfo.name);

                // Use pre-loaded images from session
                let storedImages = sessionStorage.getItem('face_images');

                // If not found, check if Home is currently fetching
                if (!storedImages && sessionStorage.getItem('face_images_fetching')) {
                    console.log('⏳ Face images are currently being fetched by Home. Waiting...');
                    setStatusMsg('🔄 Syncing face identity data...');
                    // Retry a few times
                    for (let i = 0; i < 10; i++) {
                        await new Promise(r => setTimeout(r, 1000));
                        storedImages = sessionStorage.getItem('face_images');
                        if (storedImages) break;
                    }
                }

                if (storedImages) {
                    setReferenceDescriptors(JSON.parse(storedImages));
                    if (statusMsg.includes('Syncing')) setStatusMsg('');
                } else if (!sessionStorage.getItem('face_images_fetching')) {
                    console.warn('⚠️ Face data missing even after sync check.');
                    setStatusMsg('❌ Identity data missing. Please refresh.');
                }
            } catch (e: any) {
                console.error('Initialization error:', e);
            } finally {
                setLoading(false);
            }
        };
        init();

        const timer = setInterval(() => {
            const now = new Date();
            setServerTime(now.toLocaleString());
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    const handleGeoStatus = useCallback((valid: boolean, lat: number, lng: number) => {
        setCurrentLoc({ lat, lng });
        setIsLocationChecking(false);
        if (valid) {
            setLocationStatus('passed');
        } else {
            setLocationStatus('failed');
            // Check for timeout
            if (lat === 0) {
                setStatusMsg('❌ Location verification timed out. Please try again or use the request link.');
            }
        }
    }, []); // Empty deps

    const handleCheckOutClick = () => {
        if (locationStatus === 'pending') {
            setStatusMsg("⚠️ Waiting for location verification...");
            return;
        }
        setShowCamera(true);
        setStatusMsg('');
        setCapturedImage(null); // Clear previous failure image
    };

    const handleFaceSuccess = async (image?: string) => {
        setFaceStatus('passed');
        setShowCamera(false);
        setCapturedImage(null); // Clear any previous failure image
        const msg = locationStatus === 'passed'
            ? '✅ Identity Verified! Click "Confirm" to finalize.'
            : '✅ Identity Verified';
        setStatusMsg(msg);
    };

    const handleCheckOutSubmit = async () => {
        if (locationStatus !== 'passed' || faceStatus !== 'passed') return;

        setIsCheckingOut(true);
        setStatusMsg('⏳ Submitting check-out...');

        try {
            await apiRequest('/attendance/check-out', 'POST', {
                lat: currentLoc.lat,
                lng: currentLoc.lng
            }, localStorage.getItem('emp_token') || '');

            setStatusMsg('✅ Check-Out Successful! Redirecting...');
            sessionStorage.removeItem('last_face_failure');
            setTimeout(() => router.push('/employee/attendance/log'), 1500);
        } catch (err: any) {
            setStatusMsg('❌ Check-Out Failed: ' + err.message);
            setIsCheckingOut(false);
        }
    };

    const handleFaceFailure = (image?: string) => {
        setFaceStatus('failed');
        setShowCamera(false);
        if (image) {
            setCapturedImage(image);
            sessionStorage.setItem('last_face_failure', image);
        }

        let reason = "Face matching failed";
        if (locationStatus === 'failed') {
            reason = "Location and Face matching failure";
        } else {
            reason = "Face matching failure";
        }
        setStatusMsg(`❌ Sign out request due to ${reason}`);
    };

    const handleGoToRequest = (failureType: 'location' | 'face' | 'both') => {
        sessionStorage.setItem('failure_mode', failureType);
        sessionStorage.setItem('request_type', 'CHECK_OUT');
        router.push('/employee/attendance/request-signout');
    };

    if (loading) return <div className="p-10 text-center text-gray-500">Initializing...</div>;

    const hasFailure = locationStatus === 'failed' || faceStatus === 'failed';

    return (
        <div className="max-w-5xl mx-auto p-4 md:p-8">
            <div className="mb-8 border-b border-gray-200 pb-4">
                <div className="flex justify-between items-end">
                    <div>
                        <h1 className="text-2xl font-bold text-red-900">Attendance Marking</h1>
                        <p className="text-gray-500 text-sm">Secure biometric & location verified sign-out</p>
                    </div>
                </div>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
                <div className="md:col-span-2 space-y-6">
                    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-6">
                        <div className="grid md:grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Employee</label>
                                <div className="p-3 bg-gray-50 rounded-lg text-gray-800 font-bold flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-red-500"></div>
                                    {empName}
                                </div>
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Server Time</label>
                                <div className="p-3 bg-gray-50 rounded-lg text-gray-800 font-mono font-bold flex items-center gap-2">
                                    <Clock className="w-4 h-4 text-red-500" />
                                    {serverTime}
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4 pt-4 border-t border-gray-50">
                            <h3 className="text-sm font-bold text-gray-700">Verification Steps</h3>

                            <div className={`p-4 rounded-xl border flex items-center justify-between transition-all ${locationStatus === 'passed' ? 'bg-green-50 border-green-200' :
                                locationStatus === 'failed' ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-200'
                                }`}>
                                <div className="flex items-center gap-3">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${locationStatus === 'passed' ? 'bg-green-500 text-white' :
                                        locationStatus === 'failed' ? 'bg-red-500 text-white' : 'bg-red-500 text-white'
                                        }`}>
                                        {locationStatus === 'passed' ? <CheckCircle size={18} /> : 1}
                                    </div>
                                    <div>
                                        <p className="font-bold text-gray-800">Location Check</p>
                                        <p className="text-xs text-gray-500">Verifying you are at your assigned work location</p>
                                    </div>
                                </div>
                                <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded ${locationStatus === 'passed' ? 'bg-green-200 text-green-700' :
                                    locationStatus === 'failed' ? 'bg-red-200 text-red-700' :
                                        isLocationChecking ? 'bg-red-100 text-red-600 animate-pulse' : 'bg-gray-200 text-gray-500'
                                    }`}>
                                    {locationStatus === 'passed' ? 'Verified' :
                                        locationStatus === 'failed' ? 'Out of Range' :
                                            isLocationChecking ? 'Checking...' : 'Ready'}
                                </span>
                            </div>

                            <div className={`p-4 rounded-xl border flex items-center justify-between transition-all ${faceStatus === 'passed' ? 'bg-green-50 border-green-200' :
                                faceStatus === 'failed' ? 'bg-red-50 border-red-200' :
                                    locationStatus !== 'pending' ? 'bg-white border-red-200 shadow-md' : 'bg-gray-50 border-gray-200'
                                }`}>
                                <div className="flex items-center gap-3">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${faceStatus === 'passed' ? 'bg-green-500 text-white' :
                                        faceStatus === 'failed' ? 'bg-red-500 text-white' :
                                            locationStatus !== 'pending' ? 'bg-red-600 text-white animate-pulse' : 'bg-gray-300 text-white'
                                        }`}>
                                        {faceStatus === 'passed' ? <CheckCircle size={18} /> : 2}
                                    </div>
                                    <div>
                                        <p className="font-bold text-gray-800">Biometric Identity</p>
                                        <p className="text-xs text-gray-500">Scanning face to confirm identity</p>
                                    </div>
                                </div>
                                <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded ${faceStatus === 'passed' ? 'bg-green-200 text-green-700' :
                                    faceStatus === 'failed' ? 'bg-red-200 text-red-700' :
                                        locationStatus !== 'pending' ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-400'
                                    }`}>
                                    {faceStatus === 'passed' ? 'Verified' :
                                        faceStatus === 'failed' ? 'Failed' :
                                            locationStatus !== 'pending' ? 'Ready' : 'Locked'}
                                </span>
                            </div>
                        </div>

                        {statusMsg && (
                            <div className={`p-4 rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-2 ${(statusMsg.includes('Success') || statusMsg.includes('Verified')) ? 'bg-green-100 text-green-800 border border-green-200' : 'bg-red-100 text-red-800 border border-red-200'
                                }`}>
                                {(statusMsg.includes('Success') || statusMsg.includes('Verified')) ? <CheckCircle size={20} /> : <AlertTriangle size={20} />}
                                <span className="font-bold text-sm">{statusMsg}</span>
                            </div>
                        )}

                        <div className="flex justify-end gap-3 pt-4">
                            {/* Final Outcomes: Show only after both checks are attempted */}
                            {locationStatus !== 'pending' && faceStatus !== 'pending' && (
                                <>
                                    {/* Success Case */}
                                    {locationStatus === 'passed' && faceStatus === 'passed' && (
                                        <button
                                            onClick={handleCheckOutSubmit}
                                            disabled={isCheckingOut}
                                            className="px-10 py-4 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl transition-all shadow-xl flex items-center gap-2"
                                        >
                                            {isCheckingOut ? <Loader2 className="animate-spin" size={20} /> : <CheckCircle size={20} />}
                                            {isCheckingOut ? 'Signing Out...' : 'Confirm Check Out'}
                                        </button>
                                    )}

                                    {/* Failure Case: Location Fail */}
                                    {locationStatus === 'failed' && faceStatus === 'passed' && (
                                        <button
                                            onClick={() => handleGoToRequest('location')}
                                            className="px-8 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl shadow-lg transition-all flex items-center gap-2"
                                        >
                                            <AlertTriangle size={20} />
                                            Sign out request due to location fail
                                        </button>
                                    )}

                                    {/* Failure Case: Face Fail */}
                                    {locationStatus === 'passed' && faceStatus === 'failed' && (
                                        <button
                                            onClick={() => handleGoToRequest('face')}
                                            className="px-8 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl shadow-lg transition-all flex items-center gap-2"
                                        >
                                            <AlertTriangle size={20} />
                                            Sign out request due to face matching fail
                                        </button>
                                    )}

                                    {/* Failure Case: Both Fail */}
                                    {locationStatus === 'failed' && faceStatus === 'failed' && (
                                        <button
                                            onClick={() => handleGoToRequest('both')}
                                            className="px-8 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl shadow-lg transition-all flex items-center gap-2"
                                        >
                                            <AlertTriangle size={20} />
                                            Sign out request due to location and face failure
                                        </button>
                                    )}
                                </>
                            )}

                            {/* Active Triggers */}
                            {locationStatus === 'pending' && (
                                <button
                                    disabled={isLocationChecking}
                                    onClick={() => {
                                        setIsLocationChecking(true);
                                        setStatusMsg('');
                                    }}
                                    className={`px-10 py-4 font-bold rounded-xl transition-all shadow-xl flex items-center gap-2 ${isLocationChecking ? 'bg-gray-400 cursor-not-allowed' : 'bg-red-600 hover:bg-red-700 text-white'}`}
                                >
                                    {isLocationChecking ? <Loader2 className="animate-spin" size={20} /> : <MapPin size={20} />}
                                    {isLocationChecking ? 'Checking Location...' : 'Check Location'}
                                </button>
                            )}

                            {locationStatus !== 'pending' && faceStatus === 'pending' && (
                                <button
                                    onClick={() => setShowCamera(true)}
                                    className="px-10 py-4 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl transition-all shadow-xl flex items-center gap-2"
                                >
                                    <Camera size={20} />
                                    Start Face Verification
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                        <div className="flex items-center gap-2 mb-4">
                            <MapPin className="text-red-500" size={16} />
                            <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Live Location</span>
                        </div>
                        <div className="rounded-xl overflow-hidden grayscale contrast-125 border border-gray-100">
                            <GeoGuard active={isLocationChecking} targetLat={mockTgtLat} targetLng={mockTgtLng} radius={mockRadius} onStatusChange={handleGeoStatus} />
                        </div>
                        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                            <div className="flex justify-between text-[10px] font-mono text-gray-500 uppercase">
                                <span>Lat</span>
                                <span>Lng</span>
                            </div>
                            <div className="flex justify-between font-mono text-xs font-bold text-gray-700">
                                <span>{currentLoc.lat.toFixed(6)}</span>
                                <span>{currentLoc.lng.toFixed(6)}</span>
                            </div>
                        </div>
                    </div>

                    {capturedImage && (
                        <div className="bg-white p-4 rounded-2xl border border-red-100 shadow-md">
                            <div className="flex items-center gap-2 mb-3">
                                <Camera className="text-red-500" size={16} />
                                <span className="text-[10px] font-bold uppercase tracking-widest text-red-400">Captured Face Fail</span>
                            </div>
                            <img src={capturedImage} className="w-full h-48 object-cover rounded-lg border-2 border-red-500" alt="Captured fail" />
                        </div>
                    )}
                </div>
            </div>

            {showCamera && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-red-900/40 backdrop-blur-md p-4 animate-in fade-in duration-300">
                    <div className="bg-white p-8 rounded-3xl shadow-2xl w-full max-w-2xl border border-red-100 animate-in zoom-in-95 duration-300">
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h3 className="text-2xl font-black text-gray-800">Biometric Check</h3>
                                <p className="text-gray-500">Security layer 2: Face Recognition</p>
                            </div>
                            <button onClick={() => setShowCamera(false)} className="p-2 hover:bg-gray-100 rounded-full transition">
                                <span className="text-2xl text-gray-400">&times;</span>
                            </button>
                        </div>

                        <FaceCheck
                            referenceDescriptors={referenceDescriptors}
                            onMatchSuccess={handleFaceSuccess}
                            onMatchFail={handleFaceFailure}
                            employeeName={employeeName}
                        />

                        <div className="mt-8 flex items-center justify-center gap-6 text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                            <span className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-red-500"></div> End-to-end Encrypted</span>
                            <span className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-red-500"></div> Local Processing</span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
