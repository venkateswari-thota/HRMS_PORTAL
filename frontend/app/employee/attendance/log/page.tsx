'use client';
import { useState, useEffect } from 'react';
import { apiRequest } from '@/lib/api';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { Eye } from 'lucide-react';

export default function AttendanceLogPage() {
    const [fromDate, setFromDate] = useState<Date | null>(() => {
        const d = new Date();
        d.setDate(d.getDate() - 30);
        return d;
    });
    const [toDate, setToDate] = useState<Date | null>(new Date());
    const [logs, setLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchLogs = async () => {
        setLoading(true);
        try {
            // Simulate API call or use real one
            // In real app: POST /attendance/history with date range
            const formatDate = (date: Date | null) => {
                if (!date) return '';
                const offset = date.getTimezoneOffset();
                const localDate = new Date(date.getTime() - (offset * 60 * 1000));
                return localDate.toISOString().split('T')[0];
            };

            const token = localStorage.getItem('emp_token');
            const data = await apiRequest('/attendance/history', 'POST', {
                from_date: formatDate(fromDate),
                to_date: formatDate(toDate)
            }, token || '');
            setLogs(data);
        } catch (e) {
            console.error(e);
            setLogs([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLogs();
    }, []);

    return (
        <div className="min-h-screen bg-white text-gray-800 p-6">
            {/* Header */}
            <div className="mb-6 border-b pb-4">
                <h2 className="text-xl font-bold text-blue-900">Active Financial Year: 2025</h2>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                {/* Title Bar */}
                <div className="p-4 border-b border-gray-200 bg-gray-50/50">
                    <h1 className="text-lg font-semibold text-blue-600 flex items-center gap-2">
                        <span className="w-1 h-6 bg-green-500 rounded-full"></span>
                        Attendance Log
                    </h1>
                </div>

                {/* Filters */}
                <div className="p-6 grid md:grid-cols-3 gap-4 items-end border-b border-gray-100">
                    <div>
                        <label className="block text-sm font-semibold text-gray-600 mb-1">From :</label>
                        <input
                            type="date"
                            value={fromDate?.toISOString().split('T')[0]}
                            onChange={(e) => setFromDate(new Date(e.target.value))}
                            className="w-full border border-gray-300 rounded p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-gray-600 mb-1">To :</label>
                        <input
                            type="date"
                            value={toDate ? new Date(toDate.getTime() - toDate.getTimezoneOffset() * 60000).toISOString().split('T')[0] : ''}
                            onChange={(e) => setToDate(new Date(e.target.value))}
                            className="w-full border border-gray-300 rounded p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer"
                        />
                    </div>
                    <div>
                        <button
                            onClick={fetchLogs}
                            className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-6 rounded text-sm transition-colors cursor-pointer"
                        >
                            Search
                        </button>
                    </div>
                </div>

                {/* Table */}
                <div className="p-6 overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-100 text-gray-700 font-bold text-sm">
                                <th className="p-3 border-b border-gray-200">SL</th>
                                <th className="p-3 border-b border-gray-200">Date</th>
                                <th className="p-3 border-b border-gray-200">In Time</th>
                                <th className="p-3 border-b border-gray-200">Last In Time</th>
                                <th className="p-3 border-b border-gray-200">Last Out Time</th>
                                <th className="p-3 border-b border-gray-200">Worked Hours</th>
                                <th className="p-3 border-b border-gray-200">Action</th>
                            </tr>
                        </thead>
                        <tbody className="text-sm">
                            {loading ? (
                                <tr><td colSpan={7} className="p-4 text-center">Loading...</td></tr>
                            ) : logs.length === 0 ? (
                                <tr><td colSpan={7} className="p-4 text-center text-gray-500">No records found</td></tr>
                            ) : (
                                logs.map((log, index) => (
                                    <tr key={index} className="hover:bg-gray-50 border-b border-gray-100">
                                        <td className="p-3 text-gray-500">{index + 1}</td>
                                        <td className="p-3 text-gray-700">{log.date}</td>
                                        <td className="p-3 text-gray-600">{log.in_time || '----'}</td>
                                        <td className="p-3 text-gray-600">{log.last_in || log.in_time || '----'}</td>
                                        <td className="p-3 text-gray-600">{log.last_out || '----'}</td>
                                        <td className="p-3 text-gray-600">{log.worked_hours || '----'}</td>
                                        <td className="p-3">
                                            <button className="bg-cyan-400 hover:bg-cyan-500 text-white px-3 py-1.5 rounded text-xs font-bold flex items-center gap-1 cursor-pointer">
                                                <Eye size={12} />
                                                Details
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
