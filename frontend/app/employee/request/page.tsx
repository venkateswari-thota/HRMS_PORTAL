'use client';
import RequestForm from '@/components/attendance/RequestForm';

export default function RequestPage() {
    return (
        <div className="min-h-screen bg-black p-4">
            <header className="mb-6">
                <h1 className="text-xl font-bold text-white">Submit Request</h1>
            </header>
            <RequestForm />
        </div>
    );
}
