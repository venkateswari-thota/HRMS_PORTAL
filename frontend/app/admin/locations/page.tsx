'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { apiRequest } from '@/lib/api';
import Link from 'next/link';
import {
    MapPin,
    ArrowLeft,
    Plus,
    Trash2,
    CheckCircle2,
    XCircle,
    Navigation,
    Locate,
    Radar,
    Search
} from 'lucide-react';

export default function AdminLocationsPage() {
    const router = useRouter();
    const [locations, setLocations] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const [formData, setFormData] = useState({
        name: '',
        latitude: '',
        longitude: '',
        radius: '100' // Default 100m
    });

    const fetchLocations = async () => {
        const token = localStorage.getItem('admin_token');
        if (!token) return;
        try {
            const data = await apiRequest('/admin/locations', 'GET', null, token);
            setLocations(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error('Failed to fetch locations:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLocations();
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setError('');
        setSuccess('');

        const token = localStorage.getItem('admin_token') || '';
        try {
            const payload = {
                name: formData.name,
                latitude: parseFloat(formData.latitude),
                longitude: parseFloat(formData.longitude),
                radius: parseFloat(formData.radius)
            };

            await apiRequest('/admin/locations', 'POST', payload, token);
            setSuccess('Location added successfully!');
            setFormData({ name: '', latitude: '', longitude: '', radius: '100' });
            fetchLocations();

            // Auto-dismiss success message after 3 seconds
            setTimeout(() => {
                setSuccess('');
            }, 3000);
        } catch (err: any) {
            setError(err.message || 'Failed to add location');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this location?')) return;

        const token = localStorage.getItem('admin_token') || '';
        try {
            await apiRequest(`/admin/locations/${id}`, 'DELETE', null, token);
            fetchLocations();
        } catch (err) {
            alert('Failed to delete location');
        }
    };

    const getCurrentLocation = () => {
        if (!navigator.geolocation) {
            alert('Geolocation is not supported by your browser');
            return;
        }
        navigator.geolocation.getCurrentPosition(
            (position) => {
                setFormData({
                    ...formData,
                    latitude: position.coords.latitude.toString(),
                    longitude: position.coords.longitude.toString()
                });
            },
            () => alert('Unable to retrieve your location')
        );
    };

    return (
        <div className="min-h-screen bg-slate-50 p-6 md:p-10 font-sans text-gray-900">
            <div className="max-w-6xl mx-auto space-y-10">
                {/* Header */}
                <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div className="space-y-2">
                        <Link
                            href="/admin/onboard"
                            className="inline-flex items-center gap-2 text-sm font-black text-blue-600 hover:gap-3 transition-all"
                        >
                            <ArrowLeft size={16} /> BACK TO COMMAND CENTER
                        </Link>
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-rose-600 rounded-2xl shadow-lg shadow-rose-200">
                                <MapPin className="text-white" size={28} />
                            </div>
                            <h1 className="text-4xl font-black bg-clip-text text-transparent bg-gradient-to-r from-rose-700 via-pink-700 to-red-700 tracking-tight">
                                Work Locations
                            </h1>
                        </div>
                        <p className="text-gray-500 font-medium ml-1">Manage authorized geofence zones for attendance</p>
                    </div>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                    {/* Add Form */}
                    <div className="lg:col-span-1 space-y-6">
                        <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-xl shadow-slate-200/50 space-y-6">
                            <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
                                <Plus className="text-rose-500" size={20} />
                                <h2 className="text-xl font-black text-gray-800">New Location</h2>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-5">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Location Name</label>
                                    <input
                                        type="text"
                                        name="name"
                                        required
                                        placeholder="e.g. Main Office, Warehouse A"
                                        className="w-full px-5 py-4 rounded-2xl bg-slate-50 border border-transparent focus:bg-white focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10 transition-all font-bold text-gray-800 outline-none"
                                        value={formData.name}
                                        onChange={handleChange}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Latitude</label>
                                        <input
                                            type="number"
                                            step="any"
                                            name="latitude"
                                            required
                                            placeholder="12.3456"
                                            className="w-full px-5 py-4 rounded-2xl bg-slate-50 border border-transparent focus:bg-white focus:border-rose-500 transition-all font-bold text-gray-800 outline-none"
                                            value={formData.latitude}
                                            onChange={handleChange}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Longitude</label>
                                        <input
                                            type="number"
                                            step="any"
                                            name="longitude"
                                            required
                                            placeholder="78.9012"
                                            className="w-full px-5 py-4 rounded-2xl bg-slate-50 border border-transparent focus:bg-white focus:border-rose-500 transition-all font-bold text-gray-800 outline-none"
                                            value={formData.longitude}
                                            onChange={handleChange}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Radius (meters)</label>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            name="radius"
                                            required
                                            className="w-full px-5 py-4 rounded-2xl bg-slate-50 border border-transparent focus:bg-white focus:border-rose-500 transition-all font-bold text-gray-800 outline-none pr-12"
                                            value={formData.radius}
                                            onChange={handleChange}
                                        />
                                        <Radar className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                                    </div>
                                </div>

                                <button
                                    type="button"
                                    onClick={getCurrentLocation}
                                    className="w-full flex items-center justify-center gap-2 py-3 text-xs font-black text-rose-600 border-2 border-dashed border-rose-200 rounded-2xl hover:bg-rose-50 hover:border-rose-300 transition-all active:scale-95"
                                >
                                    <Locate size={16} /> USE MY CURRENT LOCATION
                                </button>

                                {error && (
                                    <div className="p-4 bg-red-50 text-red-600 rounded-2xl flex items-center gap-3 border border-red-100 animate-shake">
                                        <XCircle size={18} className="shrink-0" />
                                        <p className="text-xs font-bold">{error}</p>
                                    </div>
                                )}

                                {success && (
                                    <div className="p-4 bg-green-50 text-green-600 rounded-2xl flex items-center gap-3 border border-green-100 animate-in fade-in zoom-in duration-300">
                                        <CheckCircle2 size={18} className="shrink-0" />
                                        <p className="text-xs font-bold">{success}</p>
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="w-full py-5 rounded-[1.5rem] bg-gradient-to-r from-rose-600 to-red-600 text-white font-black shadow-lg shadow-rose-200 hover:shadow-xl hover:-translate-y-1 transition-all disabled:opacity-50 disabled:translate-y-0"
                                >
                                    {submitting ? 'ADDING...' : 'ADD WORK LOCATION'}
                                </button>
                            </form>
                        </div>
                    </div>

                    {/* Locations List */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="flex items-center justify-between px-4">
                            <div className="flex items-center gap-3">
                                <Radar className="text-rose-500" size={20} />
                                <h2 className="text-xl font-black text-gray-800">Active Geofences</h2>
                            </div>
                            <span className="bg-slate-200 text-gray-600 px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase">
                                {locations.length} Zones Defined
                            </span>
                        </div>

                        {loading ? (
                            <div className="flex flex-col items-center justify-center py-20 animate-pulse space-y-4">
                                <div className="w-12 h-12 bg-slate-200 rounded-full"></div>
                                <div className="h-4 w-32 bg-slate-200 rounded"></div>
                            </div>
                        ) : locations.length === 0 ? (
                            <div className="bg-white rounded-[2.5rem] p-12 text-center border-2 border-dashed border-gray-100 space-y-4">
                                <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-300">
                                    <Search size={40} />
                                </div>
                                <div className="space-y-1">
                                    <h3 className="text-lg font-black text-gray-400">No Locations Found</h3>
                                    <p className="text-sm text-gray-400 font-medium">Add a new work location to start geofencing</p>
                                </div>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {locations.map((loc) => (
                                    <div key={loc.id} className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-xl transition-all group relative overflow-hidden">
                                        <div className="absolute top-0 right-0 p-4 text-rose-50 -z-0">
                                            <Radar size={80} />
                                        </div>

                                        <div className="relative z-10 space-y-6">
                                            <div className="flex justify-between items-start">
                                                <div className="space-y-1">
                                                    <h3 className="text-xl font-black text-gray-800">{loc.name}</h3>
                                                    <div className="flex items-center gap-2 text-rose-600 bg-rose-50 px-3 py-1 rounded-full w-fit">
                                                        <Navigation size={12} strokeWidth={3} />
                                                        <span className="text-[10px] font-black uppercase tracking-widest">{loc.radius}m Radius</span>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => handleDelete(loc.id)}
                                                    className="p-3 bg-slate-50 text-gray-400 hover:bg-red-50 hover:text-red-600 rounded-2xl transition-all active:scale-95"
                                                    title="Delete Location"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>

                                            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-50">
                                                <div>
                                                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Latitude</p>
                                                    <p className="font-bold text-gray-600 truncate">{loc.latitude.toFixed(6)}</p>
                                                </div>
                                                <div>
                                                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Longitude</p>
                                                    <p className="font-bold text-gray-600 truncate">{loc.longitude.toFixed(6)}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
