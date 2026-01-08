"""
Face Recognition Service with Blink Detection
Extracted and adapted from: https://github.com/akashpunagin/Attendance-project-by-Face-Recognition-and-Eye-blink-detection
"""

import face_recognition
import numpy as np
from scipy.spatial import distance
from typing import List, Dict, Tuple
import base64
import io
from PIL import Image

class FaceRecognitionService:
    """
    Face recognition service with blink detection using EAR (Eye Aspect Ratio)
    """
    
    # Thresholds
    FACE_MATCH_THRESHOLD = 0.6  # Lower is stricter
    EAR_THRESHOLD = 0.21  # Eye Aspect Ratio threshold for blink detection
    
    @staticmethod
    def calculate_ear(eye_landmarks: List[Tuple[int, int]]) -> float:
        """
        Calculate Eye Aspect Ratio (EAR) for blink detection
        
        EAR Formula:
        EAR = (||p2 - p6|| + ||p3 - p5||) / (2 * ||p1 - p4||)
        
        where p1-p6 are the eye landmark points
        
        Args:
            eye_landmarks: List of (x, y) coordinates for eye landmarks
            
        Returns:
            float: Eye Aspect Ratio value
        """
        # Vertical distances
        v1 = distance.euclidean(eye_landmarks[1], eye_landmarks[5])
        v2 = distance.euclidean(eye_landmarks[2], eye_landmarks[4])
        
        # Horizontal distance
        h = distance.euclidean(eye_landmarks[0], eye_landmarks[3])
        
        # EAR formula
        ear = (v1 + v2) / (2.0 * h)
        
        return ear
    
    @staticmethod
    def detect_blink(face_landmarks: Dict) -> Dict:
        """
        Detect if eyes are blinking using EAR threshold
        
        Args:
            face_landmarks: Dictionary containing facial landmarks
            
        Returns:
            dict: Blink detection results
        """
        try:
            # Get eye landmarks
            left_eye = face_landmarks['left_eye']
            right_eye = face_landmarks['right_eye']
            
            # Calculate EAR for both eyes
            left_ear = FaceRecognitionService.calculate_ear(left_eye)
            right_ear = FaceRecognitionService.calculate_ear(right_eye)
            
            # Average EAR
            avg_ear = (left_ear + right_ear) / 2.0
            
            # Detect blink (EAR below threshold)
            is_blinking = avg_ear < FaceRecognitionService.EAR_THRESHOLD
            
            return {
                "is_blinking": is_blinking,
                "left_ear": round(left_ear, 3),
                "right_ear": round(right_ear, 3),
                "avg_ear": round(avg_ear, 3),
                "threshold": FaceRecognitionService.EAR_THRESHOLD,
                "status": "Blink detected" if is_blinking else "Eyes open"
            }
        except Exception as e:
            return {
                "is_blinking": False,
                "error": str(e),
                "status": "Error detecting blink"
            }
    
    @staticmethod
    def base64_to_image(base64_string: str) -> np.ndarray:
        """
        Convert base64 string to numpy array (image)
        
        Args:
            base64_string: Base64 encoded image string
            
        Returns:
            np.ndarray: Image as numpy array
        """
        # Remove data URL prefix if present
        if ',' in base64_string:
            base64_string = base64_string.split(',')[1]
        
        # Decode base64
        image_data = base64.b64decode(base64_string)
        
        # Convert to PIL Image
        image = Image.open(io.BytesIO(image_data))
        
        # Convert to RGB numpy array
        image_np = np.array(image)
        
        # Ensure RGB format
        if len(image_np.shape) == 2:
            # Grayscale to RGB
            image_np = np.stack([image_np] * 3, axis=-1)
        elif image_np.shape[2] == 4:
            # RGBA to RGB
            image_np = image_np[:, :, :3]
        
        return image_np
    
    @staticmethod
    def match_face(
        test_image: np.ndarray,
        reference_encodings: List[np.ndarray]
    ) -> Dict:
        """
        Match a test face against reference face encodings
        
        Args:
            test_image: Test image as numpy array
            reference_encodings: List of reference face encodings
            
        Returns:
            dict: Match results with confidence and blink detection
        """
        try:
            # Detect faces in test image
            face_locations = face_recognition.face_locations(test_image)
            
            if len(face_locations) == 0:
                return {
                    "matched": False,
                    "face_detected": False,
                    "reason": "No face detected in image",
                    "confidence": 0.0
                }
            
            if len(face_locations) > 1:
                return {
                    "matched": False,
                    "face_detected": True,
                    "reason": "Multiple faces detected. Please ensure only one person is in frame.",
                    "confidence": 0.0
                }
            
            # Get face encoding
            test_encodings = face_recognition.face_encodings(test_image, face_locations)
            
            if len(test_encodings) == 0:
                return {
                    "matched": False,
                    "face_detected": True,
                    "reason": "Could not extract face features",
                    "confidence": 0.0
                }
            
            test_encoding = test_encodings[0]
            
            # Get face landmarks for blink detection
            face_landmarks_list = face_recognition.face_landmarks(test_image)
            blink_info = {}
            
            if len(face_landmarks_list) > 0:
                blink_info = FaceRecognitionService.detect_blink(face_landmarks_list[0])
            
            # Compare with reference encodings
            face_distances = face_recognition.face_distance(reference_encodings, test_encoding)
            
            # Get best match
            best_match_index = np.argmin(face_distances)
            min_distance = face_distances[best_match_index]
            
            # Calculate confidence (inverse of distance, normalized to 0-100)
            confidence = max(0, (1 - min_distance) * 100)
            
            # Check if match is within threshold
            is_match = min_distance < FaceRecognitionService.FACE_MATCH_THRESHOLD
            
            return {
                "matched": is_match,
                "face_detected": True,
                "confidence": round(confidence, 2),
                "distance": round(min_distance, 3),
                "threshold": FaceRecognitionService.FACE_MATCH_THRESHOLD,
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
    
    @staticmethod
    def create_face_encodings(images: List[np.ndarray]) -> List[np.ndarray]:
        """
        Create face encodings from a list of images
        
        Args:
            images: List of images as numpy arrays
            
        Returns:
            List of face encodings
        """
        encodings = []
        
        for i, image in enumerate(images):
            try:
                # Get face encoding
                face_encodings = face_recognition.face_encodings(image)
                
                if len(face_encodings) > 0:
                    encodings.append(face_encodings[0])
                    print(f"✅ Created encoding for image {i + 1}")
                else:
                    print(f"⚠️ No face found in image {i + 1}")
            except Exception as e:
                print(f"❌ Error processing image {i + 1}: {e}")
        
        return encodings
