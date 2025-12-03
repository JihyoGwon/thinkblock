"""
로컬 테스트용 실행 스크립트
환경 변수 USE_MEMORY_STORE가 설정되지 않으면 Firestore 사용 (기본값)
USE_MEMORY_STORE=true로 설정하면 인메모리 저장소 사용
"""
import os
import uvicorn

# 환경 변수가 설정되지 않았을 때만 기본값 설정 (Firestore 사용)
if "USE_MEMORY_STORE" not in os.environ:
    os.environ["USE_MEMORY_STORE"] = "false"

if __name__ == "__main__":
    import sys
    import io
    
    # Windows에서 UTF-8 인코딩 설정
    if sys.platform == 'win32':
        sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
        sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')
    
    port = int(os.getenv("PORT", "8002"))  # 기본 포트를 8002로 변경
    print("ThinkBlock 백엔드 서버 시작 (로컬 테스트 모드)")
    print("인메모리 저장소를 사용합니다")
    print(f"http://localhost:{port} 에서 실행 중...")
    print(f"API 문서: http://localhost:{port}/docs")
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)

