FROM python:3.10-slim

WORKDIR /app

# Install system dependencies if any library needs them (e.g. git or build-essential)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Copy and install requirements
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy all project source code and data files
COPY src/ ./src/
COPY data/ ./data/

# Expose the port Hugging Face Spaces expects
EXPOSE 7860

# Set environment variable defaults
ENV PORT=7860
ENV FLASK_ENV=production
ENV PYTHONUNBUFFERED=1

# Start the Flask backend server
CMD ["python", "-m", "src.server"]
