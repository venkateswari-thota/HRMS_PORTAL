from fastapi import APIRouter, HTTPException, Depends, Header, BackgroundTasks
from pydantic import BaseModel
from datetime import datetime, timezone
import math
from backend.models import Attendance, Employee, Request, Admin
from backend.email_utils import send_attendance_request_email
from typing import Optional
from jose import jwt
from backend.utils import SECRET_KEY, ALGORITHM
import boto3
import cv2
import numpy as np

router = APIRouter(prefix="/attendance", tags=["Attendance"])

class EmailUpdatePayload(BaseModel):
    email: str

# Helper Dependency
async def get_current_emp_id(authorization: str = Header(...)):
    try:
        token = authorization.split(" ")[1]
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        emp_id = payload.get("sub")
        if not emp_id:
             raise HTTPException(status_code=401, detail="Invalid Token")
        return emp_id
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid Token")

@router.get("/me/info")
async def get_my_info(emp_id: str = Depends(get_current_emp_id)):
    emp = await Employee.find_one(Employee.emp_id == emp_id)
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found")
    
    return {
        "emp_id": emp.emp_id,
        "name": emp.name,
        "email": emp.email,
        "personal_email": emp.personal_email,
        "work_lat": emp.work_lat,
        "work_lng": emp.work_lng,
        "geofence_radius": emp.geofence_radius,
        "std_check_in": emp.std_check_in,
        "std_check_out": emp.std_check_out,
        # "face_photo_count": len(emp.face_photos) if emp.face_photos else 0
    }

@router.post("/me/update-email")
async def update_personal_email(data: EmailUpdatePayload, emp_id: str = Depends(get_current_emp_id)):
    # 1. Validation
    new_email = data.email.strip().lower()
    if not new_email.endswith("@gmail.com"):
        raise HTTPException(status_code=400, detail="enter the valid mail")
    
    # 2. Update Employee
    emp = await Employee.find_one(Employee.emp_id == emp_id)
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found")
    
    emp.personal_email = new_email
    await emp.save()
    
    return {"message": "Email updated successfully", "personal_email": new_email}

@router.get("/me/images")
async def get_my_face_images(emp_id: str = Depends(get_current_emp_id)):
    """
    Get employee's face images as base64 data (bypasses CORS)
    Downloads images from S3 and converts to base64 for browser use
    """
    emp = await Employee.find_one(Employee.emp_id == emp_id)
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found")
    
    print(f"📸 Fetching face images from S3 for {emp.email}")
    
    # Import S3 client
    import boto3
    import base64
    
    s3_client = boto3.client('s3')
    bucket_name = 'hrms-employee-faces'
    
    # List all images for this employee directly from S3
    prefix = f"employees/{emp.email}/"
    
    try:
        print(f"📂 Listing S3 objects with prefix: {prefix}")
        response = s3_client.list_objects_v2(
            Bucket=bucket_name,
            Prefix=prefix
        )
        
        if 'Contents' not in response:
            raise HTTPException(
                status_code=404,
                detail=f"No face images found in S3 for {emp.email}. Please contact admin to upload your face images."
            )
        
        # Get all image files
        image_keys = [obj['Key'] for obj in response['Contents'] if obj['Key'].endswith(('.jpg', '.jpeg', '.png'))]
        
        if len(image_keys) == 0:
            raise HTTPException(
                status_code=404,
                detail="No face images found. Please contact admin to upload your face images."
            )
        
        print(f"✅ Found {len(image_keys)} images in S3")
        
        base64_images = []
        
        for key in image_keys:
            try:
                print(f"📥 Downloading: {key}")
                
                # Download image from S3
                obj_response = s3_client.get_object(Bucket=bucket_name, Key=key)
                image_data = obj_response['Body'].read()
                
                print(f"✅ Downloaded {len(image_data)} bytes")
                
                # Convert to base64
                base64_data = base64.b64encode(image_data).decode('utf-8')
                
                # Create data URL
                data_url = f"data:image/jpeg;base64,{base64_data}"
                base64_images.append(data_url)
                
                print(f"✅ Converted to base64 successfully")
                
            except Exception as e:
                print(f"❌ Error fetching image {key}: {type(e).__name__}: {str(e)}")
                import traceback
                traceback.print_exc()
                continue
        
        if len(base64_images) == 0:
            raise HTTPException(status_code=500, detail="Failed to load any images from S3")
        
        print(f"✅ Successfully loaded {len(base64_images)} images as base64")
        
        return {
            "images": base64_images,
            "count": len(base64_images),
            "employee_name": emp.name
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error listing S3 objects: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Failed to fetch images from S3: {str(e)}")

# Haversine Formula for Distance logic
def calculate_distance(lat1, lon1, lat2, lon2):
    R = 6371e3 # Earth radius in meters
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)
    
    a = math.sin(delta_phi/2) * math.sin(delta_phi/2) + \
        math.cos(phi1) * math.cos(phi2) * \
        math.sin(delta_lambda/2) * math.sin(delta_lambda/2)
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))
    
    return R * c # Distance in meters

