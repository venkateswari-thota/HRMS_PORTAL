import { useState, useEffect, useCallback, useRef } from 'react';
import * as faceapi from '@vladmandic/face-api';

interface UseFaceMatchingResult {
    isLoading: boolean;
    error: string | null;
    referenceDescriptors: faceapi.LabeledFaceDescriptors | null;
    loadFaceImages: () => Promise<void>;
    cleanup: () => void;
    employeeName: string;
    imageCount: number;
}

/**
 * Custom hook for loading employee face images from S3 and managing RAM
 * Handles:
 * - Loading face-api.js models
 * - Fetching S3 URLs from backend
 * - Downloading images to browser
 * - Extracting face descriptors
 * - Storing in RAM (React state)
 * - Cleanup on unmount
 */
export function useFaceMatching(): UseFaceMatchingResult {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [referenceDescriptors, setReferenceDescriptors] = useState<faceapi.LabeledFaceDescriptors | null>(null);
    const [employeeName, setEmployeeName] = useState('');
    const [imageCount, setImageCount] = useState(0);
    const modelsLoaded = useRef(false);

    /**
   * Load face-api.js models (only once)
   */
    const loadModels = useCallback(async () => {
        if (modelsLoaded.current) return;

        try {
            console.log('📦 Loading face-api.js models...');

            // CRITICAL: Initialize TensorFlow.js backend first
            console.log('⚙️ Initializing TensorFlow.js backend...');
            await faceapi.tf.setBackend('webgl');
            await faceapi.tf.ready();
            console.log('✅ TensorFlow.js backend ready');

            // Try local models first
            let MODEL_URL = '/models';

            try {
                await Promise.all([
                    faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
                    faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
                    faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
                ]);
                console.log('✅ Models loaded from local /models directory');
            } catch (localError) {
                console.warn('⚠️ Failed to load from /models, trying CDN fallback...', localError);

                // Fallback to CDN
                MODEL_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model';

                await Promise.all([
                    faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
                    faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
                    faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
                ]);
                console.log('✅ Models loaded from CDN');
            }

            modelsLoaded.current = true;
            console.log('✅ Face detection models ready');
        } catch (err) {
            console.error('❌ Failed to load models from both local and CDN:', err);
            throw new Error('Failed to load face detection models. Please check your internet connection and refresh the page.');
        }
    }, []);

    /**
     * Load employee face images from S3 into RAM
     */
    const loadFaceImages = useCallback(async () => {
        setIsLoading(true);
        setError(null);

        try {
            // 1. Load models first
            await loadModels();

            // 2. Fetch S3 URLs from backend
            console.log('📡 Fetching face image URLs from backend...');
            const token = localStorage.getItem('emp_token');
            if (!token) {
                throw new Error('Not authenticated');
            }

            const response = await fetch('http://localhost:8000/attendance/me/images', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || 'Failed to fetch images');
            }

            const data = await response.json();
            const { images, count, employee_name } = data;  // Changed from image_urls to images

            console.log(`📸 Received ${count} base64 images for ${employee_name}`);
            setEmployeeName(employee_name);
            setImageCount(count);

            // 3. Load base64 images into browser memory (no CORS needed!)
            const imageElements = await Promise.all(
                images.map((dataUrl: string) => loadImageFromDataUrl(dataUrl))
            );

            console.log(`✅ Images loaded into browser memory`);

            // 4. Extract face descriptors from each image
            console.log('🧠 Extracting face descriptors...');
            const descriptors: faceapi.WithFaceDescriptor<faceapi.WithFaceLandmarks<faceapi.WithFaceDetection<{}>>>[] = [];

            for (let i = 0; i < imageElements.length; i++) {
                const img = imageElements[i];

                const detection = await faceapi
                    .detectSingleFace(img, new faceapi.TinyFaceDetectorOptions())
                    .withFaceLandmarks()
                    .withFaceDescriptor();

                if (detection) {
                    descriptors.push(detection);
                    console.log(`✅ Descriptor ${i + 1}/${imageElements.length} extracted`);
                } else {
                    console.warn(`⚠️ No face detected in image ${i + 1}`);
                }
            }

            if (descriptors.length === 0) {
                throw new Error('No faces detected in any of the images. Please contact admin.');
            }

            // 5. Create labeled face descriptors (stored in RAM)
            const labeledDescriptors = new faceapi.LabeledFaceDescriptors(
                employee_name,
                descriptors.map(d => d.descriptor)
            );

            setReferenceDescriptors(labeledDescriptors);
            console.log(`✅ ${descriptors.length} face descriptors loaded into RAM`);
            console.log(`💾 RAM usage: ~${(descriptors.length * 128 * 4 / 1024).toFixed(2)} KB`);

        } catch (err: any) {
            console.error('❌ Error loading face images:', err);
            setError(err.message || 'Failed to load face images');
        } finally {
            setIsLoading(false);
        }
    }, [loadModels]);

    /**
     * Helper function to load image from base64 data URL
     */
    const loadImageFromDataUrl = (dataUrl: string): Promise<HTMLImageElement> => {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = () => reject(new Error(`Failed to load image from data URL`));
            img.src = dataUrl;  // No CORS needed for data URLs!
        });
    };

    /**
     * Cleanup function - clear RAM
     */
    const cleanup = useCallback(() => {
        console.log('🧹 Cleaning up face descriptors from RAM...');
        setReferenceDescriptors(null);
        setEmployeeName('');
        setImageCount(0);
        setError(null);
        console.log('✅ RAM cleaned up');
    }, []);

    /**
     * Auto-cleanup on component unmount
     */
    useEffect(() => {
        return () => {
            cleanup();
        };
    }, [cleanup]);

    return {
        isLoading,
        error,
        referenceDescriptors,
        loadFaceImages,
        cleanup,
        employeeName,
        imageCount,
    };
}
