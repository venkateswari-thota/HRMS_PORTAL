'use client';
import { useEffect, useState } from 'react';
import { apiRequest } from '@/lib/api';
import { Loader2, CheckCircle, Camera, Clock, User, LogIn } from 'lucide-react';

const dailyQuotes = [
    "Success is not final, failure is not fatal: it is the courage to continue that counts.",
    "The only way to do great work is to love what you do.",
    "Believe you can and you're halfway there.",
    "Your limitation—it's only your imagination.",
    "Push yourself, because no one else is going to do it for you.",
    "Great things never come from comfort zones.",
    "Dream it. Wish it. Do it.",
    "Success doesn't just find you. You have to go out and get it.",
    "The harder you work for something, the greater you'll feel when you achieve it.",
    "Dream bigger. Do bigger."
];

export default function EmployeeHome() {
    const [empName, setEmpName] = useState('Employee');
    const [quote, setQuote] = useState('');

    useEffect(() => {
        // Get employee name
        const storedName = localStorage.getItem('emp_name');
        if (storedName) {
            setEmpName(storedName);
        } else {
            const token = localStorage.getItem('emp_token');
            if (token) {
                try {
                    const payload = JSON.parse(atob(token.split('.')[1]));
                    if (payload.name) setEmpName(payload.name);
                } catch (e) { }
            }
        }

        // Get daily quote
        const dayOfYear = Math.floor((new Date().getTime() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 1000 / 60 / 60 / 24);
        setQuote(dailyQuotes[dayOfYear % dailyQuotes.length]);
    }, []);

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-8">
            {/* Welcome Banner */}
            <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-2xl p-8 mb-8 shadow-lg">
                <h1 className="text-3xl md:text-4xl font-bold text-white">
                    Welcome Back! {empName}
                </h1>
                <p className="text-green-100 mt-2 text-lg">
                    Ready to make today count? Let's get started!
                </p>
            </div>

            {/* Daily Quote */}
            <div className="bg-white rounded-2xl p-12 shadow-xl border border-gray-100 mb-8">
                <div className="flex items-start gap-4">
                    <div className="text-6xl text-blue-500 font-serif leading-none">"</div>
                    <div className="flex-1">
                        <p className="text-3xl md:text-4xl font-bold text-gray-800 leading-relaxed mb-4">
                            {quote}
                        </p>
                        <p className="text-gray-500 text-lg italic">— Daily Motivation</p>
                    </div>
                    <div className="text-6xl text-blue-500 font-serif leading-none self-end">"</div>
                </div>
            </div>

            {/* Quick Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Attendance Card */}
                <div className="bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition-shadow border border-gray-100">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-700">Today's Status</h3>
                        <div className="h-3 w-3 rounded-full bg-green-400"></div>
                    </div>
                    <div className="text-3xl font-bold text-gray-900 mb-2">
                        {new Date().toLocaleDateString('en-US', { weekday: 'long' })}
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        <span className="text-xs text-green-600 font-medium whitespace-nowrap overflow-hidden text-ellipsis">System Secure & Ready</span>
                    </div>
                </div>

                {/* Quick Actions Card */}
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 shadow-md hover:shadow-lg transition-shadow text-white">
                    <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
                    <div className="space-y-2">
                        <button className="w-full bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-lg p-3 text-left transition-colors">
                            <span className="font-medium">📍 Mark Attendance</span>
                        </button>
                        <button className="w-full bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-lg p-3 text-left transition-colors">
                            <span className="font-medium">📊 View Reports</span>
                        </button>
                    </div>
                </div>

                {/* Notifications Card */}
                <div className="bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition-shadow border border-gray-100">
                    <h3 className="text-lg font-semibold text-gray-700 mb-4">Notifications</h3>
                    <div className="space-y-3">
                        <div className="flex items-center gap-3 p-2 bg-blue-50 rounded-lg">
                            <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                            <p className="text-sm text-gray-700">No new notifications</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Additional Info Section */}
            <div className="mt-8 bg-white rounded-xl p-6 shadow-md border border-gray-100">
                <h3 className="text-xl font-semibold text-gray-800 mb-4">Your Dashboard</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg">
                        <div className="text-3xl font-bold text-purple-600">0</div>
                        <p className="text-sm text-gray-600 mt-1">Pending Tasks</p>
                    </div>
                    <div className="text-center p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-lg">
                        <div className="text-3xl font-bold text-green-600">100%</div>
                        <p className="text-sm text-gray-600 mt-1">Attendance</p>
                    </div>
                    <div className="text-center p-4 bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg">
                        <div className="text-3xl font-bold text-orange-600">0</div>
                        <p className="text-sm text-gray-600 mt-1">Leave Balance</p>
                    </div>
                    <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg">
                        <div className="text-3xl font-bold text-blue-600">Active</div>
                        <p className="text-sm text-gray-600 mt-1">Status</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
