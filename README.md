<<<<<<< HEAD
# ThinkBlock

시스템적 사고를 돕는 협의 도구. 블록을 나열하고 계층화하여 전체적인 구조를 시각화합니다.

## 프로젝트 구조

```
thinkblock/
├── frontend/          # React 웹 애플리케이션
│   ├── src/
│   │   ├── components/    # React 컴포넌트
│   │   ├── services/      # API 서비스
│   │   └── types/         # TypeScript 타입 정의
│   └── package.json
├── backend/           # Python FastAPI 백엔드
│   ├── main.py            # FastAPI 메인 서버
│   ├── firestore_service.py  # Firestore 연동 서비스
│   ├── memory_store.py     # 로컬 테스트용 인메모리 저장소
│   ├── run_local.py       # 로컬 테스트 실행 스크립트
│   └── requirements.txt
└── README.md
```

## 기술 스택

- **Frontend**: React, TypeScript, Vite, @dnd-kit
- **Backend**: Python, FastAPI
- **Database**: Google Firestore (또는 로컬 테스트용 인메모리 저장소)
- **Deployment**: Google Cloud Platform

## 주요 기능

- 블록 생성/수정/삭제 (제목, 설명)
- 드래그 앤 드롭으로 블록 계층화
- 피라미드 형태 시각화 (레벨별 색상 구분)
- Firestore를 통한 데이터 저장 (또는 인메모리 저장소)

## 로컬 테스트 (빠른 시작)

### 백엔드 실행

1. 백엔드 디렉토리로 이동:
```bash
cd backend
```

2. 가상환경 생성 및 활성화:
```bash
python -m venv venv
# Windows
venv\Scripts\activate
# macOS/Linux
source venv/bin/activate
```

3. 의존성 설치:
```bash
pip install -r requirements.txt
```

4. 로컬 테스트 모드로 실행 (Firestore 설정 불필요):
```bash
python run_local.py
```

백엔드가 `http://localhost:8000`에서 실행됩니다.

### 프론트엔드 실행

1. 프론트엔드 디렉토리로 이동:
```bash
cd frontend
```

2. 의존성 설치:
```bash
npm install
```

3. 개발 서버 실행:
```bash
npm run dev
```

4. 브라우저에서 표시된 주소 (보통 `http://localhost:5173`) 접속

## Firestore 사용하기 (프로덕션)

로컬 테스트가 아닌 실제 Firestore를 사용하려면:

1. `.env` 파일 생성:
```bash
USE_MEMORY_STORE=false
FIREBASE_CREDENTIALS_PATH=path/to/firebase-credentials.json
FIREBASE_PROJECT_ID=your-project-id
```

2. `requirements.txt`에서 Firestore 관련 패키지 주석 해제

3. 백엔드 실행:
```bash
python main.py
```

## 사용 방법

1. **블록 추가**: 상단의 "+ 블록 추가" 버튼 클릭
2. **블록 편집**: 블록의 "수정" 버튼 클릭
3. **블록 삭제**: 블록의 "삭제" 버튼 클릭
4. **계층화**: 블록을 드래그하여 다른 레벨로 이동
5. **정렬**: 같은 레벨 내에서 블록을 드래그하여 순서 변경

## API 문서

백엔드 실행 후 `http://localhost:8000/docs`에서 Swagger UI로 API 문서를 확인할 수 있습니다.

## 향후 계획

- AI 피드백 기능 (계층화 제안, 리스크 분석)
- 블록 간 의존성 표시 및 연결선
- 블록에 추가 정보 필드 확장 (우선순위, 예상 시간 등)
- 협업 기능 (여러 사용자가 동시에 편집)
=======
# thinkblock
>>>>>>> 0064c327988118c25b8aa52d6e11c65a3c899230
