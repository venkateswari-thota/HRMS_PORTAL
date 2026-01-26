'use client';
import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { apiRequest } from '@/lib/api';
import Link from 'next/link';
import { ArrowLeft, Plus, Trash2, Save, XCircle, Calendar, Info } from 'lucide-react';

interface HolidayRow {
    date: string;
    reason: string;
}

function HolidaySetupForm() {
    const router = useRouter();
    const searchParams = useSearchParams();

    // Initial year/month from URL or defaults
    const paramYear = searchParams.get('year');
    const paramMonth = searchParams.get('month');

    const [year, setYear] = useState<number>(paramYear ? parseInt(paramYear) : new Date().getFullYear());
    const [month, setMonth] = useState<number | null>(paramMonth ? parseInt(paramMonth) : null);

    const [holidays, setHolidays] = useState<HolidayRow[]>([{ date: '', reason: '' }]);
    const [initialHolidays, setInitialHolidays] = useState<HolidayRow[]>([{ date: '', reason: '' }]);
    const [loading, setLoading] = useState(false);
    const [statusMsg, setStatusMsg] = useState('');

    const fetchHolidays = async (selectedYear: number, selectedMonth: number | null) => {
        try {
            const token = localStorage.getItem('admin_token');
            const data = await apiRequest(`/leave/holidays?year=${selectedYear}`, 'GET', null, token || '');

            let fetchedHolidays: HolidayRow[] = [];
            if (data.length > 0) {
                let filtered = data;
                if (selectedMonth) {
                    filtered = data.filter((h: any) => {
                        const d = new Date(h.date);
                        return d.getMonth() + 1 === selectedMonth;
                    });
                }

                if (filtered.length > 0) {
                    fetchedHolidays = filtered.map((h: any) => ({ date: h.date, reason: h.reason }));
                } else {
                    fetchedHolidays = selectedMonth ? [] : [{ date: '', reason: '' }];
                }
            } else {
                fetchedHolidays = selectedMonth ? [] : [{ date: '', reason: '' }];
            }
            setHolidays(fetchedHolidays);
            setInitialHolidays(JSON.parse(JSON.stringify(fetchedHolidays)));
        } catch (e) {
            console.error("Failed to fetch holidays", e);
        }
    };

    useEffect(() => {
        const token = localStorage.getItem('admin_token');
        if (!token) { router.push('/auth/admin/signin'); return; }
        fetchHolidays(year, month);
    }, [year, month]);

    const addRow = () => {
        setHolidays([...holidays, { date: '', reason: '' }]);
    };

    const removeRow = (index: number) => {
        const updated = holidays.filter((_, i) => i !== index);
        if (updated.length === 0) {
            setHolidays(month ? [] : [{ date: '', reason: '' }]);
        } else {
            setHolidays(updated);
        }
    };

    const handleChange = (index: number, field: keyof HolidayRow, value: string) => {
        const updated = [...holidays];
        updated[index] = { ...updated[index], [field]: value };
        setHolidays(updated);
    };

    const isDirty = () => {
        return JSON.stringify(holidays) !== JSON.stringify(initialHolidays);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setStatusMsg('');
        try {
            const token = localStorage.getItem('admin_token');
            const validHolidays = holidays.filter(h => h.date && h.reason);
            await apiRequest('/leave/admin/holidays/setup', 'POST', { year, month, holidays: validHolidays }, token || '');

            // Immediate redirection after successful save
            router.push(`/admin/holiday-show?year=${year}`);
        } catch (e: any) {
            setStatusMsg('Error: ' + e.message);
            setLoading(false);
        }
    };

    const handleCancel = () => {
        if (confirm("Are you sure you want to clear all fields?")) {
            setHolidays([{ date: '', reason: '' }]);
            setStatusMsg('Fields cleared.');
            setTimeout(() => setStatusMsg(''), 2000);
        }
    };

    const monthNames = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            {/* Header */}
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
                            Holiday Setup {month ? ` - ${monthNames[month - 1]}` : ''}
                        </h1>
                        <p className="text-gray-500 text-sm mt-1">
                            {month ? `Modifying holidays for ${monthNames[month - 1]} ${year}` : `Configure public holidays for ${year}`}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2 bg-white p-2 rounded-xl border border-gray-200 shadow-sm">
                    <span className="text-xs font-bold text-gray-400 px-2 uppercase tracking-widest">Year {year}</span>
                </div>
            </div>

            {/* Form Container */}
            <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 p-8">
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-4">
                        <div className="grid grid-cols-12 gap-4 px-2 pb-2 border-b border-gray-50 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                            <div className="col-span-1 text-center">SL</div>
                            <div className="col-span-4">Holiday Date</div>
                            <div className="col-span-6">Reason / Holiday Name</div>
                            <div className="col-span-1 text-center">Action</div>
                        </div>

                        {holidays.length === 0 && month && (
                            <div className="py-12 text-center space-y-3 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-100 flex flex-col items-center justify-center">
                                <Info size={36} className="text-gray-300" />
                                <div>
                                    <p className="text-gray-500 font-bold uppercase tracking-widest text-[10px]">No holidays scheduled for this month</p>
                                    <p className="text-[10px] text-gray-400 mt-1">All records will be cleared upon saving.</p>
                                </div>
                            </div>
                        )}

                        {holidays.map((h, index) => (
                            <div key={index} className="grid grid-cols-12 gap-4 items-center group animate-in slide-in-from-left duration-200" style={{ animationDelay: `${index * 50}ms` }}>
                                <div className="col-span-1 text-center font-mono text-gray-300 group-hover:text-blue-400 transition-colors">
                                    {(index + 1).toString().padStart(2, '0')}
                                </div>
                                <div className="col-span-4">
                                    <div className="relative">
                                        <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" />
                                        <input
                                            type="date"
                                            required
                                            className="w-full pl-9 p-3 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-sm font-medium"
                                            value={h.date}
                                            onChange={(e) => handleChange(index, 'date', e.target.value)}
                                        />
                                    </div>
                                </div>
                                <div className="col-span-6">
                                    <input
                                        type="text"
                                        required
                                        placeholder="e.g. New Year's Day"
                                        className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-sm font-medium"
                                        value={h.reason}
                                        onChange={(e) => handleChange(index, 'reason', e.target.value)}
                                    />
                                </div>
                                <div className="col-span-1 flex justify-center">
                                    <button
                                        type="button"
                                        onClick={() => removeRow(index)}
                                        className="p-2.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all active:scale-90"
                                        title="Delete Entry"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Add Row Button - Only show if not in Monthly mode */}
                    {!month && (
                        <div className="flex justify-center pt-2">
                            <button
                                type="button"
                                onClick={addRow}
                                className="flex items-center gap-2 px-6 py-2.5 bg-blue-50 text-blue-600 rounded-full font-bold text-xs hover:bg-blue-100 transition-all border border-blue-100 active:scale-95 group"
                            >
                                <Plus size={16} className="group-hover:rotate-90 transition-transform duration-300" />
                                Add Holiday entry
                            </button>
                        </div>
                    )}

                    {statusMsg && (
                        <div className={`p-4 rounded-xl text-center font-medium ${statusMsg.includes('Error') ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-green-50 text-green-600 border border-green-100'}`}>
                            {statusMsg}
                        </div>
                    )}

                    {/* Actions */}
                    <div className={`pt-8 grid ${month ? 'grid-cols-1' : 'grid-cols-2'} gap-4`}>
                        <button
                            type="submit"
                            disabled={loading || !isDirty()}
                            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-blue-100 flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:shadow-none"
                        >
                            <Save size={20} />
                            {loading ? 'Saving Changes...' : 'Save Changes'}
                        </button>
                        {!month && (
                            <button
                                type="button"
                                onClick={handleCancel}
                                className="bg-slate-100 hover:bg-slate-200 text-gray-600 font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-2 active:scale-95"
                            >
                                <XCircle size={20} />
                                Cancel
                            </button>
                        )}
                    </div>
                </form>
            </div>
        </div>
    );
}

export default function AdminHolidaySetupPage() {
    return (
        <div className="min-h-screen bg-slate-50 p-6 md:p-10 text-gray-900 font-sans">
            <Suspense fallback={<div>Loading form...</div>}>
                <HolidaySetupForm />
            </Suspense>
        </div>
    );
}
