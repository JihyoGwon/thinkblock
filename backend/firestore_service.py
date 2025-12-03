import firebase_admin
from firebase_admin import credentials, firestore
from typing import List, Optional
from pydantic import BaseModel
import os

# Firestore 초기화
def init_firestore():
    if not firebase_admin._apps:
        cred_path = os.getenv("FIREBASE_CREDENTIALS_PATH")
        
        # 환경 변수가 없으면 프로젝트 루트에서 찾기
        if not cred_path:
            import pathlib
            project_root = pathlib.Path(__file__).parent.parent
            possible_paths = [
                project_root / "vertex-ai-thinkblock.json",
                project_root / "firebase-credentials.json",
            ]
            for path in possible_paths:
                if path.exists():
                    cred_path = str(path)
                    break
        
        if cred_path and os.path.exists(cred_path):
            try:
                cred = credentials.Certificate(cred_path)
                firebase_admin.initialize_app(cred)
                print(f"✅ Firestore 인증 파일 사용: {cred_path}")
            except Exception as e:
                print(f"⚠️  인증 파일 로드 실패: {e}")
                # 기본 인증 시도 (gcloud auth application-default login 사용)
                try:
                    firebase_admin.initialize_app()
                    print("✅ 기본 인증 사용 (gcloud auth)")
                except Exception as e2:
                    print(f"❌ Firestore 초기화 실패: {e2}")
                    raise
        else:
            # 기본 인증 사용 (GCP 환경에서 또는 gcloud auth 사용)
            try:
                firebase_admin.initialize_app()
                print("✅ 기본 인증 사용 (GCP 환경 또는 gcloud auth)")
            except Exception as e:
                print(f"❌ Firestore 초기화 실패: {e}")
                print("💡 해결 방법:")
                print("   1. vertex-ai-thinkblock.json 파일을 프로젝트 루트에 배치")
                print("   2. 또는 환경 변수 FIREBASE_CREDENTIALS_PATH 설정")
                print("   3. 또는 'gcloud auth application-default login' 실행")
                raise
    
    return firestore.client()

db = init_firestore()
PROJECTS_COLLECTION = "projects"
BLOCKS_COLLECTION = "blocks"
CATEGORIES_DOC_ID = "categories"

class BlockModel(BaseModel):
    id: Optional[str] = None
    title: str
    description: str
    level: int
    order: int
    category: Optional[str] = None  # 카테고리 필드 추가

def get_all_blocks(project_id: str) -> List[dict]:
    """프로젝트의 모든 블록 조회"""
    try:
        blocks_ref = db.collection(PROJECTS_COLLECTION).document(project_id).collection(BLOCKS_COLLECTION)
        
        # 인덱스가 없을 수 있으므로 먼저 단순 조회 후 정렬
        docs = blocks_ref.stream()
        
        blocks = []
        for doc in docs:
            block = doc.to_dict()
            block["id"] = doc.id
            blocks.append(block)
        
        # 메모리에서 정렬
        blocks.sort(key=lambda x: (x.get("level", 0), x.get("order", 0)))
        
        print(f"✅ 블록 조회 성공: project_id={project_id}, count={len(blocks)}")
        return blocks
    except Exception as e:
        print(f"❌ 블록 조회 실패: project_id={project_id}, error={e}")
        # 에러 발생 시 빈 배열 반환
        return []

def get_block(project_id: str, block_id: str) -> Optional[dict]:
    """특정 블록 조회"""
    doc_ref = db.collection(PROJECTS_COLLECTION).document(project_id).collection(BLOCKS_COLLECTION).document(block_id)
    doc = doc_ref.get()
    
    if doc.exists:
        block = doc.to_dict()
        block["id"] = doc.id
        return block
    return None

def create_block(project_id: str, block_data: dict) -> dict:
    """블록 생성"""
    try:
        # 같은 레벨의 블록 수를 확인하여 order 설정
        if "order" not in block_data or block_data["order"] is None:
            level_blocks = db.collection(PROJECTS_COLLECTION).document(project_id).collection(BLOCKS_COLLECTION).where("level", "==", block_data["level"]).stream()
            block_data["order"] = sum(1 for _ in level_blocks)
        
        doc_ref = db.collection(PROJECTS_COLLECTION).document(project_id).collection(BLOCKS_COLLECTION).document()
        block_data["id"] = doc_ref.id
        
        # Firestore에 저장
        doc_ref.set(block_data)
        print(f"✅ 블록 생성 성공: project_id={project_id}, block_id={block_data['id']}, title={block_data.get('title', '')}")
        
        return block_data
    except Exception as e:
        print(f"❌ 블록 생성 실패: project_id={project_id}, error={e}")
        raise

