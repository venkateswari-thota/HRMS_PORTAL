'use client';
import { useState, useEffect } from 'react';
import { apiRequest } from '@/lib/api';
import { useRouter } from 'next/navigation';

export default function RequestForm() {
    const router = useRouter();
    const [type, setType] = useState('CHECK_IN');
    const [reason, setReason] = useState('');
    const [loc, setLoc] = useState<{ lat: number, lng: number } | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        // Capture Current Location immediately for the report
        navigator.geolocation.getCurrentPosition(
            pos => setLoc({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
            err => alert("Location permission needed for Request")
        );
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!loc) return alert("Location not valid");

        setLoading(true);
        try {
            await apiRequest('/attendance/request', 'POST', {
                emp_id: "EMP_CURRENT", // In real app, extract from token
                type,
                reason,
                lat: loc.lat,
                lng: loc.lng
            }, localStorage.getItem('emp_token') || '');

            alert("Request Submitted to Admin. You will be notified via email.");
            router.push('/employee/attendance');
        } catch (err: any) {
            alert("Failed: " + err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="glass-panel p-6 max-w-md mx-auto mt-10">
            <h2 className="text-xl font-bold mb-4 text-white">Attendance Request</h2>
            <p className="text-xs text-gray-400 mb-6">Use this only if biometrics or location check fails.</p>

            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-xs uppercase text-gray-400 mb-1">Request Type</label>
                    <select className="auth-input" value={type} onChange={e => setType(e.target.value)}>
                        <option value="CHECK_IN">Check In Override</option>
                        <option value="CHECK_OUT">Check Out Override</option>
                    </select>
                </div>

                <div>
                    <label className="block text-xs uppercase text-gray-400 mb-1">Reason for Request</label>
                    <textarea
                        className="auth-input h-24 resize-none"
                        placeholder="e.g. Camera not working, or on Client Site..."
                        value={reason}
                        onChange={e => setReason(e.target.value)}
                        required
                    />
                </div>

                <div>
                    <label className="block text-xs uppercase text-gray-400 mb-1">Current Location (Auto)</label>
                    <div className="p-3 bg-gray-800 rounded font-mono text-sm text-blue-300">
                        {loc ? `${loc.lat.toFixed(5)}, ${loc.lng.toFixed(5)}` : "Detecting..."}
                    </div>
                </div>

                <button type="submit" disabled={loading || !loc} className="btn-primary w-full mt-4">
                    {loading ? 'Sending...' : 'Submit Request'}
                </button>
            </form>
        </div>
    );
}
