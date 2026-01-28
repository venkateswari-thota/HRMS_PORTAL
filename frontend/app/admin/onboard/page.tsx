'use client';
import { useEffect, useState } from 'react';
import EmployeeRegisterForm from '@/components/admin/EmployeeRegisterForm';
import { useRouter } from 'next/navigation';
import { apiRequest } from '@/lib/api';
import Link from 'next/link';

export default function AdminOnboardPage() {
    const router = useRouter();
    const [pendingCount, setPendingCount] = useState(0);
    const [approvedCount, setApprovedCount] = useState(0);
    const [leavePendingCount, setLeavePendingCount] = useState(0);
    const [employeeCount, setEmployeeCount] = useState(0);
    const [loading, setLoading] = useState(true);

    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        // Auth Check
        const token = localStorage.getItem('admin_token');
        if (!token) {
            router.push('/auth/admin/signin');
            return;
        }

        // Fetch counts from separate collections
        const fetchCounts = async () => {
            const authToken = localStorage.getItem('admin_token') || '';

            // 1. Attendance Requests
            try {
                const pending = await apiRequest('/admin/requests', 'GET', null, authToken);
                setPendingCount(Array.isArray(pending) ? pending.length : 0);
            } catch (e) {
                console.error('❌ Failed to fetch attendance requests:', e);
            }

            // 2. Approved Attendance
            try {
                const approved = await apiRequest('/admin/approved', 'GET', null, authToken);
                setApprovedCount(Array.isArray(approved) ? approved.length : 0);
            } catch (e) {
                console.error('❌ Failed to fetch approved attendance:', e);
            }

            // 3. Pending Leaves
            try {
                const leavePending = await apiRequest('/leave/admin/requests', 'GET', null, authToken);
                setLeavePendingCount(Array.isArray(leavePending) ? leavePending.length : 0);
            } catch (e) {
                console.error('❌ Failed to fetch leave requests:', e);
            }

            // 4. Employee Count
            try {
                const emps = await apiRequest('/admin/employees', 'GET', null, authToken);
                setEmployeeCount(Array.isArray(emps) ? emps.length : 0);
            } catch (e) {
                console.error('❌ Failed to fetch employees:', e);
            } finally {
                setLoading(false);
            }
        };

        fetchCounts();

        // Refresh counts every 30 seconds
        const interval = setInterval(fetchCounts, 30000);
        return () => clearInterval(interval);
    }, [router]);

    if (!mounted) return null;

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
                <div className="lg:col-span-1 space-y-8">
                    <Link href="/admin/employees" className="block">
                        <div className="bg-white p-6 h-[200px] flex flex-col items-center justify-center border border-gray-200 rounded-xl shadow-sm border-l-4 border-l-purple-600 hover:shadow-md transition-shadow cursor-pointer group">
                            <h3 className="font-semibold text-lg text-gray-800 mb-2">Employees</h3>
                            <div className="text-4xl font-bold text-purple-600 group-hover:scale-110 transition-transform">
                                {loading ? '...' : employeeCount}
                            </div>
                            <p className="text-xs text-gray-400 mt-2 uppercase tracking-widest">
                                {employeeCount === 0 ? 'No Members' : `${employeeCount} Employee${employeeCount > 1 ? 's' : ''}`}
                            </p>
                            <p className="text-xs text-purple-600 mt-3 underline">Manage Workforce →</p>
                        </div>
                    </Link>

                    <Link href="/admin/requests" className="block">
                        <div className="bg-white p-6 h-[200px] flex flex-col items-center justify-center border border-gray-200 rounded-xl shadow-sm border-l-4 border-l-yellow-500 hover:shadow-md transition-shadow cursor-pointer">
                            <h3 className="font-semibold text-lg text-gray-800 mb-2">Pending Attendance</h3>
                            <div className="text-4xl font-bold text-yellow-500">
                                {loading ? '...' : pendingCount}
                            </div>
                            <p className="text-xs text-gray-400 mt-2 uppercase tracking-widest">
                                {pendingCount === 0 ? 'No Requests' : `${pendingCount} Request${pendingCount > 1 ? 's' : ''}`}
                            </p>
                            {pendingCount > 0 && (
                                <p className="text-xs text-blue-600 mt-3 underline">Click to Review →</p>
                            )}
                        </div>
                    </Link>

                    <Link href="/admin/approved" className="block">
                        <div className="bg-white p-6 h-[140px] flex flex-col items-center justify-center border border-gray-200 rounded-xl shadow-sm border-l-4 border-l-green-500 hover:shadow-md transition-shadow cursor-pointer">
                            <h3 className="font-semibold text-lg text-gray-800 mb-1 text-center">Approved Attendance</h3>
                            <p className="text-[10px] text-gray-400 uppercase font-bold tracking-widest mb-1">Records Vault</p>
                            <p className="text-xs text-green-600 underline transition-all">Manage Logs →</p>
                        </div>
                    </Link>

                    <Link href="/admin/leave-requests" className="block">
                        <div className="bg-white p-6 h-[140px] flex flex-col items-center justify-center border border-gray-200 rounded-xl shadow-sm border-l-4 border-l-blue-500 hover:shadow-md transition-shadow cursor-pointer">
                            <h3 className="font-semibold text-lg text-gray-800 mb-1 text-center">Leave Requests</h3>
                            <p className="text-[10px] text-gray-400 uppercase font-bold tracking-widest mb-1">Administration</p>
                            <p className="text-xs text-blue-600 underline transition-all">Review Applications →</p>
                        </div>
                    </Link>

                    <Link href="/admin/handled-leaves" className="block">
                        <div className="bg-white p-6 h-[140px] flex flex-col items-center justify-center border border-gray-200 rounded-[2rem] shadow-sm border-l-4 border-l-purple-600 hover:shadow-md transition-shadow cursor-pointer">
                            <h3 className="font-bold text-lg text-gray-800 mb-1 text-center">Leaves Handled</h3>
                            <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest mb-1">History & Audit Logs</p>
                            <p className="text-xs text-purple-600 underline transition-all">View Archive →</p>
                        </div>
                    </Link>

                    <Link href="/admin/leave-balances" className="block">
                        <div className="bg-white p-6 h-[120px] flex flex-col items-center justify-center border border-gray-200 rounded-xl shadow-sm border-l-4 border-l-purple-500 hover:shadow-md transition-shadow cursor-pointer">
                            <h3 className="font-semibold text-lg text-gray-800 mb-1 text-center">Leave Balances</h3>
                            <p className="text-[10px] text-gray-400 uppercase font-bold tracking-widest mb-1">Setup Menu</p>
                            <p className="text-xs text-blue-600 underline">Configure Granted →</p>
                        </div>
                    </Link>

                    <Link href="/admin/leave-balances-show" className="block">
                        <div className="bg-white p-6 h-[140px] flex flex-col items-center justify-center border border-gray-200 rounded-xl shadow-sm border-l-4 border-l-indigo-500 hover:shadow-md transition-shadow cursor-pointer">
                            <h3 className="font-semibold text-lg text-gray-800 mb-1 text-center">Leave Balances</h3>
                            <p className="text-[10px] text-gray-400 uppercase font-bold tracking-widest mb-1">Dash Board</p>
                            <p className="text-xs text-indigo-600 underline transition-all">Show Archive →</p>
                        </div>
                    </Link>

                    <Link href="/admin/holiday-setup" className="block">
                        <div className="bg-white p-6 h-[120px] flex flex-col items-center justify-center border border-gray-200 rounded-[2rem] shadow-sm border-l-4 border-l-orange-500 hover:shadow-md transition-shadow cursor-pointer">
                            <h3 className="font-bold text-lg text-gray-800 mb-1 text-center">Holiday Setup</h3>
                            <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest mb-1">Upload Year</p>
                            <p className="text-xs text-orange-600 underline">Add Holidays →</p>
                        </div>
                    </Link>

                    <Link href="/admin/holiday-show" className="block">
                        <div className="bg-white p-6 h-[120px] flex flex-col items-center justify-center border border-gray-200 rounded-[2rem] shadow-sm border-l-4 border-l-blue-600 hover:shadow-md transition-shadow cursor-pointer">
                            <h3 className="font-bold text-lg text-gray-800 mb-1 text-center">Holiday Show</h3>
                            <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest mb-1">Manage Dashboard</p>
                            <p className="text-xs text-blue-600 underline transition-all">View & Edit →</p>
                        </div>
                    </Link>
                </div>
            </div>
        </div>
    );
}
