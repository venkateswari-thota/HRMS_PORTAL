'use client';
import { useState, useEffect } from 'react';
import { apiRequest } from '@/lib/api';

export default function AdminRequestsPage() {
    const [requests, setRequests] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchRequests = async () => {
        try {
            const data = await apiRequest('/admin/requests', 'GET');
            setRequests(data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRequests();
    }, []);

    const handleAction = async (id: string, action: 'APPROVE' | 'REJECT') => {
        if (!confirm(`Are you sure you want to ${action} this request?`)) return;
        try {
            await apiRequest('/admin/requests/review', 'POST', { request_id: id, action });
            alert("Success");
            fetchRequests(); // Refresh
        } catch (e: any) {
            alert(e.message);
        }
    };

    return (
        <div className="min-h-screen bg-black text-white p-8">
            <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <span className="w-3 h-3 bg-yellow-500 rounded-full"></span>
                Pending Requests
            </h1>

            <div className="grid gap-4">
                {requests.length === 0 && !loading && <p className="text-gray-500">No pending requests.</p>}

                {requests.map(req => (
                    <div key={req._id} className="glass-panel p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <span className={`px-2 py-0.5 text-xs rounded font-bold ${req.type === 'CHECK_IN' ? 'bg-green-900 text-green-300' : 'bg-red-900 text-red-300'}`}>
                                    {req.type}
                                </span>
                                <span className="font-mono text-xs text-gray-400">{new Date(req.timestamp).toLocaleString()}</span>
                            </div>
                            <h3 className="font-bold text-lg">{req.emp_id}</h3>
                            <p className="text-sm text-gray-300 mt-1">Reason: <span className="italic">"{req.reason}"</span></p>
                            <p className="text-xs text-blue-400 font-mono mt-2">Loc: {req.location_lat}, {req.location_lng}</p>
                        </div>

                        <div className="flex gap-2 w-full md:w-auto">
                            <button
                                onClick={() => handleAction(req._id, 'APPROVE')}
                                className="flex-1 md:flex-none px-4 py-2 bg-green-600 hover:bg-green-500 rounded text-sm font-bold transition-colors"
                            >
                                Approve
                            </button>
                            <button
                                onClick={() => handleAction(req._id, 'REJECT')}
                                className="flex-1 md:flex-none px-4 py-2 bg-red-600 hover:bg-red-500 rounded text-sm font-bold transition-colors"
                            >
                                Reject
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