@router.get("/time")
async def get_time():
    return {"time": datetime.now(timezone.utc).isoformat()}

# Face Matching Endpoint
class FaceMatchRequest(BaseModel):
    image: str  # base64 encoded image
    
@router.post("/match-face")
async def match_face(
    request: FaceMatchRequest,
    emp_id: str = Depends(get_current_emp_id)
):
    """
    Match employee face against S3 reference images with blink detection
    """
    try:
        from backend.opencv_face_service import face_service
        
        # Load models if not already loaded
        if face_service.eye_cascade is None:
            face_service.load_models()
        
        # Get employee
        emp = await Employee.find_one(Employee.emp_id == emp_id)
        if not emp:
            raise HTTPException(status_code=404, detail="Employee not found")
        
        print(f"🔍 Face matching request for {emp.email}")
        
        # Load reference images from S3
        s3_client = boto3.client('s3')
        bucket_name = 'hrms-employee-faces'
        prefix = f"employees/{emp.email}/"
        
        response = s3_client.list_objects_v2(
            Bucket=bucket_name,
            Prefix=prefix
        )
        
        if 'Contents' not in response:
            raise HTTPException(
                status_code=404,
                detail="No reference images found in S3"
            )
        
        # Get image keys
        image_keys = [
            obj['Key'] for obj in response['Contents'] 
            if obj['Key'].endswith(('.jpg', '.jpeg', '.png'))
        ]
        
        if len(image_keys) == 0:
            raise HTTPException(
                status_code=404,
                detail="No reference images found"
            )
        
        print(f"📥 Loading {len(image_keys)} reference images from S3")
        
        # Download and convert reference images
        reference_images = []
        for key in image_keys:
            obj_response = s3_client.get_object(Bucket=bucket_name, Key=key)
            image_data = obj_response['Body'].read()
            
            # Convert to OpenCV format
            nparr = np.frombuffer(image_data, np.uint8)
            img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
            reference_images.append(img)
        
        print(f"✅ Loaded {len(reference_images)} reference images")
        
        # Extract features from reference images
        reference_features = face_service.create_face_features(reference_images)
        
        if len(reference_features) == 0:
            raise HTTPException(
                status_code=500,
                detail="Could not extract features from reference images"
            )
        
        print(f"✅ Extracted features from {len(reference_features)} images")
        
        # Convert test image from base64
        test_image = face_service.base64_to_image(request.image)
        
        # Perform face matching
        result = face_service.match_face(test_image, reference_features)
        
        print(f"🎯 Match result: {result}")
        
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error in face matching: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Error processing face match: {str(e)}"
        )


@router.get("/profile")
async def get_employee_profile(emp_id: str): # In real usage, extract from JWT dependency
    emp = await Employee.find_one(Employee.emp_id == emp_id)
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found")
    return {
        "emp_id": emp.emp_id,
        "name": emp.name,
        "work_lat": emp.work_lat,
        "work_lng": emp.work_lng,
        "geofence_radius": emp.geofence_radius,
        "face_photos": emp.face_photos # URLs to "Cloud"
    }

class CheckInPayload(BaseModel):
    lat: float
    lng: float
    # face_match_score: float # Validated strictly on client, but in real High Security, we'd send the image to verify again here. 
    # For this prototype, we trust the Client's 'FaceCheck' component result if signed (JWT).

@router.post("/check-in")
async def check_in(data: CheckInPayload, emp_id: str = Depends(get_current_emp_id)):
    emp = await Employee.find_one(Employee.emp_id == emp_id)
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found")
        
    # Verify Location
    dist = calculate_distance(data.lat, data.lng, emp.work_lat, emp.work_lng)
    if dist > emp.geofence_radius:
        raise HTTPException(status_code=403, detail=f"Location Violation: You are {int(dist)}m away from work location.")

    # Record Attendance
    today = datetime.now().strftime("%Y-%m-%d")
    current_time = datetime.now()
    existing = await Attendance.find_one(Attendance.emp_id == emp.emp_id, Attendance.date == today)
    
    if existing and existing.check_in_time:
         return {"message": "Already checked in", "record": existing}
         
    if not existing:
        record = Attendance(
            emp_id=emp.emp_id, 
            date=today, 
            check_in_time=current_time,
            last_in_time=current_time,  # Set last_in_time
            status="PRESENT" # Logic for Late can go here
        )
        await record.create()
    else:
        # Update existing (if somehow created without check-in)
        existing.check_in_time = current_time
        existing.last_in_time = current_time  # Set last_in_time
        existing.last_out_time = None         # Reset session
        existing.worked_hours = None          # Reset session
        await existing.save()

    return {"message": "Check-in Successful"}

