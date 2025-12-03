from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel
from typing import List, Optional
import os
from dotenv import load_dotenv

# 로컬 테스트를 위해 인메모리 저장소 사용 (Firestore 설정 없이도 테스트 가능)
USE_MEMORY_STORE = os.getenv("USE_MEMORY_STORE", "true").lower() == "true"

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

@app.get("/api/blocks")
async def get_blocks():
    """모든 블록 조회"""
    try:
        if USE_MEMORY_STORE:
            blocks = store.get_all_blocks()
        else:
            blocks = get_all_blocks()
        return {"blocks": blocks}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"블록 조회 실패: {str(e)}")

@app.post("/api/blocks")
async def create_block_endpoint(block: BlockCreate):
    """새 블록 생성"""
    try:
        block_data = block.dict()
        if USE_MEMORY_STORE:
            created_block = store.create_block(block_data)
        else:
            created_block = create_block(block_data)
        return {"block": created_block}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"블록 생성 실패: {str(e)}")

@app.put("/api/blocks/{block_id}")
async def update_block_endpoint(block_id: str, block_update: BlockUpdate):
    """블록 업데이트"""
    try:
        updates = block_update.dict(exclude_unset=True)
        if USE_MEMORY_STORE:
            updated_block = store.update_block(block_id, updates)
        else:
            updated_block = update_block(block_id, updates)
        
        if updated_block is None:
            raise HTTPException(status_code=404, detail="블록을 찾을 수 없습니다")
        
        return {"block": updated_block}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"블록 업데이트 실패: {str(e)}")

@app.delete("/api/blocks/{block_id}")
async def delete_block_endpoint(block_id: str):
    """블록 삭제"""
    try:
        if USE_MEMORY_STORE:
            success = store.delete_block(block_id)
        else:
            success = delete_block(block_id)
        
        if not success:
            raise HTTPException(status_code=404, detail="블록을 찾을 수 없습니다")
        
        return {"message": "블록이 삭제되었습니다", "block_id": block_id}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"블록 삭제 실패: {str(e)}")

@app.get("/api/categories")
async def get_categories_endpoint():
    """카테고리 목록 조회"""
    try:
        if USE_MEMORY_STORE:
            categories = store.get_categories()
        else:
            categories = get_categories()
        return {"categories": categories}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"카테고리 조회 실패: {str(e)}")

@app.put("/api/categories")
async def update_categories_endpoint(categories_update: CategoriesUpdate):
    """카테고리 목록 업데이트"""
    try:
        if USE_MEMORY_STORE:
            updated_categories = store.update_categories(categories_update.categories)
        else:
            updated_categories = update_categories(categories_update.categories)
        return {"categories": updated_categories}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"카테고리 업데이트 실패: {str(e)}")

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

