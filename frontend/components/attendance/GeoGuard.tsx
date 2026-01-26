'use client';
import { useEffect, useState } from 'react';

// Haversine Distance
function getDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
    const R = 6371e3; // metres
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
        Math.cos(φ1) * Math.cos(φ2) *
        Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

interface GeoGuardProps {
    targetLat: number;
    targetLng: number;
    radius: number;
    active: boolean;
    onStatusChange: (isValid: boolean, userLat: number, userLng: number) => void;
}

export default function GeoGuard({ targetLat, targetLng, radius, active, onStatusChange }: GeoGuardProps) {
    const [status, setStatus] = useState("Waiting to start location check...");
    const [dist, setDist] = useState<number | null>(null);

    useEffect(() => {
        if (!active) {
            setStatus("Ready to check location");
            return;
        }

        if (!navigator.geolocation) {
            setStatus("Geolocation not supported");
            onStatusChange(false, 0, 0);
            return;
        }

        setStatus("Locating...");

        let watchId: number;

        // Absolute 60s timeout to prevent infinite manual waiting
        const absoluteTimeoutId = setTimeout(() => {
            console.warn("🧭 GeoGuard: Absolute 60s timeout reached.");
            setStatus("❌ Location Timeout - Calibration took too long. Please try again or use the request link.");
            onStatusChange(false, 0, 0);
            if (watchId) navigator.geolocation.clearWatch(watchId);
        }, 60000);

        // Add timeout for initial location feedback
        const feedbackTimeoutId = setTimeout(() => {
            if (status === "Locating...") {
                setStatus("⏳ Getting GPS signal... (may take 10-30s)");
            }
        }, 5000);

        watchId = navigator.geolocation.watchPosition(
            (pos) => {
                clearTimeout(feedbackTimeoutId);
                clearTimeout(absoluteTimeoutId);
                const { latitude, longitude, accuracy } = pos.coords;
                const d = getDistance(latitude, longitude, targetLat, targetLng);
                setDist(d);

                console.log(`📍 GPS: Lat=${latitude.toFixed(5)}, Lng=${longitude.toFixed(5)}, Accuracy=${accuracy.toFixed(0)}m, Distance=${d.toFixed(0)}m`);

                // Warn if accuracy is too low (e.g. > 100 meters)
                if (accuracy > 100) {
                    setStatus(`⚠️ Low GPS Accuracy (${Math.round(accuracy)}m). Move outdoors.`);
                    // Still allow update but warn user
                }

                if (d <= radius) {
                    setStatus(`✅ Location Verified (${Math.round(d)}m from office)`);
                    onStatusChange(true, latitude, longitude);
                } else {
                    setStatus(`❌ Outside Geofence (${Math.round(d)}m away, need ≤${radius}m)`);
                    onStatusChange(false, latitude, longitude);
                }
            },
            (err) => {
                clearTimeout(feedbackTimeoutId);
                // We keep the absolute timeout running if it's just a transient error like code 3 (timeout)
                if (err.code !== 3) {
                    clearTimeout(absoluteTimeoutId);
                }

                console.error('GPS Error:', err);
                if (err.code === 1) {
                    setStatus("❌ Location Access Denied - Please allow location access");
                } else if (err.code === 2) {
                    setStatus("❌ Location Unavailable - Check GPS/WiFi");
                } else if (err.code === 3) {
                    setStatus("⏳ GPS Signal Weak... still trying...");
                    return; // Don't trigger failure yet, let absolute timeout handle it
                }
                onStatusChange(false, 0, 0);
            },
            {
                enableHighAccuracy: true,
                timeout: 30000,
                maximumAge: 0 // Force fresh GPS reading
            }
        );

        return () => {
            clearTimeout(feedbackTimeoutId);
            clearTimeout(absoluteTimeoutId);
            if (watchId) navigator.geolocation.clearWatch(watchId);
        };
    }, [targetLat, targetLng, radius, active, onStatusChange]);

    return (
        <div className={`p-2 rounded text-xs font-bold font-mono text-center ${dist && dist <= radius ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'}`}>
            {status}
        </div>
    );
}
