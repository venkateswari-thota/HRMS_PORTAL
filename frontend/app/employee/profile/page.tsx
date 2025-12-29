'use client';
import { useEffect, useState } from 'react';
import { apiRequest } from '@/lib/api';
import { User, Mail, Briefcase, MapPin, Clock, ShieldCheck, Database, Server } from 'lucide-react';

export default function EmployeeProfile() {
    const [profile, setProfile] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const token = localStorage.getItem('emp_token');
                if (!token) return;
                // Fetch from new /me/info endpoint
                const data = await apiRequest('/attendance/me/info', 'GET', null, token);
                setProfile(data);
            } catch (e) {
                console.error("Failed to load profile", e);
            } finally {
                setLoading(false);
            }
        };
        fetchProfile();
    }, []);

    if (loading) return (
        <div className="flex h-full items-center justify-center p-10">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
    );

    if (!profile) return <div className="p-8 text-center text-red-500">Failed to load profile data.</div>;

    return (
        <div className="max-w-4xl mx-auto space-y-6 animate-in slide-in-from-bottom-4 duration-500">
            {/* Header / Cover */}
            <div className="relative h-48 rounded-2xl overflow-hidden bg-gradient-to-r from-blue-600 to-indigo-700 shadow-lg">
                <div className="absolute inset-0 opacity-20  bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
                <div className="absolute bottom-6 left-8 flex items-end gap-6">
                    <div className="h-24 w-24 rounded-full bg-white p-1 shadow-xl">
                        <div className="h-full w-full rounded-full bg-gray-100 flex items-center justify-center text-gray-400">
                            <User size={48} />
                        </div>
                    </div>
                    <div className="mb-2 text-white">
                        <h1 className="text-3xl font-bold">{profile.name}</h1>
                        <p className="opacity-90 flex items-center gap-2 text-sm"><Briefcase size={14} /> Employee ID: {profile.emp_id}</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Personal Info Card */}
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                        <User className="text-blue-500" size={20} /> Personal Information
                    </h3>
                    <div className="space-y-4">
                        <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                            <div className="p-2 bg-blue-100 text-blue-600 rounded-full"><Mail size={18} /></div>
                            <div>
                                <p className="text-xs text-gray-500 uppercase font-semibold">Official Email</p>
                                <p className="text-gray-900 font-medium">{profile.email}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                            <div className="p-2 bg-indigo-100 text-indigo-600 rounded-full"><Mail size={18} /></div>
                            <div>
                                <p className="text-xs text-gray-500 uppercase font-semibold">Personal Email</p>
                                <p className="text-gray-900 font-medium">{profile.personal_email}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Work Rules Card */}
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                        <Clock className="text-orange-500" size={20} /> Shift Configuration
                    </h3>
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-4 bg-orange-50 rounded-xl border border-orange-100 text-center">
                                <p className="text-xs text-orange-600 font-bold uppercase mb-1">Standard In</p>
                                <p className="text-xl font-mono font-bold text-gray-800">{profile.std_check_in}</p>
                            </div>
                            <div className="p-4 bg-purple-50 rounded-xl border border-purple-100 text-center">
                                <p className="text-xs text-purple-600 font-bold uppercase mb-1">Standard Out</p>
                                <p className="text-xl font-mono font-bold text-gray-800">{profile.std_check_out}</p>
                            </div>
                        </div>
                        <div className="p-3 bg-gray-50 rounded-lg text-sm text-gray-600 flex items-center gap-2">
                            <ShieldCheck size={16} className="text-green-500" />
                            Standard Shift Policy Active
                        </div>
                    </div>
                </div>

                {/* Geo Setup Card */}
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow md:col-span-2">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                        <MapPin className="text-green-500" size={20} /> Geographical Setup Area
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="md:col-span-2 h-48 bg-gray-100 rounded-xl overflow-hidden relative border border-gray-200 flex items-center justify-center">
                            {/* Visual Placeholder for a Map */}
                            <div className="absolute inset-0 bg-[url('https://upload.wikimedia.org/wikipedia/commons/e/ec/World_map_blank_without_borders.svg')] bg-cover opacity-20"></div>
                            <div className="z-10 text-center">
                                <div className="inline-block p-3 bg-white rounded-full shadow-lg mb-2 text-green-600 animate-bounce">
                                    <MapPin size={24} fill="currentColor" />
                                </div>
                                <p className="text-sm font-semibold text-gray-600">Work Location Locked</p>
                                <p className="text-xs text-gray-500">{profile.work_lat.toFixed(4)}, {profile.work_lng.toFixed(4)}</p>
                            </div>
                        </div>
                        <div className="space-y-4 flex flex-col justify-center">
                            <div className="bg-green-50 p-4 rounded-lg border border-green-100">
                                <p className="text-sm text-gray-500 mb-1">Geofence Radius</p>
                                <p className="text-2xl font-bold text-green-700">{profile.geofence_radius} Meters</p>
                                <p className="text-xs text-green-600 mt-1">Allowed range for Check-in</p>
                            </div>
                            <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                                <p className="text-sm text-gray-500 mb-1">Biometric Data</p>
                                <p className="text-lg font-bold text-blue-700">Enrolled ✅</p>
                                <p className="text-xs text-blue-600 mt-1">Face data synced with Cloud</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="text-center pt-8 pb-4 text-gray-400 text-sm">
                <p>Secure Employee Data | Pragyatmika HRMS</p>
            </div>
        </div>
    );
}
