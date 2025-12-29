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
        <div className="min-h-screen p-6 md:p-10 bg-slate-50 text-gray-900">
            <header className="mb-10 flex justify-between items-end border-b border-gray-200 pb-6">
                <div>
                    <h1 className="text-4xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
                        Admin Command Center
                    </h1>
                    <p className="text-gray-500 mt-2">Manage Workforce & Attendance Validation</p>
                </div>

                <button
                    onClick={() => { localStorage.removeItem('admin_token'); router.push('/auth/admin/signin'); }}
                    className="px-5 py-2.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 text-sm font-medium transition-all"
                >
                    Secure Log Out
                </button>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2">
                    <EmployeeRegisterForm />
                </div>

                <div className="lg:col-span-1 space-y-8">
                    <div className="bg-white p-6 h-[200px] flex flex-col items-center justify-center border border-gray-200 rounded-xl shadow-sm border-l-4 border-l-yellow-500">
                        <h3 className="font-semibold text-lg text-gray-800 mb-2">Pending Approvals</h3>
                        <div className="text-4xl font-bold text-yellow-500">0</div>
                        <p className="text-xs text-gray-400 mt-2 uppercase tracking-widest">No Requests</p>
                    </div>

                    <div className="bg-white p-6 h-[200px] flex flex-col items-center justify-center border border-gray-200 rounded-xl shadow-sm border-l-4 border-l-green-500">
                        <h3 className="font-semibold text-lg text-gray-800 mb-2">Active Workforce</h3>
                        <div className="text-4xl font-bold text-green-500">--</div>
                        <p className="text-xs text-gray-400 mt-2 uppercase tracking-widest">Loading Stats...</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
