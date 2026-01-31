'use client';
import { useEffect, useState } from 'react';
import { apiRequest } from '@/lib/api';
import { User, Mail, Briefcase, MapPin, Clock, ShieldCheck, Database, Server, XCircle, Phone, Save, Edit3, AlertCircle } from 'lucide-react';

export default function EmployeeProfile() {
    const [profile, setProfile] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    // Edit states
    const [isEditing, setIsEditing] = useState(false);
    const [editData, setEditData] = useState({
        personal_email: '',
        primary_phone: '',
        secondary_phone: '',
        emergency_phone: ''
    });
    const [emailError, setEmailError] = useState('');
    const [updating, setUpdating] = useState(false);
    const [fieldErrors, setFieldErrors] = useState<{ [key: string]: string }>({});

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const token = localStorage.getItem('emp_token');
                if (!token) return;
                const data = await apiRequest('/attendance/me/info', 'GET', null, token);
                setProfile(data);
                setEditData({
                    personal_email: data.personal_email || '',
                    primary_phone: data.primary_phone || '',
                    secondary_phone: data.secondary_phone || '',
                    emergency_phone: data.emergency_phone || ''
                });
            } catch (e) {
                console.error("Failed to load profile", e);
            } finally {
                setLoading(false);
            }
        };
        fetchProfile();
    }, []);

    const validateEmail = (email: string) => {
        if (!email.toLowerCase().endsWith('@gmail.com')) {
            setEmailError('enter the valid mail');
            return false;
        }
        setEmailError('');
        return true;
    };

    const validatePhone = (phone: string) => /^[0-9]{10}$/.test(phone.replace(/[\s\-]/g, ''));

    const handleSaveProfile = async () => {
        if (!validateEmail(editData.personal_email)) return;

        // Validate phone numbers
        const errors: { [key: string]: string } = {};
        if (!validatePhone(editData.primary_phone)) {
            errors.primary_phone = 'Primary phone must be exactly 10 digits';
        }
        if (editData.secondary_phone && !validatePhone(editData.secondary_phone)) {
            errors.secondary_phone = 'Secondary phone must be exactly 10 digits';
        }
        if (!validatePhone(editData.emergency_phone)) {
            errors.emergency_phone = 'Emergency phone must be exactly 10 digits';
        }

        if (Object.keys(errors).length > 0) {
            setFieldErrors(errors);
            return;
        }
        setFieldErrors({});

        setUpdating(true);
        try {
            const token = localStorage.getItem('emp_token');
            await apiRequest('/attendance/me/update-profile', 'POST', editData, token!);
            setProfile({
                ...profile,
                personal_email: editData.personal_email,
                primary_phone: editData.primary_phone,
                secondary_phone: editData.secondary_phone,
                emergency_phone: editData.emergency_phone
            });
            setIsEditing(false);
        } catch (e: any) {
            setEmailError(e.message || 'Failed to update profile');
        } finally {
            setUpdating(false);
        }
    };

    if (loading) return (
        <div className="flex h-full items-center justify-center p-10">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
    );

    if (!profile) return <div className="p-8 text-center text-red-500">Failed to load profile data.</div>;

    const infoItemClass = "relative group p-3 bg-gray-50 rounded-lg flex items-center gap-4 transition-all hover:bg-white hover:shadow-sm border border-transparent hover:border-gray-100";

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
                <div className="absolute top-6 right-8">
                    {!isEditing ? (
                        <button
                            onClick={() => setIsEditing(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 backdrop-blur-md text-white rounded-lg transition-all font-bold text-sm border border-white/30"
                        >
                            <Edit3 size={16} /> Edit Profile
                        </button>
                    ) : (
                        <div className="flex gap-2">
                            <button
                                onClick={handleSaveProfile}
                                disabled={updating || !!emailError}
                                className="flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-all font-bold text-sm shadow-lg disabled:opacity-50"
                            >
                                {updating ? 'Saving...' : <><Save size={16} /> Save Changes</>}
                            </button>
                            <button
                                onClick={() => {
                                    setIsEditing(false);
                                    setEditData({
                                        personal_email: profile.personal_email,
                                        primary_phone: profile.primary_phone,
                                        secondary_phone: profile.secondary_phone,
                                        emergency_phone: profile.emergency_phone
                                    });
                                }}
                                className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-all font-bold text-sm border border-white/20"
                            >
                                <XCircle size={16} /> Cancel
                            </button>
                        </div>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Personal Info Card */}
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                        <User className="text-blue-500" size={20} /> Contact Information
                    </h3>
                    <div className="space-y-4">
                        <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                            <div className="p-2 bg-blue-100 text-blue-600 rounded-full"><Mail size={18} /></div>
                            <div>
                                <p className="text-xs text-gray-500 uppercase font-semibold">Official Email</p>
                                <p className="text-gray-900 font-medium">{profile.email}</p>
                            </div>
                        </div>

                        {/* Personal Email */}
                        <div className={infoItemClass}>
                            <div className="p-2 bg-indigo-100 text-indigo-600 rounded-full"><Mail size={18} /></div>
                            <div className="flex-1">
                                <p className="text-xs text-gray-500 uppercase font-semibold">Personal Email</p>
                                {isEditing ? (
                                    <div className="mt-1">
                                        <input
                                            type="email"
                                            className={`w-full text-sm p-1.5 bg-white border ${emailError ? 'border-red-500' : 'border-gray-200'} rounded outline-none focus:ring-2 focus:ring-indigo-100`}
                                            value={editData.personal_email}
                                            onChange={e => {
                                                setEditData({ ...editData, personal_email: e.target.value });
                                                validateEmail(e.target.value);
                                            }}
                                        />
                                        {emailError && <p className="text-[10px] text-red-500 mt-1 font-medium">{emailError}</p>}
                                    </div>
                                ) : (
                                    <p className="text-gray-900 font-medium">{profile.personal_email}</p>
                                )}
                            </div>
                        </div>

                        {/* Phone Numbers */}
                        <div className={infoItemClass}>
                            <div className="p-2 bg-green-100 text-green-600 rounded-full"><Phone size={18} /></div>
                            <div className="flex-1">
                                <p className="text-xs text-gray-500 uppercase font-semibold">Primary Phone</p>
                                {isEditing ? (
                                    <div className="flex-1">
                                        <input
                                            type="text"
                                            className={`w-full mt-1 text-sm p-1.5 bg-white border ${fieldErrors.primary_phone ? 'border-red-500 ring-2 ring-red-100' : 'border-gray-200'} rounded outline-none focus:ring-2 focus:ring-indigo-100`}
                                            value={editData.primary_phone}
                                            onChange={e => {
                                                setEditData({ ...editData, primary_phone: e.target.value });
                                                if (fieldErrors.primary_phone) setFieldErrors(prev => ({ ...prev, primary_phone: '' }));
                                            }}
                                        />
                                        {fieldErrors.primary_phone && <p className="text-[10px] text-red-500 mt-1 font-medium">{fieldErrors.primary_phone}</p>}
                                    </div>
                                ) : (
                                    <p className="text-gray-900 font-medium">{profile.primary_phone}</p>
                                )}
                            </div>
                        </div>

                        <div className={infoItemClass}>
                            <div className="p-2 bg-gray-100 text-gray-600 rounded-full"><Phone size={18} /></div>
                            <div className="flex-1">
                                <p className="text-xs text-gray-500 uppercase font-semibold">Secondary Phone</p>
                                {isEditing ? (
                                    <div className="flex-1">
                                        <input
                                            type="text"
                                            className={`w-full mt-1 text-sm p-1.5 bg-white border ${fieldErrors.secondary_phone ? 'border-red-500 ring-2 ring-red-100' : 'border-gray-200'} rounded outline-none focus:ring-2 focus:ring-indigo-100`}
                                            value={editData.secondary_phone}
                                            onChange={e => {
                                                setEditData({ ...editData, secondary_phone: e.target.value });
                                                if (fieldErrors.secondary_phone) setFieldErrors(prev => ({ ...prev, secondary_phone: '' }));
                                            }}
                                            placeholder="Optional"
                                        />
                                        {fieldErrors.secondary_phone && <p className="text-[10px] text-red-500 mt-1 font-medium">{fieldErrors.secondary_phone}</p>}
                                    </div>
                                ) : (
                                    <p className="text-gray-900 font-medium">{profile.secondary_phone || 'Not Provided'}</p>
                                )}
                            </div>
                        </div>

                        <div className={infoItemClass}>
                            <div className="p-2 bg-red-100 text-red-600 rounded-full"><AlertCircle size={18} /></div>
                            <div className="flex-1">
                                <p className="text-xs text-gray-500 uppercase font-semibold">Emergency Contact</p>
                                {isEditing ? (
                                    <div className="flex-1">
                                        <input
                                            type="text"
                                            className={`w-full mt-1 text-sm p-1.5 bg-white border ${fieldErrors.emergency_phone ? 'border-red-500 ring-2 ring-red-100' : 'border-gray-200'} rounded outline-none focus:ring-2 focus:ring-indigo-100`}
                                            value={editData.emergency_phone}
                                            onChange={e => {
                                                setEditData({ ...editData, emergency_phone: e.target.value });
                                                if (fieldErrors.emergency_phone) setFieldErrors(prev => ({ ...prev, emergency_phone: '' }));
                                            }}
                                        />
                                        {fieldErrors.emergency_phone && <p className="text-[10px] text-red-500 mt-1 font-medium">{fieldErrors.emergency_phone}</p>}
                                    </div>
                                ) : (
                                    <p className="text-gray-900 font-medium">{profile.emergency_phone}</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Shif & Location Summary */}
                <div className="space-y-6">
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

                    {/* Geo Location Card */}
                    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                            <MapPin className="text-rose-500" size={20} /> Assigned Work Location
                        </h3>
                        <div className="bg-rose-50 p-4 rounded-xl border border-rose-100 mb-4">
                            <div className="flex justify-between items-start mb-2">
                                <div>
                                    <p className="text-xs text-rose-600 font-bold uppercase">Work Zone</p>
                                    <p className="text-lg font-bold text-gray-900">{profile.work_location || 'Not Assigned'}</p>
                                </div>
                                <div className="p-2 bg-white rounded-lg shadow-sm">
                                    <MapPin className="text-rose-500" size={20} />
                                </div>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-gray-500 font-mono">
                                <Database size={12} /> {profile.work_lat.toFixed(4)}, {profile.work_lng.toFixed(4)}
                            </div>
                        </div>
                        <div className="flex gap-4">
                            <div className="flex-1 bg-blue-50 p-3 rounded-lg border border-blue-100 text-center">
                                <p className="text-[10px] text-blue-600 font-bold uppercase">Radius</p>
                                <p className="text-md font-bold text-gray-800">{profile.geofence_radius}m</p>
                            </div>
                            <div className="flex-1 bg-green-50 p-3 rounded-lg border border-green-100 text-center">
                                <p className="text-[10px] text-green-600 font-bold uppercase">Status</p>
                                <p className="text-md font-bold text-gray-800">Verified</p>
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
