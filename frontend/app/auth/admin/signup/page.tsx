'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiRequest } from '@/lib/api';
import Link from 'next/link';
import { Eye, EyeOff } from 'lucide-react';

export default function AdminSignUp() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await apiRequest('/auth/admin/signup', 'POST', { email, password });
            alert('Admin registered! Please sign in.');
            router.push('/auth/admin/signin');
        } catch (err: any) {
            setError(err.message);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4">
            <div className="glass-panel p-8 w-full max-w-md">
                <h1 className="text-3xl font-bold mb-6 text-center">Admin Registration</h1>
                {error && <div className="mb-4 p-3 bg-red-500/20 text-red-200 rounded">{error}</div>}
                <form onSubmit={handleSignup} className="space-y-4">
                    <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} className="auth-input" required />
                    <div className="relative">
                        <input
                            type={showPassword ? "text" : "password"}
                            placeholder="Password"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            className="auth-input pr-12"
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
                    <button type="submit" className="btn-primary">Sign Up</button>
                </form>
                <div className="mt-4 text-center text-sm">
                    <Link href="/auth/admin/signin" className="text-blue-400">Back to Sign In</Link>
                </div>
            </div>
        </div>
    );
}
