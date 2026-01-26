'use client';
import { useState, useEffect } from 'react';
import { apiRequest } from '@/lib/api';
import { Calendar, ChevronLeft, ChevronRight, Info } from 'lucide-react';

export default function EmployeeHolidayCalendarPage() {
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
        fetchHolidays(year);
    }, [year]);

    // Group holidays by month
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

    const getDayNum = (dateStr: string) => {
        return new Date(dateStr).getDate().toString().padStart(2, '0');
    };

    return (
        <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500 font-sans selection:bg-blue-100">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-gray-100 pb-8 gap-6">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 flex items-center gap-4">
                        <Calendar className="text-blue-600" size={32} />
                        Holiday Calendar
                    </h1>
                    <p className="text-gray-500 text-sm font-medium mt-1">Explore official holiday schedule for the company year {year}</p>
                </div>

                <div className="flex items-center gap-4 bg-white p-2.5 rounded-2xl border border-gray-100 shadow-sm self-end md:self-auto">
                    <button
                        onClick={() => setYear(year - 1)}
                        className="p-2.5 hover:bg-slate-100 rounded-xl transition-all text-gray-400 hover:text-blue-600 active:scale-90"
                    >
                        <ChevronLeft size={22} />
                    </button>
                    <span className="text-xl font-black text-blue-600 px-4 min-w-[90px] text-center">{year}</span>
                    <button
                        onClick={() => setYear(year + 1)}
                        className="p-2.5 hover:bg-slate-100 rounded-xl transition-all text-gray-400 hover:text-blue-600 active:scale-90"
                    >
                        <ChevronRight size={22} />
                    </button>
                </div>
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                {monthNames.map((month, idx) => {
                    const monthHolidays = getHolidaysByMonth(idx);
                    return (
                        <div key={month} className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all flex flex-col h-[320px] group overflow-hidden">
                            <div className="p-5 border-b border-gray-50 flex justify-between items-center bg-gray-50/20">
                                <h3 className="text-[11px] font-black text-gray-400 tracking-[0.2em] leading-none">
                                    {month}
                                </h3>
                                {monthHolidays.length > 0 && (
                                    <span className="bg-blue-600 text-white text-[9px] font-black px-2 py-0.5 rounded-full shadow-sm">
                                        {monthHolidays.length}
                                    </span>
                                )}
                            </div>

                            <div className="flex-1 p-5 overflow-y-auto custom-scrollbar">
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
                                                    <span className="text-sm font-black text-gray-900 leading-none">{getDayNum(holiday.date)}</span>
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
                                    <div className="h-full flex flex-col items-center justify-center text-center opacity-20">
                                        <Info size={32} className="mb-2 text-gray-300" />
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-relaxed">
                                            No Holidays<br />Scheduled
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
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
