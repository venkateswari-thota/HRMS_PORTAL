from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from .database import init_db

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    await init_db()
    yield
    # Shutdown

app = FastAPI(lifespan=lifespan)

from .routers import auth, admin, attendance, upload
from fastapi.staticfiles import StaticFiles
import os

app.include_router(auth.router)
app.include_router(admin.router)
app.include_router(attendance.router)
app.include_router(upload.router)

# Mount Static for "Cloud" Storage Simulation
os.makedirs("backend/static", exist_ok=True)
app.mount("/static", StaticFiles(directory="backend/static"), name="static")

# Allow CORS for Next.js Frontend
origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {"message": "Person Verification HRMS API is running"}