def update_block(project_id: str, block_id: str, updates: dict) -> Optional[dict]:
    """블록 업데이트"""
    doc_ref = db.collection(PROJECTS_COLLECTION).document(project_id).collection(BLOCKS_COLLECTION).document(block_id)
    doc = doc_ref.get()
    
    if not doc.exists:
        return None
    
    # None 값 제거
    updates = {k: v for k, v in updates.items() if v is not None}
    
    doc_ref.update(updates)
    
    # 업데이트된 문서 반환
    updated_doc = doc_ref.get()
    block = updated_doc.to_dict()
    block["id"] = updated_doc.id
    return block

def delete_block(project_id: str, block_id: str) -> bool:
    """블록 삭제"""
    doc_ref = db.collection(PROJECTS_COLLECTION).document(project_id).collection(BLOCKS_COLLECTION).document(block_id)
    doc = doc_ref.get()
    
    if doc.exists:
        doc_ref.delete()
        return True
    return False

# 카테고리 관련 함수
def get_categories(project_id: str) -> List[str]:
    """프로젝트의 카테고리 목록 조회"""
    doc_ref = db.collection(PROJECTS_COLLECTION).document(project_id).collection("metadata").document(CATEGORIES_DOC_ID)
    doc = doc_ref.get()
    
    if doc.exists:
        data = doc.to_dict()
        return data.get("categories", [])
    return []

def update_categories(project_id: str, categories: List[str]) -> List[str]:
    """프로젝트의 카테고리 목록 업데이트"""
    doc_ref = db.collection(PROJECTS_COLLECTION).document(project_id).collection("metadata").document(CATEGORIES_DOC_ID)
    doc_ref.set({"categories": categories})
    return categories

# 프로젝트 관련 함수
def create_project(project_name: str) -> dict:
    """새 프로젝트 생성"""
    import uuid
    from datetime import datetime
    
    project_id = str(uuid.uuid4())
    project_data = {
        "id": project_id,
        "name": project_name,
        "createdAt": datetime.now(),
        "updatedAt": datetime.now(),
    }
    
    doc_ref = db.collection(PROJECTS_COLLECTION).document(project_id)
    doc_ref.set(project_data)
    
    return project_data

def get_project(project_id: str) -> Optional[dict]:
    """프로젝트 조회"""
    doc_ref = db.collection(PROJECTS_COLLECTION).document(project_id)
    doc = doc_ref.get()
    
    if doc.exists:
        project = doc.to_dict()
        project["id"] = doc.id
        return project
    return None

def get_all_projects() -> List[dict]:
    """모든 프로젝트 조회"""
    from google.cloud.firestore import Query
    
    projects_ref = db.collection(PROJECTS_COLLECTION)
    docs = projects_ref.order_by("updatedAt", direction=Query.DESCENDING).stream()
    
    projects = []
    for doc in docs:
        project = doc.to_dict()
        project["id"] = doc.id
        projects.append(project)
    
    return projects

def update_project(project_id: str, updates: dict) -> Optional[dict]:
    """프로젝트 업데이트"""
    from datetime import datetime
    
    doc_ref = db.collection(PROJECTS_COLLECTION).document(project_id)
    doc = doc_ref.get()
    
    if not doc.exists:
        return None
    
    updates["updatedAt"] = datetime.now()
    doc_ref.update(updates)
    
    updated_doc = doc_ref.get()
    project = updated_doc.to_dict()
    project["id"] = updated_doc.id
    return project

def delete_project(project_id: str) -> bool:
    """프로젝트 삭제 (블록과 카테고리도 함께 삭제)"""
    project_ref = db.collection(PROJECTS_COLLECTION).document(project_id)
    project_doc = project_ref.get()
    
    if not project_doc.exists:
        return False
    
    # 모든 블록 삭제
    blocks_ref = project_ref.collection(BLOCKS_COLLECTION)
    for block_doc in blocks_ref.stream():
        block_doc.reference.delete()
    
    # 메타데이터 삭제
    metadata_ref = project_ref.collection("metadata")
    for metadata_doc in metadata_ref.stream():
        metadata_doc.reference.delete()
    
    # 프로젝트 문서 삭제
    project_ref.delete()
    
    return True

