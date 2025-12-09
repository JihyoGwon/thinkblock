# 리팩토링 및 효율화 가이드

이 문서는 ThinkBlock 프로젝트의 코드 전반을 검토하고 개선이 필요한 부분을 정리한 것입니다.

## 목차

1. [백엔드 리팩토링](#백엔드-리팩토링)
2. [프론트엔드 리팩토링](#프론트엔드-리팩토링)
3. [성능 최적화](#성능-최적화)
4. [코드 품질 개선](#코드-품질-개선)
5. [아키텍처 개선](#아키텍처-개선)

---

## 백엔드 리팩토링

### 1. API 라우터 분리 (우선순위: 높음) ✅ 완료

**현재 문제점:**
- ~~`backend/main.py`에 모든 API 엔드포인트가 한 파일에 집중되어 있음 (572줄)~~ ✅ **해결됨**
- ~~유지보수성과 가독성이 떨어짐~~ ✅ **해결됨**
- ~~테스트 작성이 어려움~~ ✅ **해결됨**

**개선 완료:**
```
backend/
├── main.py                    # FastAPI 앱 초기화만 담당 (약 60줄)
├── models.py                  # 공통 모델 정의
├── routers/
│   ├── __init__.py
│   ├── blocks.py              # 블록 관련 엔드포인트 (4개)
│   ├── projects.py            # 프로젝트 관련 엔드포인트 (6개)
│   ├── categories.py          # 카테고리 및 색상 관련 엔드포인트 (6개)
│   ├── dependencies.py        # 의존성 관련 엔드포인트 (3개)
│   └── ai.py                  # AI 관련 엔드포인트 (2개)
└── ...
```

**구현 내용:**
- 모든 엔드포인트를 기능별로 분리
- `main.py`는 앱 초기화와 라우터 등록만 담당
- 각 라우터는 독립적으로 관리 가능
- 테스트 작성 및 유지보수 용이성 향상

### 2. 저장소 추상화 개선 (우선순위: 높음) ✅ 완료

**현재 문제점:**
- ~~`_get_store_func()` 함수가 `globals()`를 사용하는 안티패턴~~ ✅ **완료**
- ~~메모리 스토어와 Firestore 간 인터페이스 불일치~~ ✅ **완료**
- ~~테스트 작성이 어려움~~ ✅ **완료**

**완료된 작업:**
- ✅ `StorageInterface` 추상 클래스 생성 (`backend/storage/base.py`)
- ✅ `MemoryStore`를 `StorageInterface` 구현하도록 수정 (`backend/storage/memory_store.py`)
- ✅ `FirestoreStore` 클래스 생성 (`backend/storage/firestore_store.py`)
- ✅ `main.py`에서 `globals()` 패턴 제거
- ✅ 모든 엔드포인트에서 `storage` 인스턴스 직접 사용
- ✅ 타입 안정성 향상 및 테스트 가능성 개선

**개선된 구조:**
```python
# storage/base.py
from abc import ABC, abstractmethod
from typing import List, Optional, Dict

class StorageInterface(ABC):
    @abstractmethod
    def get_all_blocks(self, project_id: str) -> List[dict]:
        pass
    
    # ... 기타 메서드

# storage/memory_store.py
class MemoryStore(StorageInterface):
    # 구현

# storage/firestore_store.py
class FirestoreStore(StorageInterface):
    # 구현

# main.py
from storage import StorageInterface, MemoryStore, FirestoreStore

def get_storage() -> StorageInterface:
    if USE_MEMORY_STORE:
        return MemoryStore()
    else:
        return FirestoreStore()

storage = get_storage()  # 전역 인스턴스

# 사용 예시
blocks = storage.get_all_blocks(project_id)  # ✅ 타입 안전, 명확함
```

### 3. 에러 처리 통합 (우선순위: 중간)

**현재 문제점:**
- 각 엔드포인트마다 동일한 에러 처리 패턴이 반복됨
- 에러 메시지가 일관되지 않음

**개선 방안:**
```python
# exceptions.py
class BlockNotFoundError(Exception):
    pass

class ProjectNotFoundError(Exception):
    pass

# middleware/error_handler.py
from fastapi import Request
from fastapi.responses import JSONResponse

@app.exception_handler(BlockNotFoundError)
async def block_not_found_handler(request: Request, exc: BlockNotFoundError):
    return JSONResponse(
        status_code=404,
        content={"detail": "블록을 찾을 수 없습니다"}
    )
```

### 4. AI 서비스 프롬프트 관리 (우선순위: 중간)

**현재 문제점:**
- `ai_service.py`에 긴 프롬프트 문자열이 하드코딩되어 있음
- 프롬프트 수정 시 코드 변경이 필요함
- 프롬프트 버전 관리가 어려움

**개선 방안:**
```
backend/
├── prompts/
│   ├── generate_blocks.txt
│   └── arrange_blocks.txt
└── ai_service.py
```

```python
# ai_service.py
def load_prompt(filename: str) -> str:
    prompt_path = pathlib.Path(__file__).parent / "prompts" / filename
    return prompt_path.read_text(encoding="utf-8")

def generate_blocks(...):
    prompt_template = load_prompt("generate_blocks.txt")
    prompt = prompt_template.format(
        project_overview=project_overview,
        # ...
    )
```

### 5. Firestore 쿼리 최적화 (우선순위: 중간)

**현재 문제점:**
- `get_all_blocks()`에서 모든 문서를 가져온 후 메모리에서 정렬
- 인덱스 활용이 부족함

**개선 방안:**
```python
# firestore_service.py
def get_all_blocks(project_id: str) -> List[dict]:
    blocks_ref = db.collection(PROJECTS_COLLECTION)\
        .document(project_id)\
        .collection(BLOCKS_COLLECTION)\
        .order_by("level")\
        .order_by("order")
    
    blocks = []
    for doc in blocks_ref.stream():
        block = doc.to_dict()
        block["id"] = doc.id
        blocks.append(block)
    
    return blocks
```

**필요한 인덱스:**
```json
// firestore.indexes.json에 추가
{
  "collectionGroup": "blocks",
  "queryScope": "COLLECTION",
  "fields": [
    { "fieldPath": "level", "order": "ASCENDING" },
    { "fieldPath": "order", "order": "ASCENDING" }
  ]
}
```

### 6. 의존성 주입 패턴 적용 (우선순위: 낮음)

**현재 문제점:**
- 함수들이 전역 변수에 의존
- 테스트 시 모킹이 어려움

**개선 방안:**
```python
# services/block_service.py
class BlockService:
    def __init__(self, storage: StorageInterface):
        self.storage = storage
    
    def create_block(self, project_id: str, block_data: dict) -> dict:
        return self.storage.create_block(project_id, block_data)

# routers/blocks.py
@router.post("")
async def create_block(
    project_id: str,
    block: BlockCreate,
    service: BlockService = Depends(get_block_service)
):
    return service.create_block(project_id, block.dict())
```

---

## 프론트엔드 리팩토링

### 1. App.tsx 컴포넌트 분리 (우선순위: 높음)

**현재 문제점:**
- `App.tsx`가 1173줄로 너무 큼
- 단일 책임 원칙 위반
- 유지보수가 어려움

**개선 방안:**
```
frontend/src/
├── App.tsx                    # 라우팅만 담당
├── pages/
│   └── ProjectPage.tsx        # 프로젝트 페이지 (현재 App.tsx 내용)
├── components/
│   ├── ProjectHeader.tsx      # 헤더 영역
│   ├── ProjectView.tsx        # 메인 뷰 영역
│   └── ProjectModals.tsx      # 모달 관리
└── hooks/
    ├── useConnectionMode.ts   # 연결선 모드 로직
    └── useDragMode.ts         # 드래그 모드 로직
```

**예시:**
```typescript
// components/ProjectHeader.tsx
export const ProjectHeader: React.FC<ProjectHeaderProps> = ({
  project,
  onProjectNameEdit,
  // ...
}) => {
  // 헤더 관련 로직만
};

// pages/ProjectPage.tsx
export const ProjectPage: React.FC = () => {
  const { projectId } = useParams();
  const { blocks, ... } = useBlocks(projectId);
  
  return (
    <div>
      <ProjectHeader {...headerProps} />
      <ProjectView {...viewProps} />
      <ProjectModals {...modalProps} />
    </div>
  );
};
```

### 2. 커스텀 훅 통합 (우선순위: 중간)

**현재 문제점:**
- `useProject.ts`와 `useProjectData.ts`가 중복 기능 제공
- `useProject.ts`가 사용되지 않는 것으로 보임

**개선 방안:**
```typescript
// hooks/useProject.ts 통합
export const useProject = (projectId: string | undefined) => {
  const { blocks, ... } = useBlocks(projectId);
  const { categories, categoryColors, project, ... } = useProjectData(projectId);
  
  return {
    blocks,
    categories,
    categoryColors,
    project,
    // ...
  };
};
```

### 3. API 서비스 에러 처리 개선 (우선순위: 중간)

**현재 문제점:**
- 각 API 함수마다 동일한 에러 처리 패턴 반복
- 에러 메시지가 일관되지 않음

**개선 방안:**
```typescript
// services/api.ts
class ApiError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public code?: string
  ) {
    super(message);
  }
}

const handleApiError = (error: unknown, defaultMessage: string): never => {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<{ detail?: string }>;
    const message = axiosError.response?.data?.detail || axiosError.message || defaultMessage;
    throw new ApiError(
      message,
      axiosError.response?.status,
      axiosError.code
    );
  }
  throw error instanceof Error ? error : new ApiError(defaultMessage);
};

// 사용 예시
export const api = {
  getBlocks: async (projectId: string): Promise<Block[]> => {
    try {
      const response = await apiClient.get(`/api/projects/${projectId}/blocks`);
      return response.data?.blocks || [];
    } catch (error) {
      return handleApiError(error, '블록 조회에 실패했습니다.');
    }
  },
};
```

### 4. PyramidView 성능 최적화 (우선순위: 중간)

**현재 문제점:**
- ~~`console.log`가 프로덕션 코드에 남아있음~~ ✅ **완료**
- `renderConnections()`가 매 렌더링마다 호출됨
- `useEffect` 의존성 배열이 과도함

**완료된 작업:**
- ✅ 로거 유틸리티 생성 (`frontend/src/utils/logger.ts`)
- ✅ 모든 `console.log` 제거 또는 `logger`로 교체
- ✅ 개발 환경에서만 로그 출력하도록 조건부 처리
- ✅ 프로덕션에서는 로그가 출력되지 않음

**남은 작업:**
```typescript
// PyramidView.tsx
// 2. renderConnections 메모이제이션
const connections = useMemo(() => {
  return renderConnections();
}, [containerRect, allBlocks, dependencyColors, selectedConnectionColor, isConnectionMode, isDragMode]);

// 3. useEffect 최적화
useEffect(() => {
  const updateBlockPositions = () => {
    // ...
  };
  
  updateBlockPositions();
  
  // 디바운싱 적용
  const timeout = setTimeout(updateBlockPositions, 100);
  const resizeObserver = new ResizeObserver(updateBlockPositions);
  
  return () => {
    clearTimeout(timeout);
    resizeObserver.disconnect();
  };
}, [allBlocks]); // 의존성 최소화
```

### 5. 타입 정의 통합 (우선순위: 낮음)

**현재 문제점:**
- 타입 정의가 여러 파일에 분산되어 있음
- 중복 정의 가능성

**개선 방안:**
```
frontend/src/
├── types/
│   ├── index.ts              # 모든 타입 re-export
│   ├── block.ts
│   ├── project.ts
│   ├── common.ts
│   └── api.ts                # API 응답 타입
```

### 6. 상수 관리 개선 (우선순위: 낮음)

**현재 문제점:**
- 상수가 여러 파일에 분산
- 매직 넘버 사용

**개선 방안:**
```typescript
// constants/index.ts
export const CONFIG = {
  API_TIMEOUT: 60000,
  DEFAULT_MAX_LEVEL: 4,
  DEBOUNCE_DELAY: 100,
} as const;

// 사용
const timeout = CONFIG.API_TIMEOUT;
```

---

## 성능 최적화

### 1. 불필요한 리렌더링 방지

**문제점:**
- `App.tsx`에서 많은 상태가 변경될 때 전체 컴포넌트 트리가 리렌더링됨

**개선 방안:**
```typescript
// React.memo 적용
export const PyramidView = React.memo<PyramidViewProps>(({ ... }) => {
  // ...
}, (prevProps, nextProps) => {
  // 커스텀 비교 로직
  return (
    prevProps.blocksByLevel === nextProps.blocksByLevel &&
    prevProps.maxLevel === nextProps.maxLevel &&
    // ...
  );
});

// useMemo로 계산 결과 캐싱
const blocksByLevel = useMemo(
  () => groupBlocksByLevel(blocks),
  [blocks]
);
```

### 2. API 호출 최적화

**문제점:**
- 블록 삭제 후 같은 레벨의 블록들을 개별적으로 업데이트
- 여러 API 호출이 순차적으로 발생

**개선 방안:**
```typescript
// 백엔드에 배치 업데이트 API 추가
// POST /api/projects/{project_id}/blocks/batch-update
{
  "updates": [
    { "id": "block1", "order": 0 },
    { "id": "block2", "order": 1 }
  ]
}

// 프론트엔드에서 사용
const updateBlocksBatch = async (updates: BlockUpdate[]) => {
  await api.updateBlocksBatch(projectId, updates);
};
```

### 3. 연결선 렌더링 최적화

**문제점:**
- 연결선이 매 렌더링마다 다시 그려짐
- 많은 블록이 있을 때 성능 저하

**개선 방안:**
```typescript
// Canvas 기반 렌더링으로 변경
// 또는 WebGL 사용
// 또는 가상화 적용 (보이는 연결선만 렌더링)
```

### 4. 이미지/에셋 최적화

**문제점:**
- SVG 아이콘이 인라인으로 포함되어 있음

**개선 방안:**
- SVG를 별도 파일로 분리
- 필요시 스프라이트 시트 사용
- 이미지 최적화 (WebP 형식 등)

---

## 코드 품질 개선

### 1. 테스트 코드 작성 (우선순위: 높음)

**현재 상태:**
- 테스트 코드가 전혀 없음

**개선 방안:**
```
backend/
├── tests/
│   ├── test_blocks.py
│   ├── test_projects.py
│   └── test_ai_service.py
frontend/
├── src/
│   └── __tests__/
│       ├── components/
│       └── hooks/
```

**예시:**
```python
# backend/tests/test_blocks.py
import pytest
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_create_block():
    response = client.post(
        "/api/projects/test-project/blocks",
        json={"title": "Test", "description": "Test", "level": 0}
    )
    assert response.status_code == 200
    assert response.json()["block"]["title"] == "Test"
```

```typescript
// frontend/src/__tests__/hooks/useBlocks.test.tsx
import { renderHook, waitFor } from '@testing-library/react';
import { useBlocks } from '../hooks/useBlocks';

describe('useBlocks', () => {
  it('should fetch blocks', async () => {
    const { result } = renderHook(() => useBlocks('test-project'));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.blocks).toHaveLength(0);
  });
});
```

### 2. 타입 안정성 강화

**문제점:**
- `any` 타입 사용
- 타입 가드 부족

**개선 방안:**
```typescript
// 타입 가드 추가
function isBlock(obj: any): obj is Block {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    typeof obj.id === 'string' &&
    typeof obj.title === 'string'
  );
}

// 사용
if (isBlock(data)) {
  // 타입 안전하게 사용 가능
}
```

### 3. 에러 바운더리 추가

**문제점:**
- React 에러 바운더리가 없음
- 에러 발생 시 전체 앱이 크래시됨

**개선 방안:**
```typescript
// components/ErrorBoundary.tsx
class ErrorBoundary extends React.Component<Props, State> {
  // 구현
}

// App.tsx
<ErrorBoundary>
  <ProjectPage />
</ErrorBoundary>
```

### 4. 로깅 시스템 구축

**문제점:**
- `console.log` 사용
- 프로덕션 로깅이 없음

**개선 방안:**
```typescript
// utils/logger.ts
export const logger = {
  info: (message: string, ...args: any[]) => {
    if (import.meta.env.DEV) {
      console.log(`[INFO] ${message}`, ...args);
    }
    // 프로덕션에서는 외부 로깅 서비스로 전송
  },
  error: (message: string, error?: Error) => {
    console.error(`[ERROR] ${message}`, error);
    // 에러 트래킹 서비스로 전송 (예: Sentry)
  },
};
```

---

## 아키텍처 개선

### 1. 상태 관리 라이브러리 도입 검토

**현재 상태:**
- React Context나 전역 상태 관리가 없음
- Props drilling 발생

**검토 사항:**
- Zustand 또는 Jotai 같은 경량 상태 관리 라이브러리 도입
- Redux는 과도할 수 있음

### 2. API 클라이언트 개선

**문제점:**
- Axios 인스턴스가 단순함
- 요청/응답 인터셉터 부족

**개선 방안:**
```typescript
// services/apiClient.ts
apiClient.interceptors.request.use((config) => {
  // 인증 토큰 추가
  const token = getAuthToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // 인증 실패 처리
      await refreshToken();
      return apiClient.request(error.config);
    }
    return Promise.reject(error);
  }
);
```

### 3. 환경 변수 관리

**문제점:**
- 환경 변수가 하드코딩되어 있음
- 타입 안정성 부족

**개선 방안:**
```typescript
// config/env.ts
const env = {
  API_URL: import.meta.env.VITE_API_URL || 'http://localhost:8002',
  API_TIMEOUT: Number(import.meta.env.VITE_API_TIMEOUT) || 60000,
} as const;

export default env;
```

### 4. 코드 스플리팅

**문제점:**
- 모든 코드가 한 번에 로드됨
- 초기 로딩 시간이 길 수 있음

**개선 방안:**
```typescript
// lazy loading 적용
const ProjectPage = lazy(() => import('./pages/ProjectPage'));
const ProjectsPage = lazy(() => import('./pages/ProjectsPage'));

// Suspense로 감싸기
<Suspense fallback={<Loading />}>
  <Routes>
    <Route path="/projects/:projectId" element={<ProjectPage />} />
  </Routes>
</Suspense>
```

---

## 우선순위별 실행 계획

### Phase 1 (즉시 실행)
1. ⏳ App.tsx 컴포넌트 분리
2. ✅ **API 라우터 분리** - **완료**
   - `backend/models.py` 생성 (공통 모델 정의)
   - `backend/routers/` 디렉토리 생성
   - `routers/blocks.py` - 블록 관련 엔드포인트 (4개)
   - `routers/projects.py` - 프로젝트 관련 엔드포인트 (6개)
   - `routers/categories.py` - 카테고리 및 색상 관련 엔드포인트 (6개)
   - `routers/dependencies.py` - 의존성 관련 엔드포인트 (3개)
   - `routers/ai.py` - AI 관련 엔드포인트 (2개)
   - `main.py` 간소화 (523줄 → 약 60줄)
   - 모든 엔드포인트를 기능별로 분리하여 유지보수성 향상
3. ✅ **저장소 추상화 개선** - **완료**
   - `StorageInterface` 추상 클래스 생성
   - `MemoryStore`와 `FirestoreStore` 구현
   - `globals()` 안티패턴 제거
   - 모든 엔드포인트에서 타입 안전한 인터페이스 사용
4. ✅ **console.log 제거** - **완료**
   - 로거 유틸리티 생성 (`frontend/src/utils/logger.ts`)
   - 모든 파일의 `console.log` 제거 또는 `logger`로 교체
   - 개발 환경에서만 로그 출력, 프로덕션에서는 출력 안 함

### Phase 2 (단기)
1. 에러 처리 통합
2. 커스텀 훅 통합
3. 테스트 코드 작성 시작
4. Firestore 쿼리 최적화

### Phase 3 (중기)
1. AI 서비스 프롬프트 관리
2. 성능 최적화 (리렌더링, API 호출)
3. 타입 안정성 강화
4. 로깅 시스템 구축

### Phase 4 (장기)
1. 상태 관리 라이브러리 도입 검토
2. 코드 스플리팅
3. 에러 바운더리 추가
4. 의존성 주입 패턴 적용

---

## 참고 사항

- 리팩토링은 점진적으로 진행해야 함
- 각 단계마다 테스트를 작성하고 통과하는지 확인
- 기능 추가보다 리팩토링을 우선시할지 팀과 논의 필요
- 성능 측정 도구를 사용하여 개선 효과를 정량적으로 확인

