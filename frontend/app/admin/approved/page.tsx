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
    ArrowUpRight,
    Maximize2,
    X
} from 'lucide-react';

export default function AdminApprovedPage() {
    const router = useRouter();
    const [approvedRequests, setApprovedRequests] = useState<any[]>([]);
    const [employees, setEmployees] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [mounted, setMounted] = useState(false);
    const [selectedEmpId, setSelectedEmpId] = useState('all');
    const [selectedImage, setSelectedImage] = useState<string | null>(null);

    const fetchData = async () => {
        try {
            const token = localStorage.getItem('admin_token') || '';
            const [approvedData, empsData] = await Promise.all([
                apiRequest('/admin/approved', 'GET', null, token),
                apiRequest('/admin/employees', 'GET', null, token)
            ]);
            setApprovedRequests(Array.isArray(approvedData) ? approvedData : []);
            setEmployees(Array.isArray(empsData) ? empsData : []);
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
        fetchData();
    }, [router]);

    const filteredRequests = approvedRequests.filter(req =>
        selectedEmpId === 'all' || req.emp_id === selectedEmpId
    );

    const selectedEmployee = employees.find(emp => emp.emp_id === selectedEmpId);

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

                {/* Filter & Detail Row */}
                <div className="max-w-4xl">
                    <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 p-8 space-y-4">
                        {/* Selected Employee Display */}
                        <div className="h-6 flex items-center px-1">
                            {selectedEmployee && (
                                <div className="flex items-center gap-2 animate-in fade-in slide-in-from-left-2 duration-300">
                                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                                    <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest leading-none">Selected:</p>
                                    <p className="text-sm font-black text-green-600 leading-none">{selectedEmployee.name}</p>
                                </div>
                            )}
                            {!selectedEmployee && selectedEmpId === 'all' && (
                                <p className="text-[11px] font-black text-gray-300 uppercase tracking-widest px-1 leading-none">Viewing All Workforce Records</p>
                            )}
                        </div>

                        <div className="flex flex-col md:flex-row items-stretch gap-4">
                            <div className="relative group flex-1 w-full">
                                <div className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none group-focus-within:text-green-500 transition-colors">
                                    <User size={20} />
                                </div>
                                <select
                                    value={selectedEmpId}
                                    onChange={(e) => setSelectedEmpId(e.target.value)}
                                    className="w-full pl-16 pr-14 py-4.5 bg-slate-50 border border-slate-100 rounded-[1.8rem] outline-none focus:ring-4 focus:ring-green-500/10 focus:bg-white focus:border-green-200 transition-all text-base font-black text-gray-700 appearance-none cursor-pointer shadow-inner h-full"
                                >
                                    <option value="all">View All IDs</option>
                                    {employees.map(emp => (
                                        <option key={emp.emp_id} value={emp.emp_id}>
                                            {emp.emp_id}
                                        </option>
                                    ))}
                                </select>
                                <div className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none group-focus-within:text-green-500 transition-colors">
                                    <Filter size={18} />
                                </div>
                            </div>

                            <div className="flex items-center gap-3 shrink-0">
                                <div className="px-8 py-3 bg-green-50/50 rounded-[1.8rem] border border-green-100 flex flex-col items-center justify-center min-w-[110px] hover:bg-green-100/50 transition-colors group/stat">
                                    <p className="text-[10px] font-black text-green-400 uppercase tracking-tighter leading-none mb-1 group-hover/stat:text-green-600 transition-colors">Shown</p>
                                    <p className="text-2xl font-black text-green-600 leading-none">{filteredRequests.length}</p>
                                </div>
                                <div className="px-8 py-3 bg-slate-50 rounded-[1.8rem] border border-slate-100 flex flex-col items-center justify-center min-w-[110px] hover:bg-slate-100 transition-colors group/stat">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter leading-none mb-1 group-hover/stat:text-slate-600 transition-colors">Total</p>
                                    <p className="text-2xl font-black text-slate-600 leading-none">{approvedRequests.length}</p>
                                </div>
                            </div>
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
                                    <div className="flex flex-col lg:flex-row justify-between gap-6">
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
                                                        <p className="font-black text-gray-900 tracking-tight text-lg">{req.emp_name || req.emp_id}</p>
                                                    </div>
                                                </div>

                                                <div className="space-y-1">
                                                    <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Approval Timestamp</p>
                                                    <div className="flex items-center gap-2 text-sm font-bold text-gray-600 bg-slate-50/50 w-fit px-3 py-1.5 rounded-xl border border-slate-100">
                                                        <Clock size={16} className="text-green-500" />
                                                        {new Date(req.approved_at).toLocaleString()}
                                                    </div>
                                                </div>

                                                {req.location_failure && (
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
                                                )}
                                            </div>

                                            {/* Reason Section */}
                                            <div className="p-4 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                                                <p className="text-[9px] font-black text-gray-300 uppercase tracking-widest mb-1">Authenticated Reason</p>
                                                <p className="text-sm text-gray-500 italic">"{req.reason}"</p>
                                            </div>
                                        </div>

                                        {/* Image Verification */}
                                        {req.face_failure && req.face_image && (
                                            <div className="w-full lg:w-48 shrink-0 space-y-2">
                                                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest px-1">Identity Verification</p>
                                                <div
                                                    className="relative group cursor-zoom-in rounded-[1.2rem] overflow-hidden border-4 border-white shadow-lg aspect-square lg:aspect-auto lg:h-32"
                                                    onClick={() => setSelectedImage(req.face_image)}
                                                >
                                                    <img
                                                        src={req.face_image}
                                                        alt="Face verification"
                                                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                                    />
                                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-3">
                                                        <div className="flex items-center gap-1.5 bg-white/20 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/30 text-white text-[9px] font-bold">
                                                            <Maximize2 size={10} /> Zoom
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
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
                                <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Approved Log Verification</p>
                                <div className="px-3 py-1 bg-green-50 text-green-600 text-[10px] font-black rounded-lg border border-green-100 uppercase tracking-tighter">Archived Image</div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
