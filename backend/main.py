from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel
from typing import List, Optional
import os
from dotenv import load_dotenv

# 로컬 테스트를 위해 인메모리 저장소 사용 (Firestore 설정 없이도 테스트 가능)
# 기본값을 false로 변경하여 Firestore를 기본으로 사용
USE_MEMORY_STORE = os.getenv("USE_MEMORY_STORE", "false").lower() == "true"

if USE_MEMORY_STORE:
    from memory_store import memory_store as store
    print("⚠️  인메모리 저장소를 사용합니다 (로컬 테스트 모드)")
else:
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
        duplicate_project,
    )
    print("📦 Firestore를 사용합니다")

load_dotenv()

app = FastAPI(title="ThinkBlock API")

# CORS 설정
# 프로덕션에서는 환경 변수로 관리하거나 특정 도메인만 허용
cors_origins = os.getenv("CORS_ORIGINS", "http://localhost:3000,http://localhost:5173,http://localhost:5174").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 데이터 모델
class Block(BaseModel):
    id: Optional[str] = None
    title: str
    description: str
    level: int  # 계층 레벨 (0이 가장 아래, 숫자가 클수록 위)
    order: int  # 같은 레벨 내 순서
    category: Optional[str] = None  # 카테고리

class BlockCreate(BaseModel):
    title: str
    description: str
    level: int
    order: Optional[int] = None
    category: Optional[str] = None

class BlockUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    level: Optional[int] = None
    order: Optional[int] = None
    category: Optional[str] = None

class CategoriesUpdate(BaseModel):
    categories: List[str]

class ProjectCreate(BaseModel):
    name: str

class ProjectUpdate(BaseModel):
    name: Optional[str] = None

class ProjectDuplicate(BaseModel):
    name: str
    copy_structure: bool = True  # True: 전체 복사, False: 블록만 복사

class AIGenerateBlocksRequest(BaseModel):
    project_overview: str
    current_status: str
    problems: str
    additional_info: str = ""

class AIArrangeBlocksRequest(BaseModel):
    block_ids: List[str]  # 배치할 블록 ID 리스트

@app.get("/api/projects/{project_id}/blocks")
async def get_blocks(project_id: str):
    """프로젝트의 모든 블록 조회"""
    try:
        if USE_MEMORY_STORE:
            blocks = store.get_all_blocks(project_id)
        else:
            blocks = get_all_blocks(project_id)
        return {"blocks": blocks}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"블록 조회 실패: {str(e)}")

@app.post("/api/projects/{project_id}/blocks")
async def create_block_endpoint(project_id: str, block: BlockCreate):
    """새 블록 생성"""
    try:
        block_data = block.dict()
        if USE_MEMORY_STORE:
            created_block = store.create_block(project_id, block_data)
        else:
            created_block = create_block(project_id, block_data)
        return {"block": created_block}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"블록 생성 실패: {str(e)}")

@app.put("/api/projects/{project_id}/blocks/{block_id}")
async def update_block_endpoint(project_id: str, block_id: str, block_update: BlockUpdate):
    """블록 업데이트"""
    try:
        updates = block_update.dict(exclude_unset=True)
        if USE_MEMORY_STORE:
            updated_block = store.update_block(project_id, block_id, updates)
        else:
            updated_block = update_block(project_id, block_id, updates)
        
        if updated_block is None:
            raise HTTPException(status_code=404, detail="블록을 찾을 수 없습니다")
        
        return {"block": updated_block}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"블록 업데이트 실패: {str(e)}")

@app.delete("/api/projects/{project_id}/blocks/{block_id}")
async def delete_block_endpoint(project_id: str, block_id: str):
    """블록 삭제"""
    try:
        if USE_MEMORY_STORE:
            success = store.delete_block(project_id, block_id)
        else:
            success = delete_block(project_id, block_id)
        
        if not success:
            raise HTTPException(status_code=404, detail="블록을 찾을 수 없습니다")
        
        return {"message": "블록이 삭제되었습니다", "block_id": block_id}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"블록 삭제 실패: {str(e)}")

@app.get("/api/projects/{project_id}/categories")
async def get_categories_endpoint(project_id: str):
    """프로젝트의 카테고리 목록 조회"""
    try:
        if USE_MEMORY_STORE:
            categories = store.get_categories(project_id)
        else:
            categories = get_categories(project_id)
        return {"categories": categories}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"카테고리 조회 실패: {str(e)}")

@app.put("/api/projects/{project_id}/categories")
async def update_categories_endpoint(project_id: str, categories_update: CategoriesUpdate):
    """프로젝트의 카테고리 목록 업데이트"""
    try:
        if USE_MEMORY_STORE:
            updated_categories = store.update_categories(project_id, categories_update.categories)
        else:
            updated_categories = update_categories(project_id, categories_update.categories)
        return {"categories": updated_categories}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"카테고리 업데이트 실패: {str(e)}")

