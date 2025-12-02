from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
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
    )
    print("📦 Firestore를 사용합니다")

load_dotenv()

app = FastAPI(title="ThinkBlock API")

# CORS 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173", "http://localhost:5174"],  # 프론트엔드 주소 (Vite 기본 포트 포함)
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

class BlockCreate(BaseModel):
    title: str
    description: str
    level: int
    order: Optional[int] = None

class BlockUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    level: Optional[int] = None
    order: Optional[int] = None

@app.get("/")
def read_root():
    return {"message": "ThinkBlock API"}

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

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

