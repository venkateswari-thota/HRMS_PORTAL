"""
AWS S3 Service for Employee Face Image Storage
Handles upload, download, and deletion of employee face images
"""
import os
import boto3
from botocore.exceptions import ClientError, NoCredentialsError
from typing import List, Optional
from dotenv import load_dotenv
import io
from PIL import Image
from pathlib import Path

# Load environment variables from backend/.env
# Get the directory where this file is located (backend/)
current_dir = Path(__file__).resolve().parent
env_path = current_dir / '.env'
load_dotenv(dotenv_path=env_path)

# AWS Configuration
AWS_ACCESS_KEY_ID = os.getenv('AWS_ACCESS_KEY_ID')
AWS_SECRET_ACCESS_KEY = os.getenv('AWS_SECRET_ACCESS_KEY')
AWS_REGION = os.getenv('AWS_REGION', 'ap-south-2')
AWS_S3_BUCKET = os.getenv('AWS_S3_BUCKET', 'hrms-employee-faces')

# Debug: Print credential status (NOT the actual credentials)
print("=" * 50)
print("AWS S3 Configuration Check:")
print(f"AWS_ACCESS_KEY_ID: {'✅ Set' if AWS_ACCESS_KEY_ID else '❌ Missing'}")
print(f"AWS_SECRET_ACCESS_KEY: {'✅ Set' if AWS_SECRET_ACCESS_KEY else '❌ Missing'}")
print(f"AWS_REGION: {AWS_REGION}")
print(f"AWS_S3_BUCKET: {AWS_S3_BUCKET}")
print("=" * 50)

# Initialize S3 client
try:
    s3_client = boto3.client(
        's3',
        aws_access_key_id=AWS_ACCESS_KEY_ID,
        aws_secret_access_key=AWS_SECRET_ACCESS_KEY,
        region_name=AWS_REGION
    )
    print("✅ S3 client initialized successfully")
except Exception as e:
    print(f"❌ Failed to initialize S3 client: {e}")
    s3_client = None