# 프로젝트 관련 API
@app.post("/api/projects")
async def create_project_endpoint(project: ProjectCreate):
    """새 프로젝트 생성"""
    try:
        if USE_MEMORY_STORE:
            created_project = store.create_project(project.name)
        else:
            created_project = create_project(project.name)
        return {"project": created_project}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"프로젝트 생성 실패: {str(e)}")

@app.get("/api/projects")
async def get_all_projects_endpoint():
    """모든 프로젝트 조회"""
    try:
        if USE_MEMORY_STORE:
            projects = store.get_all_projects()
        else:
            projects = get_all_projects()
        return {"projects": projects}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"프로젝트 조회 실패: {str(e)}")

@app.get("/api/projects/{project_id}")
async def get_project_endpoint(project_id: str):
    """프로젝트 조회"""
    try:
        if USE_MEMORY_STORE:
            project = store.get_project(project_id)
        else:
            project = get_project(project_id)
        
        if project is None:
            raise HTTPException(status_code=404, detail="프로젝트를 찾을 수 없습니다")
        
        return {"project": project}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"프로젝트 조회 실패: {str(e)}")

@app.put("/api/projects/{project_id}")
async def update_project_endpoint(project_id: str, project_update: ProjectUpdate):
    """프로젝트 업데이트"""
    try:
        updates = project_update.dict(exclude_unset=True)
        if USE_MEMORY_STORE:
            updated_project = store.update_project(project_id, updates)
        else:
            updated_project = update_project(project_id, updates)
        
        if updated_project is None:
            raise HTTPException(status_code=404, detail="프로젝트를 찾을 수 없습니다")
        
        return {"project": updated_project}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"프로젝트 업데이트 실패: {str(e)}")

@app.delete("/api/projects/{project_id}")
async def delete_project_endpoint(project_id: str):
    """프로젝트 삭제"""
    try:
        if USE_MEMORY_STORE:
            success = store.delete_project(project_id)
        else:
            success = delete_project(project_id)
        
        if not success:
            raise HTTPException(status_code=404, detail="프로젝트를 찾을 수 없습니다")
        
        return {"message": "프로젝트가 삭제되었습니다", "project_id": project_id}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"프로젝트 삭제 실패: {str(e)}")

@app.post("/api/projects/{project_id}/duplicate")
async def duplicate_project_endpoint(project_id: str, duplicate_data: ProjectDuplicate):
    """프로젝트 복제"""
    try:
        if USE_MEMORY_STORE:
            # 메모리 스토어는 아직 복제 기능 미구현
            raise HTTPException(status_code=501, detail="메모리 스토어에서는 복제 기능을 사용할 수 없습니다")
        else:
            new_project = duplicate_project(project_id, duplicate_data.name, duplicate_data.copy_structure)
        return {"project": new_project}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"프로젝트 복제 실패: {str(e)}")

@app.post("/api/projects/{project_id}/ai/generate-blocks")
async def ai_generate_blocks_endpoint(project_id: str, request: AIGenerateBlocksRequest):
    """AI를 사용하여 블록 생성"""
    try:
        from ai_service import generate_blocks, init_vertex_ai
        
        # Vertex AI 초기화
        if not init_vertex_ai():
            raise HTTPException(status_code=500, detail="Vertex AI 초기화 실패")
        
        # 기존 카테고리 가져오기
        if USE_MEMORY_STORE:
            existing_categories = store.get_categories(project_id)
        else:
            from firestore_service import get_categories
            existing_categories = get_categories(project_id)
        
        # AI로 블록 생성
        generate_result = generate_blocks(
            project_overview=request.project_overview,
            current_status=request.current_status,
            problems=request.problems,
            additional_info=request.additional_info,
            existing_categories=existing_categories
        )
        
        # 결과에서 blocks와 project_analysis 추출
        if isinstance(generate_result, dict):
            generated_blocks = generate_result.get("blocks", [])
            project_analysis = generate_result.get("project_analysis")
        else:
            # 레거시 호환성 (리스트로 반환된 경우)
            generated_blocks = generate_result
            project_analysis = None
        
        # project_analysis를 프로젝트에 저장
        if project_analysis:
            project_updates = {"project_analysis": project_analysis}
            if USE_MEMORY_STORE:
                store.update_project(project_id, project_updates)
            else:
                from firestore_service import update_project
                update_project(project_id, project_updates)
            print(f"✅ 프로젝트 분석 저장 완료: {len(project_analysis)} 문자")
        
        # 생성된 블록들을 저장
        created_blocks = []
        for block_data in generated_blocks:
            block_create = BlockCreate(
                title=block_data.get("title", ""),
                description=block_data.get("description", ""),
                level=-1,  # 기본값: 좌측 리스트에 표시
                order=0,
                category=block_data.get("category")
            )
            
            if USE_MEMORY_STORE:
                created_block = store.create_block(project_id, block_create.dict())
            else:
                from firestore_service import create_block
                created_block = create_block(project_id, block_create.dict())
            
            created_blocks.append(created_block)
        
        # 새로 생성된 카테고리들을 프로젝트 카테고리 목록에 추가
        new_categories = set()
        for block in created_blocks:
            if block.get("category"):
                new_categories.add(block["category"])
        
        if new_categories:
            updated_categories = list(set(existing_categories) | new_categories)
            if USE_MEMORY_STORE:
                store.update_categories(project_id, updated_categories)
            else:
                from firestore_service import update_categories
                update_categories(project_id, updated_categories)
        
        return {"blocks": created_blocks}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI 블록 생성 실패: {str(e)}")

