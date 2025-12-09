"""
공통 유틸리티 함수
"""
import os
import pathlib
from typing import Optional


def find_credentials_file() -> Optional[str]:
    """
    인증 파일 경로를 찾는 공통 함수
    Firestore와 Vertex AI 모두에서 사용
    """
    project_root = pathlib.Path(__file__).parent.parent
    possible_paths = [
        project_root / "vertex-ai-thinkblock.json",
        project_root / "firebase-credentials.json",
    ]
    
    # 환경 변수에서 경로 확인
    env_cred_path = os.getenv("GOOGLE_APPLICATION_CREDENTIALS")
    env_firebase_path = os.getenv("FIREBASE_CREDENTIALS_PATH")
    cred_path = env_cred_path or env_firebase_path
    
    if cred_path:
        # 상대 경로인 경우 프로젝트 루트 기준으로 변환
        if not os.path.isabs(cred_path):
            cred_path = str(project_root / cred_path)
        
        # 절대 경로로 변환
        cred_path = str(pathlib.Path(cred_path).absolute())
        
        if os.path.exists(cred_path):
            print(f"🔍 인증 파일 찾음 (환경 변수): {cred_path}")
            return cred_path
        else:
            print(f"⚠️  환경 변수에 지정된 파일이 존재하지 않음: {cred_path}")
    
    # 프로젝트 루트에서 찾기
    for path in possible_paths:
        abs_path = path.absolute()
        if path.exists():
            print(f"🔍 인증 파일 찾음 (프로젝트 루트): {abs_path}")
            return str(abs_path)
        else:
            print(f"🔍 확인한 경로 (존재하지 않음): {abs_path}")
    
    print(f"⚠️  인증 파일을 찾을 수 없습니다. 프로젝트 루트: {project_root.absolute()}")
    return None



