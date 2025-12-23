'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiRequest } from '@/lib/api';
import Captcha from '@/components/ui/Captcha';

export default function EmployeeSignIn() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isCaptchaValid, setIsCaptchaValid] = useState(false);
    const [error, setError] = useState('');

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!isCaptchaValid) {
            setError('Invalid Captcha');
            return;
        }
        try {
            const res = await apiRequest('/auth/employee/login', 'POST', { email, password });
            localStorage.setItem('emp_token', res.access_token);
            router.push('/employee/attendance');
        } catch (err: any) {
            setError(err.message);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-black">
            <div className="glass-panel p-8 w-full max-w-sm border-t-4 border-indigo-500">
                <h1 className="text-2xl font-bold mb-2 text-center text-white">Employee Portal</h1>
                <p className="text-gray-400 text-center mb-6 text-sm">Sign in to mark attendance</p>

                {error && <div className="mb-4 text-red-400 text-center text-sm">{error}</div>}

                <form onSubmit={handleLogin} className="space-y-4">
                    <input type="email" placeholder="Work Email" value={email} onChange={e => setEmail(e.target.value)} className="auth-input" required />
                    <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} className="auth-input" required />

                    <div className="py-2">
                        <Captcha onValidate={setIsCaptchaValid} />
                    </div>

                    <button type="submit" className="btn-primary bg-indigo-600 hover:bg-indigo-700">
                        Access Portal
                    </button>
                </form>
            </div>
        </div>
    );
}