@router.post("/check-out")
async def check_out(data: CheckInPayload, emp_id: str = Depends(get_current_emp_id)):
    emp = await Employee.find_one(Employee.emp_id == emp_id)
    if not emp:
         raise HTTPException(status_code=404, detail="Employee not found")
    
    # Verify Location
    dist = calculate_distance(data.lat, data.lng, emp.work_lat, emp.work_lng)
    if dist > emp.geofence_radius:
        raise HTTPException(status_code=403, detail="Location Violation during Check-out.")

    today = datetime.now().strftime("%Y-%m-%d")
    current_time = datetime.now()
    record = await Attendance.find_one(Attendance.emp_id == emp.emp_id, Attendance.date == today)
    
    if not record or not record.last_in_time:
        raise HTTPException(status_code=400, detail="Cannot Check-out without Check-in")
        
    record.last_out_time = current_time  # Always track last out for session
    
    # Calculate worked hours using last_in_time and last_out_time
    # Fallback to check_in_time if last_in_time is missing (for older records)
    start_time = record.last_in_time or record.check_in_time
    if start_time and record.last_out_time:
        diff = record.last_out_time - start_time
        seconds = diff.total_seconds()
        hours = int(seconds // 3600)
        minutes = int((seconds % 3600) // 60)
        secs = int(seconds % 60)
        record.worked_hours = f"{hours}:{minutes:02d}:{secs:02d}"
    
    await record.save()
    
    return {"message": "Check-out Successful"}

# History Endpoint for Log Page
class HistoryPayload(BaseModel):
    from_date: str
    to_date: str

@router.post("/history")
async def get_attendance_history(data: HistoryPayload, emp_id: str = Depends(get_current_emp_id)):
    # Fetch records between dates
    # Since dates are strings YYYY-MM-DD, we can comparing lexicographically or filter
    # For prototype, we'll fetch all and filter in python if needed or assume query
    print(f"DEBUG: Fetching history for {emp_id} from {data.from_date} to {data.to_date}")
    records = await Attendance.find(
        Attendance.emp_id == emp_id,
        Attendance.date >= data.from_date,
        Attendance.date <= data.to_date
    ).sort("-date").to_list()
    print(f"DEBUG: Found {len(records)} records for {emp_id}")
    
    # Format for UI
    logs = []
    for r in records:
        # Fallback logic for older records missing session fields
        effective_in = r.last_in_time or r.check_in_time
        effective_out = r.last_out_time
        
        cin = r.check_in_time.strftime("%H:%M:%S") if r.check_in_time else "-"
        last_in = effective_in.strftime("%H:%M:%S") if effective_in else "-"
        last_out = effective_out.strftime("%H:%M:%S") if effective_out else "-"
        
        logs.append({
            "date": datetime.strptime(r.date, "%Y-%m-%d").strftime("%B %d, %Y"),
            "in_time": cin,
            "last_in": last_in,
            "last_out": last_out,
            "worked_hours": r.worked_hours if r.worked_hours else "-"
        })
        
    return logs

class RequestPayload(BaseModel):
    type: str # IN or OUT
    reason: str
    lat: float
    lng: float
    location_failure: bool = False
    face_failure: bool = False
    current_location_coordinates: Optional[str] = None
    face_image: Optional[str] = None

@router.post("/request")
async def submit_request(data: RequestPayload, background_tasks: BackgroundTasks, emp_id: str = Depends(get_current_emp_id)):
    print(f"DEBUG: Processing {data.type} request for {emp_id}")
    # Create Request
    req = Request(
        emp_id=emp_id,
        type=data.type,
        reason=data.reason,
        timestamp=datetime.now(),
        location_lat=data.lat,
        location_lng=data.lng,
        location_failure=data.location_failure,
        face_failure=data.face_failure,
        current_location_coordinates=data.current_location_coordinates,
        face_image=data.face_image,
        status="PENDING"
    )
    await req.create()
    print(f"✅ Request created for {emp_id} with ID: {req.id}")
    
    # Send Email to Admin in Background
    admin = await Admin.find_one()
    admin_email = admin.email if admin else "admin@pragyatmika.com" 
    
    # Get Employee details for email
    emp = await Employee.find_one(Employee.emp_id == emp_id)
    emp_name = emp.name if emp else "Unknown Employee"

    background_tasks.add_task(
        send_attendance_request_email,
        emp_name=emp_name,
        admin_email=admin_email,
        emp_id=emp_id,
        type=data.type,
        reason=data.reason,
        lat=data.lat,
        lng=data.lng
    )
    
    return {"message": "Request Submitted to Admin"}
