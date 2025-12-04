# ThinkBlock 아키텍처 문서

## 시스템 개요

ThinkBlock은 프론트엔드(React)와 백엔드(FastAPI)로 구성된 풀스택 웹 애플리케이션입니다. Google Firestore를 데이터베이스로 사용하며, Google Vertex AI를 통한 AI 기능을 제공합니다.

## 전체 아키텍처

```
┌─────────────────┐
│   React Client  │  (Vite Dev Server / Static Files)
│   (Frontend)    │
└────────┬────────┘
         │ HTTP/REST API
         │
┌────────▼────────┐
│  FastAPI Server │  (Uvicorn ASGI Server)
│   (Backend)     │
└────────┬────────┘
         │
    ┌────┴────┐
    │         │
┌───▼───┐ ┌──▼────────┐
│Firestore│ │ Vertex AI │
│  (DB)   │ │  (AI)     │
└────────┘ └───────────┘
```

## 프론트엔드 아키텍처

### 기술 스택
- **프레임워크**: React 18+ with TypeScript
- **빌드 도구**: Vite
- **라우팅**: react-router-dom
- **드래그 앤 드롭**: @dnd-kit/core, @dnd-kit/sortable
- **HTTP 클라이언트**: Axios

### 컴포넌트 구조

```
App.tsx (루트 컴포넌트)
├── ProjectSelector.tsx (프로젝트 선택 화면)
└── App (메인 애플리케이션)
    ├── Header
    │   ├── 프로젝트 이름 편집
    │   ├── 프로젝트 목록 버튼
    │   ├── 카테고리 관리 버튼
    │   └── 초기화 버튼
    ├── Tabs.tsx
    │   ├── Tab 0: PyramidView
    │   └── Tab 1: TableView
    ├── BlockInput.tsx (블록 추가 입력)
    ├── BlockList.tsx (미배치 블록 목록)
    ├── PyramidView.tsx (피라미드 뷰)
    │   ├── DropZone.tsx (드롭 영역)
    │   └── Block.tsx (개별 블록)
    ├── TableView.tsx (테이블 뷰)
    ├── BlockForm.tsx (블록 편집 모달)
    ├── CategoryManager.tsx (카테고리 관리 모달)
    ├── AIGenerateBlocksModal.tsx (AI 블록 생성 모달)
    ├── AIArrangeBlocksModal.tsx (AI 블록 배치 모달)
    ├── ArrangementReasoningModal.tsx (배치 이유 모달)
    └── FloatingButton (AI 배치 이유 버튼)
```

### 상태 관리

- **로컬 상태**: React useState, useMemo
- **서버 상태**: API 호출을 통한 데이터 동기화
- **라우팅 상태**: react-router-dom의 useParams, useNavigate

### 주요 상태

```typescript
// App.tsx의 주요 상태
- blocks: Block[]                    // 모든 블록 목록
- categories: string[]                // 카테고리 목록
- project: { id, name }              // 현재 프로젝트 정보
- activeTab: number                  // 현재 활성 탭 (0: 피라미드, 1: 테이블)
- arrangementReasoning: string        // AI 배치 이유
```

### 데이터 흐름

1. **초기 로드**
   ```
   App 마운트 → projectId 확인 → API 호출
   → 프로젝트 정보 로드
   → 블록 목록 로드
   → 카테고리 목록 로드
   → 상태 업데이트 → UI 렌더링
   ```

2. **블록 생성**
   ```
   BlockInput → API 호출 → 백엔드 저장
   → Firestore 저장 → 응답 반환
   → 프론트엔드 상태 업데이트 → UI 갱신
   ```

3. **드래그 앤 드롭**
   ```
   사용자 드래그 → DndContext 이벤트
   → handleDragEnd 호출
   → 레벨/순서 계산 → API 호출
   → Firestore 업데이트 → 상태 동기화
   ```

## 백엔드 아키텍처

### 기술 스택
- **프레임워크**: FastAPI
- **서버**: Uvicorn (ASGI)
- **데이터베이스**: Google Firestore
- **AI**: Google Vertex AI (Gemini 2.5 Flash)
- **인증**: Firebase Admin SDK

### 디렉토리 구조

```
backend/
├── main.py                 # FastAPI 앱 진입점, API 엔드포인트 정의
├── firestore_service.py    # Firestore CRUD 로직
├── ai_service.py          # Vertex AI 연동 로직
├── memory_store.py        # 로컬 테스트용 인메모리 저장소
├── config.py              # 설정 관리
└── run_local.py           # 로컬 실행 스크립트
```

### API 엔드포인트 구조

```
/api/projects
  GET    /                    # 프로젝트 목록 조회
  POST   /                    # 프로젝트 생성
  GET    /{project_id}        # 프로젝트 조회
  PUT    /{project_id}        # 프로젝트 수정
  DELETE /{project_id}        # 프로젝트 삭제
  POST   /{project_id}/duplicate  # 프로젝트 복제

/api/projects/{project_id}/blocks
  GET    /                    # 블록 목록 조회
  POST   /                    # 블록 생성
  GET    /{block_id}          # 블록 조회
  PUT    /{block_id}          # 블록 수정
  DELETE /{block_id}          # 블록 삭제

/api/projects/{project_id}/categories
  GET    /                    # 카테고리 목록 조회
  PUT    /                    # 카테고리 업데이트

/api/projects/{project_id}/ai
  POST   /generate-blocks     # AI 블록 생성
  POST   /arrange-blocks     # AI 블록 배치
```

### 서비스 레이어

