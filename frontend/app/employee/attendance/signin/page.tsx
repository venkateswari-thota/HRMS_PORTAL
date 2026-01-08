'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiRequest } from '@/lib/api';
import GeoGuard from '@/components/attendance/GeoGuard';
import Link from 'next/link';
import { AlertTriangle, CheckCircle, Camera, MapPin, Loader2, Image as ImageIcon } from 'lucide-react';
import dynamic from 'next/dynamic';

// Dynamic import for FaceCheck to prevent SSR issues
const FaceCheck = dynamic(() => import('@/components/FaceCheck'), { ssr: false, loading: () => <div className="text-center p-4">Loading camera...</div> });

export default function AttendanceSignIn() {
    const router = useRouter();
    const [checkInAllowed, setCheckInAllowed] = useState(false);
    const [currentLoc, setCurrentLoc] = useState({ lat: 0, lng: 0 });
    const [showCamera, setShowCamera] = useState(false);
    const [statusMsg, setStatusMsg] = useState('');
    const [serverTime, setServerTime] = useState('');
    const [empName, setEmpName] = useState('Employee');
    const [loading, setLoading] = useState(true);
    const [faceMatchSuccess, setFaceMatchSuccess] = useState(false);

    // Face matching state (loaded directly, not via hook)
    const [loadingImages, setLoadingImages] = useState(false);
    const [referenceDescriptors, setReferenceDescriptors] = useState<any>(null);
    const [employeeName, setEmployeeName] = useState('');
    const [imageCount, setImageCount] = useState(0);

    // Employee work location
    const [workLocation, setWorkLocation] = useState({
        lat: 0,
        lng: 0,
        radius: 0
    });

    // Mock Data (Ideally fetch from /auth/me or Config)
    const mockTgtLat = 20.5937;
    const mockTgtLng = 78.9629;
    const mockRadius = 500000;

    useEffect(() => {
        const init = async () => {
            const token = localStorage.getItem('emp_token');
            if (!token) { router.push('/auth/employee/signin'); return; }

            // Get Name
            const storedName = localStorage.getItem('emp_name');
            if (storedName) setEmpName(storedName);

            try {
                // Fetch Time
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

                // Load face images (descriptors will be created by FaceCheck component)
                setLoadingImages(true);
                const imagesData = await apiRequest('/attendance/me/images', 'GET', null, token);
                if (imagesData && imagesData.images && imagesData.images.length > 0) {
                    // FaceCheck component will handle descriptor creation from base64 images
                    setReferenceDescriptors(imagesData.images); // Array of base64 data URLs
                    setImageCount(imagesData.images.length);
                } else {
                    setStatusMsg('⚠️ No face images found. Please contact admin.');
                }
                setLoadingImages(false);
            } catch (e: any) {
                console.error(e);
                setLoadingImages(false);
                if (e.message?.includes('No face images')) {
                    setStatusMsg('⚠️ No face images found. Please contact admin to upload your photos.');
                }
            } finally {
                setLoading(false);
            }
        };
        init();

        const timer = setInterval(() => {
            const now = new Date();
            // Format: YYYY-MM-DD HH:mm:ss
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
        setCheckInAllowed(valid);
        setCurrentLoc({ lat, lng });
    };

    const handleCheckInClick = () => {
        // Just open camera - images already loaded by useFaceMatching hook
        console.log('🎥 Opening camera for face verification');
        console.log('📸 Reference descriptors:', referenceDescriptors);
        console.log('📊 Image count:', imageCount);
        console.log('👤 Employee name:', employeeName);

        if (!referenceDescriptors || loadingImages) {
            setStatusMsg("⚠️ Face images are still loading. Please wait...");
            console.warn('⚠️ Cannot open camera - images not loaded yet');
            return;
        }
        setShowCamera(true);
        setStatusMsg('');
    };

    const handleFaceSuccess = async () => {
        setShowCamera(false);
        try {
            await apiRequest('/attendance/check-in', 'POST', {
                lat: currentLoc.lat,
                lng: currentLoc.lng
            }, localStorage.getItem('emp_token') || '');

            setStatusMsg('Check-In Successful! ✅');
            setTimeout(() => router.push('/employee/home'), 2000);
        } catch (err: any) {
            setStatusMsg('Failed: ' + err.message);
        }
    };

    const handleFaceFailure = () => {
        setShowCamera(false);
        setStatusMsg("❌ Face doesn't match our records. Go with sign-in request.");
    };

    if (loading) return <div className="p-10 text-center text-gray-500">Loading Attendance System...</div>;

    return (
        <div className="max-w-5xl mx-auto">
            {/* Header */}
            <div className="mb-8 border-b border-gray-200 pb-4">
                <h1 className="text-xl font-bold text-blue-600">Attendance</h1>
                <div className="mt-4 flex gap-2">
                    <button className="px-6 py-2 bg-gray-200 text-gray-600 font-medium rounded shadow-sm">Check In</button>
                    <Link href="/employee/attendance/signout" className="px-6 py-2 bg-gray-200 text-gray-600 font-medium rounded hover:bg-gray-300 transition">Check Out</Link>
                </div>
            </div>

            {/* Face Images Loading Status */}
            {loadingImages && (
                <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-center gap-3">
                    <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                    <span className="text-blue-700 font-medium">Loading your face images from cloud...</span>
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

                    {/* Employee Name */}
                    <div className="space-y-2">
                        <label className="block text-sm font-bold text-gray-700">Employee Name <span className="text-red-500">*</span></label>
                        <div className="w-full p-3 bg-gray-100 border border-gray-300 rounded text-gray-700 font-medium">
                            {empName}
                        </div>
                    </div>

                    {/* Punch Time */}
                    <div className="space-y-2">
                        <label className="block text-sm font-bold text-gray-700">Punch Time <span className="text-red-500">*</span></label>
                        <div className="w-full p-3 bg-gray-100 border border-gray-300 rounded text-gray-700 font-mono">
                            {serverTime}
                        </div>
                    </div>

                </div>

                {/* Status Messages */}
                {statusMsg && (
                    <div className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${statusMsg.includes('Success') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                        {statusMsg.includes('Success') ? <CheckCircle size={20} /> : <AlertTriangle size={20} />}
                        <span className="font-medium">{statusMsg}</span>
                        {!statusMsg.includes('Success') && (
                            <Link href="/employee/attendance/request-signin" className="ml-auto text-sm underline hover:text-red-900">
                                Request Sign In &rarr;
                            </Link>
                        )}
                    </div>
                )}

                {/* Primary Action */}
                <div className="flex justify-end gap-3">
                    {!faceMatchSuccess && (
                        <button
                            onClick={handleCheckInClick}
                            disabled={!referenceDescriptors || loadingImages}
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
                                    await apiRequest('/attendance/check-in', 'POST', {
                                        lat: currentLoc.lat,
                                        lng: currentLoc.lng
                                    }, token || '');
                                    setStatusMsg('✅ Check-In Successful!');
                                    setTimeout(() => router.push('/employee/home'), 2000);
                                } catch (err: any) {
                                    setStatusMsg('❌ Failed: ' + err.message);
                                }
                            }}
                            disabled={!checkInAllowed}
                            className="px-8 py-3 bg-green-600 text-white font-bold rounded hover:bg-green-700 transition shadow-lg flex items-center gap-2 disabled:bg-gray-400 disabled:cursor-not-allowed"
                        >
                            <CheckCircle size={20} />
                            Submit Check In
                        </button>
                    )}
                </div>
            </div>

            {/* Hidden GeoGuard */}
            <div className="mt-8 p-4 bg-gray-50 border border-gray-200 rounded-lg max-w-xs opacity-75">
                <div className="flex items-center gap-2 mb-2 text-gray-600">
                    <MapPin size={16} />
                    <span className="text-xs font-semibold uppercase">Location Monitor</span>
                </div>
                <GeoGuard targetLat={mockTgtLat} targetLng={mockTgtLng} radius={mockRadius} onStatusChange={handleGeoStatus} />
                <div className="mt-2 text-xs text-gray-400 font-mono">
                    {currentLoc.lat.toFixed(5)}, {currentLoc.lng.toFixed(5)}
                </div>
            </div>

            {/* Camera Modal Overlay */}
            {showCamera && referenceDescriptors && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                    <div className="bg-white p-6 rounded-2xl shadow-2xl w-full max-w-2xl">
                        <h3 className="text-2xl font-bold mb-4 text-center text-gray-800">Identity Verification (Check In)</h3>
                        <p className="text-center text-gray-600 mb-6">Please look at the camera and blink naturally</p>
                        <FaceCheck
                            referenceDescriptors={referenceDescriptors}
                            onMatchSuccess={handleFaceSuccess}
                            onMatchFail={handleFaceFailure}
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
