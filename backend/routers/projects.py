"""
프로젝트 관련 API 엔드포인트
"""
from fastapi import APIRouter, HTTPException
from models import ProjectCreate, ProjectUpdate, ProjectDuplicate
from storage import get_storage

router = APIRouter(prefix="/api/projects", tags=["projects"])

# 저장소 인스턴스 가져오기
storage = get_storage()


@router.post("")
async def create_project(project: ProjectCreate):
    """새 프로젝트 생성"""
    try:
        created_project = storage.create_project(project.name)
        return {"project": created_project}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"프로젝트 생성 실패: {str(e)}")


@router.get("")
async def get_all_projects():
    """모든 프로젝트 조회"""
    try:
        projects = storage.get_all_projects()
        return {"projects": projects}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"프로젝트 조회 실패: {str(e)}")


@router.get("/{project_id}")
async def get_project(project_id: str):
    """프로젝트 조회"""
    try:
        project = storage.get_project(project_id)
        
        if project is None:
            raise HTTPException(status_code=404, detail="프로젝트를 찾을 수 없습니다")
        
        return {"project": project}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"프로젝트 조회 실패: {str(e)}")


@router.put("/{project_id}")
async def update_project(project_id: str, project_update: ProjectUpdate):
    """프로젝트 업데이트"""
    try:
        updates = project_update.dict(exclude_unset=True)
        updated_project = storage.update_project(project_id, updates)
        
        if updated_project is None:
            raise HTTPException(status_code=404, detail="프로젝트를 찾을 수 없습니다")
        
        return {"project": updated_project}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"프로젝트 업데이트 실패: {str(e)}")


@router.delete("/{project_id}")
async def delete_project(project_id: str):
    """프로젝트 삭제"""
    try:
        success = storage.delete_project(project_id)
        
        if not success:
            raise HTTPException(status_code=404, detail="프로젝트를 찾을 수 없습니다")
        
        return {"message": "프로젝트가 삭제되었습니다", "project_id": project_id}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"프로젝트 삭제 실패: {str(e)}")


@router.post("/{project_id}/duplicate")
async def duplicate_project(project_id: str, duplicate_data: ProjectDuplicate):
    """프로젝트 복제"""
    try:
        new_project = storage.duplicate_project(project_id, duplicate_data.name, duplicate_data.copy_structure)
        return {"project": new_project}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"프로젝트 복제 실패: {str(e)}")