#### firestore_service.py
- Firestore 연결 관리
- 프로젝트 CRUD
- 블록 CRUD
- 카테고리 관리
- 프로젝트 복제 로직

#### ai_service.py
- Vertex AI 초기화
- AI 블록 생성 (프롬프트 엔지니어링)
- AI 블록 배치 (의존성 분석, 레벨 배정)
- 응답 파싱 및 검증

### 데이터 모델

#### Block
```python
{
    "id": str,              # Firestore 문서 ID
    "title": str,           # 블록 제목
    "description": str,     # 블록 설명
    "level": int,           # 레벨 (0-5, -1은 미배치)
    "order": int,           # 같은 레벨 내 순서
    "category": str | None # 카테고리
}
```

#### Project
```python
{
    "id": str,                      # 프로젝트 ID
    "name": str,                    # 프로젝트 이름
    "createdAt": timestamp,         # 생성 시간
    "updatedAt": timestamp,         # 수정 시간
    "project_analysis": str,        # AI 생성 프로젝트 분석 (선택사항)
    "arrangement_reasoning": str    # AI 배치 이유 (선택사항)
}
```

### Firestore 구조

```
projects/
  {projectId}/
    blocks/
      {blockId}/
        - id: string
        - title: string
        - description: string
        - level: number
        - order: number
        - category: string (optional)
    metadata/
      categories/
        - categories: string[]
    - name: string
    - createdAt: timestamp
    - updatedAt: timestamp
    - project_analysis: string (optional)      # AI 생성 프로젝트 분석
    - arrangement_reasoning: string (optional) # AI 배치 이유
```

## AI 통합

### Vertex AI 사용

- **모델**: `gemini-2.0-flash-exp` (Gemini 2.5 Flash는 현재 사용 불가)
- **위치**: 환경 변수 `VERTEX_AI_LOCATION` (기본값: `asia-northeast3`)
- **인증**: Service Account JSON 파일 (`GOOGLE_APPLICATION_CREDENTIALS`)
- **프로젝트 ID**: 환경 변수 `GOOGLE_CLOUD_PROJECT`

### AI 블록 생성 프로세스

1. 사용자 입력 (프로젝트 개요, 진행 상황, 문제점, 참고사항)
2. 체계적인 사고 과정(thinking_process)을 포함한 프롬프트 생성:
   - 프로젝트 핵심 분석
   - 카테고리 체계 설계
   - 블록 범위 및 우선순위 결정
   - 블록 생성 계획
   - 서비스 설계자 관점의 검토
   - 최종 블록 생성
3. Vertex AI 호출 (Gemini 2.0 Flash Exp)
4. JSON 파싱 및 검증 (thinking_process와 blocks 추출)
5. 프로젝트 분석(project_analysis) 추출 및 프로젝트에 저장
6. 블록 생성 (레벨 -1, 기본 카테고리)
7. Firestore 저장

### AI 블록 배치 프로세스

1. 사용자가 배치할 블록 선택
2. 저장된 프로젝트 분석(project_analysis) 조회
3. 블록 정보 수집 (제목, 설명, 카테고리)
4. 체계적인 사고 과정(thinking_process)을 포함한 프롬프트 생성:
   - 프로젝트 분석 (project_analysis 활용)
   - 레벨 5 (목표) 분석
   - 레벨별 목표 설정
   - 의존성 및 우선순위 분석
   - 서비스 설계자 관점의 조언
   - 최종 배치 결정
5. Vertex AI 호출 (Gemini 2.0 Flash Exp)
6. 레벨 배정 및 배치 이유(reasoning) 추출
7. Firestore 업데이트 (블록 레벨 업데이트)
8. 배치 이유(reasoning)를 프로젝트에 저장

## 보안 및 인증

### Firestore 인증
- **로컬**: Service Account JSON 파일 (`vertex-ai-thinkblock.json`)
- **프로덕션**: Google Cloud 기본 인증 (Cloud Run 서비스 계정)

### CORS 설정
- 개발: `http://localhost:3000, http://localhost:5173, http://localhost:5174`
- 프로덕션: 환경 변수로 설정 가능

## 성능 최적화

### 프론트엔드
- React.memo를 통한 불필요한 리렌더링 방지
- useMemo를 통한 계산 결과 캐싱
- 드래그 앤 드롭 최적화 (@dnd-kit)

### 백엔드
- Firestore 쿼리 최적화 (인덱스 사용)
- AI 응답 타임아웃 설정 (60초)
- 비동기 처리 (FastAPI async/await)

## 에러 처리

### 프론트엔드
- API 호출 실패 시 사용자 알림
- 네트워크 오류 처리
- AI 호출 실패 시 재시도 버튼 제공

### 백엔드
- HTTP 예외 처리 (FastAPI HTTPException)
- AI 응답 파싱 실패 처리
- Firestore 오류 처리

## 배포 아키텍처

### Google Cloud Platform

```
Cloud Build (CI/CD)
  ↓
Artifact Registry (Docker 이미지)
  ↓
Cloud Run (컨테이너 실행)
  ├── Frontend (Static Files)
  └── Backend (FastAPI)
      ├── Firestore
      └── Vertex AI
```

### Docker 구조
- Multi-stage build
- Stage 1: Frontend 빌드 (Vite)
- Stage 2: Backend + Frontend 통합

## 확장성 고려사항

### 현재 제한사항
- 단일 사용자 환경
- 실시간 동기화 없음
- 파일 업로드 미지원

### 향후 개선 방향
- WebSocket을 통한 실시간 협업
- 사용자 인증 및 권한 관리
- 파일 첨부 기능
- 히스토리 관리 및 되돌리기

