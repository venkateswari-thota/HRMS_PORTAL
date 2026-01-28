'use client';
import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { X, Shield, MapPin, Clock, Mail, AlertCircle, Edit2 } from 'lucide-react';
import { apiRequest } from '@/lib/api';

const MapPicker = dynamic(() => import('./MapPicker'), { ssr: false, loading: () => <p className="text-white/50 animate-pulse">Loading Map Interface...</p> });

interface EmployeeEditModalProps {
    employee: any;
    onClose: () => void;
    onSuccess: () => void;
}

export default function EmployeeEditModal({ employee, onClose, onSuccess }: EmployeeEditModalProps) {
    const [formData, setFormData] = useState({
        emp_id: employee.emp_id,
        personal_email: employee.personal_email || '',
        work_lat: employee.work_location?.lat || 0,
        work_lng: employee.work_location?.lng || 0,
        geofence_radius: employee.geofence_radius || 100,
        std_check_in: employee.std_check_in || '09:00',
        std_check_out: employee.std_check_out || '18:00',
    });

    const [emailError, setEmailError] = useState('');
    const [updating, setUpdating] = useState(false);

    // Manual Coordinate Settings
    const [isEditingLocation, setIsEditingLocation] = useState(false);
    const [tempLat, setTempLat] = useState(employee.work_location?.lat || 0);
    const [tempLng, setTempLng] = useState(employee.work_location?.lng || 0);

    const handleSaveLocation = () => {
        setFormData(prev => ({ ...prev, work_lat: tempLat, work_lng: tempLng }));
        setIsEditingLocation(false);
    };

    const validateEmail = (email: string) => {
        if (!email.toLowerCase().endsWith('@gmail.com')) {
            setEmailError('enter the valid mail');
            return false;
        }
        setEmailError('');
        return true;
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateEmail(formData.personal_email)) return;

        setUpdating(true);
        try {
            const token = localStorage.getItem('admin_token') || '';
            await apiRequest('/admin/employee/update', 'POST', formData, token);
            alert('✅ Employee updated successfully!');
            onSuccess();
            onClose();
        } catch (err: any) {
            alert('❌ Update failed: ' + err.message);
        } finally {
            setUpdating(false);
        }
    };

    const inputClass = "w-full px-4 py-2.5 rounded-lg bg-gray-50 border border-gray-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all outline-none text-gray-900 text-sm";

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[95vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-300">
                {/* Header */}
                <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gradient-to-r from-indigo-50 to-white">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
                            <Shield className="text-indigo-600" />
                            Edit Employee Record
                        </h2>
                        <p className="text-xs text-gray-500 mt-1 uppercase tracking-wider font-semibold">
                            Surgical Profile Modification • <span className="text-indigo-600 font-mono">{employee.emp_id}</span>
                        </p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400 hover:text-red-500">
                        <X size={24} />
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-10 space-y-8">
                    <form id="edit-form" onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Summary Details (ReadOnly) */}
                        <div className="col-span-2 grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-xl border border-gray-100 opacity-70">
                            <div>
                                <label className="text-[10px] font-bold text-gray-400 uppercase">Employee ID</label>
                                <p className="text-sm font-mono font-bold text-gray-700">{employee.emp_id}</p>
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-gray-400 uppercase">Official Email</label>
                                <p className="text-sm font-medium text-gray-700">{employee.email}</p>
                            </div>
                        </div>

                        {/* Personal Email */}
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wide flex items-center gap-2">
                                <Mail size={14} className="text-indigo-400" />
                                Personal Email
                            </label>
                            <input
                                className={`${inputClass} ${emailError ? 'border-red-500 bg-red-50 focus:border-red-500 focus:ring-red-500' : ''}`}
                                type="email"
                                value={formData.personal_email}
                                onChange={(e) => {
                                    setFormData({ ...formData, personal_email: e.target.value });
                                    if (emailError) validateEmail(e.target.value);
                                }}
                                onBlur={(e) => validateEmail(e.target.value)}
                            />
                            {emailError && (
                                <p className="text-[11px] text-red-500 font-medium flex items-center gap-1 mt-1">
                                    <AlertCircle size={10} /> {emailError}
                                </p>
                            )}
                        </div>

                        {/* Geofence Radius */}
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wide flex items-center gap-2">
                                <Shield size={14} className="text-orange-400" />
                                Geofence Radius (Meters)
                            </label>
                            <input
                                type="number"
                                className={inputClass}
                                value={formData.geofence_radius}
                                onChange={(e) => setFormData({ ...formData, geofence_radius: parseFloat(e.target.value) })}
                            />
                        </div>

                        {/* Map Location Section */}
                        <div className="col-span-2 space-y-3">
                            <div className="flex justify-between items-end">
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-wide flex items-center gap-2">
                                    <MapPin size={14} className="text-green-500" />
                                    Work Location (Precise)
                                </label>
                                <div className="relative group min-w-[200px] flex justify-end">
                                    {!isEditingLocation ? (
                                        <div className="flex items-center gap-2 text-[10px] text-indigo-600 font-mono bg-indigo-50 px-3 py-1.5 rounded border border-indigo-100 shadow-sm transition-all group-hover:pr-10">
                                            <span>{formData.work_lat.toFixed(5)}, {formData.work_lng.toFixed(5)}</span>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setIsEditingLocation(true);
                                                    setTempLat(formData.work_lat);
                                                    setTempLng(formData.work_lng);
                                                }}
                                                className="absolute right-1 opacity-0 group-hover:opacity-100 p-1 text-indigo-400 hover:text-indigo-600 hover:bg-white rounded transition-all"
                                                title="Edit Coordinates"
                                            >
                                                <Edit2 size={12} />
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-2 bg-white border border-indigo-300 p-1 rounded shadow-lg animate-in fade-in zoom-in-95 duration-200">
                                            <input
                                                type="number"
                                                step="0.00001"
                                                className="w-24 px-1.5 py-1 text-[10px] border rounded focus:ring-1 focus:ring-indigo-500 outline-none"
                                                value={tempLat}
                                                onChange={e => setTempLat(parseFloat(e.target.value) || 0)}
                                                placeholder="Lat"
                                            />
                                            <input
                                                type="number"
                                                step="0.00001"
                                                className="w-24 px-1.5 py-1 text-[10px] border rounded focus:ring-1 focus:ring-indigo-500 outline-none"
                                                value={tempLng}
                                                onChange={e => setTempLng(parseFloat(e.target.value) || 0)}
                                                placeholder="Lng"
                                            />
                                            <div className="flex gap-1 border-l pl-1 ml-1">
                                                <button
                                                    type="button"
                                                    onClick={handleSaveLocation}
                                                    className="p-1 text-green-600 hover:bg-green-50 rounded"
                                                    title="Apply Coordinates"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setIsEditingLocation(false)}
                                                    className="p-1 text-red-600 hover:bg-red-50 rounded"
                                                    title="Cancel"
                                                >
                                                    <X size={12} />
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="h-64 rounded-xl overflow-hidden border border-gray-200 shadow-inner">
                                <MapPicker
                                    onSelect={(lat, lng) => setFormData({ ...formData, work_lat: lat, work_lng: lng })}
                                    lat={formData.work_lat}
                                    lng={formData.work_lng}
                                />
                            </div>
                        </div>

                        {/* Shift Hours */}
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wide flex items-center gap-2">
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
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wide flex items-center gap-2">
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
                    </form>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-6 py-2.5 rounded-xl border border-gray-300 text-gray-600 font-bold text-sm hover:bg-white transition-all shadow-sm"
                    >
                        Cancel Modification
                    </button>
                    <button
                        form="edit-form"
                        disabled={updating || !!emailError}
                        type="submit"
                        className="px-8 py-2.5 rounded-xl bg-indigo-600 text-white font-bold text-sm hover:bg-indigo-700 transition-all shadow-lg active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {updating ? '⏳ Updating...' : '✨ Save Changes'}
                    </button>
                </div>
            </div>
        </div>
    );
}
