'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { apiRequest } from '@/lib/api';
import Link from 'next/link';
import {
    LayoutDashboard,
    ArrowLeft,
    Search,
    User,
    Clock,
    Filter,
    Table,
    Award,
    Briefcase,
    Heart,
    Baby,
    Home,
    Palmtree,
    AlertCircle,
    Edit,
    Trash2
} from 'lucide-react';

export default function AdminLeaveBalancesShowPage() {
    const router = useRouter();
    const [balances, setBalances] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [filterType, setFilterType] = useState<'ALL' | 'EMPLOYEE'>('ALL');
    const [searchId, setSearchId] = useState('');
    const [statusMsg, setStatusMsg] = useState('');

    const fetchBalances = async (empId?: string) => {
        setLoading(true);
        setStatusMsg('');
        try {
            const token = localStorage.getItem('admin_token');
            const url = empId
                ? `/leave/admin/balances/all?emp_id=${empId}`
                : '/leave/admin/balances/all';

            const data = await apiRequest(url, 'GET', null, token || '');
            setBalances(data);

            if (data.length === 0) {
                setStatusMsg(empId ? `No balances found for ${empId}` : 'No leave balances found.');
            }
        } catch (e: any) {
            console.error(e);
            setStatusMsg('Error fetching balances: ' + e.message);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (empId: string) => {
        if (!confirm(`Are you sure you want to PERMANENTLY delete the leave balances for ${empId}?`)) return;
        try {
            const token = localStorage.getItem('admin_token');
            await apiRequest(`/leave/admin/balances/${empId}`, 'DELETE', null, token || '');
            fetchBalances(filterType === 'EMPLOYEE' ? searchId : undefined);
        } catch (e: any) {
            alert("Delete failed: " + e.message);
        }
    };

    const handleEdit = (empId: string) => {
        router.push(`/admin/leave-balances?emp_id=${empId}`);
    };

    useEffect(() => {
        const token = localStorage.getItem('admin_token');
        if (!token) { router.push('/auth/admin/signin'); return; }

        if (filterType === 'ALL') {
            fetchBalances();
        }
    }, [filterType]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (!searchId.trim()) return;
        fetchBalances(searchId.trim());
    };

    const BalanceCard = ({ balance }: { balance: any }) => (
        <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-md transition-all group animate-in slide-in-from-bottom duration-300 relative">
            {/* Management Actions */}
            <div className="absolute top-6 right-6 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                    onClick={() => handleEdit(balance.emp_id)}
                    className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-600 hover:text-white transition-all active:scale-95"
                    title="Edit Balance"
                >
                    <Edit size={16} />
                </button>
                <button
                    onClick={() => handleDelete(balance.emp_id)}
                    className="p-2.5 bg-red-50 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all active:scale-95"
                    title="Delete Record"
                >
                    <Trash2 size={16} />
                </button>
            </div>

            <div className="flex flex-col gap-6">
                {/* Employee Header */}
                <div className="flex justify-between items-center border-b border-gray-50 pb-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 font-bold">
                            {balance.emp_id.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest leading-none mb-1">Employee ID</p>
                            <h3 className="font-bold text-gray-900 leading-none">{balance.emp_id}</h3>
                        </div>
                    </div>
                    <div className="flex items-center gap-1.5 text-gray-400 font-medium text-[10px] uppercase tracking-tighter mr-24">
                        <Clock size={12} />
                        Last Updated: {balance.last_updated ? new Date(balance.last_updated).toLocaleString() : 'Never'}
                    </div>
                </div>

                {/* Balance Grid */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex flex-col items-center justify-center text-center">
                        <AlertCircle size={16} className="text-red-400 mb-2" />
                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">LOP</p>
                        <p className="text-xl font-bold text-gray-900">{balance.loss_of_pay}</p>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex flex-col items-center justify-center text-center">
                        <Palmtree size={16} className="text-orange-400 mb-2" />
                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Optional</p>
                        <p className="text-xl font-bold text-gray-900">{balance.optional_holiday}</p>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex flex-col items-center justify-center text-center">
                        <Award size={16} className="text-purple-400 mb-2" />
                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Comp Off</p>
                        <p className="text-xl font-bold text-gray-900">{balance.comp_off}</p>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex flex-col items-center justify-center text-center">
                        <Baby size={16} className="text-pink-400 mb-2" />
                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Paternity</p>
                        <p className="text-xl font-bold text-gray-900">{balance.paternity_leave}</p>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex flex-col items-center justify-center text-center">
                        <Home size={16} className="text-blue-400 mb-2" />
                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">WFH</p>
                        <p className="text-xl font-bold text-gray-900">{balance.wfh_contract}</p>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex flex-col items-center justify-center text-center">
                        <Heart size={16} className="text-green-400 mb-2" />
                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Paid Leave</p>
                        <p className="text-xl font-bold text-gray-900">{balance.paid_leave}</p>
                    </div>
                </div>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-slate-50 p-6 md:p-10 text-gray-900 font-sans selection:bg-indigo-100">
            <div className="max-w-7xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-gray-200 pb-6">
                    <div className="flex items-center gap-5">
                        <Link
                            href="/admin/onboard"
                            className="p-2.5 bg-white rounded-full border border-gray-100 shadow-sm text-gray-400 hover:text-indigo-600 hover:border-indigo-100 hover:shadow-md transition-all active:scale-90 group"
                        >
                            <ArrowLeft size={22} className="group-hover:-translate-x-0.5 transition-transform" />
                        </Link>
                        <div>
                            <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">
                                Leave Balances Dashboard
                            </h1>
                            <p className="text-gray-500 text-sm mt-1">Review all employees' current leave eligibility and balance status</p>
                        </div>
                    </div>
                </div>

                {/* Filters */}
                <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 p-6 transition-all">
                    <div className="flex flex-col md:flex-row gap-6 items-end">
                        <div className="flex-1 space-y-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Filter View</label>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setFilterType('ALL')}
                                    className={`px-6 py-2.5 rounded-xl font-bold text-xs transition-all ${filterType === 'ALL' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'bg-slate-50 text-gray-400 hover:bg-slate-100'}`}
                                >
                                    All Records
                                </button>
                                <button
                                    onClick={() => setFilterType('EMPLOYEE')}
                                    className={`px-6 py-2.5 rounded-xl font-bold text-xs transition-all ${filterType === 'EMPLOYEE' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'bg-slate-50 text-gray-400 hover:bg-slate-100'}`}
                                >
                                    Specific Employee
                                </button>
                            </div>
                        </div>

                        {filterType === 'EMPLOYEE' && (
                            <form onSubmit={handleSearch} className="flex-1 space-y-2 animate-in slide-in-from-left duration-300">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Employee Search</label>
                                <div className="flex gap-2">
                                    <div className="relative flex-1">
                                        <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" />
                                        <input
                                            type="text"
                                            placeholder="Enter Employee ID..."
                                            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all text-sm font-medium"
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
                                        Fetch
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>

                {/* Content List */}
                <div className="space-y-4">
                    {loading ? (
                        <div className="py-20 flex flex-col items-center justify-center space-y-4">
                            <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                            <p className="text-gray-400 font-medium animate-pulse">Scanning records archive...</p>
                        </div>
                    ) : balances.length > 0 ? (
                        <div className="grid gap-6">
                            {balances.map((bal, idx) => (
                                <BalanceCard key={idx} balance={bal} />
                            ))}
                        </div>
                    ) : (
                        <div className="py-20 text-center space-y-4 bg-white rounded-[2.5rem] border-2 border-dashed border-gray-100">
                            <AlertCircle size={48} className="mx-auto text-gray-200" />
                            <div className="space-y-1">
                                <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">No Data Available</p>
                                <p className="text-[10px] text-gray-300">{statusMsg || 'The balance registry is currently empty.'}</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
