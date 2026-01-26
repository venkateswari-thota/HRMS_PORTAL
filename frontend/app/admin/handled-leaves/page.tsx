'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { apiRequest } from '@/lib/api';
import Link from 'next/link';
import {
    History,
    ArrowLeft,
    Search,
    CheckCircle,
    XCircle,
    Slash,
    User,
    Calendar,
    Filter,
    Clock
} from 'lucide-react';

export default function AdminHandledLeavesPage() {
    const router = useRouter();
    const [history, setHistory] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [filterType, setFilterType] = useState<'ALL' | 'EMPLOYEE'>('ALL');
    const [searchId, setSearchId] = useState('');
    const [statusMsg, setStatusMsg] = useState('');

    const fetchHistory = async (empId?: string) => {
        setLoading(true);
        setStatusMsg('');
        try {
            const token = localStorage.getItem('admin_token');
            const url = empId
                ? `/leave/admin/handled-history?emp_id=${empId}`
                : '/leave/admin/handled-history';

            const data = await apiRequest(url, 'GET', null, token || '');
            setHistory(data);

            if (data.length === 0) {
                setStatusMsg(empId ? `No records found for ${empId}` : 'No processed records found.');
            }
        } catch (e: any) {
            console.error(e);
            setStatusMsg('Error fetching history: ' + e.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const token = localStorage.getItem('admin_token');
        if (!token) { router.push('/auth/admin/signin'); return; }

        if (filterType === 'ALL') {
            fetchHistory();
        }
    }, [filterType]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (!searchId.trim()) return;
        fetchHistory(searchId.trim());
    };

    const getStatusStyles = (status: string) => {
        switch (status) {
            case 'APPROVED':
                return {
                    bg: 'bg-green-50',
                    text: 'text-green-600',
                    border: 'border-green-100',
                    icon: <CheckCircle size={14} />
                };
            case 'REJECTED':
                return {
                    bg: 'bg-red-50',
                    text: 'text-red-600',
                    border: 'border-red-100',
                    icon: <XCircle size={14} />
                };
            case 'WITHDRAWN':
                return {
                    bg: 'bg-slate-100',
                    text: 'text-slate-500',
                    border: 'border-slate-200',
                    icon: <Slash size={14} />
                };
            default:
                return { bg: 'bg-gray-50', text: 'text-gray-600', border: 'border-gray-100', icon: null };
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 p-6 md:p-10 text-gray-900 font-sans">
            <div className="max-w-6xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-gray-200 pb-6">
                    <div className="flex items-center gap-5">
                        <Link
                            href="/admin/onboard"
                            className="p-2.5 bg-white rounded-full border border-gray-100 shadow-sm text-gray-400 hover:text-blue-600 hover:border-blue-100 hover:shadow-md transition-all active:scale-90 group"
                        >
                            <ArrowLeft size={22} className="group-hover:-translate-x-0.5 transition-transform" />
                        </Link>
                        <div>
                            <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-indigo-600">
                                Leaves Handled History
                            </h1>
                            <p className="text-gray-500 text-sm mt-1">Audit log of all Approved, Rejected, and Withdrawn applications</p>
                        </div>
                    </div>
                </div>

                {/* Filters */}
                <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 p-6">
                    <div className="flex flex-col md:flex-row gap-6 items-end">
                        <div className="flex-1 space-y-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">View Category</label>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setFilterType('ALL')}
                                    className={`px-6 py-2.5 rounded-xl font-bold text-xs transition-all ${filterType === 'ALL' ? 'bg-purple-600 text-white shadow-lg shadow-purple-100' : 'bg-slate-50 text-gray-400 hover:bg-slate-100'}`}
                                >
                                    All Records
                                </button>
                                <button
                                    onClick={() => setFilterType('EMPLOYEE')}
                                    className={`px-6 py-2.5 rounded-xl font-bold text-xs transition-all ${filterType === 'EMPLOYEE' ? 'bg-purple-600 text-white shadow-lg shadow-purple-100' : 'bg-slate-50 text-gray-400 hover:bg-slate-100'}`}
                                >
                                    Specific Employee
                                </button>
                            </div>
                        </div>

                        {filterType === 'EMPLOYEE' && (
                            <form onSubmit={handleSearch} className="flex-1 space-y-2 animate-in slide-in-from-left duration-300">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Search Employee ID</label>
                                <div className="flex gap-2">
                                    <div className="relative flex-1">
                                        <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" />
                                        <input
                                            type="text"
                                            placeholder="e.g. EMP123"
                                            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white transition-all text-sm font-medium"
                                            value={searchId}
                                            onChange={(e) => setSearchId(e.target.value)}
                                            required
                                        />
                                    </div>
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 rounded-xl font-bold text-xs flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50"
                                    >
                                        {loading ? '...' : <Search size={16} />}
                                        Search
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>

                {/* History List */}
                <div className="space-y-4">
                    {loading ? (
                        <div className="py-20 flex flex-col items-center justify-center space-y-4">
                            <div className="w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
                            <p className="text-gray-400 font-medium animate-pulse">Retrieving archived records...</p>
                        </div>
                    ) : history.length > 0 ? (
                        <div className="grid gap-4">
                            {history.map((record, index) => {
                                const styles = getStatusStyles(record.final_status);
                                return (
                                    <div
                                        key={index}
                                        className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-md transition-all group animate-in slide-in-from-bottom duration-300"
                                        style={{ animationDelay: `${index * 50}ms` }}
                                    >
                                        <div className="flex flex-col md:flex-row justify-between gap-6">
                                            <div className="flex-1 space-y-4">
                                                <div className="flex items-center gap-3">
                                                    <div className={`px-4 py-1 rounded-full border ${styles.bg} ${styles.text} ${styles.border} flex items-center gap-2 text-[10px] font-black uppercase tracking-widest`}>
                                                        {styles.icon}
                                                        {record.final_status}
                                                    </div>
                                                    <div className="flex items-center gap-1.5 text-gray-400 font-medium text-xs">
                                                        <Clock size={12} />
                                                        {record.action_date ? new Date(record.action_date).toLocaleString() : 'N/A'}
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                                    <div>
                                                        <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest mb-1">Employee</p>
                                                        <p className="font-bold text-gray-900">{record.emp_id}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest mb-1">Type</p>
                                                        <p className="font-bold text-purple-600">{record.leave_type}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest mb-1">Duration</p>
                                                        <div className="flex items-center gap-2 text-xs font-bold text-gray-600">
                                                            <Calendar size={14} className="text-gray-400" />
                                                            {record.from_date} <span className="text-gray-300">→</span> {record.to_date}
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="p-4 bg-slate-50/50 rounded-2xl border border-slate-100 border-dashed">
                                                    <p className="text-[9px] font-black text-gray-300 uppercase tracking-widest mb-1">Reason provided</p>
                                                    <p className="text-sm text-gray-500 italic">"{record.reason}"</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="py-20 text-center space-y-4 bg-white rounded-[2.5rem] border-2 border-dashed border-gray-100">
                            <History size={48} className="mx-auto text-gray-200" />
                            <div className="space-y-1">
                                <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">History is empty</p>
                                <p className="text-[10px] text-gray-300">{statusMsg || 'No processed records found in the archive.'}</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
