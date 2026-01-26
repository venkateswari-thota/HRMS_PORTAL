# HRMS Portal - Professional Attendance & Leave Management

A comprehensive Human Resource Management System built with **FastAPI** (Backend) and **Next.js** (Frontend). This system features secure **Face Recognition** and **Geolocation-verified** attendance tracking, along with a surgical **Leave Management** system.

---

## 🚀 Overview
The HRMS Portal automates critical HR workflows for workforce management:
- **Attendance**: Multi-factor verification (Face ID + GPS Geofencing).
- **Leave Management**: Employee applications, admin approvals, handled history, and balance tracking.
- **Admin Control**: Employee onboarding, holiday setup, and dashboard analytics.

---

## 🛠️ Technology Stack
- **Backend**: Python, FastAPI, MongoDB (Beanie ODM), AWS S3 (Storage).
- **Frontend**: React, Next.js, Tailwind CSS, Lucide Icons.
- **AI/ML**: Face-api.js (Browser-side), OpenCV (Server-side).

---

## 📋 Installation & Setup

To keep the repository clean, dependencies and configurations are documented below. Follow these steps to set up your environment.

### 1. Backend Setup
Navigate to the `backend/` directory and install the following Python dependencies.

#### **Dependencies**
You can copy this list into a `requirements.txt` file or install them manually:
```text
fastapi==0.115.6
uvicorn==0.34.0
beanie==1.27.0
motor==3.6.0
pydantic==2.10.4
pydantic-settings==2.7.0
passlib[argon2]==1.7.4
python-jose[cryptography]==3.3.0
python-multipart==0.0.20
boto3==1.35.76
Pillow==11.0.0
python-dotenv==1.0.1
opencv-python-headless==4.10.0.84
numpy==1.26.4
scipy==1.13.1
```

#### **Configuration (.env)**
Create a `.env` file in the `backend/` directory with the following variables:
```env
MONGODB_URL="your_mongodb_connection_string"
AWS_ACCESS_KEY_ID="your_aws_access_key"
AWS_SECRET_ACCESS_KEY="your_aws_secret_key"
AWS_REGION="ap-south-2"
AWS_S3_BUCKET="hrms-employee-faces"
SECRET_KEY="your_jwt_secret_key"
```

### 2. Frontend Setup
Navigate to the `frontend/` directory and run:
```bash
npm install
npm run dev
```

---

## 📑 Core Modules
- **Employee Leave**: `frontend/app/employee/leave/apply/page.tsx`
- **Admin Dashboard**: `frontend/app/admin/onboard/page.tsx`
- **Face Recognition Service**: `backend/face_recognition_service.py`
- **S3 Storage Utility**: `backend/s3_service.py`

---

## 🛡️ Privacy & Professionalism
This repository is maintained for official use. Debug scripts, personalized data, and temporary logs are strictly ignored to ensure a clean, generic, and professional codebase suitable for production evaluation.
