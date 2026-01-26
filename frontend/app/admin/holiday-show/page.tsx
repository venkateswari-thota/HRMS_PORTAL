'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { apiRequest } from '@/lib/api';
import Link from 'next/link';
import { Calendar, ChevronLeft, ChevronRight, Edit3, ArrowLeft } from 'lucide-react';

export default function AdminHolidayViewPage() {
    const router = useRouter();
    const [year, setYear] = useState<number>(new Date().getFullYear());
    const [holidays, setHolidays] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const monthNames = [
        "JANUARY", "FEBRUARY", "MARCH", "APRIL", "MAY", "JUNE",
        "JULY", "AUGUST", "SEPTEMBER", "OCTOBER", "NOVEMBER", "DECEMBER"
    ];

    const fetchHolidays = async (selectedYear: number) => {
        setLoading(true);
        try {
            const data = await apiRequest(`/leave/holidays?year=${selectedYear}`);
            setHolidays(data);
        } catch (e) {
            console.error("Failed to fetch holidays", e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const token = localStorage.getItem('admin_token');
        if (!token) { router.push('/auth/admin/signin'); return; }
        fetchHolidays(year);
    }, [year]);

    const getHolidaysByMonth = (monthIndex: number) => {
        return holidays.filter(h => {
            const date = new Date(h.date);
            return date.getMonth() === monthIndex;
        });
    };

    const getDayName = (dateStr: string) => {
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        return days[new Date(dateStr).getDay()];
    };

    return (
        <div className="min-h-screen bg-slate-50 p-6 md:p-10 text-gray-900 font-sans selection:bg-blue-100">
            <div className="max-w-7xl mx-auto space-y-10">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-gray-200 pb-8">
                    <div className="flex items-center gap-6">
                        <Link
                            href="/admin/onboard"
                            className="p-3 bg-white rounded-full border border-gray-100 shadow-sm text-gray-400 hover:text-blue-600 hover:border-blue-100 hover:shadow-md transition-all active:scale-90 group"
                        >
                            <ArrowLeft size={24} className="group-hover:-translate-x-1 transition-transform" />
                        </Link>
                        <div>
                            <h1 className="text-3xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600">
                                Holiday Calendar Dashboard
                            </h1>
                            <p className="text-gray-500 text-sm font-medium mt-1">Review and manage company-wide holidays month by month</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-4 bg-white p-2.5 rounded-2xl border border-gray-100 shadow-sm">
                        <button onClick={() => setYear(year - 1)} className="p-2.5 hover:bg-slate-50 rounded-xl transition-all text-gray-400 hover:text-blue-600 active:scale-90">
                            <ChevronLeft size={22} />
                        </button>
                        <div className="flex flex-col items-center min-w-[100px]">
                            <span className="text-[10px] font-black text-gray-400 tracking-[0.2em] uppercase leading-none mb-1">Year</span>
                            <span className="text-xl font-black text-blue-600 leading-none">{year}</span>
                        </div>
                        <button onClick={() => setYear(year + 1)} className="p-2.5 hover:bg-slate-50 rounded-xl transition-all text-gray-400 hover:text-blue-600 active:scale-90">
                            <ChevronRight size={22} />
                        </button>
                    </div>
                </div>

                {/* 12-Box Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {monthNames.map((month, idx) => {
                        const monthHolidays = getHolidaysByMonth(idx);
                        return (
                            <div
                                key={month}
                                className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col h-[340px] overflow-hidden group"
                            >
                                <div className="p-6 border-b border-gray-50 flex justify-between items-center bg-gray-50/20">
                                    <h3 className="text-[11px] font-black text-gray-400 tracking-[0.2em] leading-none uppercase">
                                        {month}
                                    </h3>
                                </div>

                                <div className="flex-1 p-6 overflow-y-auto custom-scrollbar relative">
                                    {loading ? (
                                        <div className="space-y-4">
                                            <div className="h-10 bg-gray-50 animate-pulse rounded-2xl"></div>
                                            <div className="h-10 bg-gray-50 animate-pulse rounded-2xl"></div>
                                        </div>
                                    ) : monthHolidays.length > 0 ? (
                                        <div className="space-y-4">
                                            {monthHolidays.map((holiday, hIdx) => (
                                                <div key={hIdx} className="flex items-center gap-3">
                                                    <div className="flex flex-col items-center min-w-[28px]">
                                                        <span className="text-sm font-black text-gray-900 leading-none">{new Date(holiday.date).getDate()}</span>
                                                        <span className="text-[8px] font-bold text-blue-500 uppercase tracking-tighter">{getDayName(holiday.date)}</span>
                                                    </div>
                                                    <div className="flex-1 bg-slate-50 border border-slate-100/50 px-4 py-2.5 rounded-[2rem] hover:bg-blue-50 hover:border-blue-100 transition-all cursor-default">
                                                        <p className="text-[11px] font-bold text-gray-700 leading-tight">
                                                            {holiday.reason}
                                                        </p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="h-full flex flex-col items-center justify-center text-center opacity-20 group-hover:opacity-40 transition-opacity">
                                            <Calendar size={32} className="mb-2 text-gray-300" />
                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-relaxed">
                                                No Holidays<br />Listed
                                            </p>
                                        </div>
                                    )}
                                </div>

                                {/* Edit Button Footer */}
                                <div className="p-4 bg-gray-50/50 flex justify-end">
                                    <Link
                                        href={`/admin/holiday-setup?year=${year}&month=${idx + 1}`}
                                        className="p-3 bg-white text-blue-600 rounded-2xl border border-blue-50 shadow-sm hover:bg-blue-600 hover:text-white hover:shadow-md transition-all active:scale-90 group/btn"
                                        title={`Edit ${month} Holidays`}
                                    >
                                        <Edit3 size={18} className="group-hover/btn:rotate-12 transition-transform" />
                                    </Link>
                                </div>
                            </div>
                        );
                    })}
                </div>

            </div>

            <style jsx>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 5px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #f1f5f9;
                    border-radius: 20px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: #e2e8f0;
                }
            `}</style>
        </div>
    );
}
