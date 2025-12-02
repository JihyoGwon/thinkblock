import firebase_admin
from firebase_admin import credentials, firestore
from typing import List, Optional
from pydantic import BaseModel
import os

# Firestore 초기화
def init_firestore():
    if not firebase_admin._apps:
        cred_path = os.getenv("FIREBASE_CREDENTIALS_PATH")
        if cred_path and os.path.exists(cred_path):
            cred = credentials.Certificate(cred_path)
            firebase_admin.initialize_app(cred)
        else:
            # 기본 인증 사용 (GCP 환경에서)
            firebase_admin.initialize_app()
    
    return firestore.client()

db = init_firestore()
COLLECTION_NAME = "blocks"

class BlockModel(BaseModel):
    id: Optional[str] = None
    title: str
    description: str
    level: int
    order: int

def get_all_blocks() -> List[dict]:
    """모든 블록 조회"""
    blocks_ref = db.collection(COLLECTION_NAME)
    docs = blocks_ref.order_by("level").order_by("order").stream()
    
    blocks = []
    for doc in docs:
        block = doc.to_dict()
        block["id"] = doc.id
        blocks.append(block)
    
    return blocks

def get_block(block_id: str) -> Optional[dict]:
    """특정 블록 조회"""
    doc_ref = db.collection(COLLECTION_NAME).document(block_id)
    doc = doc_ref.get()
    
    if doc.exists:
        block = doc.to_dict()
        block["id"] = doc.id
        return block
    return None

def create_block(block_data: dict) -> dict:
    """블록 생성"""
    # 같은 레벨의 블록 수를 확인하여 order 설정
    if "order" not in block_data or block_data["order"] is None:
        level_blocks = db.collection(COLLECTION_NAME).where("level", "==", block_data["level"]).stream()
        block_data["order"] = sum(1 for _ in level_blocks)
    
    doc_ref = db.collection(COLLECTION_NAME).document()
    block_data["id"] = doc_ref.id
    doc_ref.set(block_data)
    
    return block_data

def update_block(block_id: str, updates: dict) -> Optional[dict]:
    """블록 업데이트"""
    doc_ref = db.collection(COLLECTION_NAME).document(block_id)
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

def delete_block(block_id: str) -> bool:
    """블록 삭제"""
    doc_ref = db.collection(COLLECTION_NAME).document(block_id)
    doc = doc_ref.get()
    
    if doc.exists:
        doc_ref.delete()
        return True
    return False

