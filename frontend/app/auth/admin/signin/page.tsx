'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiRequest } from '@/lib/api';
import Captcha from '@/components/ui/Captcha';
import Link from 'next/link';
import { Eye, EyeOff } from 'lucide-react';

export default function AdminSignIn() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isCaptchaValid, setIsCaptchaValid] = useState(false);
    const [error, setError] = useState('');

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!isCaptchaValid) {
            setError('Please complete the Captcha correctly.');
            return;
        }

        try {
            const res = await apiRequest('/auth/admin/login', 'POST', { email, password });
            localStorage.setItem('admin_token', res.access_token);
            router.push('/admin/onboard'); // Redirect to Admin Dashboard
        } catch (err: any) {
            setError(err.message);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4">
            <div className="glass-panel p-8 w-full max-w-md">
                <h1 className="text-3xl font-bold mb-6 text-center bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-indigo-600">
                    Admin Portal
                </h1>
                {error && <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded text-red-200 text-sm">{error}</div>}
                <form onSubmit={handleLogin} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1 text-gray-400">Email Address</label>
                        <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="auth-input" placeholder="admin@example.com" required />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1 text-gray-400">Password</label>
                        <div className="relative">
                            <input
                                type={showPassword ? "text" : "password"}
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                className="auth-input pr-12"
                                placeholder="••••••••"
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-blue-500 transition-colors"
                            >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                    </div>

                    <div className="py-2">
                        <Captcha onValidate={setIsCaptchaValid} />
                    </div>

                    <button type="submit" className="btn-primary">
                        Sign In
                    </button>
                </form>
                <div className="mt-4 text-center text-sm text-gray-400">
                    Don't have an account? <Link href="/auth/admin/signup" className="text-blue-400 hover:underline">Sign Up</Link>
                </div>
            </div>
        </div>
    );
}