class S3Service:
    """Service class for S3 operations"""
    
    @staticmethod
    def upload_employee_images(employee_email: str, image_files: List[bytes], image_names: List[str]) -> List[str]:
        """
        Upload multiple employee face images to S3
        
        Args:
            employee_email: Employee email (used as folder name)
            image_files: List of image file bytes
            image_names: List of original filenames
            
        Returns:
            List of S3 URLs for uploaded images
        """
        if not s3_client:
            raise Exception("S3 client not initialized. Check AWS credentials.")
        
        uploaded_urls = []
        
        for idx, (image_bytes, original_name) in enumerate(zip(image_files, image_names)):
            try:
                # Create S3 key (path): employees/{email}/face_{index}.jpg
                file_extension = original_name.split('.')[-1] if '.' in original_name else 'jpg'
                s3_key = f"employees/{employee_email}/face_{idx}.{file_extension}"
                
                print(f"📤 Uploading: {s3_key}")
                
                # Optimize image before upload (resize if too large)
                optimized_image = S3Service._optimize_image(image_bytes)
                
                # Upload to S3
                s3_client.put_object(
                    Bucket=AWS_S3_BUCKET,
                    Key=s3_key,
                    Body=optimized_image,
                    ContentType=f'image/{file_extension}'
                )
                
                # Generate S3 URL
                s3_url = f"https://{AWS_S3_BUCKET}.s3.{AWS_REGION}.amazonaws.com/{s3_key}"
                uploaded_urls.append(s3_url)
                
                print(f"✅ Uploaded: {s3_key}")
                
            except NoCredentialsError as e:
                error_msg = "AWS credentials not found. Please check your .env file."
                print(f"❌ {error_msg}")
                print(f"   Error details: {e}")
                raise Exception(error_msg)
            except ClientError as e:
                error_code = e.response['Error']['Code']
                error_msg = e.response['Error']['Message']
                print(f"❌ AWS Error uploading {original_name}:")
                print(f"   Error Code: {error_code}")
                print(f"   Error Message: {error_msg}")
                raise Exception(f"AWS Error ({error_code}): {error_msg}")
            except Exception as e:
                print(f"❌ Unexpected error uploading {original_name}: {e}")
                raise Exception(f"Failed to upload image: {str(e)}")
        
        return uploaded_urls
    
    @staticmethod
    def get_employee_images(employee_email: str) -> List[str]:
        """
        Get all image URLs for an employee
        
        Args:
            employee_email: Employee email
            
        Returns:
            List of S3 URLs
        """
        try:
            prefix = f"employees/{employee_email}/"
            response = s3_client.list_objects_v2(
                Bucket=AWS_S3_BUCKET,
                Prefix=prefix
            )
            
            if 'Contents' not in response:
                return []
            
            urls = []
            for obj in response['Contents']:
                s3_url = f"https://{AWS_S3_BUCKET}.s3.{AWS_REGION}.amazonaws.com/{obj['Key']}"
                urls.append(s3_url)
            
            return urls
            
        except ClientError as e:
            print(f"❌ Error fetching images: {e}")
            return []
    
    @staticmethod
    def delete_employee_images(employee_email: str) -> bool:
        """
        Delete all images for an employee
        
        Args:
            employee_email: Employee email
            
        Returns:
            True if successful
        """
        try:
            prefix = f"employees/{employee_email}/"
            response = s3_client.list_objects_v2(
                Bucket=AWS_S3_BUCKET,
                Prefix=prefix
            )
            
            if 'Contents' not in response:
                return True  # No images to delete
            
            # Delete all objects
            objects_to_delete = [{'Key': obj['Key']} for obj in response['Contents']]
            s3_client.delete_objects(
                Bucket=AWS_S3_BUCKET,
                Delete={'Objects': objects_to_delete}
            )
            
            print(f"✅ Deleted {len(objects_to_delete)} images for {employee_email}")
            return True
            
        except ClientError as e:
            print(f"❌ Error deleting images: {e}")
            return False
    
    @staticmethod
    def _optimize_image(image_bytes: bytes, max_size: tuple = (800, 800)) -> bytes:
        """
        Optimize image size before upload
        
        Args:
            image_bytes: Original image bytes
            max_size: Maximum dimensions (width, height)
            
        Returns:
            Optimized image bytes
        """
        try:
            # Open image
            img = Image.open(io.BytesIO(image_bytes))
            
            # Convert to RGB if necessary
            if img.mode in ('RGBA', 'P'):
                img = img.convert('RGB')
            
            # Resize if too large
            img.thumbnail(max_size, Image.Resampling.LANCZOS)
            
            # Save to bytes
            output = io.BytesIO()
            img.save(output, format='JPEG', quality=85, optimize=True)
            output.seek(0)
            
            return output.getvalue()
            
        except Exception as e:
            print(f"⚠️ Image optimization failed, using original: {e}")
            return image_bytes
    
    @staticmethod
    def generate_presigned_url(s3_url: str, expiration: int = 3600) -> str:
        """
        Generate a presigned URL for secure image access
        
        Args:
            s3_url: Original S3 URL
            expiration: URL expiration time in seconds (default 1 hour)
            
        Returns:
            Presigned URL
        """
        try:
            # Extract S3 key from URL
            s3_key = s3_url.split(f"{AWS_S3_BUCKET}.s3.{AWS_REGION}.amazonaws.com/")[1]
            
            # Generate presigned URL
            presigned_url = s3_client.generate_presigned_url(
                'get_object',
                Params={'Bucket': AWS_S3_BUCKET, 'Key': s3_key},
                ExpiresIn=expiration
            )
            
            return presigned_url
            
        except Exception as e:
            print(f"❌ Error generating presigned URL: {e}")
            return s3_url  # Return original URL as fallback


# Test function (for debugging)
if __name__ == "__main__":
    print(f"AWS Region: {AWS_REGION}")
    print(f"S3 Bucket: {AWS_S3_BUCKET}")
    print(f"Credentials configured: {bool(AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY)}")
