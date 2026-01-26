# Base Image
FROM python:3.10-slim

# Set working directory
WORKDIR /app

# Install system dependencies for OpenCV
RUN apt-get update && apt-get install -y \
    libgl1-mesa-glx \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first (caching)
COPY backend/requirements.txt .

# Install Python deps
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend code
# Note: Context will be the root of the repo, so we copy backend/ folder
COPY backend ./backend
COPY .env .

# Expose port
EXPOSE 8000

# Run Command
CMD ["uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "8000"]
