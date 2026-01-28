'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { apiRequest } from '@/lib/api';
import Link from 'next/link';
import {
    CheckCircle,
    ArrowLeft,
    Calendar,
    Clock,
    MapPin,
    User,
    History,
    Search,
    Filter,
    ChevronRight,
    ArrowUpRight
} from 'lucide-react';

export default function AdminApprovedPage() {
    const router = useRouter();
    const [approvedRequests, setApprovedRequests] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [mounted, setMounted] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    const fetchApproved = async () => {
        try {
            const token = localStorage.getItem('admin_token');
            const data = await apiRequest('/admin/approved', 'GET', null, token || '');
            setApprovedRequests(Array.isArray(data) ? data : []);
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
        fetchApproved();
    }, [router]);

    const filteredRequests = approvedRequests.filter(req =>
        req.emp_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (req.name && req.name.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    if (!mounted) return null;

    return (
        <div className="min-h-screen bg-slate-50 p-6 md:p-10 text-gray-900 font-sans">
            <div className="max-w-6xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-gray-200 pb-8">
                    <div className="flex items-center gap-5">
                        <Link
                            href="/admin/onboard"
                            className="p-3 bg-white rounded-2xl border border-gray-100 shadow-sm text-gray-400 hover:text-green-600 hover:border-green-100 hover:shadow-md transition-all active:scale-90 group"
                        >
                            <ArrowLeft size={22} className="group-hover:-translate-x-0.5 transition-transform" />
                        </Link>
                        <div>
                            <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-green-600 to-emerald-600">
                                Approved Attendance Logs
                            </h1>
                            <p className="text-gray-500 text-sm mt-1 flex items-center gap-2">
                                <History size={14} />
                                Records Vault: {approvedRequests.length} historical approvals
                            </p>
                        </div>
                    </div>
                </div>

                {/* Search & Stats */}
                <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 p-6 flex flex-col md:flex-row items-center gap-6">
                    <div className="relative flex-1 w-full">
                        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search by Employee ID or Name..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-green-500 focus:bg-white transition-all text-sm font-bold text-gray-700"
                        />
                    </div>
                    <div className="flex items-center gap-4 shrink-0">
                        <div className="px-5 py-3 bg-green-50 rounded-2xl border border-green-100 text-center">
                            <p className="text-[10px] font-black text-green-400 uppercase tracking-widest leading-tight">Displayed</p>
                            <p className="text-xl font-black text-green-600 leading-none mt-1">{filteredRequests.length}</p>
                        </div>
                        <div className="px-5 py-3 bg-slate-50 rounded-2xl border border-slate-100 text-center">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-tight">Total</p>
                            <p className="text-xl font-black text-slate-600 leading-none mt-1">{approvedRequests.length}</p>
                        </div>
                    </div>
                </div>

                {/* Records List */}
                <div className="space-y-4">
                    {loading ? (
                        <div className="py-32 flex flex-col items-center justify-center space-y-4">
                            <div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div>
                            <p className="text-gray-400 font-medium animate-pulse">Retrieving archived approvals...</p>
                        </div>
                    ) : filteredRequests.length === 0 ? (
                        <div className="py-24 text-center bg-white rounded-[3rem] border-2 border-dashed border-gray-100 space-y-4 shadow-sm">
                            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-gray-300">
                                <Search size={40} />
                            </div>
                            <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">No matching records found</p>
                        </div>
                    ) : (
                        <div className="grid gap-4">
                            {filteredRequests.map((req, index) => (
                                <div
                                    key={req.id}
                                    className="bg-white p-6 md:p-8 rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-md transition-all group animate-in slide-in-from-bottom-4 duration-500"
                                    style={{ animationDelay: `${index * 30}ms` }}
                                >
                                    <div className="flex flex-col md:flex-row justify-between gap-6">
                                        <div className="flex-1 space-y-6">
                                            {/* Top Bar */}
                                            <div className="flex items-center gap-3">
                                                <div className={`px-4 py-1 rounded-full text-[10px] font-black tracking-widest uppercase border ${req.type === 'CHECK_IN' ? 'bg-green-50 text-green-600 border-green-100' : 'bg-red-50 text-red-600 border-red-100'}`}>
                                                    {req.type}
                                                </div>
                                                <div className="flex items-center gap-1.5 text-gray-400 font-medium text-xs">
                                                    <Calendar size={12} />
                                                    Requested: {new Date(req.timestamp).toLocaleString()}
                                                </div>
                                                <div className="ml-auto flex items-center gap-2 bg-green-500 text-white px-4 py-1.5 rounded-full text-[10px] font-black tracking-widest shadow-lg shadow-green-100 group-hover:scale-105 transition-transform">
                                                    <CheckCircle size={14} strokeWidth={3} />
                                                    APPROVED
                                                </div>
                                            </div>

                                            {/* Main Info */}
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                                <div className="space-y-1">
                                                    <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Employee</p>
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-8 h-8 bg-slate-50 rounded-lg flex items-center justify-center border border-slate-100 font-bold text-gray-400 text-xs">
                                                            {req.emp_id.slice(-2)}
                                                        </div>
                                                        <p className="font-black text-gray-900 tracking-tight text-lg">{req.name || req.emp_id}</p>
                                                    </div>
                                                </div>

                                                <div className="space-y-1">
                                                    <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Approval Timestamp</p>
                                                    <div className="flex items-center gap-2 text-sm font-bold text-gray-600 bg-slate-50/50 w-fit px-3 py-1.5 rounded-xl border border-slate-100">
                                                        <Clock size={16} className="text-green-500" />
                                                        {new Date(req.approved_at).toLocaleString()}
                                                    </div>
                                                </div>

                                                <div className="space-y-1">
                                                    <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Location Match</p>
                                                    <a
                                                        href={`https://www.google.com/maps?q=${req.location_lat},${req.location_lng}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="flex items-center gap-2 text-xs font-bold text-blue-600 hover:underline bg-blue-50/30 w-fit px-3 py-1.5 rounded-xl border border-blue-50"
                                                    >
                                                        <MapPin size={16} />
                                                        {req.location_lat.toFixed(4)}, {req.location_lng.toFixed(4)}
                                                        <ArrowUpRight size={12} className="opacity-50" />
                                                    </a>
                                                </div>
                                            </div>

                                            {/* Reason Section */}
                                            <div className="p-4 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                                                <p className="text-[9px] font-black text-gray-300 uppercase tracking-widest mb-1">Authenticated Reason</p>
                                                <p className="text-sm text-gray-500 italic">"{req.reason}"</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
