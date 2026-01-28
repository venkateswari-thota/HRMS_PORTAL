'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { apiRequest } from '@/lib/api';
import { Calendar, Clock, FileText, Send, Trash2, CheckCircle, XCircle, RotateCcw } from 'lucide-react';

export default function LeaveApplyPage() {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<'apply' | 'pending' | 'history'>('apply');
    const [loading, setLoading] = useState(false);
    const [statusMsg, setStatusMsg] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [modalMsg, setModalMsg] = useState('');

    // Form State
    const [formData, setFormData] = useState({
        leave_type: '',
        from_date: '',
        to_date: '',
        from_session: 'Session 1',
        to_session: 'Session 2',
        reason: ''
    });

    const [pendingLeaves, setPendingLeaves] = useState<any[]>([]);
    const [historyLeaves, setHistoryLeaves] = useState<any[]>([]);
    const [holidays, setHolidays] = useState<string[]>([]);

    const leaveTypes = [
        "Loss of Pay",
        "Paternity Leave",
        "Comp Off",
        "Work From Home - Contract",
        "Paid Leave"
    ];

    const fetchLeaves = async () => {
        const empId = localStorage.getItem('emp_id');
        if (!empId) {
            router.push('/auth/employee/signin');
            return;
        }
        try {
            const pending = await apiRequest(`/leave/pending?emp_id=${empId}`);
            setPendingLeaves(pending);
            const history = await apiRequest(`/leave/history?emp_id=${empId}`);
            setHistoryLeaves(history);

            // Fetch holidays for the current year
            const year = new Date().getFullYear();
            const holidayData = await apiRequest(`/leave/holidays?year=${year}`);
            if (Array.isArray(holidayData)) {
                setHolidays(holidayData.map((h: any) => h.date));
            }
        } catch (e) {
            console.error("Failed to fetch leaves or holidays", e);
        }
    };

    useEffect(() => {
        fetchLeaves();
    }, []);

    const isNonWorkingDay = (dateStr: string) => {
        if (!dateStr) return false;
        const date = new Date(dateStr);
        // getDay() returns 0 for Sunday
        if (date.getDay() === 0) return true;
        if (holidays.includes(dateStr)) return true;
        return false;
    };

    const validateDateRange = (from: string, to: string) => {
        if (!from || !to) return true;

        let current = new Date(from);
        const endDate = new Date(to);

        while (current <= endDate) {
            const dateStr = current.toISOString().split('T')[0];
            if (isNonWorkingDay(dateStr)) {
                return false;
            }
            current.setDate(current.getDate() + 1);
        }
        return true;
    };

    const handleDateChange = (field: 'from_date' | 'to_date', value: string) => {
        if (isNonWorkingDay(value)) {
            setModalMsg("Looks like it's already your non working day. Please pick different date(s) to apply.");
            setShowModal(true);
            return; // Don't update state to block the selection
        }

        const newFormData = { ...formData, [field]: value };

        // If both dates are set, check the entire range
        if (newFormData.from_date && newFormData.to_date) {
            if (!validateDateRange(newFormData.from_date, newFormData.to_date)) {
                setModalMsg("The selected range includes non-working days (Sundays or holidays). Please pick different dates.");
                setShowModal(true);
                return;
            }
        }

        setFormData(newFormData);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Final safety validation
        if (!validateDateRange(formData.from_date, formData.to_date)) {
            setModalMsg("Looks like it's already your non working day. Please pick different date(s) to apply.");
            setShowModal(true);
            return;
        }

        setLoading(true);
        setStatusMsg('');
        const empId = localStorage.getItem('emp_id');
        if (!empId) return;
        try {
            await apiRequest('/leave/apply', 'POST', { ...formData, emp_id: empId });
            setStatusMsg('Leave Application Submitted Successfully!');
            setFormData({ leave_type: '', from_date: '', to_date: '', from_session: 'Session 1', to_session: 'Session 2', reason: '' });
            fetchLeaves();
            setTimeout(() => setActiveTab('pending'), 1500);
        } catch (e: any) {
            setStatusMsg('Error: ' + e.message);
        } finally {
            setLoading(false);
        }
    };

    const handleWithdraw = async (id: string) => {
        if (!confirm("Are you sure you want to withdraw this leave request?")) return;
        try {
            await apiRequest('/leave/withdraw', 'POST', { leave_id: id });
            fetchLeaves();
        } catch (e: any) {
            alert(e.message);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center justify-between border-b border-gray-200 pb-4">
                <h1 className="text-2xl font-bold text-gray-900">Leave Apply</h1>
                <div className="flex bg-gray-100 p-1 rounded-lg">
                    {(['apply', 'pending', 'history'] as const).map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${activeTab === tab ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            {tab.charAt(0).toUpperCase() + tab.slice(1)}
                        </button>
                    ))}
                </div>
            </div>

            {activeTab === 'apply' && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">Leave Type*</label>
                                <select
                                    required
                                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                    value={formData.leave_type}
                                    onChange={e => setFormData({ ...formData, leave_type: e.target.value })}
                                >
                                    <option value="">Select type</option>
                                    {leaveTypes.map(t => <option key={t} value={t}>{t}</option>)}
                                </select>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">From Date*</label>
                                <div className="flex gap-2">
                                    <input
                                        type="date" required
                                        className="flex-1 p-2.5 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                                        value={formData.from_date}
                                        onChange={e => handleDateChange('from_date', e.target.value)}
                                    />
                                    <select
                                        className="w-32 p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm"
                                        value={formData.from_session}
                                        onChange={e => setFormData({ ...formData, from_session: e.target.value })}
                                    >
                                        <option>Session 1</option>
                                        <option>Session 2</option>
                                    </select>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">To Date*</label>
                                <div className="flex gap-2">
                                    <input
                                        type="date" required
                                        className="flex-1 p-2.5 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                                        value={formData.to_date}
                                        onChange={e => handleDateChange('to_date', e.target.value)}
                                    />
                                    <select
                                        className="w-32 p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm"
                                        value={formData.to_session}
                                        onChange={e => setFormData({ ...formData, to_session: e.target.value })}
                                    >
                                        <option>Session 1</option>
                                        <option>Session 2</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Reason*</label>
                            <textarea
                                required rows={3}
                                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Enter a reason"
                                value={formData.reason}
                                onChange={e => setFormData({ ...formData, reason: e.target.value })}
                            ></textarea>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                                <FileText size={16} className="text-gray-400" />
                                Attach File (Optional)
                            </label>
                            <div className="p-4 border-2 border-dashed border-gray-200 rounded-xl bg-gray-50/50 flex flex-col items-center justify-center text-center">
                                <p className="text-xs text-gray-400 mb-2">File Types: pdf, xls, doc, docx, txt, png, jpg</p>
                                <input
                                    type="file"
                                    className="text-xs text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                                />
                            </div>
                        </div>

                        {statusMsg && (
                            <div className={`p-4 rounded-lg text-sm font-medium ${statusMsg.includes('Error') ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
                                {statusMsg}
                            </div>
                        )}

                        <div className="flex gap-4">
                            <button
                                type="submit" disabled={loading}
                                className="px-8 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-all disabled:opacity-50"
                            >
                                {loading ? 'Submitting...' : 'Submit'}
                            </button>
                            <button type="reset" className="px-8 py-3 bg-gray-100 text-gray-600 font-bold rounded-xl hover:bg-gray-200 transition-all">
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {activeTab === 'pending' && (
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    {pendingLeaves.length === 0 ? (
                        <div className="text-center py-12 bg-white rounded-xl border border-dashed border-gray-300 text-gray-400">
                            No pending leave requests found.
                        </div>
                    ) : (
                        pendingLeaves.map(leave => (
                            <div key={leave.id} className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all group">
                                <div className="flex justify-between items-start">
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 text-[10px] font-bold rounded uppercase">Pending</span>
                                            <span className="text-xs text-gray-400 font-mono">{new Date(leave.applied_on).toLocaleDateString()}</span>
                                        </div>
                                        <h3 className="text-lg font-bold text-gray-900">{leave.leave_type}</h3>
                                        <div className="flex items-center gap-4 text-sm text-gray-500">
                                            <div className="flex items-center gap-1"><Calendar size={14} /> {leave.from_date} ({leave.from_session})</div>
                                            <div className="text-gray-300">→</div>
                                            <div className="flex items-center gap-1"><Calendar size={14} /> {leave.to_date} ({leave.to_session})</div>
                                        </div>
                                        <p className="text-sm text-gray-600 mt-3 pt-3 border-t border-gray-50 italic">"{leave.reason}"</p>
                                    </div>
                                    <button
                                        onClick={() => handleWithdraw(leave.id)}
                                        className="px-4 py-2 bg-red-50 text-red-600 text-xs font-bold rounded-lg hover:bg-red-600 hover:text-white transition-all border border-red-100"
                                    >
                                        Withdraw
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}

            {activeTab === 'history' && (
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    {historyLeaves.length === 0 ? (
                        <div className="text-center py-12 bg-white rounded-xl border border-dashed border-gray-300 text-gray-400">
                            No leave history available.
                        </div>
                    ) : (
                        historyLeaves.map(leave => (
                            <div key={leave.id} className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm opacity-80 hover:opacity-100 transition-all">
                                <div className="flex justify-between items-start">
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2 mb-2">
                                            {leave.status === 'APPROVED' ? (
                                                <span className="px-2 py-0.5 bg-green-100 text-green-700 text-[10px] font-bold rounded uppercase flex items-center gap-1">
                                                    <CheckCircle size={10} /> Approved
                                                </span>
                                            ) : leave.status === 'REJECTED' ? (
                                                <span className="px-2 py-0.5 bg-red-100 text-red-700 text-[10px] font-bold rounded uppercase flex items-center gap-1">
                                                    <XCircle size={10} /> Rejected
                                                </span>
                                            ) : (
                                                <span className="px-2 py-0.5 bg-gray-100 text-gray-700 text-[10px] font-bold rounded uppercase flex items-center gap-1">
                                                    <RotateCcw size={10} /> Withdrawn
                                                </span>
                                            )}
                                            <span className="text-xs text-gray-400 font-mono">{new Date(leave.applied_on).toLocaleDateString()}</span>
                                        </div>
                                        <h3 className="text-lg font-bold text-gray-900">{leave.leave_type}</h3>
                                        <div className="flex items-center gap-4 text-sm text-gray-500">
                                            <div className="flex items-center gap-1"><Calendar size={14} /> {leave.from_date}</div>
                                            <div className="text-gray-300">→</div>
                                            <div className="flex items-center gap-1"><Calendar size={14} /> {leave.to_date}</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}

            {/* Custom Validation Modal */}
            {showModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 p-8 max-w-md w-full text-center space-y-6 animate-in zoom-in-95 duration-200">
                        <div className="mx-auto w-16 h-16 bg-red-50 rounded-full flex items-center justify-center">
                            <XCircle className="text-red-500" size={32} />
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-xl font-bold text-gray-900 leading-tight">Invalid Date Selected</h3>
                            <p className="text-gray-600">
                                {modalMsg}
                            </p>
                        </div>
                        <button
                            onClick={() => setShowModal(false)}
                            className="w-full py-3 bg-gray-900 text-white font-bold rounded-xl hover:bg-black transition-all shadow-lg active:scale-[0.98]"
                        >
                            Got it
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
