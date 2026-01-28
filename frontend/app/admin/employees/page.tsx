'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiRequest } from '@/lib/api';
import EmployeeRegisterForm from '@/components/admin/EmployeeRegisterForm';
import EmployeeEditModal from '@/components/admin/EmployeeEditModal';
import { Users, Mail, MapPin, Shield, ArrowLeft, Clock, Edit2 } from 'lucide-react';
import Link from 'next/link';

export default function AdminEmployeesPage() {
    const router = useRouter();
    const [employees, setEmployees] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingEmployee, setEditingEmployee] = useState<any>(null);

    const fetchEmployees = async () => {
        try {
            const token = localStorage.getItem('admin_token') || '';
            const data = await apiRequest('/admin/employees', 'GET', null, token);
            setEmployees(data);
        } catch (e) {
            console.error('Failed to fetch employees:', e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const token = localStorage.getItem('admin_token');
        if (!token) {
            router.push('/auth/admin/signin');
            return;
        }
        fetchEmployees();
    }, [router]);

    return (
        <div className="min-h-screen p-6 md:p-10 bg-slate-50 text-gray-900">
            {editingEmployee && (
                <EmployeeEditModal
                    employee={editingEmployee}
                    onClose={() => setEditingEmployee(null)}
                    onSuccess={fetchEmployees}
                />
            )}

            <header className="mb-10 flex justify-between items-center border-b border-gray-200 pb-6">
                <div className="flex items-center gap-4">
                    <Link href="/admin/onboard" className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500">
                        <ArrowLeft size={24} />
                    </Link>
                    <div>
                        <h1 className="text-4xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-indigo-600">
                            Workforce Management
                        </h1>
                        <p className="text-gray-500 mt-2">Register and Manage Employee Profiles</p>
                    </div>
                </div>
            </header>

            <div className="max-w-7xl mx-auto space-y-12">
                {/* Top Section: Registration Form */}
                <section className="animate-in fade-in slide-in-from-top-4 duration-500">
                    <div className="max-w-4xl mx-auto">
                        <EmployeeRegisterForm onSuccess={fetchEmployees} />
                    </div>
                </section>

                {/* Bottom Section: Existed Employees Directory */}
                <section className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <div className="flex items-center gap-3 mb-6">
                        <Users className="text-purple-600" size={24} />
                        <h2 className="text-2xl font-bold text-gray-800">Employee Directory</h2>
                        <span className="bg-purple-100 text-purple-700 text-xs font-bold px-2.5 py-1 rounded-full border border-purple-200 uppercase">
                            {employees.length} Records
                        </span>
                    </div>

                    {loading ? (
                        <div className="flex justify-center p-20">
                            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                            {employees.map((emp) => (
                                <div key={emp.emp_id} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all hover:border-purple-200 group relative flex flex-col h-[280px]">
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="p-1.5 bg-purple-50 text-purple-600 rounded-lg group-hover:bg-purple-500 group-hover:text-white transition-colors">
                                            <Users size={16} />
                                        </div>
                                        <span className="text-[10px] font-bold text-gray-400 bg-gray-50 px-1.5 py-0.5 rounded border border-gray-100 uppercase tracking-tighter">
                                            {emp.emp_id}
                                        </span>
                                    </div>

                                    <h3 className="font-bold text-[14px] text-gray-800 mb-1 truncate leading-tight" title={emp.name}>{emp.name}</h3>

                                    <div className="space-y-2.5 mt-2 flex-1">
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2 text-[10px] text-gray-500 overflow-hidden">
                                                <Mail size={12} className="flex-shrink-0 text-blue-400" />
                                                <span className="truncate font-medium" title={emp.email}>{emp.email}</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-[10px] text-gray-500 overflow-hidden">
                                                <Mail size={12} className="flex-shrink-0 text-indigo-400" />
                                                <span className="truncate font-medium" title={emp.personal_email}>{emp.personal_email}</span>
                                            </div>
                                        </div>

                                        <div className="pt-2.5 border-t border-gray-50 space-y-2">
                                            <div className="flex items-center justify-between text-[10px]">
                                                <div className="flex items-center gap-1.5 text-gray-400">
                                                    <MapPin size={11} className="text-green-500" />
                                                    <span>Location</span>
                                                </div>
                                                <span className="font-mono text-gray-600 bg-gray-50 px-1 rounded">{emp.work_location.lat.toFixed(3)}, {emp.work_location.lng.toFixed(3)}</span>
                                            </div>
                                            <div className="flex items-center justify-between text-[10px]">
                                                <div className="flex items-center gap-1.5 text-gray-400">
                                                    <Shield size={11} className="text-orange-500" />
                                                    <span>Radius</span>
                                                </div>
                                                <span className="font-bold text-gray-700 bg-orange-50 px-1.5 rounded text-orange-700">{emp.geofence_radius}m</span>
                                            </div>
                                            <div className="flex items-center justify-between text-[10px]">
                                                <div className="flex items-center gap-1.5 text-gray-400">
                                                    <Clock size={11} className="text-blue-500" />
                                                    <span>Shift</span>
                                                </div>
                                                <span className="font-bold text-gray-600">{emp.std_check_in} - {emp.std_check_out}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-3 pt-2 text-center border-t border-gray-100 flex justify-between items-center">
                                        <p className="text-[9px] text-gray-400 uppercase font-bold">Face Samples: {emp.image_count}</p>
                                        <button
                                            onClick={() => setEditingEmployee(emp)}
                                            className="p-1.5 opacity-0 group-hover:opacity-100 bg-gray-50 hover:bg-indigo-50 text-gray-400 hover:text-indigo-600 rounded-lg transition-all border border-gray-100 hover:border-indigo-200"
                                            title="Edit Profile"
                                        >
                                            <Edit2 size={12} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </section>
            </div>
        </div>
    );
}
