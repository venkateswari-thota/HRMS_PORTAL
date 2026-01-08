'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Camera, CheckCircle, AlertTriangle, MapPin, Loader2 } from 'lucide-react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import GeoGuard from '@/components/attendance/GeoGuard';
import { apiRequest } from '@/lib/api';

// Dynamic import for FaceCheck to prevent SSR issues
const FaceCheck = dynamic(() => import('@/components/FaceCheck'), { ssr: false, loading: () => <div className="text-center p-4">Loading camera...</div> });

export default function AttendanceSignOut() {
    const router = useRouter();
    const [checkOutAllowed, setCheckOutAllowed] = useState(false);
    const [currentLoc, setCurrentLoc] = useState({ lat: 0, lng: 0 });
    const [showCamera, setShowCamera] = useState(false);
    const [statusMsg, setStatusMsg] = useState('');
    const [serverTime, setServerTime] = useState('');
    const [empName, setEmpName] = useState('Employee');
    const [loading, setLoading] = useState(true);
    const [faceMatchSuccess, setFaceMatchSuccess] = useState(false);

    // Face matching state (loaded directly, not via hook)
    const [loadingImages, setLoadingImages] = useState(false);
    const [imageError, setImageError] = useState<string | null>(null);
    const [referenceDescriptors, setReferenceDescriptors] = useState<any>(null);
    const [employeeName, setEmployeeName] = useState('');
    const [imageCount, setImageCount] = useState(0);

    // Employee work location (fetched from backend)
    const [workLocation, setWorkLocation] = useState({
        lat: 0,
        lng: 0,
        radius: 0
    });

    useEffect(() => {
        const init = async () => {
            const token = localStorage.getItem('emp_token');
            if (!token) {
                router.push('/auth/employee/signin');
                return;
            }

            const storedName = localStorage.getItem('emp_name');
            if (storedName) setEmpName(storedName);

            try {
                const timeRes = await apiRequest('/attendance/time');
                setServerTime(new Date(timeRes.iso_time).toLocaleString());

                // Fetch employee work location
                const empInfo = await apiRequest('/attendance/me/info', 'GET', null, token);
                setWorkLocation({
                    lat: empInfo.work_lat,
                    lng: empInfo.work_lng,
                    radius: empInfo.geofence_radius
                });
                setEmployeeName(empInfo.name);

                // Load face images directly
                setLoadingImages(true);
                const imagesData = await apiRequest('/attendance/me/images', 'GET', null, token);
                if (imagesData && imagesData.images && imagesData.images.length > 0) {
                    setReferenceDescriptors(imagesData.images);
                    setImageCount(imagesData.images.length);
                } else {
                    setImageError('⚠️ No face images found. Please contact admin.');
                }
                setLoadingImages(false);
            } catch (e: any) {
                console.error(e);
                setLoadingImages(false);
                if (e.message?.includes('No face images')) {
                    setImageError('⚠️ No face images found. Please contact admin to upload your photos.');
                }
            } finally {
                setLoading(false);
            }
        };
        init();

        const timer = setInterval(() => {
            const now = new Date();
            const formatted = now.getFullYear() + "-" +
                String(now.getMonth() + 1).padStart(2, '0') + "-" +
                String(now.getDate()).padStart(2, '0') + " " +
                String(now.getHours()).padStart(2, '0') + ":" +
                String(now.getMinutes()).padStart(2, '0') + ":" +
                String(now.getSeconds()).padStart(2, '0');
            setServerTime(formatted);
        }, 1000);

        return () => clearInterval(timer);
    }, []);

    const handleGeoStatus = (valid: boolean, lat: number, lng: number) => {
        setCheckOutAllowed(valid);
        setCurrentLoc({ lat, lng });
    };

    const handleCheckOutClick = () => {
        // 1. Check Location first
        if (!checkOutAllowed) {
            setStatusMsg("⚠️ You are outside the allowed work location. Go with the sign-out request.");
            return;
        }

        // 2. Check if face images loaded
        if (!referenceDescriptors) {
            alert("Face images not loaded. Please refresh the page.");
            return;
        }

        // 3. Open Camera for face verification
        setShowCamera(true);
        setFaceMatchSuccess(false);
    };

    const handleFaceMatchSuccess = async () => {
        setFaceMatchSuccess(true);
        setShowCamera(false);

        // Double-check location before allowing submission
        if (!checkOutAllowed) {
            setFaceMatchSuccess(false);
            setStatusMsg("⚠️ Face verified, but you're outside the work location. Please go to your work location or submit a sign-out request for attendance.");
            return;
        }
        try {
            const token = localStorage.getItem('emp_token');
            await apiRequest('/attendance/check-out', 'POST', {
                lat: currentLoc.lat,
                lng: currentLoc.lng
            }, token || '');

            setStatusMsg('✅ Check-Out Successful!');
            setTimeout(() => router.push('/employee/home'), 2000);
        } catch (err: any) {
            setStatusMsg('❌ Failed: ' + err.message);
        }
    };

    const handleFaceMatchFail = () => {
        setShowCamera(false);
        setStatusMsg("❌ Face doesn't match our records. Go with sign-out request.");
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
                    <p className="text-gray-600">Loading Attendance System...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto p-6">
            {/* Header */}
            <div className="mb-8 border-b border-gray-200 pb-4">
                <h1 className="text-2xl font-bold text-blue-600">Attendance</h1>
                <div className="mt-4 flex gap-2">
                    <Link href="/employee/attendance/signin" className="px-6 py-2 bg-gray-200 text-gray-600 font-medium rounded hover:bg-gray-300 transition">Check In</Link>
                    <button className="px-6 py-2 bg-green-600 text-white font-medium rounded shadow-sm">Check Out</button>
                </div>
            </div>

            {/* Face Images Loading Status */}
            {loadingImages && (
                <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-center gap-3">
                    <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                    <span className="text-blue-700 font-medium">Loading your face images from cloud...</span>
                </div>
            )}

            {imageError && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
                    <AlertTriangle className="w-5 h-5 text-red-600" />
                    <span className="text-red-700 font-medium">{imageError}</span>
                </div>
            )}

            {referenceDescriptors && !loadingImages && (
                <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span className="text-green-700 font-medium">
                        ✅ {imageCount} face images loaded for {employeeName}
                    </span>
                </div>
            )}

            {/* Main Form Area */}
            <div className="bg-white p-8 rounded-lg border border-gray-100 shadow-sm max-w-3xl">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                    <div className="space-y-2">
                        <label className="block text-sm font-bold text-gray-700">Employee Name <span className="text-red-500">*</span></label>
                        <div className="w-full p-3 bg-gray-100 border border-gray-300 rounded text-gray-700 font-medium">
                            {empName}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="block text-sm font-bold text-gray-700">Punch Time <span className="text-red-500">*</span></label>
                        <div className="w-full p-3 bg-gray-100 border border-gray-300 rounded text-gray-700 font-mono">
                            {serverTime}
                        </div>
                    </div>
                </div>

                {statusMsg && (
                    <div className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${statusMsg.includes('Success') || statusMsg.includes('✅') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                        {statusMsg.includes('Success') || statusMsg.includes('✅') ? <CheckCircle size={20} /> : <AlertTriangle size={20} />}
                        <span className="font-medium">{statusMsg}</span>
                        {!statusMsg.includes('Success') && !statusMsg.includes('✅') && (
                            <Link href="/employee/attendance/request-signout" className="ml-auto text-sm underline hover:text-red-900">
                                Request Sign Out &rarr;
                            </Link>
                        )}
                    </div>
                )}

                {/* Primary Action */}
                <div className="flex justify-end gap-3">
                    {!faceMatchSuccess && (
                        <button
                            onClick={handleCheckOutClick}
                            disabled={!checkOutAllowed || !referenceDescriptors || loadingImages}
                            className="px-8 py-3 bg-blue-600 text-white font-bold rounded hover:bg-blue-700 transition shadow-lg flex items-center gap-2 disabled:bg-gray-400 disabled:cursor-not-allowed"
                        >
                            <Camera size={20} />
                            {loadingImages ? 'Loading Images...' : 'Verify Face'}
                        </button>
                    )}

                    {faceMatchSuccess && (
                        <button
                            onClick={async () => {
                                try {
                                    const token = localStorage.getItem('emp_token');
                                    await apiRequest('/attendance/check-out', 'POST', {
                                        lat: currentLoc.lat,
                                        lng: currentLoc.lng
                                    }, token || '');
                                    setStatusMsg('✅ Check-Out Successful!');
                                    setTimeout(() => router.push('/employee/home'), 2000);
                                } catch (err: any) {
                                    setStatusMsg('❌ Failed: ' + err.message);
                                }
                            }}
                            className="px-8 py-3 bg-green-600 text-white font-bold rounded hover:bg-green-700 transition shadow-lg flex items-center gap-2 animate-pulse"
                        >
                            <CheckCircle size={20} />
                            Submit Check Out
                        </button>
                    )}
                </div>
            </div>

            {/* Location Monitor */}
            <div className="mt-8 p-4 bg-gray-50 border border-gray-200 rounded-lg max-w-xs">
                <div className="flex items-center gap-2 mb-2 text-gray-600">
                    <MapPin size={16} />
                    <span className="text-xs font-semibold uppercase">Location Monitor</span>
                </div>
                <GeoGuard targetLat={workLocation.lat} targetLng={workLocation.lng} radius={workLocation.radius} onStatusChange={handleGeoStatus} />
                <div className="mt-2 text-xs text-gray-400 font-mono">
                    {currentLoc.lat.toFixed(5)}, {currentLoc.lng.toFixed(5)}
                </div>
            </div>

            {/* Camera Modal Overlay */}
            {showCamera && referenceDescriptors && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                    <div className="bg-white p-6 rounded-2xl shadow-2xl w-full max-w-2xl">
                        <h3 className="text-2xl font-bold mb-4 text-center text-gray-800">Identity Verification (Check Out)</h3>
                        <p className="text-center text-gray-600 mb-6">Please look at the camera and blink naturally</p>

                        <FaceCheck
                            referenceDescriptors={referenceDescriptors}
                            onMatchSuccess={handleFaceMatchSuccess}
                            onMatchFail={handleFaceMatchFail}
                            employeeName={employeeName}
                        />

                        <div className="mt-6 flex justify-between items-center">
                            <span className="text-xs text-gray-400">🔒 Your face data is processed locally and never sent to servers</span>
                            <button
                                onClick={() => setShowCamera(false)}
                                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded transition"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
