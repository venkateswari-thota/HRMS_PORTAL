import boto3
import os
import base64
from typing import List, Dict
from backend.logger import log_debug

class RekognitionService:
    def __init__(self):
        # Rekognition is available in Mumbai (ap-south-1)
        self.rekognition = boto3.client('rekognition', region_name="ap-south-1")
        # S3 client can fetch from any region (Hyderabad ap-south-2)
        self.s3 = boto3.client('s3', region_name=os.getenv("AWS_REGION", "ap-south-2"))
        self.bucket = os.getenv("AWS_S3_BUCKET", "hrms-employee-faces")

    def compare_live_against_s3(self, live_image_base64: str, s3_keys: List[str]) -> Dict:
        """
        Compares a live captured image against reference images by downloading from S3 first.
        This fixes the region mismatch between Rekognition (Mumbai) and S3 (Hyderabad).
        """
        try:
            # 1. Clean and decode live image
            if "," in live_image_base64:
                live_image_base64 = live_image_base64.split(",")[1]
            live_bytes = base64.b64decode(live_image_base64)

            best_match = None
            
            # 2. Iterate through reference images
            for key in s3_keys:
                log_debug(f"🔍 AWS: Fetching {key} from S3 for comparison...")
                
                try:
                    # Download target image from S3 to bypass region constraints
                    s3_response = self.s3.get_object(Bucket=self.bucket, Key=key)
                    target_bytes = s3_response['Body'].read()

                    # Compare using BYTES for both (bypasses region locking)
                    response = self.rekognition.compare_faces(
                        SourceImage={'Bytes': live_bytes},
                        TargetImage={'Bytes': target_bytes},
                        SimilarityThreshold=0.0 
                    )

                    if response['FaceMatches']:
                        match = response['FaceMatches'][0]
                        similarity = match['Similarity']
                        log_debug(f"✅ AWS Score for {key}: {similarity:.2f}%")
                        
                        if similarity >= 70.0:
                            return {
                                "matched": True,
                                "face_detected": True,
                                "confidence": round(similarity, 2),
                                "method": "aws_rekognition",
                                "message": f"Face matched via AWS Cloud with {similarity:.1f}% confidence"
                            }
                        
                        # Track best match for failure reason
                        if not best_match or similarity > best_match['similarity']:
                            best_match = {"similarity": similarity, "key": key}
                            
                    elif response.get('UnmatchedFaces'):
                        # If no match even at 0 threshold, it means no face or completely different
                        log_debug(f"❌ AWS: No match found for {key}")

                except self.rekognition.exceptions.InvalidParameterException as e:
                    log_debug(f"⚠️ AWS Invalid Param (likely no face in image): {e}")
                    continue
                except Exception as e:
                    log_debug(f"❌ AWS Comparison Error for {key}: {e}")
                    continue

            # If we got here, no match met the 70% threshold
            reason = "Face did not match any reference images."
            if best_match:
                reason = f"Face did not match with enough confidence (Best: {best_match['similarity']:.1f}%, Need: 70%)"

            return {
                "matched": False,
                "face_detected": True,
                "reason": reason,
                "confidence": best_match['similarity'] if best_match else 0.0,
                "method": "aws_rekognition"
            }

        except Exception as e:
            log_debug(f"❌ Rekognition Service Error: {e}")
            return {
                "matched": False,
                "face_detected": False,
                "error": str(e),
                "method": "aws_rekognition"
            }

# Singleton instance
rekognition_service = RekognitionService()