@app.post("/api/projects/{project_id}/ai/arrange-blocks")
async def ai_arrange_blocks_endpoint(project_id: str, request: AIArrangeBlocksRequest):
    """AI를 사용하여 블록들을 적절한 레벨에 배치"""
    try:
        from ai_service import arrange_blocks, init_vertex_ai
        
        # Vertex AI 초기화
        if not init_vertex_ai():
            raise HTTPException(status_code=500, detail="Vertex AI 초기화 실패")
        
        # 배치할 블록들 가져오기
        if USE_MEMORY_STORE:
            all_blocks = store.get_all_blocks(project_id)
        else:
            from firestore_service import get_all_blocks
            all_blocks = get_all_blocks(project_id)
        
        # 요청된 블록 ID들만 필터링
        blocks_to_arrange = [block for block in all_blocks if block.get("id") in request.block_ids]
        
        if not blocks_to_arrange:
            raise HTTPException(status_code=400, detail="배치할 블록을 찾을 수 없습니다")
        
        # 프로젝트에서 저장된 project_analysis 가져오기
        project_analysis = None
        if USE_MEMORY_STORE:
            project = store.get_project(project_id)
            if project:
                project_analysis = project.get("project_analysis")
        else:
            from firestore_service import get_project
            project = get_project(project_id)
            if project:
                project_analysis = project.get("project_analysis")
        
        # AI로 블록 배치 (저장된 project_analysis 사용)
        arranged_blocks = arrange_blocks(
            blocks_to_arrange,
            project_overview=project_analysis,  # generate_blocks에서 생성된 project_analysis 사용
            current_status=None,
            problems=None,
            additional_info=None
        )
        
        # 배치 이유 추출 (첫 번째 블록에서)
        arrangement_reasoning = ""
        if arranged_blocks and len(arranged_blocks) > 0:
            arrangement_reasoning = arranged_blocks[0].get("arrangement_reasoning", "")
            print(f"🔍 추출된 배치 이유 길이: {len(arrangement_reasoning)} 문자")
            if arrangement_reasoning:
                print(f"🔍 배치 이유 일부: {arrangement_reasoning[:200]}")
        
        # 블록들의 레벨 업데이트
        updated_blocks = []
        for arranged_block in arranged_blocks:
            block_id = arranged_block.get("id")
            new_level = arranged_block.get("level", 0)
            
            # 블록 업데이트
            updates = {"level": new_level}
            if USE_MEMORY_STORE:
                updated_block = store.update_block(project_id, block_id, updates)
            else:
                from firestore_service import update_block
                updated_block = update_block(project_id, block_id, updates)
            
            updated_blocks.append(updated_block)
        
        # 배치 이유를 프로젝트에 저장
        if arrangement_reasoning:
            project_updates = {"arrangement_reasoning": arrangement_reasoning}
            if USE_MEMORY_STORE:
                store.update_project(project_id, project_updates)
            else:
                from firestore_service import update_project
                update_project(project_id, project_updates)
            print(f"✅ 배치 이유 프로젝트에 저장 완료: {len(arrangement_reasoning)} 문자")
        
        print(f"🔍 API 응답에 포함할 reasoning: {len(arrangement_reasoning)} 문자")
        return {"blocks": updated_blocks, "reasoning": arrangement_reasoning}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"AI 블록 배치 실패: {str(e)}")

# 정적 파일 서빙 (프로덕션 환경) - API 라우트 이후에 정의
static_dir = os.path.join(os.path.dirname(__file__), "static")
if os.path.exists(static_dir):
    # 정적 파일 (CSS, JS 등) 서빙
    app.mount("/static", StaticFiles(directory=static_dir), name="static")
    
    @app.get("/")
    async def serve_frontend():
        """프론트엔드 메인 페이지 서빙"""
        index_path = os.path.join(static_dir, "index.html")
        if os.path.exists(index_path):
            return FileResponse(index_path)
        return {"message": "ThinkBlock API"}
    
    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        """SPA 라우팅을 위한 fallback"""
        # API 경로는 제외
        if full_path.startswith("api/"):
            raise HTTPException(status_code=404, detail="API endpoint not found")
        
        # 정적 파일이 있으면 서빙
        file_path = os.path.join(static_dir, full_path)
        if os.path.exists(file_path) and os.path.isfile(file_path):
            return FileResponse(file_path)
        
        # 그 외의 경우 index.html 반환 (SPA 라우팅)
        index_path = os.path.join(static_dir, "index.html")
        if os.path.exists(index_path):
            return FileResponse(index_path)
        
        raise HTTPException(status_code=404, detail="Not found")
else:
    # 로컬 개발 환경
    @app.get("/")
    def read_root():
        return {"message": "ThinkBlock API"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

