FROM python:3.10-slim

WORKDIR /app

# Install system dependencies (including build-essential and libpq for PostgreSQL)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    curl \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Create uploads directory
RUN mkdir -p /app/uploads

EXPOSE 8000

ENV PORT=8000
ENV DATABASE_URL="sqlite:///./omnispace.db"

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
