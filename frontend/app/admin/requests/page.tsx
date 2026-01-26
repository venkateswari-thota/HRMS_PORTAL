'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { apiRequest } from '@/lib/api';
import Link from 'next/link';

export default function AdminRequestsPage() {
    const router = useRouter();
    const [pendingRequests, setPendingRequests] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);

    const [mounted, setMounted] = useState(false);

    const fetchRequests = async () => {
        try {
            const token = localStorage.getItem('admin_token');
            // Only fetch pending requests (from requests collection)
            const data = await apiRequest('/admin/requests', 'GET', null, token || '');
            console.log('📊 Pending requests received:', data);
            setPendingRequests(Array.isArray(data) ? data : []);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        setMounted(true);
        // Auth check
        const token = localStorage.getItem('admin_token');
        if (!token) {
            router.push('/auth/admin/signin');
            return;
        }
        fetchRequests();
    }, [router]);

    if (!mounted) return null;

    const handleAction = async (id: string, action: 'APPROVE' | 'REJECT') => {
        if (!confirm(`Are you sure you want to ${action} this request?`)) return;
        try {
            const token = localStorage.getItem('admin_token');
            await apiRequest('/admin/requests/review', 'POST', { request_id: id, action }, token || '');
            alert(`Request ${action === 'APPROVE' ? 'Approved' : 'Rejected'} Successfully!`);
            fetchRequests(); // Refresh
        } catch (e: any) {
            alert(e.message);
        }
    };

    return (
        <div className="min-h-screen bg-black text-white p-8">
            <div className="mb-6 flex items-center justify-between">
                <h1 className="text-2xl font-bold flex items-center gap-2">
                    <span className="w-3 h-3 bg-yellow-500 rounded-full"></span>
                    Pending Attendance Approval
                </h1>
                <div className="flex gap-4">
                    <Link href="/admin/approved" className="text-green-400 hover:underline">
                        View Approved →
                    </Link>
                    <Link href="/admin/onboard" className="text-blue-400 hover:underline">
                        ← Back to Dashboard
                    </Link>
                </div>
            </div>

            <div className="mb-4 text-gray-400">
                Total Pending: {loading ? '...' : pendingRequests.length}
            </div>

            <div className="grid gap-4">
                {loading && (
                    <div className="text-center py-20">
                        <div className="animate-spin w-8 h-8 border-4 border-yellow-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                        <p className="text-gray-400 animate-pulse">Fetching pending attendance requests...</p>
                    </div>
                )}

                {!loading && pendingRequests.length === 0 && (
                    <p className="text-gray-500">No pending attendance requests.</p>
                )}

                {pendingRequests.map(req => (
                    <div key={req.id} className="glass-panel p-6 border border-gray-800 rounded-xl bg-gray-900/50 hover:border-gray-600 transition-all">
                        <div className="flex flex-col lg:flex-row gap-6">
                            {/* Left: Info */}
                            <div className="flex-1 space-y-4">
                                <div className="flex items-center gap-3">
                                    <span className={`px-3 py-1 text-xs rounded-full font-black tracking-widest ${req.type === 'CHECK_IN' ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'}`}>
                                        {req.type}
                                    </span>
                                    <span className="text-xs text-gray-400 font-mono">{new Date(req.timestamp).toLocaleString()}</span>
                                </div>

                                <div className="space-y-1">
                                    <h3 className="text-2xl font-black text-white">{req.emp_id}</h3>
                                    <p className="text-gray-400 text-sm leading-relaxed">
                                        Reason: <span className="text-gray-100 italic">"{req.reason}"</span>
                                    </p>
                                </div>

                                <div className="flex items-center gap-4 pt-2">
                                    <a
                                        href={`https://www.google.com/maps?q=${req.location_lat},${req.location_lng}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="bg-gray-800/50 p-2 rounded-lg border border-gray-700/50 hover:bg-blue-500/10 hover:border-blue-500/50 transition-all cursor-pointer block"
                                        title="View on Google Maps (New Tab for Stability)"
                                    >
                                        <p className="text-[10px] uppercase font-bold text-gray-500 mb-1">Coordinates (Click for Maps)</p>
                                        <p className="text-xs font-mono text-blue-400 font-bold underline transition-colors">{req.location_lat.toFixed(5)}, {req.location_lng.toFixed(5)}</p>
                                    </a>
                                    <div className="bg-gray-800/50 p-2 rounded-lg border border-gray-700/50">
                                        <p className="text-[10px] uppercase font-bold text-gray-500 mb-1">Status</p>
                                        <p className="text-xs font-bold text-yellow-500">PENDING REVIEW</p>
                                    </div>
                                </div>
                            </div>

                            {/* Middle: Verification Image */}
                            {req.face_image && (
                                <div className="w-full lg:w-48 space-y-2">
                                    <p className="text-[10px] uppercase font-bold text-gray-400 tracking-widest">Verification Photo</p>
                                    <div
                                        className="relative group cursor-zoom-in"
                                        onClick={() => setSelectedImage(req.face_image)}
                                    >
                                        <img
                                            src={req.face_image}
                                            alt="Captured face"
                                            className="w-full h-32 object-cover rounded-xl border border-gray-700 group-hover:border-blue-500 transition-all shadow-2xl"
                                        />
                                        <div className="absolute inset-0 bg-blue-500/20 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex items-center justify-center">
                                            <span className="text-[10px] font-bold text-white bg-black/60 px-2 py-1 rounded">Enlarge Image</span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Right: Actions */}
                            <div className="flex lg:flex-col gap-3 justify-center">
                                <button
                                    onClick={() => handleAction(req.id, 'APPROVE')}
                                    className="flex-1 lg:w-32 py-3 bg-green-600 hover:bg-green-50 text-white hover:text-green-900 font-black rounded-xl transition-all shadow-lg active:scale-95"
                                >
                                    APPROVE
                                </button>
                                <button
                                    onClick={() => handleAction(req.id, 'REJECT')}
                                    className="flex-1 lg:w-32 py-3 bg-red-600 hover:bg-red-50 text-white hover:text-red-900 font-black rounded-xl transition-all shadow-lg active:scale-95"
                                >
                                    REJECT
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Image Zoom Modal */}
            {selectedImage && (
                <div
                    className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4 backdrop-blur-sm transition-all animate-in fade-in zoom-in duration-200"
                    onClick={() => setSelectedImage(null)}
                >
                    <div className="relative max-w-4xl w-full">
                        <button
                            className="absolute -top-12 right-0 text-white hover:text-red-500 text-sm font-black tracking-widest flex items-center gap-2 transition-colors"
                            onClick={() => setSelectedImage(null)}
                        >
                            CLOSE [X]
                        </button>
                        <img
                            src={selectedImage}
                            alt="Verification Full Size"
                            className="w-full h-auto max-h-[85vh] object-contain rounded-2xl border-2 border-white/20 shadow-2xl"
                            onClick={(e) => e.stopPropagation()}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}
