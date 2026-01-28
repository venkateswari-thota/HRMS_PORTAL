'use client';
import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { X, Save, Mail, MapPin, Shield, Clock, AlertCircle } from 'lucide-react';
import { apiRequest } from '@/lib/api';

const MapPicker = dynamic(() => import('./MapPicker'), { ssr: false, loading: () => <p className="text-gray-400 animate-pulse">Loading Map...</p> });

interface EmployeeEditModalProps {
    employee: any;
    onClose: () => void;
    onSuccess: () => void;
}

export default function EmployeeEditModal({ employee, onClose, onSuccess }: EmployeeEditModalProps) {
    const [formData, setFormData] = useState({
        emp_id: employee.emp_id,
        personal_email: employee.personal_email,
        work_lat: employee.work_location.lat,
        work_lng: employee.work_location.lng,
        geofence_radius: employee.geofence_radius,
        std_check_in: employee.std_check_in,
        std_check_out: employee.std_check_out,
    });

    const [loading, setLoading] = useState(false);
    const [emailError, setEmailError] = useState('');

    const validateEmail = (email: string) => {
        if (!email.toLowerCase().endsWith('@gmail.com')) {
            setEmailError('enter the valid mail');
            return false;
        }
        setEmailError('');
        return true;
    };

    const handleSave = async () => {
        if (!validateEmail(formData.personal_email)) return;

        setLoading(true);
        try {
            const token = localStorage.getItem('admin_token') || '';
            await apiRequest('/admin/employee/update', 'POST', formData, token);
            alert('✅ Employee updated successfully');
            onSuccess();
            onClose();
        } catch (e: any) {
            alert('❌ Update failed: ' + (e.message || 'Unknown error'));
        } finally {
            setLoading(false);
        }
    };

    const inputClass = "w-full px-4 py-3 rounded-lg bg-gray-50 border border-gray-200 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all outline-none text-gray-900";

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gradient-to-r from-purple-50 to-white">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-purple-600 text-white rounded-xl">
                            <Shield size={20} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-800">Surgical Edit: {employee.name}</h2>
                            <p className="text-xs text-gray-500 font-mono">{employee.emp_id} • {employee.email}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-red-50 hover:text-red-500 rounded-full transition-all">
                        <X size={24} />
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Left Column: Details */}
                        <div className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                                    <Mail size={14} className="text-purple-500" />
                                    Personal Email
                                </label>
                                <input
                                    className={`${inputClass} ${emailError ? 'border-red-500 bg-red-50' : ''}`}
                                    value={formData.personal_email}
                                    onChange={(e) => {
                                        setFormData({ ...formData, personal_email: e.target.value });
                                        validateEmail(e.target.value);
                                    }}
                                />
                                {emailError && (
                                    <p className="text-xs text-red-500 flex items-center gap-1 mt-1 font-medium italic">
                                        <AlertCircle size={12} /> {emailError}
                                    </p>
                                )}
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                                        <Clock size={14} className="text-blue-500" />
                                        Shift Start
                                    </label>
                                    <input
                                        type="time"
                                        className={inputClass}
                                        value={formData.std_check_in}
                                        onChange={(e) => setFormData({ ...formData, std_check_in: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                                        <Clock size={14} className="text-blue-500" />
                                        Shift End
                                    </label>
                                    <input
                                        type="time"
                                        className={inputClass}
                                        value={formData.std_check_out}
                                        onChange={(e) => setFormData({ ...formData, std_check_out: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                                    <Shield size={14} className="text-orange-500" />
                                    Geofence Radius (Meters)
                                </label>
                                <input
                                    type="number"
                                    className={inputClass}
                                    value={formData.geofence_radius}
                                    onChange={(e) => setFormData({ ...formData, geofence_radius: parseFloat(e.target.value) })}
                                />
                            </div>
                        </div>

                        {/* Right Column: Map Selection */}
                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                                    <MapPin size={14} className="text-green-500" />
                                    Work Location
                                </label>
                                <div className="text-[10px] font-mono text-blue-600 bg-blue-50 px-2 py-1 rounded">
                                    {formData.work_lat.toFixed(5)}, {formData.work_lng.toFixed(5)}
                                </div>
                            </div>
                            <div className="h-64 rounded-2xl border-2 border-gray-100 overflow-hidden shadow-inner">
                                <MapPicker
                                    onSelect={(lat, lng) => setFormData({ ...formData, work_lat: lat, work_lng: lng })}
                                    lat={formData.work_lat}
                                    lng={formData.work_lng}
                                />
                            </div>
                            <p className="text-[10px] text-gray-400 italic text-center">Click on the map to surgically change coordinates</p>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-6 py-2.5 rounded-xl text-gray-500 font-bold hover:bg-gray-200 transition-all text-sm italic"
                    >
                        Keep Existed Data (Cancel)
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={loading || !!emailError}
                        className="px-8 py-2.5 rounded-xl bg-purple-600 text-white font-bold shadow-lg shadow-purple-200 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm flex items-center gap-2"
                    >
                        {loading ? 'Surgical Save...' : <><Save size={18} /> Update Record</>}
                    </button>
                </div>
            </div>
        </div>
    );
}
