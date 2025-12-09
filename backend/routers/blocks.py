"""
블록 관련 API 엔드포인트
"""
from fastapi import APIRouter
from models import BlockCreate, BlockUpdate
from storage import get_storage
from exceptions import BlockNotFoundError, StorageError

router = APIRouter(prefix="/api/projects/{project_id}/blocks", tags=["blocks"])


@router.get("")
async def get_blocks(project_id: str):
    """프로젝트의 모든 블록 조회"""
    try:
        storage = get_storage()
        blocks = storage.get_all_blocks(project_id)
        return {"blocks": blocks}
    except Exception as e:
        raise StorageError(f"블록 조회 실패: {str(e)}")


@router.post("")
async def create_block(project_id: str, block: BlockCreate):
    """새 블록 생성"""
    try:
        storage = get_storage()
        block_data = block.dict()
        created_block = storage.create_block(project_id, block_data)
        return {"block": created_block}
    except Exception as e:
        raise StorageError(f"블록 생성 실패: {str(e)}")


@router.put("/{block_id}")
async def update_block(project_id: str, block_id: str, block_update: BlockUpdate):
    """블록 업데이트"""
    try:
        storage = get_storage()
        updates = block_update.dict(exclude_unset=True)
        updated_block = storage.update_block(project_id, block_id, updates)
        
        if updated_block is None:
            raise BlockNotFoundError(block_id)
        
        return {"block": updated_block}
    except BlockNotFoundError:
        raise
    except Exception as e:
        raise StorageError(f"블록 업데이트 실패: {str(e)}")


@router.delete("/{block_id}")
async def delete_block(project_id: str, block_id: str):
    """블록 삭제"""
    try:
        storage = get_storage()
        success = storage.delete_block(project_id, block_id)
        
        if not success:
            raise BlockNotFoundError(block_id)
        
        return {"message": "블록이 삭제되었습니다", "block_id": block_id}
    except BlockNotFoundError:
        raise
    except Exception as e:
        raise StorageError(f"블록 삭제 실패: {str(e)}")

