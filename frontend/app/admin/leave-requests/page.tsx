'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { apiRequest } from '@/lib/api';
import Link from 'next/link';
import { Calendar, User, Clock, CheckCircle, XCircle, ArrowLeft } from 'lucide-react';

export default function AdminLeaveRequestsPage() {
    const router = useRouter();
    const [requests, setRequests] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchRequests = async () => {
        try {
            const token = localStorage.getItem('admin_token');
            const data = await apiRequest('/leave/admin/requests', 'GET', null, token || '');
            setRequests(data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const token = localStorage.getItem('admin_token');
        if (!token) { router.push('/auth/admin/signin'); return; }
        fetchRequests();
    }, []);

    const handleAction = async (id: string, action: 'APPROVE' | 'REJECT') => {
        if (!confirm(`Are you sure you want to ${action} this leave?`)) return;
        try {
            const token = localStorage.getItem('admin_token');
            await apiRequest('/leave/admin/review', 'POST', { request_id: id, action }, token || '');
            alert(`Leave ${action.toLowerCase()}ed successfully.`);
            fetchRequests();
        } catch (e: any) {
            alert(e.message);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 p-6 md:p-10">
            <div className="max-w-6xl mx-auto space-y-8">
                <div className="flex items-center justify-between border-b border-gray-200 pb-6">
                    <div className="flex items-center gap-5">
                        <Link
                            href="/admin/onboard"
                            className="p-2.5 bg-white rounded-full border border-gray-100 shadow-sm text-gray-400 hover:text-blue-600 hover:border-blue-100 hover:shadow-md transition-all active:scale-90 group"
                            title="Go Back"
                        >
                            <ArrowLeft size={22} className="group-hover:-translate-x-0.5 transition-transform" />
                        </Link>
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 leading-tight">Leave Requests</h1>
                            <p className="text-gray-500 text-sm">Review and manage employee leave applications</p>
                        </div>
                    </div>
                </div>

                <div className="grid gap-6">
                    {loading ? (
                        <div className="text-center py-20">
                            <div className="animate-spin w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full mx-auto"></div>
                        </div>
                    ) : requests.length === 0 ? (
                        <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-300">
                            <p className="text-gray-400">No pending leave requests.</p>
                        </div>
                    ) : (
                        requests.map(req => (
                            <div key={req.id} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all">
                                <div className="flex flex-col lg:flex-row gap-8 items-start justify-between">
                                    <div className="space-y-4 flex-1">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 font-bold">
                                                {req.emp_id.substring(0, 2)}
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-gray-900">{req.emp_id}</h3>
                                                <p className="text-xs text-gray-400 font-mono">Applied on: {new Date(req.applied_on).toLocaleString()}</p>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Leave Type</p>
                                                <p className="font-bold text-blue-600">{req.leave_type}</p>
                                            </div>
                                            <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Duration</p>
                                                <div className="flex items-center gap-2 text-sm text-gray-700">
                                                    <Calendar size={14} className="text-gray-400" />
                                                    <span>{req.from_date}</span>
                                                    <span className="text-gray-300">→</span>
                                                    <span>{req.to_date}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 italic text-gray-600 text-sm">
                                            "{req.reason}"
                                        </div>
                                    </div>

                                    <div className="flex lg:flex-col gap-3 w-full lg:w-40 pt-4 lg:pt-0">
                                        <button
                                            onClick={() => handleAction(req.id, 'APPROVE')}
                                            className="flex-1 bg-green-600 text-white py-3 rounded-xl font-bold hover:bg-green-700 transition-all shadow-lg shadow-green-200 active:scale-95 flex items-center justify-center gap-2"
                                        >
                                            <CheckCircle size={18} /> Approve
                                        </button>
                                        <button
                                            onClick={() => handleAction(req.id, 'REJECT')}
                                            className="flex-1 bg-red-50 text-red-600 py-3 rounded-xl font-bold hover:bg-red-600 hover:text-white transition-all border border-red-100 active:scale-95 flex items-center justify-center gap-2"
                                        >
                                            <XCircle size={18} /> Reject
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
