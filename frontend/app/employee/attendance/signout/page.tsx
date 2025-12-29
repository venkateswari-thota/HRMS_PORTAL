'use client';
import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { apiRequest } from '@/lib/api';
import GeoGuard from '@/components/attendance/GeoGuard';
import Link from 'next/link';
import { AlertTriangle, CheckCircle, Camera, MapPin } from 'lucide-react';

const FaceCheck = dynamic(() => import('@/components/attendance/FaceCheck'), { ssr: false });

export default function AttendanceSignOut() {
    const router = useRouter();
    const [checkInAllowed, setCheckInAllowed] = useState(false);
    const [currentLoc, setCurrentLoc] = useState({ lat: 0, lng: 0 });
    const [showCamera, setShowCamera] = useState(false);
    const [faceRefData, setFaceRefData] = useState<any[]>([]);
    const [statusMsg, setStatusMsg] = useState('');
    const [serverTime, setServerTime] = useState('');
    const [empName, setEmpName] = useState('Employee');
    const [loading, setLoading] = useState(true);

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
            } catch (e) {
                console.error(e);
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
        setCheckInAllowed(valid);
        setCurrentLoc({ lat, lng });
    };

    const handleCheckOutClick = async () => {
        if (!checkInAllowed) {
            alert("You are outside the allowed work location.");
            return;
        }

        try {
            const profile = await apiRequest(`/attendance/profile?emp_id=EMP001`);
            if (profile.face_photos) {
                setFaceRefData(profile.face_photos);
            }
            setShowCamera(true);
        } catch (e) {
            alert("Failed to load Face Data from Server.");
        }
    };

    const handleFaceSuccess = async () => {
        setShowCamera(false);
        try {
            await apiRequest('/attendance/check-out', 'POST', {
                emp_id: "EMP_CURRENT",
                lat: currentLoc.lat,
                lng: currentLoc.lng
            }, localStorage.getItem('emp_token') || '');

            setStatusMsg('Check-Out Successful! ✅');
            setTimeout(() => router.push('/employee/home'), 2000);
        } catch (err: any) {
            setStatusMsg('Failed: ' + err.message);
        }
    };

    const handleFaceFailure = (reason: string) => {
        setStatusMsg("Face Validation Failed: " + reason);
    };

    if (loading) return <div className="p-10 text-center text-gray-500">Loading Attendance System...</div>;

    return (
        <div className="max-w-5xl mx-auto">
            {/* Header */}
            <div className="mb-8 border-b border-gray-200 pb-4">
                <h1 className="text-xl font-bold text-blue-600">Attendance</h1>
                <div className="mt-4 flex gap-2">
                    <Link href="/employee/attendance/signin" className="px-6 py-2 bg-gray-200 text-gray-600 font-medium rounded hover:bg-gray-300 transition">Check In</Link>
                    <button className="px-6 py-2 bg-green-600 text-white font-medium rounded shadow-sm">Check Out</button>
                </div>
            </div>

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
                            <Link href="/employee/attendance/request-signout" className="ml-auto text-sm underline hover:text-red-900">
                                Request Sign Out &rarr;
                            </Link>
                        )}
                    </div>
                )}

                {/* Primary Action */}
                <div className="flex justify-end">
                    <button
                        onClick={handleCheckOutClick}
                        className="px-8 py-3 bg-green-600 text-white font-bold rounded hover:bg-green-700 transition shadow-lg flex items-center gap-2"
                    >
                        <Camera size={20} />
                        Check Out
                    </button>
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
            {showCamera && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
                    <div className="bg-white p-6 rounded-2xl shadow-2xl w-full max-w-lg">
                        <h3 className="text-xl font-bold mb-4 text-center text-gray-800">Identity Verification (Out)</h3>
                        <div className="relative bg-black rounded-lg overflow-hidden aspect-video border-2 border-gray-200">
                            <FaceCheck
                                referenceDescriptors={faceRefData}
                                onSuccess={handleFaceSuccess}
                                onFailure={handleFaceFailure}
                            />
                            {/* Overlay Instruction */}
                            <div className="absolute bottom-4 left-0 w-full text-center text-white/90 text-sm font-medium drop-shadow-md">
                                Please blink your eyes to verify liveness
                            </div>
                        </div>
                        <div className="mt-6 flex justify-between items-center">
                            <span className="text-xs text-gray-400">Comparing with reliable face data...</span>
                            <button
                                onClick={() => setShowCamera(false)}
                                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded"
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
