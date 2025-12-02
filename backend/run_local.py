"""
로컬 테스트용 실행 스크립트
Firestore 설정 없이 인메모리 저장소로 실행
"""
import os
import uvicorn

# 인메모리 저장소 사용하도록 설정
os.environ["USE_MEMORY_STORE"] = "true"

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

