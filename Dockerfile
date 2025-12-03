# Stage 1: 프론트엔드 빌드
FROM node:18-alpine AS frontend-builder

WORKDIR /app/frontend

# 프론트엔드 의존성 설치
COPY frontend/package*.json ./
RUN npm ci

# 프론트엔드 소스 복사 및 빌드
COPY frontend/ .
RUN npm run build

# Stage 2: 백엔드 실행
FROM python:3.11-slim

WORKDIR /app

# 시스템 의존성 설치
RUN apt-get update && apt-get install -y \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# 백엔드 의존성 설치
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 백엔드 소스 복사
COPY backend/ .

# 프론트엔드 빌드 파일 복사
COPY --from=frontend-builder /app/frontend/dist ./static

# 포트 설정
ENV PORT=8080
EXPOSE 8080

# Cloud Run은 PORT 환경 변수를 사용
CMD exec uvicorn main:app --host 0.0.0.0 --port ${PORT:-8080}

