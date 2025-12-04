# ThinkBlock

시스템적 사고를 돕는 협의 도구. 블록을 나열하고 계층화하여 전체적인 구조를 시각화합니다.

## 프로젝트 개요

ThinkBlock은 사람들이 시스템적 사고를 할 수 있도록 돕는 도구입니다. 원하는 기능들을 블록으로 나열하고, 드래그 앤 드롭으로 계층화하여 피라미드 형태로 시각화합니다. 가장 아래 레벨(기반)은 먼저 구축해야 할 것들, 가장 위 레벨(목표)은 나중에 달성할 수 있는 것들로 구성됩니다.

## 프로젝트 구조

```
thinkblock/
├── frontend/          # React 웹 애플리케이션
│   ├── src/
│   │   ├── components/    # React 컴포넌트
│   │   │   ├── Block.tsx
│   │   │   ├── BlockForm.tsx
│   │   │   ├── BlockInput.tsx
│   │   │   ├── BlockList.tsx
│   │   │   ├── PyramidView.tsx
│   │   │   ├── TableView.tsx
│   │   │   ├── CategoryDropdown.tsx
│   │   │   ├── CategoryManager.tsx
│   │   │   ├── ProjectSelector.tsx
│   │   │   ├── AIGenerateBlocksModal.tsx
│   │   │   ├── AIArrangeBlocksModal.tsx
│   │   │   └── ArrangementReasoningModal.tsx
│   │   ├── services/      # API 서비스
│   │   ├── types/         # TypeScript 타입 정의
│   │   ├── constants/     # 상수 정의
│   │   └── utils/         # 유틸리티 함수
│   └── package.json
├── backend/           # Python FastAPI 백엔드
│   ├── main.py            # FastAPI 메인 서버
│   ├── ai_service.py      # Vertex AI 연동 서비스
│   ├── firestore_service.py  # Firestore 연동 서비스
│   ├── memory_store.py     # 로컬 테스트용 인메모리 저장소
│   ├── config.py          # 설정 파일
│   ├── run_local.py       # 로컬 테스트 실행 스크립트
│   └── requirements.txt
├── Dockerfile         # Docker 이미지 빌드 파일
├── cloudbuild.yaml    # Google Cloud Build 설정
├── firestore.indexes.json  # Firestore 인덱스 설정
└── README.md
```

## 기술 스택

- **Frontend**: React, TypeScript, Vite, @dnd-kit, react-router-dom
- **Backend**: Python, FastAPI, Uvicorn
- **Database**: Google Firestore
- **AI**: Google Vertex AI (Gemini 2.5 Flash)
- **Deployment**: Google Cloud Platform (Cloud Run, Cloud Build, Artifact Registry)

## 주요 기능

### 블록 관리
- ✅ 블록 생성/수정/삭제 (제목, 설명, 카테고리)
- ✅ 드래그 앤 드롭으로 블록 계층화 (레벨 0-5)
- ✅ 같은 레벨 내 블록 순서 변경
- ✅ 전체 블록 초기화

### 시각화
- ✅ 피라미드 뷰: 계층 구조를 피라미드 형태로 시각화
- ✅ 테이블 뷰: 블록을 표 형식으로 확인 및 관리
- ✅ 레벨별 색상 구분 및 태그 표시

### 프로젝트 관리
- ✅ 프로젝트 생성/수정/삭제
- ✅ 프로젝트 복제 (블록만 복사 또는 전체 구조 복사)
- ✅ 프로젝트 목록 조회 및 선택

### 카테고리 관리
- ✅ 카테고리 추가/수정/삭제
- ✅ 블록에 카테고리 할당 (Notion 스타일 드롭다운)

