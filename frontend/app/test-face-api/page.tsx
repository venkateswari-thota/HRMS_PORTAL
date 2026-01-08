'use client';
import { useEffect, useState } from 'react';
import * as faceapi from '@vladmandic/face-api';

export default function TestFaceAPI() {
    const [status, setStatus] = useState('Testing...');
    const [details, setDetails] = useState<string[]>([]);

    useEffect(() => {
        const test = async () => {
            const logs: string[] = [];

            try {
                logs.push('1. Checking if face-api.js is loaded...');
                logs.push(`   faceapi object exists: ${!!faceapi}`);
                logs.push(`   faceapi.nets exists: ${!!faceapi.nets}`);
                setDetails([...logs]);

                logs.push('2. Initializing TensorFlow.js backend...');
                setDetails([...logs]);

                // CRITICAL: Initialize TensorFlow backend first
                await faceapi.tf.setBackend('webgl');
                await faceapi.tf.ready();
                logs.push('   ✅ TensorFlow.js backend ready');
                setDetails([...logs]);

                logs.push('3. Attempting to load models from CDN...');
                setDetails([...logs]);

                const MODEL_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model';

                await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
                logs.push('   ✅ Tiny Face Detector loaded');
                setDetails([...logs]);

                await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL);
                logs.push('   ✅ Face Landmark 68 loaded');
                setDetails([...logs]);

                await faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL);
                logs.push('   ✅ Face Recognition loaded');
                setDetails([...logs]);

                setStatus('✅ SUCCESS! All models loaded');
            } catch (err: any) {
                logs.push(`❌ ERROR: ${err.message}`);
                logs.push(`   Stack: ${err.stack}`);
                setDetails(logs);
                setStatus('❌ FAILED');
            }
        };

        test();
    }, []);

    return (
        <div className="p-8 max-w-2xl mx-auto">
            <h1 className="text-2xl font-bold mb-4">Face-API.js Test</h1>
            <div className={`p-4 rounded-lg mb-4 ${status.includes('SUCCESS') ? 'bg-green-100' : status.includes('FAILED') ? 'bg-red-100' : 'bg-blue-100'}`}>
                <p className="font-bold">{status}</p>
            </div>
            <div className="bg-gray-100 p-4 rounded-lg">
                <pre className="text-sm whitespace-pre-wrap">
                    {details.join('\n')}
                </pre>
            </div>
        </div>
    );
}
