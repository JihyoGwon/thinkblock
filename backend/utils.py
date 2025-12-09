"""
공통 유틸리티 함수
"""
import os
import pathlib
from typing import Optional, Callable, Any
from functools import wraps


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


def get_store_operation(use_memory_store: bool):
    """
    메모리 스토어 또는 Firestore를 선택하는 데코레이터 팩토리
    
    Args:
        use_memory_store: 메모리 스토어 사용 여부
    
    Returns:
        데코레이터 함수
    """
    def decorator(func: Callable) -> Callable:
        @wraps(func)
        async def wrapper(*args, **kwargs):
            if use_memory_store:
                from memory_store import memory_store as store
                # store 객체를 kwargs에 추가
                kwargs['store'] = store
            else:
                # Firestore 함수들을 kwargs에 추가
                from firestore_service import (
                    get_all_blocks,
                    get_block,
                    create_block,
                    update_block,
                    delete_block,
                    get_categories,
                    update_categories,
                    create_project,
                    get_project,
                    get_all_projects,
                    update_project,
                    delete_project,
                )
                kwargs['get_all_blocks'] = get_all_blocks
                kwargs['get_block'] = get_block
                kwargs['create_block'] = create_block
                kwargs['update_block'] = update_block
                kwargs['delete_block'] = delete_block
                kwargs['get_categories'] = get_categories
                kwargs['update_categories'] = update_categories
                kwargs['create_project'] = create_project
                kwargs['get_project'] = get_project
                kwargs['get_all_projects'] = get_all_projects
                kwargs['update_project'] = update_project
                kwargs['delete_project'] = delete_project
            
            return await func(*args, **kwargs)
        return wrapper
    return decorator

