'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { apiRequest } from '@/lib/api';
import Link from 'next/link';

export default function AdminApprovedPage() {
    const router = useRouter();
    const [approvedRequests, setApprovedRequests] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const [mounted, setMounted] = useState(false);

    const fetchApproved = async () => {
        try {
            const token = localStorage.getItem('admin_token');
            const data = await apiRequest('/admin/approved', 'GET', null, token || '');
            console.log('✅ Approved requests received:', data);
            setApprovedRequests(Array.isArray(data) ? data : []);
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
        fetchApproved();
    }, [router]);

    if (!mounted) return null;

    return (
        <div className="min-h-screen bg-black text-white p-8">
            <div className="mb-6 flex items-center justify-between">
                <h1 className="text-2xl font-bold flex items-center gap-2">
                    <span className="w-3 h-3 bg-green-500 rounded-full"></span>
                    Approved Requests
                </h1>
                <Link href="/admin/onboard" className="text-blue-400 hover:underline">
                    ← Back to Dashboard
                </Link>
            </div>

            <div className="mb-4 text-gray-400">
                Total Approved: {loading ? '...' : approvedRequests.length}
            </div>

            <div className="grid gap-4">
                {loading && (
                    <div className="text-center py-20">
                        <div className="animate-spin w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                        <p className="text-gray-400 animate-pulse">Retrieving historical approvals...</p>
                    </div>
                )}

                {!loading && approvedRequests.length === 0 && (
                    <p className="text-gray-500">No approved requests yet.</p>
                )}

                {approvedRequests.map(req => (
                    <div key={req.id} className="glass-panel p-4 bg-green-900/10 border-l-4 border-l-green-500">
                        <div className="flex items-center gap-2 mb-2">
                            <span className={`px-2 py-0.5 text-xs rounded font-bold ${req.type === 'CHECK_IN' ? 'bg-green-900 text-green-300' : 'bg-red-900 text-red-300'}`}>
                                {req.type}
                            </span>
                            <span className="font-mono text-xs text-gray-400">
                                Requested: {new Date(req.timestamp).toLocaleString()}
                            </span>
                            <span className="ml-auto px-2 py-0.5 text-xs rounded font-bold bg-green-700 text-green-100">
                                ✓ APPROVED
                            </span>
                        </div>
                        <h3 className="font-bold text-lg">{req.emp_id}</h3>
                        <p className="text-sm text-gray-300 mt-1">
                            Reason: <span className="italic">"{req.reason}"</span>
                        </p>
                        <p className="text-xs text-gray-400 mt-2">
                            Approved: {new Date(req.approved_at).toLocaleString()}
                        </p>
                        <p className="text-xs text-blue-400 font-mono mt-1">
                            Location: {req.location_lat}, {req.location_lng}
                        </p>
                    </div>
                ))}
            </div>
        </div>
    );
}
