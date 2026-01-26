'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { apiRequest } from '@/lib/api';
import { Info } from 'lucide-react';

export default function LeaveBalancesPage() {
    const router = useRouter();
    const [balances, setBalances] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchBalances = async () => {
        const empId = localStorage.getItem('emp_id');
        if (!empId) {
            router.push('/auth/employee/signin');
            return;
        }
        try {
            const data = await apiRequest(`/leave/balances/${empId}`);
            setBalances(data);
        } catch (e) {
            console.error("Failed to fetch balances", e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBalances();
    }, []);

    return (
        <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                <h1 className="text-2xl font-bold text-gray-800">Leave Balances</h1>
            </div>

            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[1, 2, 3, 4, 5, 6].map(i => (
                        <div key={i} className="h-40 bg-gray-100 animate-pulse rounded-2xl border border-gray-100"></div>
                    ))}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {balances.map((item, idx) => (
                        <div key={idx} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group">
                            <div className="flex justify-between items-start mb-4">
                                <h3 className="text-sm font-bold text-gray-500 group-hover:text-blue-600 transition-colors uppercase tracking-tight leading-tight">
                                    {item.category}
                                </h3>
                                <div className="text-[10px] font-bold text-gray-400 bg-gray-50 px-2 py-1 rounded-md">
                                    Granted: {item.granted}
                                </div>
                            </div>

                            <div className="flex flex-col items-center justify-center py-2">
                                <span className={`text-4xl font-extrabold ${item.balance < 0 ? 'text-red-500' : item.balance > 0 ? 'text-gray-800' : 'text-gray-300'}`}>
                                    {item.balance}
                                </span>
                                <span className="text-[10px] uppercase font-bold text-gray-400 tracking-widest mt-1">Balance</span>
                            </div>

                            <div className="mt-4 pt-4 border-t border-gray-50 flex items-center gap-2 text-[10px] text-blue-500 font-bold opacity-0 group-hover:opacity-100 transition-opacity cursor-default">
                                <Info size={12} /> View Details
                            </div>
                        </div>
                    ))}
                </div>
            )}

        </div>
    );
}
