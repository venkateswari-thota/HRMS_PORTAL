'use client';
import { useState } from 'react';
import dynamic from 'next/dynamic';
import { apiRequest } from '@/lib/api';

const MapPicker = dynamic(() => import('./MapPicker'), { ssr: false, loading: () => <p className="text-white/50 animate-pulse">Loading Map Interface...</p> });

export default function EmployeeRegisterForm() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    personal_email: '', // NEW
    work_lat: 0,
    work_lng: 0,
    geofence_radius: 100,
    std_check_in: '09:00',
    std_check_out: '18:00',
    face_photos: [] as string[]
  });
  const [loading, setLoading] = useState(false);

  const handleLocationSelect = (lat: number, lng: number) => {
    setFormData(prev => ({ ...prev, work_lat: lat, work_lng: lng }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        ...formData,
        face_photos: formData.face_photos.length > 0 ? formData.face_photos : ["/dummy-face.jpg"]
      };
      const res = await apiRequest('/admin/employee/register', 'POST', payload, localStorage.getItem('admin_token') || '');
      alert(`Employee Registered Successfully!\n\nID: ${res.emp_id}\nTemp Password: ${res.temp_password}\n\nPlease share these credentials securely.`);
      // Reset form or redirect
    } catch (err: any) {
      alert("Registration Failed: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-panel p-6 border border-white/10 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-purple-500"></div>
      <h2 className="text-xl font-bold mb-6 text-white flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-blue-500"></span>
        Register New Employee
      </h2>
      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="space-y-1">
          <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">Full Name</label>
          <input
            className="auth-input focus:ring-2 ring-blue-500/50"
            placeholder="e.g. John Doe"
            value={formData.name}
            onChange={e => setFormData({ ...formData, name: e.target.value })}
            required
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">Org Email</label>
          <input
            className="auth-input focus:ring-2 ring-blue-500/50"
            placeholder="john@company.com"
            type="email"
            value={formData.email}
            onChange={e => setFormData({ ...formData, email: e.target.value })}
            required
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">Personal Email</label>
          <input
            className="auth-input focus:ring-2 ring-purple-500/50"
            placeholder="john.doe@gmail.com"
            type="email"
            value={formData.personal_email}
            onChange={e => setFormData({ ...formData, personal_email: e.target.value })}
            required
          />
        </div>

        <div className="col-span-2 space-y-2">
          <div className="flex justify-between items-end">
            <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">Work Location (Geo-fencing)</label>
            <span className="text-xs text-blue-300 font-mono bg-blue-900/30 px-2 py-1 rounded">
              {formData.work_lat.toFixed(5)}, {formData.work_lng.toFixed(5)}
            </span>
          </div>
          <div className="h-72 rounded-xl overflow-hidden border-2 border-white/5 shadow-inner">
            <MapPicker onSelect={handleLocationSelect} />
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">Geofence Radius (Meters)</label>
          <input
            type="number"
            className="auth-input"
            value={formData.geofence_radius}
            onChange={e => setFormData({ ...formData, geofence_radius: parseFloat(e.target.value) })}
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">Face Data (3-5 Photos)</label>
          <input
            type="file"
            multiple
            accept="image/*"
            className="block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700"
            onChange={async (e) => {
              if (!e.target.files) return;
              const files = Array.from(e.target.files);
              const urls: string[] = [];

              // Upload each file
              for (const file of files) {
                const fd = new FormData();
                fd.append('file', file);
                try {
                  const res = await apiRequest('/upload/image', 'POST', fd, localStorage.getItem('admin_token') || '', true); // True for multipart
                  urls.push(res.url);
                } catch (err) {
                  console.error("Upload failed", err);
                }
              }
              setFormData(prev => ({ ...prev, face_photos: [...prev.face_photos, ...urls] }));
              alert(`Uploaded ${urls.length} photos successfully.`);
            }}
          />
          <div className="flex gap-2 mt-2">
            {formData.face_photos.map((src, i) => (
              <img key={i} src={`http://localhost:8000${src}`} className="w-10 h-10 rounded border border-white/20 object-cover" />
            ))}
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">Shift Start</label>
          <input type="time" className="auth-input" value={formData.std_check_in} onChange={e => setFormData({ ...formData, std_check_in: e.target.value })} />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">Shift End</label>
          <input type="time" className="auth-input" value={formData.std_check_out} onChange={e => setFormData({ ...formData, std_check_out: e.target.value })} />
        </div>

        <div className="col-span-2 pt-4">
          <button type="submit" disabled={loading} className="btn-primary w-full flex justify-center items-center gap-2">
            {loading ? 'Registering...' : 'Create Employee Profile'}
          </button>
        </div>
      </form>
    </div>
  );
}
