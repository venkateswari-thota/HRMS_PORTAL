'use client';
import { useEffect, useRef, useState } from 'react';
import * as faceapi from 'face-api.js';

interface FaceCheckProps {
    referenceDescriptors: any[]; // Uploaded URLs or Float32Array
    onSuccess: () => void;
    onFailure: (reason: string) => void;
}

export default function FaceCheck({ referenceDescriptors, onSuccess, onFailure }: FaceCheckProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [loading, setLoading] = useState(true);
    const [status, setStatus] = useState("Initializing Face AI...");
    const [livenessConfirmed, setLivenessConfirmed] = useState(false);

    // Load Models & Process Reference Data
    useEffect(() => {
        const loadResources = async () => {
            try {
                // 1. Load AI Models
                const MODEL_URL = 'https://justadudewhohacks.github.io/face-api.js/models';
                await faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL);
                await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL);
                await faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL);

                // 2. Compute Descriptors from Cloud URLs (RAM Loading)
                const labeledDescriptors: faceapi.LabeledFaceDescriptors[] = [];
                if (referenceDescriptors && referenceDescriptors.length > 0) {
                    setStatus("Downloading Face Data into RAM...");
                    const descriptors: Float32Array[] = [];

                    for (const url of referenceDescriptors) {
                        try {
                            // Fetch Image from Backend
                            const img = await faceapi.fetchImage(`http://localhost:8000${url}`);
                            const detection = await faceapi.detectSingleFace(img).withFaceLandmarks().withFaceDescriptor();
                            if (detection) {
                                descriptors.push(detection.descriptor);
                            }
                        } catch (e) {
                            console.error("Failed to load face image", url);
                        }
                    }

                    if (descriptors.length > 0) {
                        labeledDescriptors.push(new faceapi.LabeledFaceDescriptors('Employee', descriptors));
                        (window as any).faceRefVals = labeledDescriptors; // Store in RAM
                    } else {
                        onFailure("No valid faces found in profile photos");
                        return;
                    }
                }

                startVideo();
            } catch (err) {
                console.error(err);
                setStatus("Failed to load AI Models or Data");
                onFailure("System Error");
            }
        };
        loadResources();
    }, [referenceDescriptors]);

    const startVideo = () => {
        navigator.mediaDevices.getUserMedia({ video: {} })
            .then(stream => {
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                }
                setLoading(false);
                setStatus("Position face in circle. BLINK to verify liveness.");
            })
            .catch(err => {
                setStatus("Camera Permission Denied");
                onFailure("Camera Denied");
            });
    };

    const scanFace = async () => {
        if (!videoRef.current) return;

        // Detect Face
        const detections = await faceapi.detectAllFaces(videoRef.current)
            .withFaceLandmarks()
            .withFaceDescriptors();

        if (!detections.length) {
            setStatus("No face detected");
            return;
        }

        const face = detections[0];
        const landmarks = face.landmarks;

        // 1. Liveness: Blink Detection (Simple Eye Aspect Ratio Logic)
        const leftEye = landmarks.getLeftEye();
        const rightEye = landmarks.getRightEye();

        // Calculate simple opening (distance between top/bottom eyelids)
        // This is a simplified "Blink" check for the prototype.
        // Real EAR formula is more complex. Here using a heuristic.
        const leftEyeH = leftEye[4].y - leftEye[1].y; // Approx height
        const rightEyeH = rightEye[4].y - rightEye[1].y;

        // Threshold for blink (closed eye)
        if (leftEyeH < 3 && rightEyeH < 3) {
            // Eyes Closed
            if (!livenessConfirmed) {
                setLivenessConfirmed(true);
                setStatus("Blink Detected! analyzing match...");
            }
        }

        if (livenessConfirmed) {
            // 2. Perform Match against Reference (RAM)
            const labeledDescriptors = (window as any).faceRefVals as faceapi.LabeledFaceDescriptors[];

            if (!labeledDescriptors || labeledDescriptors.length === 0) {
                setStatus("No reference data in RAM");
                return;
            }

            const faceMatcher = new faceapi.FaceMatcher(labeledDescriptors, 0.6);
            const bestMatch = faceMatcher.findBestMatch(face.descriptor);

            if (bestMatch.label !== 'unknown') {
                // SUCCESS
                onSuccess();
            } else {
                setStatus("Face Does Not Match Records");
                // onFailure("Face Mismatch"); // Optional: Don't fail immediately, let them try again
            }
        }
    };

    // Loop Scan
    useEffect(() => {
        if (loading) return;
        const interval = setInterval(scanFace, 500); // Check every 500ms
        return () => clearInterval(interval);
    }, [loading, livenessConfirmed]);

    return (
        <div className="relative flex flex-col items-center">
            <div className="relative w-64 h-64 rounded-full overflow-hidden border-4 border-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.5)]">
                <video ref={videoRef} autoPlay muted className="w-full h-full object-cover" />
            </div>
            <div className="mt-4 p-3 bg-white/10 rounded-lg text-center backdrop-blur w-full max-w-xs">
                <p className={`font-mono font-bold ${livenessConfirmed ? 'text-green-400' : 'text-blue-300'}`}>
                    {status}
                </p>
            </div>
            {loading && <div className="absolute inset-0 flex items-center justify-center bg-black/80 text-white rounded-full">Loading AI...</div>}
        </div>
    );
}
