'use client';
import { useState, useEffect, useRef } from 'react';
import { RefreshCw, Volume2 } from 'lucide-react';

interface CaptchaProps {
    onValidate: (isValid: boolean) => void;
}

export default function Captcha({ onValidate }: CaptchaProps) {
    const [captchaCode, setCaptchaCode] = useState('');
    const [userInput, setUserInput] = useState('');
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const generateCaptcha = () => {
        const characters = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Excluded confusing chars like I, 1, O, 0
        let result = '';
        for (let i = 0; i < 6; i++) {
            result += characters.charAt(Math.floor(Math.random() * characters.length));
        }
        setCaptchaCode(result);
        setUserInput('');
        onValidate(false);
    };

    const drawCaptcha = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Background
        ctx.fillStyle = '#f3f4f6';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Add Noise (Dots)
        for (let i = 0; i < 50; i++) {
            ctx.fillStyle = `rgba(0,0,0,${Math.random() * 0.2})`;
            ctx.beginPath();
            ctx.arc(
                Math.random() * canvas.width,
                Math.random() * canvas.height,
                1,
                0,
                2 * Math.PI
            );
            ctx.fill();
        }

        // Setup Text
        ctx.font = 'bold 24px Courier New';
        ctx.textBaseline = 'middle';
        ctx.textAlign = 'center';

        // Draw Characters with random rotation/position
        const charWidth = canvas.width / 6;
        for (let i = 0; i < 6; i++) {
            const char = captchaCode[i];
            ctx.save();
            // Position
            const x = (i * charWidth) + (charWidth / 2);
            const y = canvas.height / 2;
            ctx.translate(x, y);

            // Rotation
            const angle = (Math.random() - 0.5) * 0.4; // -0.2 to 0.2 rad
            ctx.rotate(angle);

            ctx.fillStyle = '#374151'; // Text color
            ctx.fillText(char, 0, 0);
            ctx.restore();
        }

        // Add Lines
        for (let i = 0; i < 5; i++) {
            ctx.beginPath();
            ctx.moveTo(Math.random() * canvas.width, Math.random() * canvas.height);
            ctx.lineTo(Math.random() * canvas.width, Math.random() * canvas.height);
            ctx.strokeStyle = `rgba(0,0,0,${Math.random() * 0.3})`;
            ctx.stroke();
        }
    };

    const playAudio = () => {
        if ('speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance(captchaCode.split('').join(' ')); // Spell it out
            utterance.rate = 0.8;
            window.speechSynthesis.speak(utterance);
        } else {
            alert("Text-to-Speech not supported in this browser.");
        }
    };

    useEffect(() => {
        generateCaptcha();
    }, []);

    useEffect(() => {
        if (captchaCode) {
            drawCaptcha();
        }
    }, [captchaCode]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setUserInput(val);
        if (val.toUpperCase() === captchaCode) {
            onValidate(true);
        } else {
            onValidate(false);
        }
    };

    return (
        <div className="space-y-3">
            <div className="flex items-center gap-2">
                <canvas
                    ref={canvasRef}
                    width={200}
                    height={50}
                    className="border border-gray-300 rounded bg-gray-100 cursor-pointer"
                    onClick={() => { generateCaptcha(); playAudio(); }}
                    title="Click to refresh and hear"
                />
                <div className="flex flex-col gap-1">
                    <button
                        type="button"
                        onClick={generateCaptcha}
                        className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                        title="Refresh Captcha"
                    >
                        <RefreshCw size={18} />
                    </button>
                    <button
                        type="button"
                        onClick={playAudio}
                        className="p-2 text-gray-500 hover:text-purple-600 hover:bg-purple-50 rounded transition-colors"
                        title="Listen to Captcha"
                    >
                        <Volume2 size={18} />
                    </button>
                </div>
            </div>

            <input
                type="text"
                placeholder="Enter Captcha Code"
                className="auth-input bg-white text-gray-900 border border-gray-300 focus:border-blue-500 focus:ring-blue-500/20"
                value={userInput}
                onChange={handleChange}
            />
        </div>
    );
}
