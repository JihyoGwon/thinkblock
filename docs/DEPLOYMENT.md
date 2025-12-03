# ThinkBlock 배포 가이드

## 목차
1. [사전 요구사항](#사전-요구사항)
2. [Google Cloud 설정](#google-cloud-설정)
3. [로컬 배포 테스트](#로컬-배포-테스트)
4. [Cloud Build를 통한 배포](#cloud-build를-통한-배포)
5. [배포 후 확인](#배포-후-확인)
6. [트러블슈팅](#트러블슈팅)

---

## 사전 요구사항

### 필수 도구
- Google Cloud 계정
- `gcloud` CLI 설치 및 설정
- Docker 설치
- Git

### Google Cloud 프로젝트 설정
1. Google Cloud Console에서 프로젝트 생성
2. 다음 API 활성화:
   - Cloud Run API
   - Cloud Build API
   - Artifact Registry API
   - Firestore API
   - Vertex AI API

### 서비스 계정 및 권한
- Cloud Build 서비스 계정에 다음 권한 필요:
  - Cloud Run Admin
  - Service Account User
  - Artifact Registry Writer
  - Storage Admin (이미지 저장용)

---

## Google Cloud 설정

### 1. Firestore 데이터베이스 생성

```bash
# Firestore 데이터베이스 생성 (Native 모드)
gcloud firestore databases create --region=asia-northeast3
```

또는 Google Cloud Console에서:
1. Firestore로 이동
2. "데이터베이스 만들기" 클릭
3. Native 모드 선택
4. 리전 선택 (asia-northeast3 권장)

### 2. Artifact Registry 저장소 생성

```bash
gcloud artifacts repositories create thinkblock \
  --repository-format=docker \
  --location=asia-northeast3 \
  --description="ThinkBlock Docker images"
```

### 3. Service Account 생성 및 키 다운로드

```bash
# Service Account 생성
gcloud iam service-accounts create thinkblock-sa \
  --display-name="ThinkBlock Service Account"

# 권한 부여
gcloud projects add-iam-policy-binding thinkblock \
  --member="serviceAccount:thinkblock-sa@thinkblock.iam.gserviceaccount.com" \
  --role="roles/datastore.user"

gcloud projects add-iam-policy-binding thinkblock \
  --member="serviceAccount:thinkblock-sa@thinkblock.iam.gserviceaccount.com" \
  --role="roles/aiplatform.user"

# 키 다운로드
gcloud iam service-accounts keys create vertex-ai-thinkblock.json \
  --iam-account=thinkblock-sa@thinkblock.iam.gserviceaccount.com
```

**중요**: `vertex-ai-thinkblock.json` 파일을 프로젝트 루트에 저장하고 `.gitignore`에 추가되어 있는지 확인하세요.

### 4. Cloud Build 서비스 계정 권한 설정

```bash
# Cloud Build 서비스 계정에 권한 부여
PROJECT_NUMBER=$(gcloud projects describe thinkblock --format="value(projectNumber)")

gcloud projects add-iam-policy-binding thinkblock \
  --member="serviceAccount:${PROJECT_NUMBER}@cloudbuild.gserviceaccount.com" \
  --role="roles/run.admin"

gcloud projects add-iam-policy-binding thinkblock \
  --member="serviceAccount:${PROJECT_NUMBER}@cloudbuild.gserviceaccount.com" \
  --role="roles/iam.serviceAccountUser"

gcloud projects add-iam-policy-binding thinkblock \
  --member="serviceAccount:${PROJECT_NUMBER}@cloudbuild.gserviceaccount.com" \
  --role="roles/artifactregistry.writer"
```

---

## 로컬 배포 테스트

### Docker 이미지 빌드 및 테스트

```bash
# Docker 이미지 빌드
docker build -t thinkblock:local .

# 로컬에서 실행 테스트
docker run -p 8080:8080 \
  -e GOOGLE_APPLICATION_CREDENTIALS=/app/vertex-ai-thinkblock.json \
  -e GOOGLE_CLOUD_PROJECT=thinkblock \
  -e VERTEX_AI_LOCATION=us-central1 \
  -e USE_MEMORY_STORE=false \
  -v $(pwd)/vertex-ai-thinkblock.json:/app/vertex-ai-thinkblock.json \
  thinkblock:local
```

브라우저에서 `http://localhost:8080` 접속하여 테스트

---

## Cloud Build를 통한 배포

### 1. cloudbuild.yaml 확인

`cloudbuild.yaml` 파일의 설정 확인:
- `_SERVICE_NAME`: Cloud Run 서비스 이름 (기본값: `thinkblock`)
- `_REGION`: Cloud Run 리전 (기본값: `asia-northeast3`)

### 2. 환경 변수 설정

`.env` 파일 또는 Cloud Build substitution variables 설정:

```bash
# .env 파일 (로컬 테스트용)
GOOGLE_APPLICATION_CREDENTIALS=vertex-ai-thinkblock.json
GOOGLE_CLOUD_PROJECT=thinkblock
VERTEX_AI_LOCATION=us-central1
USE_MEMORY_STORE=false
```

### 3. Cloud Build 실행

```bash
# Cloud Build 제출
gcloud builds submit --config=cloudbuild.yaml \
  --substitutions=_SERVICE_NAME=thinkblock,_REGION=asia-northeast3
```

또는 GitHub 연동 시 자동 배포:
- Cloud Build 트리거 설정
- `main` 브랜치에 푸시 시 자동 배포

### 4. 배포 진행 상황 확인

```bash
# Cloud Build 로그 확인
gcloud builds list --limit=5

# 특정 빌드 로그 확인
gcloud builds log BUILD_ID
```

---

## 배포 후 확인

### 1. Cloud Run 서비스 확인

```bash
# 서비스 목록 확인
gcloud run services list

# 서비스 상세 정보 확인
gcloud run services describe thinkblock --region=asia-northeast3

# 서비스 URL 확인
gcloud run services describe thinkblock --region=asia-northeast3 --format="value(status.url)"
```

### 2. 환경 변수 확인

Cloud Run 콘솔에서 환경 변수 확인:
- `GOOGLE_APPLICATION_CREDENTIALS`: `/app/vertex-ai-thinkblock.json` (컨테이너 내부 경로)
- `GOOGLE_CLOUD_PROJECT`: 프로젝트 ID
- `VERTEX_AI_LOCATION`: Vertex AI 리전
- `USE_MEMORY_STORE`: `false`

**중요**: Cloud Run에서는 Service Account를 통해 자동 인증되므로, `GOOGLE_APPLICATION_CREDENTIALS`는 컨테이너 내부 경로를 가리킵니다.

### 3. 애플리케이션 테스트

1. 브라우저에서 Cloud Run URL 접속
2. 프로젝트 생성 테스트
3. 블록 추가 테스트
4. AI 기능 테스트

### 4. 로그 확인

```bash
# Cloud Run 로그 확인
gcloud run services logs read thinkblock --region=asia-northeast3 --limit=50
```

---

## 트러블슈팅

### 문제: Docker 빌드 실패

**증상**: `npm run build` 실패

**해결 방법**:
1. TypeScript 오류 확인
2. `frontend/tsconfig.json` 설정 확인
3. 의존성 설치 확인: `cd frontend && npm install`

**자주 발생하는 오류**:
- `Property 'env' does not exist on type 'ImportMeta'`
  - 해결: `frontend/src/vite-env.d.ts` 파일 확인
- `JSX elements cannot have multiple attributes`
  - 해결: 중복 속성 제거

---

### 문제: Artifact Registry 푸시 실패

**증상**: `name unknown: Repository "thinkblock" not found`

**해결 방법**:
```bash
# 저장소 생성 확인
gcloud artifacts repositories list --location=asia-northeast3

# 저장소가 없으면 생성
gcloud artifacts repositories create thinkblock \
  --repository-format=docker \
  --location=asia-northeast3
```

---

### 문제: 권한 오류

**증상**: `PERMISSION_DENIED: Permission 'artifactregistry.repositories.create' denied`

**해결 방법**:
1. Cloud Build 서비스 계정에 권한 부여 (위의 "Cloud Build 서비스 계정 권한 설정" 참조)
2. 또는 저장소를 수동으로 생성

---

### 문제: Firestore 연결 실패

**증상**: `Firebase Admin SDK initialization failed`

**해결 방법**:
1. Service Account 키 파일 확인
2. Firestore 데이터베이스 생성 확인
3. Service Account에 `datastore.user` 역할 확인

```bash
# Service Account 권한 확인
gcloud projects get-iam-policy thinkblock \
  --flatten="bindings[].members" \
  --filter="bindings.members:serviceAccount:thinkblock-sa@thinkblock.iam.gserviceaccount.com"
```

---

### 문제: Vertex AI 호출 실패

**증상**: `No module named 'vertexai'` 또는 `cannot import name 'GenerativeModel'`

**해결 방법**:
1. `requirements.txt`에 `google-cloud-aiplatform==1.38.1` 확인
2. Vertex AI API 활성화 확인
3. Service Account에 `aiplatform.user` 역할 확인

```bash
# Vertex AI API 활성화 확인
gcloud services list --enabled | grep aiplatform

# API 활성화 (필요 시)
gcloud services enable aiplatform.googleapis.com
```

---

### 문제: CORS 오류

**증상**: 브라우저 콘솔에 CORS 오류

**해결 방법**:
1. `backend/main.py`의 CORS 설정 확인
2. Cloud Run URL을 `cors_origins`에 추가
3. 환경 변수로 설정:

```bash
gcloud run services update thinkblock \
  --region=asia-northeast3 \
  --set-env-vars="CORS_ORIGINS=https://your-domain.com"
```

---

### 문제: 정적 파일이 로드되지 않음

**증상**: 페이지는 보이지만 리소스 로드 실패

**해결 방법**:
1. `Dockerfile`의 정적 파일 복사 경로 확인
2. `backend/main.py`의 정적 파일 마운트 경로 확인
3. 빌드 로그에서 파일 복사 확인

---

### 문제: Cloud Run 서비스가 시작되지 않음

**증상**: 서비스 상태가 "Starting"에서 멈춤

**해결 방법**:
1. 로그 확인: `gcloud run services logs read thinkblock --region=asia-northeast3`
2. 환경 변수 확인
3. 메모리 및 CPU 할당 확인:

```bash
gcloud run services update thinkblock \
  --region=asia-northeast3 \
  --memory=1Gi \
  --cpu=1
```

---

### 문제: AI 기능이 작동하지 않음

**증상**: AI 블록 생성/배치 실패

**해결 방법**:
1. Vertex AI API 활성화 확인
2. Service Account 권한 확인
3. 리전 설정 확인 (`us-central1` 권장)
4. 로그에서 상세 오류 확인

---

## 모니터링 및 유지보수

### 로그 모니터링

```bash
# 실시간 로그 스트리밍
gcloud run services logs tail thinkblock --region=asia-northeast3

# 특정 시간대 로그 확인
gcloud run services logs read thinkblock \
  --region=asia-northeast3 \
  --limit=100 \
  --format=json
```

### 성능 모니터링

Google Cloud Console에서:
- Cloud Run 메트릭 확인
- Firestore 사용량 확인
- Vertex AI 사용량 확인

### 비용 최적화

1. **Cloud Run**:
   - 최소 인스턴스 수 조정
   - 요청 타임아웃 설정
   - CPU 할당 조정

2. **Firestore**:
   - 인덱스 최적화
   - 쿼리 최적화

3. **Vertex AI**:
   - 요청 빈도 제한
   - 캐싱 활용 (향후 구현)

---

## 롤백

### 이전 버전으로 롤백

```bash
# 배포된 리비전 목록 확인
gcloud run revisions list --service=thinkblock --region=asia-northeast3

# 특정 리비전으로 롤백
gcloud run services update-traffic thinkblock \
  --region=asia-northeast3 \
  --to-revisions=REVISION_NAME=100
```

---

## 보안 체크리스트

- [ ] Service Account 키 파일이 `.gitignore`에 포함되어 있는지 확인
- [ ] Cloud Run 서비스에 최소 권한만 부여
- [ ] CORS 설정이 적절한지 확인
- [ ] 환경 변수에 민감한 정보가 없는지 확인
- [ ] Firestore 보안 규칙 설정 (필요 시)
- [ ] HTTPS만 사용 (Cloud Run 기본)

---

## 추가 리소스

- [Cloud Run 문서](https://cloud.google.com/run/docs)
- [Cloud Build 문서](https://cloud.google.com/build/docs)
- [Firestore 문서](https://cloud.google.com/firestore/docs)
- [Vertex AI 문서](https://cloud.google.com/vertex-ai/docs)

