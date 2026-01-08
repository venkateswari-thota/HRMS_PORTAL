"""
OpenCV-based Face Recognition Service with Blink Detection
No dlib dependency - uses OpenCV DNN for face detection and recognition
"""

import cv2
import numpy as np
from scipy.spatial import distance
from typing import List, Dict, Tuple
import base64
import io
from PIL import Image

class OpenCVFaceService:
    """
    Face recognition using OpenCV DNN with blink detection
    """
    
    # Thresholds
    FACE_MATCH_THRESHOLD = 0.4  # Cosine similarity threshold
    EAR_THRESHOLD = 0.21  # Eye Aspect Ratio threshold for blink detection
    
    def __init__(self):
        # Load face detector (Caffe model)
        self.face_detector = None
        self.face_recognizer = None
        self.eye_cascade = None
        
    def load_models(self):
        """Load OpenCV face detection and recognition models"""
        try:
            # Load Haar Cascade for eye detection (for blink)
            self.eye_cascade = cv2.CascadeClassifier(
                cv2.data.haarcascades + 'haarcascade_eye.xml'
            )
            print("✅ Eye cascade loaded")
            return True
        except Exception as e:
            print(f"❌ Error loading models: {e}")
            return False
    
    @staticmethod
    def calculate_ear(eye_landmarks: List[Tuple[int, int]]) -> float:
        """
        Calculate Eye Aspect Ratio (EAR) for blink detection
        Extracted from GitHub repo
        """
        # Vertical distances
        v1 = distance.euclidean(eye_landmarks[1], eye_landmarks[5])
        v2 = distance.euclidean(eye_landmarks[2], eye_landmarks[4])
        
        # Horizontal distance
        h = distance.euclidean(eye_landmarks[0], eye_landmarks[3])
        
        # EAR formula
        ear = (v1 + v2) / (2.0 * h)
        
        return ear
    
    def detect_blink_simple(self, image: np.ndarray) -> Dict:
        """
        Simple blink detection using eye cascade
        """
        try:
            gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
            
            # Detect eyes
            eyes = self.eye_cascade.detectMultiScale(gray, 1.3, 5)
            
            # Simple logic: if less than 2 eyes detected, might be blinking
            is_blinking = len(eyes) < 2
            
            return {
                "is_blinking": bool(is_blinking),
                "eyes_detected": int(len(eyes)),
                "status": "Blink detected" if is_blinking else "Eyes open",
                "method": "opencv_cascade"
            }
        except Exception as e:
            return {
                "is_blinking": False,
                "error": str(e),
                "status": "Error detecting blink"
            }
    
    @staticmethod
    def base64_to_image(base64_string: str) -> np.ndarray:
        """Convert base64 string to OpenCV image"""
        # Remove data URL prefix if present
        if ',' in base64_string:
            base64_string = base64_string.split(',')[1]
        
        # Decode base64
        image_data = base64.b64decode(base64_string)
        
        # Convert to PIL Image
        image = Image.open(io.BytesIO(image_data))
        
        # Convert to numpy array (RGB)
        image_np = np.array(image)
        
        # Convert RGB to BGR for OpenCV
        if len(image_np.shape) == 3:
            image_bgr = cv2.cvtColor(image_np, cv2.COLOR_RGB2BGR)
        else:
            image_bgr = cv2.cvtColor(image_np, cv2.COLOR_GRAY2BGR)
        
        return image_bgr
    
    def extract_face_features(self, image: np.ndarray) -> np.ndarray:
        """
        Extract face features using ORB (Oriented FAST and Rotated BRIEF)
        Simple feature extraction that works without dlib
        """
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        
        # Detect face region
        face_cascade = cv2.CascadeClassifier(
            cv2.data.haarcascades + 'haarcascade_frontalface_default.xml'
        )
        faces = face_cascade.detectMultiScale(gray, 1.3, 5)
        
        if len(faces) == 0:
            return None
        
        # Get first face
        (x, y, w, h) = faces[0]
        face_roi = gray[y:y+h, x:x+w]
        
        # Resize to standard size
        face_roi = cv2.resize(face_roi, (128, 128))
        
        # Use ORB for feature extraction
        orb = cv2.ORB_create(nfeatures=500)
        keypoints, descriptors = orb.detectAndCompute(face_roi, None)
        
        if descriptors is None:
            return None
        
        # Create fixed-size feature vector
        feature_vector = np.mean(descriptors, axis=0)
        
        return feature_vector
    
    def match_face(
        self,
        test_image: np.ndarray,
        reference_features: List[np.ndarray]
    ) -> Dict:
        """
        Match a test face against reference face features
        """
        try:
            # Detect faces
            face_cascade = cv2.CascadeClassifier(
                cv2.data.haarcascades + 'haarcascade_frontalface_default.xml'
            )
            gray = cv2.cvtColor(test_image, cv2.COLOR_BGR2GRAY)
            faces = face_cascade.detectMultiScale(gray, 1.3, 5)
            
            if len(faces) == 0:
                return {
                    "matched": False,
                    "face_detected": False,
                    "reason": "No face detected in image",
                    "confidence": 0.0
                }
            
            if len(faces) > 1:
                return {
                    "matched": False,
                    "face_detected": True,
                    "reason": "Multiple faces detected. Please ensure only one person is in frame.",
                    "confidence": 0.0
                }
            
            # Extract features from test image
            test_features = self.extract_face_features(test_image)
            
            if test_features is None:
                return {
                    "matched": False,
                    "face_detected": True,
                    "reason": "Could not extract face features",
                    "confidence": 0.0
                }
            
            # Blink detection
            blink_info = self.detect_blink_simple(test_image)
            
            # Compare with reference features
            similarities = []
            for ref_features in reference_features:
                # Calculate cosine similarity
                similarity = np.dot(test_features, ref_features) / (
                    np.linalg.norm(test_features) * np.linalg.norm(ref_features)
                )
                similarities.append(similarity)
            
            # Get best match
            best_similarity = max(similarities)
            confidence = best_similarity * 100
            
            # Check if match is within threshold
            is_match = best_similarity > self.FACE_MATCH_THRESHOLD
            
            # Convert numpy types to Python native types for JSON serialization
            return {
                "matched": bool(is_match),
                "face_detected": True,
                "confidence": float(round(confidence, 2)),
                "similarity": float(round(best_similarity, 3)),
                "threshold": self.FACE_MATCH_THRESHOLD,
                "blink_detection": blink_info,
                "message": f"Face {'matched' if is_match else 'not matched'} with {confidence:.1f}% confidence"
            }
            
        except Exception as e:
            return {
                "matched": False,
                "face_detected": False,
                "error": str(e),
                "reason": f"Error processing image: {str(e)}",
                "confidence": 0.0
            }
    
    def create_face_features(self, images: List[np.ndarray]) -> List[np.ndarray]:
        """Create face features from a list of images"""
        features = []
        
        for i, image in enumerate(images):
            try:
                feature_vector = self.extract_face_features(image)
                
                if feature_vector is not None:
                    features.append(feature_vector)
                    print(f"✅ Created features for image {i + 1}")
                else:
                    print(f"⚠️ No face found in image {i + 1}")
            except Exception as e:
                print(f"❌ Error processing image {i + 1}: {e}")
        
        return features

# Global instance
face_service = OpenCVFaceService()
