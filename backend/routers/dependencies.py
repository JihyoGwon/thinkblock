"""
의존성 관련 API 엔드포인트
"""
from fastapi import APIRouter, HTTPException
from models import DependencyRequest
from storage import get_storage

router = APIRouter(prefix="/api/projects/{project_id}", tags=["dependencies"])


@router.post("/blocks/{block_id}/dependencies")
async def add_dependency(project_id: str, block_id: str, request: DependencyRequest):
    """블록에 의존성 추가"""
    try:
        storage = get_storage()
        block = storage.get_block(project_id, block_id)
        if not block:
            raise HTTPException(status_code=404, detail="블록을 찾을 수 없습니다")
        
        dependencies = block.get("dependencies", [])
        if request.dependency_id not in dependencies:
            dependencies.append(request.dependency_id)
            storage.update_block(project_id, block_id, {"dependencies": dependencies})
        
        # 색상이 제공된 경우 의존성 색상 저장
        if request.color:
            storage.update_dependency_color(project_id, block_id, request.dependency_id, request.color)
        
        updated_block = storage.get_block(project_id, block_id)
        return {"block": updated_block}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"의존성 추가 실패: {str(e)}")


@router.delete("/blocks/{block_id}/dependencies/{dependency_id}")
async def remove_dependency(project_id: str, block_id: str, dependency_id: str):
    """블록에서 의존성 제거"""
    try:
        storage = get_storage()
        block = storage.get_block(project_id, block_id)
        if not block:
            raise HTTPException(status_code=404, detail="블록을 찾을 수 없습니다")
        
        dependencies = block.get("dependencies", [])
        if dependency_id in dependencies:
            dependencies.remove(dependency_id)
            storage.update_block(project_id, block_id, {"dependencies": dependencies})
            # 의존성 색상도 제거
            storage.remove_dependency_color(project_id, block_id, dependency_id)
        
        updated_block = storage.get_block(project_id, block_id)
        return {"block": updated_block}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"의존성 제거 실패: {str(e)}")


@router.get("/dependency-colors")
async def get_dependency_colors(project_id: str):
    """프로젝트의 의존성 색상 맵 조회"""
    try:
        storage = get_storage()
        colors = storage.get_dependency_colors(project_id)
        return {"colors": colors}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"의존성 색상 조회 실패: {str(e)}")

