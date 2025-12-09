"""
ThinkBlock API 메인 애플리케이션
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
import os
from dotenv import load_dotenv

# 라우터 임포트
from routers import blocks, projects, categories, dependencies, ai

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

# 라우터 등록
app.include_router(blocks.router)
app.include_router(projects.router)
app.include_router(categories.router)
app.include_router(dependencies.router)
app.include_router(ai.router)

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
            from fastapi import HTTPException
            raise HTTPException(status_code=404, detail="API endpoint not found")
        
        # 정적 파일이 있으면 서빙
        file_path = os.path.join(static_dir, full_path)
        if os.path.exists(file_path) and os.path.isfile(file_path):
            return FileResponse(file_path)
        
        # 그 외의 경우 index.html 반환 (SPA 라우팅)
        index_path = os.path.join(static_dir, "index.html")
        if os.path.exists(index_path):
            return FileResponse(index_path)
        
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Not found")
else:
    # 로컬 개발 환경
    @app.get("/")
    def read_root():
        return {"message": "ThinkBlock API"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
