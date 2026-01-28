'use client';
import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { apiRequest } from '@/lib/api';
import Link from 'next/link';
import { ArrowLeft, Save, User, Info, Search, AlertCircle, Trash2, Edit, Clock, Palmtree, Award, Baby, Home, Heart } from 'lucide-react';

function LeaveBalanceForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const paramEmpId = searchParams.get('emp_id');

    const [loading, setLoading] = useState(false);
    const [statusMsg, setStatusMsg] = useState('');
    const [isEditMode, setIsEditMode] = useState(false);

    const [formData, setFormData] = useState({
        emp_id: '',
        loss_of_pay: 0,
        optional_holiday: 0,
        comp_off: 0,
        paternity_leave: 0,
        wfh_contract: 0,
        paid_leave: 0
    });

    // Dashboard States
    const [balances, setBalances] = useState<any[]>([]);
    const [loadingDashboard, setLoadingDashboard] = useState(false);
    const [filterType, setFilterType] = useState<'ALL' | 'EMPLOYEE'>('ALL');
    const [searchId, setSearchId] = useState('');
    const [searchEmpName, setSearchEmpName] = useState('');
    const [dashStatusMsg, setDashStatusMsg] = useState('');

    const [employees, setEmployees] = useState<{ emp_id: string, name: string }[]>([]);
    const [selectedEmpName, setSelectedEmpName] = useState('');

    useEffect(() => {
        fetchEmployees();
        if (paramEmpId) {
            setIsEditMode(true);
            fetchExistingBalances(paramEmpId);
        }
    }, [paramEmpId]);

    const fetchEmployees = async () => {
        try {
            const token = localStorage.getItem('admin_token');
            const data = await apiRequest('/admin/employees', 'GET', null, token || '');
            setEmployees(data);

            // If already have emp_id, set the name
            if (formData.emp_id) {
                const emp = data.find((e: any) => e.emp_id === formData.emp_id);
                if (emp) setSelectedEmpName(emp.name);
            }
        } catch (e) {
            console.error("Failed to fetch employees", e);
        }
    };

    const fetchExistingBalances = async (id: string) => {
        try {
            const token = localStorage.getItem('admin_token');
            const data = await apiRequest(`/leave/admin/balances/${id}`, 'GET', null, token || '');
            if (data) {
                setFormData({
                    emp_id: id,
                    loss_of_pay: data.loss_of_pay || 0,
                    optional_holiday: data.optional_holiday || 0,
                    comp_off: data.comp_off || 0,
                    paternity_leave: data.paternity_leave || 0,
                    wfh_contract: data.wfh_contract || 0,
                    paid_leave: data.paid_leave || 0
                });

                // Set name if employees already loaded
                const emp = employees.find(e => e.emp_id === id);
                if (emp) setSelectedEmpName(emp.name);
            }
        } catch (e) {
            console.error("Failed to fetch balance for edit", e);
        }
    };

    // Dashboard Logic
    const fetchBalances = async (empId?: string) => {
        setLoadingDashboard(true);
        setDashStatusMsg('');
        try {
            const token = localStorage.getItem('admin_token');
            const url = empId
                ? `/leave/admin/balances/all?emp_id=${empId}`
                : '/leave/admin/balances/all';

            const data = await apiRequest(url, 'GET', null, token || '');
            setBalances(data);

            if (data.length === 0) {
                setDashStatusMsg(empId ? `No balances found for ${empId}` : 'No leave balances found.');
            }
        } catch (e: any) {
            console.error(e);
            setDashStatusMsg('Error fetching balances: ' + e.message);
        } finally {
            setLoadingDashboard(false);
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

    const handleEditFromDash = (empId: string) => {
        setIsEditMode(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
        fetchExistingBalances(empId);
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (!searchId.trim()) return;
        fetchBalances(searchId.trim());
    };

    useEffect(() => {
        if (filterType === 'ALL') {
            fetchBalances();
        }
    }, [filterType]);

    // Update searchEmpName whenever searchId changes
    useEffect(() => {
        const emp = employees.find(e => e.emp_id === searchId);
        if (emp) setSearchEmpName(emp.name);
        else setSearchEmpName('');
    }, [searchId, employees]);

    // Update selectedEmpName whenever emp_id changes or employees load
    useEffect(() => {
        const emp = employees.find(e => e.emp_id === formData.emp_id);
        if (emp) {
            setSelectedEmpName(emp.name);
        } else if (!formData.emp_id) {
            setSelectedEmpName('');
        }
    }, [formData.emp_id, employees]);

    const categories = [
        { label: "Loss Of Pay", key: "loss_of_pay" },
        { label: "Optional Holiday", key: "optional_holiday" },
        { label: "Comp-off", key: "comp_off" },
        { label: "Paternity Leave", key: "paternity_leave" },
        { label: "Work from Home - contract", key: "wfh_contract" },
        { label: "Paid Leave", key: "paid_leave" }
    ];

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setStatusMsg('');
        try {
            const token = localStorage.getItem('admin_token');
            await apiRequest('/leave/admin/balances/setup', 'POST', formData, token || '');

            if (isEditMode) {
                // Return to show mode but on this page, dashboard will refresh
                setIsEditMode(false);
                setStatusMsg('Balances updated successfully!');
                setFormData({
                    emp_id: '',
                    loss_of_pay: 0,
                    optional_holiday: 0,
                    comp_off: 0,
                    paternity_leave: 0,
                    wfh_contract: 0,
                    paid_leave: 0
                });
                setSelectedEmpName('');
                fetchBalances(filterType === 'EMPLOYEE' ? searchId : undefined);
                setTimeout(() => setStatusMsg(''), 3000);
            } else {
                setStatusMsg('Balances updated successfully!');
                setFormData({
                    emp_id: '',
                    loss_of_pay: 0,
                    optional_holiday: 0,
                    comp_off: 0,
                    paternity_leave: 0,
                    wfh_contract: 0,
                    paid_leave: 0
                });
                setSelectedEmpName('');
                fetchBalances();
                setTimeout(() => setStatusMsg(''), 3000);
            }
        } catch (e: any) {
            setStatusMsg('Error: ' + e.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-3xl mx-auto space-y-8">
            <div className="flex items-center justify-between border-b border-gray-200 pb-6">
                <div className="flex items-center gap-5">
                    <button
                        onClick={() => router.back()}
                        className="p-2.5 bg-white rounded-full border border-gray-100 shadow-sm text-gray-400 hover:text-blue-600 hover:border-blue-100 hover:shadow-md transition-all active:scale-90 group"
                        title="Go Back"
                    >
                        <ArrowLeft size={22} className="group-hover:-translate-x-0.5 transition-transform" />
                    </button>
                    <div>
                        <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
                            {isEditMode ? 'Edit Leave Balances' : 'Leave Balances Setup'}
                        </h1>
                        <p className="text-gray-500 text-sm mt-1">
                            {isEditMode ? `Surgically modifying balances for ${formData.emp_id}` : 'Configure granted leave counts for employees'}
                        </p>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 p-8">
                <form onSubmit={handleSubmit} className="space-y-8">
                    {/* Employee ID Selection Section */}
                    <div className="space-y-3">
                        <div className="flex justify-between items-center px-1">
                            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                <User size={14} /> {isEditMode ? 'Employee ID (Locked)' : 'Select Employee'}
                            </label>
                            {selectedEmpName && (
                                <span className="text-sm font-bold text-blue-600 animate-in fade-in slide-in-from-right-2">
                                    {selectedEmpName}
                                </span>
                            )}
                        </div>
                        <div className="relative">
                            {isEditMode ? (
                                <div className="w-full p-4 bg-slate-50 border border-slate-100 rounded-xl font-bold text-gray-400 flex items-center justify-between">
                                    <span>{formData.emp_id}</span>
                                    <Info size={16} className="text-slate-300" />
                                </div>
                            ) : (
                                <select
                                    required
                                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-bold text-gray-700 appearance-none transition-all cursor-pointer"
                                    value={formData.emp_id}
                                    onChange={e => setFormData({ ...formData, emp_id: e.target.value })}
                                >
                                    <option value="" disabled>Choose an employee...</option>
                                    {employees.map(emp => (
                                        <option key={emp.emp_id} value={emp.emp_id}>
                                            {emp.emp_id}
                                        </option>
                                    ))}
                                </select>
                            )}
                            {!isEditMode && (
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Leave Categories */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {categories.map(cat => (
                            <div key={cat.key} className="space-y-2">
                                <label className="text-sm font-semibold text-gray-700 px-1">{cat.label}</label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <span className="text-[9px] font-black text-blue-500 uppercase tracking-tighter">Granted</span>
                                    </div>
                                    <input
                                        type="number" min="0" required
                                        className="w-full pl-20 p-4 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 group-hover:border-blue-200 transition-all font-bold text-gray-700"
                                        value={formData[cat.key as keyof typeof formData]}
                                        onChange={e => setFormData({ ...formData, [cat.key]: parseInt(e.target.value) || 0 })}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>

                    {statusMsg && (
                        <div className={`p-4 rounded-xl text-center font-medium ${statusMsg.includes('Error') ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-green-50 text-green-600 border border-green-100'}`}>
                            {statusMsg}
                        </div>
                    )}

                    <div className="pt-4 grid grid-cols-1 gap-4">
                        <button
                            type="submit" disabled={loading}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-blue-100 flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
                        >
                            <Save size={20} />
                            {loading ? 'Processing Changes...' : (isEditMode ? 'Update & Save Changes' : 'Save Leave Balances')}
                        </button>
                    </div>
                </form>
            </div>

            {/* Dashboard Section */}
            <div className="space-y-8 animate-in fade-in duration-700 delay-200">
                <div className="flex items-center gap-4 px-2">
                    <div className="h-px flex-1 bg-gradient-to-r from-transparent via-gray-200 to-transparent"></div>
                    <h2 className="text-xl font-bold text-gray-400 uppercase tracking-[0.3em] text-center">Balances Dashboard</h2>
                    <div className="h-px flex-1 bg-gradient-to-r from-transparent via-gray-200 to-transparent"></div>
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
                                <div className="flex justify-between items-center px-1">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Employee Search</label>
                                    {searchEmpName && (
                                        <span className="text-[10px] font-bold text-blue-600 animate-in fade-in slide-in-from-right-1">
                                            {searchEmpName}
                                        </span>
                                    )}
                                </div>
                                <div className="flex gap-2">
                                    <div className="relative flex-1">
                                        <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300 pointer-events-none z-10" />
                                        <select
                                            className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all text-sm font-bold text-gray-700 appearance-none cursor-pointer"
                                            value={searchId}
                                            onChange={(e) => setSearchId(e.target.value)}
                                            required
                                        >
                                            <option value="" disabled>Select Employee ID...</option>
                                            {employees.map(emp => (
                                                <option key={emp.emp_id} value={emp.emp_id}>
                                                    {emp.emp_id}
                                                </option>
                                            ))}
                                        </select>
                                        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-300">
                                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg>
                                        </div>
                                    </div>
                                    <button
                                        type="submit"
                                        disabled={loadingDashboard}
                                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 rounded-xl font-bold text-xs flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50 shadow-lg shadow-indigo-100"
                                    >
                                        {loadingDashboard ? '...' : <Search size={16} />}
                                        Fetch
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>

                {/* Content List */}
                <div className="space-y-4 pb-20">
                    {loadingDashboard ? (
                        <div className="py-20 flex flex-col items-center justify-center space-y-4">
                            <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                            <p className="text-gray-400 font-medium animate-pulse">Scanning records archive...</p>
                        </div>
                    ) : balances.length > 0 ? (
                        <div className="grid gap-6">
                            {balances.map((bal, idx) => (
                                <div key={idx} className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-md transition-all group animate-in slide-in-from-bottom duration-300 relative">
                                    {/* Management Actions */}
                                    <div className="absolute top-6 right-6 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={() => handleEditFromDash(bal.emp_id)}
                                            className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-600 hover:text-white transition-all active:scale-95"
                                            title="Edit Balance"
                                        >
                                            <Edit size={16} />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(bal.emp_id)}
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
                                                    {bal.emp_id.substring(0, 2).toUpperCase()}
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest leading-none mb-1">Employee ID</p>
                                                    <h3 className="font-bold text-gray-900 leading-none">{bal.emp_id}</h3>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-1.5 text-gray-400 font-medium text-[10px] uppercase tracking-tighter mr-24">
                                                <Clock size={12} />
                                                Last Updated: {bal.last_updated ? new Date(bal.last_updated).toLocaleString() : 'Never'}
                                            </div>
                                        </div>

                                        {/* Balance Grid */}
                                        <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
                                            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex flex-col items-center justify-center text-center">
                                                <AlertCircle size={16} className="text-red-400 mb-2" />
                                                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">LOP</p>
                                                <p className="text-xl font-bold text-gray-900">{bal.loss_of_pay}</p>
                                            </div>
                                            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex flex-col items-center justify-center text-center">
                                                <Palmtree size={16} className="text-orange-400 mb-2" />
                                                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Optional</p>
                                                <p className="text-xl font-bold text-gray-900">{bal.optional_holiday}</p>
                                            </div>
                                            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex flex-col items-center justify-center text-center">
                                                <Award size={16} className="text-purple-400 mb-2" />
                                                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Comp Off</p>
                                                <p className="text-xl font-bold text-gray-900">{bal.comp_off}</p>
                                            </div>
                                            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex flex-col items-center justify-center text-center">
                                                <Baby size={16} className="text-pink-400 mb-2" />
                                                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Paternity</p>
                                                <p className="text-xl font-bold text-gray-900">{bal.paternity_leave}</p>
                                            </div>
                                            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex flex-col items-center justify-center text-center">
                                                <Home size={16} className="text-blue-400 mb-2" />
                                                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">WFH</p>
                                                <p className="text-xl font-bold text-gray-900">{bal.wfh_contract}</p>
                                            </div>
                                            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex flex-col items-center justify-center text-center">
                                                <Heart size={16} className="text-green-400 mb-2" />
                                                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Paid Leave</p>
                                                <p className="text-xl font-bold text-gray-900">{bal.paid_leave}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="py-20 text-center space-y-4 bg-white rounded-[2.5rem] border-2 border-dashed border-gray-100">
                            <AlertCircle size={48} className="mx-auto text-gray-200" />
                            <div className="space-y-1">
                                <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">No Data Available</p>
                                <p className="text-[10px] text-gray-300">{dashStatusMsg || 'The balance registry is currently empty.'}</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default function AdminLeaveBalancesSetup() {
    return (
        <div className="min-h-screen bg-slate-50 p-6 md:p-10 text-gray-900 font-sans selection:bg-blue-100">
            <Suspense fallback={<div>Loading setup form...</div>}>
                <LeaveBalanceForm />
            </Suspense>
        </div>
    );
}