### AI 기능
- ✅ **AI 블록 생성**: 프로젝트 개요를 입력하면 AI가 체계적인 사고 과정을 거쳐 블록을 자동 생성 (최소 20개)
- ✅ **프로젝트 분석 저장**: 생성된 프로젝트 분석(project_analysis)이 자동으로 프로젝트에 저장
- ✅ **AI 블록 배치**: 선택한 블록들을 AI가 체계적으로 분석하여 적절한 레벨에 자동 배치
- ✅ **배치 이유 확인**: AI가 블록을 배치한 체계적인 사고 과정과 이유를 확인할 수 있는 플로팅 버튼
- ✅ **배치 이유 영구 저장**: 배치 이유가 프로젝트에 저장되어 페이지 새로고침 후에도 확인 가능

## 로컬 개발 환경 설정

### 사전 요구사항

- Python 3.11+
- Node.js 18+
- Google Cloud 계정 (Firestore 및 Vertex AI 사용 시)
- `vertex-ai-thinkblock.json` 파일 (프로젝트 루트에 위치)

### 환경 변수 설정

프로젝트 루트에 `.env` 파일 생성:

```bash
GOOGLE_APPLICATION_CREDENTIALS=vertex-ai-thinkblock.json
GOOGLE_CLOUD_PROJECT=thinkblock
VERTEX_AI_LOCATION=us-central1
USE_MEMORY_STORE=false
```

### 빠른 시작

프로젝트 루트에서:

```bash
python app.py
```

이 명령어 하나로 백엔드와 프론트엔드가 동시에 실행됩니다!

- 프론트엔드: `http://localhost:5173`
- 백엔드: `http://localhost:8002`

### 개별 실행

#### 백엔드 실행

```bash
cd backend
python -m venv venv
# Windows
venv\Scripts\activate
# macOS/Linux
source venv/bin/activate

pip install -r requirements.txt
python run_local.py
```

#### 프론트엔드 실행

```bash
cd frontend
npm install
npm run dev
```

## 배포

### Google Cloud Platform 배포

1. Artifact Registry 저장소 생성:
```bash
gcloud artifacts repositories create thinkblock \
  --repository-format=docker \
  --location=asia-northeast3
```

2. Cloud Build로 배포:
```bash
gcloud builds submit --config=cloudbuild.yaml
```

3. Cloud Run 서비스 확인:
```bash
gcloud run services list
```

## 사용 방법

### 기본 워크플로우

1. **프로젝트 생성**: 프로젝트 목록 페이지에서 "새 프로젝트" 버튼 클릭
2. **블록 추가**: 
   - 왼쪽 입력 영역에서 "+" 버튼 클릭 후 제목 입력
   - 또는 AI 버튼 → "블록 생성"으로 AI가 자동 생성
3. **블록 편집**: 블록을 더블클릭하여 제목, 설명, 카테고리 수정
4. **계층화**: 
   - 블록을 드래그하여 피라미드의 원하는 레벨로 이동
   - 또는 AI 버튼 → "블록 배치"로 AI가 자동 배치
5. **확인**: 피라미드 뷰 또는 테이블 뷰에서 구조 확인

### 레벨 설명

- **레벨 0 (기반)**: 가장 먼저 구축해야 할 기반 인프라, 기본 설정
- **레벨 1-4**: 단계별 핵심 기능 및 고급 기능
- **레벨 5 (목표)**: 최종적으로 달성하고자 하는 목표

## API 문서

백엔드 실행 후 `http://localhost:8002/docs`에서 Swagger UI로 API 문서를 확인할 수 있습니다.

## 데이터 모델

### Firestore 구조

```
projects/
  {projectId}/
    blocks/
      {blockId}/
        - id: string
        - title: string
        - description: string
        - level: number (0-5)
        - order: number
        - category: string (optional)
    metadata/
      categories/
        - categories: string[]
    - name: string
    - createdAt: timestamp
    - updatedAt: timestamp
```

## 향후 계획

- [ ] 블록 간 의존성 표시 및 연결선
- [ ] 블록에 추가 정보 필드 확장 (우선순위, 예상 시간, 담당자 등)
- [ ] 협업 기능 (여러 사용자가 동시에 편집)
- [ ] 블록 내보내기/가져오기 (JSON, CSV)
- [ ] 히스토리 관리 (변경 이력 추적)
- [ ] 템플릿 기능

## 라이선스

MIT License
