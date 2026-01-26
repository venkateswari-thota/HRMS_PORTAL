'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiRequest } from '@/lib/api';
import Captcha from '@/components/ui/Captcha';
import Image from 'next/image';
import { Eye, EyeOff } from 'lucide-react';

export default function EmployeeSignIn() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isCaptchaValid, setIsCaptchaValid] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!isCaptchaValid) {
            setError('Please complete the Captcha correctly.');
            return;
        }

        setLoading(true);
        try {
            const res = await apiRequest('/auth/employee/login', 'POST', { email, password });
            localStorage.setItem('emp_token', res.access_token);
            localStorage.setItem('emp_name', res.name);
            localStorage.setItem('emp_id', res.emp_id);
            sessionStorage.clear(); // Clear any stale face data or failure states
            router.push('/employee/home');
        } catch (err: any) {
            setError(err.message || "Login Failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex bg-white font-sans text-gray-800">
            {/* Left Section: Login Form */}
            <div className="w-full lg:w-1/2 flex flex-col justify-center items-center p-8 lg:p-16 relative">
                <div className="w-full max-w-md space-y-8">
                    {/* Logo */}
                    <div className="hidden lg:block absolute top-8 left-8">
                        <div className="h-12 w-auto relative">
                            {/* Assuming logo.jpg is rectangular - adjusting style to fit nicely */}
                            <img src="/logo.jpg" alt="Pragyatmika Logo" className="h-12 object-contain" />
                        </div>
                    </div>
                    <div className="lg:hidden flex justify-center mb-4">
                        <img src="/logo.jpg" alt="Pragyatmika Logo" className="h-10 object-contain" />
                    </div>

                    <div className="text-center lg:text-left">
                        <h1 className="text-3xl font-bold tracking-tight text-gray-900">Hello there! 👋</h1>
                        <p className="mt-2 text-sm text-gray-600">Please sign in to access your dashboard.</p>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Email Address</label>
                            <input
                                type="email"
                                placeholder="e.g. employee@company.com"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Password</label>
                            <div className="relative">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all pr-12"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                                >
                                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                </button>
                            </div>
                            <div className="flex justify-end">
                                <a href="#" className="text-xs text-blue-600 hover:text-blue-800">Forgot password?</a>
                            </div>
                        </div>

                        <div className="pt-2">
                            <Captcha onValidate={setIsCaptchaValid} />
                        </div>

                        {error && (
                            <div className="p-3 rounded-lg bg-red-50 text-red-600 text-sm border border-red-100 flex items-center gap-2">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className={`w-full py-3 px-4 rounded-lg text-white font-medium bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg shadow-blue-500/30 ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
                        >
                            {loading ? 'Signing In...' : 'Login'}
                        </button>
                    </form>
                </div>

                <div className="absolute bottom-6 text-xs text-gray-400">
                    © 2024 Pragyatmika Intelligence. All rights reserved.
                </div>
            </div>

            {/* Right Section: Background Only */}
            <div className="hidden lg:flex w-1/2 bg-blue-50 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 to-purple-600/10 z-0"></div>
                {/* Decorative Circles - Kept as part of background aesthetic */}
                <div className="absolute top-10 right-10 w-64 h-64 bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
                <div className="absolute -bottom-8 left-20 w-72 h-72 bg-blue-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
            </div>
        </div>
    );
}
