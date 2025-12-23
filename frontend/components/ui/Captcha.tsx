'use client';
import { useEffect, useRef, useState } from 'react';

interface CaptchaProps {
    onValidate: (isValid: boolean) => void;
}

export default function Captcha({ onValidate }: CaptchaProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [captchaCode, setCaptchaCode] = useState('');
    const [userInput, setUserInput] = useState('');

    const generateCaptcha = () => {
        const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
        let code = '';
        for (let i = 0; i < 6; i++) {
            code += chars[Math.floor(Math.random() * chars.length)];
        }
        setCaptchaCode(code);
        drawCaptcha(code);
        setUserInput('');
        onValidate(false);
    };

    const drawCaptcha = (code: string) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Clear
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Background
        ctx.fillStyle = '#f3f4f6';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Text
        ctx.font = '30px Arial';
        ctx.fillStyle = '#374151';
        ctx.textBaseline = 'middle';
        ctx.textAlign = 'center';

        // Add noise/lines
        for (let i = 0; i < 5; i++) {
            ctx.strokeStyle = `rgba(0,0,0,${Math.random() * 0.5})`;
            ctx.beginPath();
            ctx.moveTo(Math.random() * canvas.width, Math.random() * canvas.height);
            ctx.lineTo(Math.random() * canvas.width, Math.random() * canvas.height);
            ctx.stroke();
        }

        ctx.fillText(code, canvas.width / 2, canvas.height / 2);
    };

    useEffect(() => {
        generateCaptcha();
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setUserInput(val);
        if (val === captchaCode) {
            onValidate(true);
        } else {
            onValidate(false);
        }
    };

    return (
        <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
                <canvas
                    ref={canvasRef}
                    width={200}
                    height={60}
                    className="rounded border border-gray-300 cursor-pointer"
                    onClick={generateCaptcha}
                    title="Click to reload"
                />
                <button
                    type="button"
                    onClick={generateCaptcha}
                    className="p-2 bg-gray-200 rounded hover:bg-gray-300"
                >
                    ↻
                </button>
            </div>
            <input
                type="text"
                placeholder="Enter Captcha"
                value={userInput}
                onChange={handleChange}
                className="auth-input"
            />
        </div>
    );
}
