'use client';
import { useEffect, useState } from 'react';
import EmployeeRegisterForm from '@/components/admin/EmployeeRegisterForm';
import { useRouter } from 'next/navigation';

export default function AdminOnboardPage() {
    const router = useRouter();

    useEffect(() => {
        // Auth Check
        const token = localStorage.getItem('admin_token');
        if (!token) {
            router.push('/auth/admin/signin');
        }
    }, [router]);

    return (
        <div className="min-h-screen p-6 md:p-10 bg-black text-white">
            <header className="mb-10 flex justify-between items-end border-b border-white/10 pb-6">
                <div>
                    <h1 className="text-4xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-500">
                        Admin Command Center
                    </h1>
                    <p className="text-gray-500 mt-2">Manage Workforce & Attendance Validation</p>
                </div>

                <button
                    onClick={() => { localStorage.removeItem('admin_token'); router.push('/auth/admin/signin'); }}
                    className="px-5 py-2.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 text-sm font-medium transition-all"
                >
                    Secure Log Out
                </button>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2">
                    <EmployeeRegisterForm />
                </div>

                <div className="lg:col-span-1 space-y-8">
                    <div className="glass-panel p-6 h-[200px] flex flex-col items-center justify-center border-l-4 border-yellow-500">
                        <h3 className="font-semibold text-lg text-white mb-2">Pending Approvals</h3>
                        <div className="text-4xl font-bold text-yellow-400">0</div>
                        <p className="text-xs text-gray-500 mt-2 uppercase tracking-widest">No Requests</p>
                    </div>

                    <div className="glass-panel p-6 h-[200px] flex flex-col items-center justify-center border-l-4 border-green-500">
                        <h3 className="font-semibold text-lg text-white mb-2">Active Workforce</h3>
                        <div className="text-4xl font-bold text-green-400">--</div>
                        <p className="text-xs text-gray-500 mt-2 uppercase tracking-widest">Loading Stats...</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
