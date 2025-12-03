"""
로컬 테스트를 위한 인메모리 저장소
Firestore 설정 없이도 테스트할 수 있도록 사용
"""
from typing import List, Optional, Dict
import uuid

class MemoryStore:
    def __init__(self):
        self.blocks: Dict[str, dict] = {}
    
    def get_all_blocks(self) -> List[dict]:
        """모든 블록 조회"""
        blocks = list(self.blocks.values())
        # level과 order로 정렬
        blocks.sort(key=lambda x: (x["level"], x["order"]))
        return blocks
    
    def get_block(self, block_id: str) -> Optional[dict]:
        """특정 블록 조회"""
        return self.blocks.get(block_id)
    
    def create_block(self, block_data: dict) -> dict:
        """블록 생성"""
        block_id = str(uuid.uuid4())
        block_data["id"] = block_id
        
        # order가 없으면 같은 레벨의 블록 수로 설정
        if "order" not in block_data or block_data["order"] is None:
            level_blocks = [b for b in self.blocks.values() if b["level"] == block_data["level"]]
            block_data["order"] = len(level_blocks)
        
        self.blocks[block_id] = block_data
        return block_data
    
    def update_block(self, block_id: str, updates: dict) -> Optional[dict]:
        """블록 업데이트"""
        if block_id not in self.blocks:
            return None
        
        # None 값 제거
        updates = {k: v for k, v in updates.items() if v is not None}
        
        # 기존 블록 업데이트
        self.blocks[block_id].update(updates)
        return self.blocks[block_id].copy()
    
    def delete_block(self, block_id: str) -> bool:
        """블록 삭제"""
        if block_id in self.blocks:
            del self.blocks[block_id]
            return True
        return False

    def get_categories(self) -> List[str]:
        """카테고리 목록 조회"""
        return getattr(self, '_categories', [])
    
    def update_categories(self, categories: List[str]) -> List[str]:
        """카테고리 목록 업데이트"""
        self._categories = categories
        return categories

# 전역 인스턴스
memory_store = MemoryStore()

