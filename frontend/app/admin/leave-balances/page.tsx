'use client';
import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { apiRequest } from '@/lib/api';
import Link from 'next/link';
import { ArrowLeft, Save, User, Info } from 'lucide-react';

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

    useEffect(() => {
        if (paramEmpId) {
            setIsEditMode(true);
            fetchExistingBalances(paramEmpId);
        }
    }, [paramEmpId]);

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
            }
        } catch (e) {
            console.error("Failed to fetch balance for edit", e);
        }
    };

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
                router.push('/admin/leave-balances-show');
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
                    {/* Employee ID Section */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2 px-1">
                            <User size={14} /> Employee ID {isEditMode && <span className="text-[10px] text-indigo-400 opacity-60">(Locked)</span>}
                        </label>
                        <div className="relative">
                            <input
                                type="text" required
                                placeholder="e.g. PRAGEMP001"
                                disabled={isEditMode}
                                className={`w-full p-4 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-bold transition-all ${isEditMode ? 'bg-slate-50 border-slate-100 text-gray-400 cursor-not-allowed' : 'bg-slate-50 border-slate-200 text-gray-700'}`}
                                value={formData.emp_id}
                                onChange={e => setFormData({ ...formData, emp_id: e.target.value })}
                            />
                            {isEditMode && <Info size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300" />}
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
