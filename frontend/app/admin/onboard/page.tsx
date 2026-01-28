'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiRequest } from '@/lib/api';
import Link from 'next/link';
import {
    Users,
    ClipboardCheck,
    Calendar,
    History,
    Scale,
    Palmtree,
    LogOut,
    LayoutGrid,
    Clock,
    CheckCircle2,
    FileText,
    Settings,
    ChevronRight,
    TrendingUp
} from 'lucide-react';

export default function AdminOnboardPage() {
    const router = useRouter();
    const [pendingCount, setPendingCount] = useState(0);
    const [approvedCount, setApprovedCount] = useState(0);
    const [leavePendingCount, setLeavePendingCount] = useState(0);
    const [employeeCount, setEmployeeCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [mounted, setMounted] = useState(false);

    const fetchCounts = async () => {
        const authToken = localStorage.getItem('admin_token') || '';
        try {
            const [pending, approved, leavePending, emps] = await Promise.all([
                apiRequest('/admin/requests', 'GET', null, authToken).catch(() => []),
                apiRequest('/admin/approved', 'GET', null, authToken).catch(() => []),
                apiRequest('/leave/admin/requests', 'GET', null, authToken).catch(() => []),
                apiRequest('/admin/employees', 'GET', null, authToken).catch(() => [])
            ]);

            setPendingCount(Array.isArray(pending) ? pending.length : 0);
            setApprovedCount(Array.isArray(approved) ? approved.length : 0);
            setLeavePendingCount(Array.isArray(leavePending) ? leavePending.length : 0);
            setEmployeeCount(Array.isArray(emps) ? emps.length : 0);
        } catch (e) {
            console.error('❌ Failed to fetch dashboard metrics:', e);
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
        fetchCounts();
        const interval = setInterval(fetchCounts, 30000);
        return () => clearInterval(interval);
    }, [router]);

    if (!mounted) return null;

    const handleLogout = () => {
        localStorage.removeItem('admin_token');
        router.push('/auth/admin/signin');
    };

    return (
        <div className="min-h-screen p-6 md:p-10 bg-slate-50 text-gray-900 font-sans">
            <div className="max-w-6xl mx-auto space-y-10">
                {/* Header */}
                <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-gray-200 pb-8">
                    <div className="space-y-2">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-600 rounded-xl shadow-lg shadow-blue-200">
                                <LayoutGrid className="text-white" size={24} />
                            </div>
                            <h1 className="text-4xl font-black bg-clip-text text-transparent bg-gradient-to-r from-blue-700 via-indigo-700 to-purple-700 tracking-tight">
                                Management Command Center
                            </h1>
                        </div>
                        <p className="text-gray-500 font-medium ml-12">Organization-wide Attendance & Leave Governance</p>
                    </div>

                    <button
                        onClick={handleLogout}
                        className="group flex items-center gap-2 px-6 py-3 rounded-2xl bg-white border border-red-100 text-red-600 text-sm font-black hover:bg-red-50 transition-all shadow-sm hover:shadow-md active:scale-95"
                    >
                        <LogOut size={18} className="group-hover:-translate-x-1 transition-transform" />
                        SECURE LOGOUT
                    </button>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                    {/* Sidebar Stats / Primary Card */}
                    <div className="lg:col-span-1 space-y-8">
                        <Link href="/admin/employees" className="block group">
                            <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm hover:shadow-2xl hover:-translate-y-1 transition-all duration-500 relative overflow-hidden h-full flex flex-col justify-center border-l-8 border-l-blue-600">
                                <div className="absolute top-0 right-0 p-8 text-blue-50 group-hover:text-blue-100 transition-colors">
                                    <Users size={80} strokeWidth={1.5} />
                                </div>
                                <div className="relative z-10 space-y-4">
                                    <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600">
                                        <Users size={24} />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Total Workforce</p>
                                        <h3 className="text-5xl font-black text-gray-900 leading-none">
                                            {loading ? '...' : employeeCount}
                                        </h3>
                                    </div>
                                    <div className="flex items-center gap-2 text-xs font-bold text-blue-600 underline">
                                        Manage Employees <ChevronRight size={14} />
                                    </div>
                                </div>
                            </div>
                        </Link>
                    </div>

                    {/* Main Content Area: Grouped Rows */}
                    <div className="lg:col-span-3 space-y-8">

                        {/* Row 1: Attendance Section */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 px-2">
                                <Clock size={16} className="text-yellow-500" />
                                <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">Attendance Management</h3>
                                <div className="h-[1px] flex-1 bg-gray-100"></div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <Link href="/admin/requests" className="block relative group">
                                    <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-xl transition-all border-l-4 border-l-yellow-500 flex items-center gap-6">
                                        <div className="w-16 h-16 bg-yellow-50 rounded-[1.5rem] flex items-center justify-center text-yellow-600 shrink-0 group-hover:scale-110 transition-transform">
                                            <ClipboardCheck size={32} />
                                        </div>
                                        <div className="flex-1">
                                            <h4 className="font-black text-gray-800 text-lg leading-tight">Pending Requests</h4>
                                            <div className="flex items-center justify-between mt-1">
                                                <p className="text-xs font-bold text-gray-400 uppercase">Awaiting Action</p>
                                                <span className="text-2xl font-black text-yellow-500">{loading ? '..' : pendingCount}</span>
                                            </div>
                                        </div>
                                        <div className="p-2 bg-slate-50 rounded-xl group-hover:bg-yellow-50 group-hover:text-yellow-600 transition-colors">
                                            <ChevronRight size={20} />
                                        </div>
                                    </div>
                                    {pendingCount > 0 && (
                                        <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 border-2 border-white rounded-full animate-bounce"></div>
                                    )}
                                </Link>

                                <Link href="/admin/approved" className="block group">
                                    <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-xl transition-all border-l-4 border-l-green-500 flex items-center gap-6">
                                        <div className="w-16 h-16 bg-green-50 rounded-[1.5rem] flex items-center justify-center text-green-600 shrink-0 group-hover:scale-110 transition-transform">
                                            <CheckCircle2 size={32} />
                                        </div>
                                        <div className="flex-1">
                                            <h4 className="font-black text-gray-800 text-lg leading-tight">Approved Logs</h4>
                                            <p className="text-[10px] font-black text-green-600 uppercase mt-1 tracking-tighter">Historical Records Vault</p>
                                        </div>
                                        <div className="p-2 bg-slate-50 rounded-xl group-hover:bg-green-50 group-hover:text-green-600 transition-colors">
                                            <ChevronRight size={20} />
                                        </div>
                                    </div>
                                </Link>
                            </div>
                        </div>

                        {/* Row 2: Leaves Section */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 px-2">
                                <FileText size={16} className="text-blue-500" />
                                <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">Leave Administration</h3>
                                <div className="h-[1px] flex-1 bg-gray-100"></div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <Link href="/admin/leave-requests" className="block relative group">
                                    <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-xl transition-all border-l-4 border-l-blue-500 flex items-center gap-6">
                                        <div className="w-16 h-16 bg-blue-50 rounded-[1.5rem] flex items-center justify-center text-blue-600 shrink-0 group-hover:scale-110 transition-transform">
                                            <Calendar size={32} />
                                        </div>
                                        <div className="flex-1">
                                            <h4 className="font-black text-gray-800 text-lg leading-tight">Leave Requests</h4>
                                            <div className="flex items-center justify-between mt-1">
                                                <p className="text-xs font-bold text-gray-400 uppercase">New Applications</p>
                                                <span className="text-2xl font-black text-blue-500">{loading ? '..' : leavePendingCount}</span>
                                            </div>
                                        </div>
                                        <div className="p-2 bg-slate-50 rounded-xl group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                                            <ChevronRight size={20} />
                                        </div>
                                    </div>
                                    {leavePendingCount > 0 && (
                                        <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 border-2 border-white rounded-full"></div>
                                    )}
                                </Link>

                                <Link href="/admin/handled-leaves" className="block group">
                                    <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-xl transition-all border-l-4 border-l-purple-600 flex items-center gap-6">
                                        <div className="w-16 h-16 bg-purple-50 rounded-[1.5rem] flex items-center justify-center text-purple-600 shrink-0 group-hover:scale-110 transition-transform">
                                            <History size={32} />
                                        </div>
                                        <div className="flex-1">
                                            <h4 className="font-black text-gray-800 text-lg leading-tight">Handled Leaves</h4>
                                            <p className="text-[10px] font-black text-purple-600 uppercase mt-1 tracking-tighter">Audit Trail & Archive</p>
                                        </div>
                                        <div className="p-2 bg-slate-50 rounded-xl group-hover:bg-purple-50 group-hover:text-purple-600 transition-colors">
                                            <ChevronRight size={20} />
                                        </div>
                                    </div>
                                </Link>
                            </div>
                        </div>

                        {/* Row 3: Configurations */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 px-2">
                                <Settings size={16} className="text-slate-400" />
                                <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">Setup & Configuration</h3>
                                <div className="h-[1px] flex-1 bg-gray-100"></div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <Link href="/admin/leave-balances" className="block group">
                                    <div className="bg-white p-5 rounded-[1.5rem] border border-gray-100 shadow-sm hover:shadow-lg transition-all border-l-4 border-l-indigo-400 flex items-center gap-4">
                                        <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 shrink-0">
                                            <Scale size={24} />
                                        </div>
                                        <div className="flex-1">
                                            <h4 className="font-bold text-gray-800 text-sm">Policy & Balances</h4>
                                            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mt-0.5">Quota Configuration</p>
                                        </div>
                                        <div className="w-8 h-8 flex items-center justify-center text-gray-300">
                                            <ChevronRight size={16} />
                                        </div>
                                    </div>
                                </Link>

                                <Link href="/admin/holiday-setup" className="block group">
                                    <div className="bg-white p-5 rounded-[1.5rem] border border-gray-100 shadow-sm hover:shadow-lg transition-all border-l-4 border-l-orange-400 flex items-center gap-4">
                                        <div className="w-12 h-12 bg-orange-50 rounded-xl flex items-center justify-center text-orange-600 shrink-0">
                                            <Palmtree size={24} />
                                        </div>
                                        <div className="flex-1">
                                            <h4 className="font-bold text-gray-800 text-sm">Holiday Calendar</h4>
                                            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mt-0.5">Corporate Schedule</p>
                                        </div>
                                        <div className="w-8 h-8 flex items-center justify-center text-gray-300">
                                            <ChevronRight size={16} />
                                        </div>
                                    </div>
                                </Link>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
}
