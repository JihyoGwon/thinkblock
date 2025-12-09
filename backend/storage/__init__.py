"""
저장소 인터페이스 및 구현체
"""
import os

from .base import StorageInterface
from .memory_store import MemoryStore
from .firestore_store import FirestoreStore

__all__ = ['StorageInterface', 'MemoryStore', 'FirestoreStore', 'get_storage']

# 전역 저장소 인스턴스 (싱글톤 패턴)
_storage_instance = None


def get_storage() -> StorageInterface:
    """저장소 인스턴스 반환 (싱글톤 패턴)"""
    global _storage_instance
    
    if _storage_instance is None:
        USE_MEMORY_STORE = os.getenv("USE_MEMORY_STORE", "false").lower() == "true"
        
        if USE_MEMORY_STORE:
            print("⚠️  인메모리 저장소를 사용합니다 (로컬 테스트 모드)")
            _storage_instance = MemoryStore()
        else:
            print("📦 Firestore를 사용합니다")
            _storage_instance = FirestoreStore()
    
    return _storage_instance

