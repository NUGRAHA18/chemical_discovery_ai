FROM python:3.11-slim

WORKDIR /app

# System deps dibutuhkan RDKit untuk rendering molekul
RUN apt-get update && apt-get install -y --no-install-recommends \
    libxrender1 \
    libxext6 \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies (gunakan requirements.slim.txt yang sudah di-clean)
COPY requirements.slim.txt ./
RUN pip install --no-cache-dir -r requirements.slim.txt

COPY app.py gemini_manager.py ./

EXPOSE 5000
CMD ["python", "app.py"]
