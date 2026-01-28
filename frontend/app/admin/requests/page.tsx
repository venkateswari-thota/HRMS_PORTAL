'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { apiRequest } from '@/lib/api';
import Link from 'next/link';
import {
    Clock,
    ArrowLeft,
    CheckCircle,
    XCircle,
    MapPin,
    User,
    AlertCircle,
    Maximize2,
    Check,
    X,
    Calendar,
    ChevronRight
} from 'lucide-react';

export default function AdminRequestsPage() {
    const router = useRouter();
    const [pendingRequests, setPendingRequests] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [mounted, setMounted] = useState(false);

    const fetchRequests = async () => {
        try {
            const token = localStorage.getItem('admin_token');
            const data = await apiRequest('/admin/requests', 'GET', null, token || '');
            setPendingRequests(Array.isArray(data) ? data : []);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        setMounted(true);
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
            fetchRequests();
        } catch (e: any) {
            alert(e.message);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 p-6 md:p-10 text-gray-900 font-sans">
            <div className="max-w-6xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-gray-200 pb-8">
                    <div className="flex items-center gap-5">
                        <Link
                            href="/admin/onboard"
                            className="p-3 bg-white rounded-2xl border border-gray-100 shadow-sm text-gray-400 hover:text-blue-600 hover:border-blue-100 hover:shadow-md transition-all active:scale-90 group"
                        >
                            <ArrowLeft size={22} className="group-hover:-translate-x-0.5 transition-transform" />
                        </Link>
                        <div>
                            <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-yellow-600 to-orange-600">
                                Pending Attendance Approval
                            </h1>
                            <p className="text-gray-500 text-sm mt-1 flex items-center gap-2">
                                <Clock size={14} />
                                {pendingRequests.length} request{pendingRequests.length !== 1 ? 's' : ''} awaiting review
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <Link
                            href="/admin/approved"
                            className="px-6 py-3 bg-white border border-gray-200 rounded-2xl text-sm font-bold text-gray-600 hover:bg-slate-50 hover:border-blue-200 hover:text-blue-600 transition-all shadow-sm flex items-center gap-2 group"
                        >
                            View Approved Logs
                            <ChevronRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
                        </Link>
                    </div>
                </div>

                {/* Main List */}
                <div className="space-y-6">
                    {loading ? (
                        <div className="py-32 flex flex-col items-center justify-center space-y-4">
                            <div className="w-12 h-12 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin"></div>
                            <p className="text-gray-400 font-medium animate-pulse">Fetching pending requests...</p>
                        </div>
                    ) : pendingRequests.length === 0 ? (
                        <div className="py-24 text-center bg-white rounded-[3rem] border-2 border-dashed border-gray-100 space-y-4 shadow-sm">
                            <div className="w-20 h-20 bg-yellow-50 rounded-full flex items-center justify-center mx-auto">
                                <CheckCircle size={40} className="text-yellow-500/50" />
                            </div>
                            <div className="space-y-1">
                                <h3 className="text-xl font-bold text-gray-700 underline decoration-yellow-500/30">Queue is Clear</h3>
                                <p className="text-sm text-gray-400">All attendance exceptions have been processed.</p>
                            </div>
                        </div>
                    ) : (
                        <div className="grid gap-6">
                            {pendingRequests.map((req, index) => (
                                <div
                                    key={req.id}
                                    className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm hover:shadow-xl transition-all p-6 md:p-8 animate-in slide-in-from-bottom-4 duration-500"
                                    style={{ animationDelay: `${index * 50}ms` }}
                                >
                                    <div className="flex flex-col lg:flex-row gap-8">
                                        {/* Identity & Status */}
                                        <div className="flex-1 space-y-6">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className={`px-4 py-1 rounded-full text-[10px] font-black tracking-widest uppercase border ${req.type === 'CHECK_IN' ? 'bg-green-50 text-green-600 border-green-100' : 'bg-red-50 text-red-600 border-red-100'}`}>
                                                        {req.type}
                                                    </div>
                                                    <div className="flex items-center gap-1.5 text-gray-400 font-medium text-xs">
                                                        <Clock size={12} />
                                                        {new Date(req.timestamp).toLocaleString()}
                                                    </div>
                                                </div>
                                                <div className="lg:hidden text-[10px] font-black text-yellow-500 bg-yellow-50 px-3 py-1 rounded-full border border-yellow-100 animate-pulse">
                                                    PENDING REVIEW
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center border border-slate-100 shadow-inner">
                                                        <User className="text-gray-400" size={24} />
                                                    </div>
                                                    <div>
                                                        <h3 className="text-2xl font-black text-gray-900 tracking-tight">{req.name || req.emp_id}</h3>
                                                        <p className="text-xs text-blue-500 font-bold tracking-wider">{req.emp_id}</p>
                                                    </div>
                                                </div>
                                                <div className="p-4 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                                                    <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest mb-1">Reason for Exception</p>
                                                    <p className="text-gray-600 italic leading-relaxed text-sm">"{req.reason}"</p>
                                                </div>
                                            </div>

                                            <div className="flex flex-wrap items-center gap-4 pt-2">
                                                <a
                                                    href={`https://www.google.com/maps?q=${req.location_lat},${req.location_lng}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="group flex flex-col bg-white p-3 rounded-2xl border border-gray-100 shadow-sm hover:border-blue-500 hover:shadow-blue-50 transition-all"
                                                >
                                                    <span className="text-[9px] font-black text-gray-300 uppercase tracking-widest mb-1 flex items-center gap-1">
                                                        <MapPin size={10} /> Location Coordinates
                                                    </span>
                                                    <span className="text-xs font-bold text-blue-600 group-hover:underline">{req.location_lat.toFixed(5)}, {req.location_lng.toFixed(5)}</span>
                                                </a>

                                                <div className="hidden lg:flex flex-col bg-yellow-50/50 p-3 rounded-2xl border border-yellow-100 shadow-sm">
                                                    <span className="text-[9px] font-black text-yellow-400 uppercase tracking-widest mb-1 flex items-center gap-1">
                                                        <AlertCircle size={10} /> Status
                                                    </span>
                                                    <span className="text-xs font-black text-yellow-600 animate-pulse uppercase tracking-tighter">Awaiting Approval</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Image Verification */}
                                        {req.face_image && (
                                            <div className="w-full lg:w-56 shrink-0 space-y-3">
                                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Identity Verification</p>
                                                <div
                                                    className="relative group cursor-zoom-in rounded-[1.5rem] overflow-hidden border-4 border-white shadow-xl aspect-square lg:aspect-auto lg:h-40"
                                                    onClick={() => setSelectedImage(req.face_image)}
                                                >
                                                    <img
                                                        src={req.face_image}
                                                        alt="Face verification"
                                                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                                    />
                                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-4">
                                                        <div className="flex items-center gap-2 bg-white/20 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/30 text-white text-[10px] font-bold">
                                                            <Maximize2 size={12} /> Click to Enlarge
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* Decision Actions */}
                                        <div className="flex lg:flex-col gap-2 justify-center shrink-0">
                                            <button
                                                onClick={() => handleAction(req.id, 'APPROVE')}
                                                className="flex-1 lg:w-28 py-2.5 bg-green-500 hover:bg-green-600 text-white font-bold rounded-xl transition-all shadow-lg shadow-green-100 active:scale-95 flex items-center justify-center gap-2 group"
                                            >
                                                <Check size={14} strokeWidth={4} className="group-hover:scale-110 transition-transform" />
                                                <span className="text-[10px] tracking-tight uppercase">Approve</span>
                                            </button>
                                            <button
                                                onClick={() => handleAction(req.id, 'REJECT')}
                                                className="flex-1 lg:w-28 py-2.5 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl transition-all shadow-lg shadow-red-100 active:scale-95 flex items-center justify-center gap-2 group"
                                            >
                                                <X size={14} strokeWidth={4} className="group-hover:scale-110 transition-transform" />
                                                <span className="text-[10px] tracking-tight uppercase">Reject</span>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Image Zoom Modal */}
            {selectedImage && (
                <div
                    className="fixed inset-0 z-[100] bg-slate-900/90 flex items-center justify-center p-6 backdrop-blur-md transition-all animate-in fade-in duration-300"
                    onClick={() => setSelectedImage(null)}
                >
                    <div className="relative max-w-4xl w-full">
                        <button
                            className="absolute -top-16 right-0 p-3 bg-white/10 hover:bg-red-500 text-white rounded-2xl border border-white/20 transition-all flex items-center gap-2 font-bold text-xs"
                            onClick={() => setSelectedImage(null)}
                        >
                            <X size={20} /> CLOSE VIEW
                        </button>
                        <div className="bg-white p-3 rounded-[2.5rem] shadow-2xl border border-white/20 overflow-hidden transform animate-in zoom-in-95 duration-300">
                            <img
                                src={selectedImage}
                                alt="Verification Full Size"
                                className="w-full h-auto max-h-[75vh] object-contain rounded-[2rem]"
                                onClick={(e) => e.stopPropagation()}
                            />
                            <div className="mt-4 flex items-center justify-between px-4 pb-2">
                                <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Employee Identity Verification</p>
                                <div className="px-3 py-1 bg-blue-50 text-blue-600 text-[10px] font-black rounded-lg border border-blue-100 uppercase tracking-tighter">High Resolution</div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
