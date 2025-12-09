"""
카테고리 및 색상 관련 API 엔드포인트
"""
from fastapi import APIRouter
from models import CategoriesUpdate, CategoryColorsUpdate, ConnectionColorPaletteUpdate
from storage import get_storage
from exceptions import StorageError

router = APIRouter(prefix="/api/projects/{project_id}", tags=["categories"])


@router.get("/categories")
async def get_categories(project_id: str):
    """프로젝트의 카테고리 목록 조회"""
    try:
        storage = get_storage()
        categories = storage.get_categories(project_id)
        return {"categories": categories}
    except Exception as e:
        raise StorageError(f"카테고리 조회 실패: {str(e)}")


@router.put("/categories")
async def update_categories(project_id: str, categories_update: CategoriesUpdate):
    """프로젝트의 카테고리 목록 업데이트"""
    try:
        storage = get_storage()
        updated_categories = storage.update_categories(project_id, categories_update.categories)
        return {"categories": updated_categories}
    except Exception as e:
        raise StorageError(f"카테고리 업데이트 실패: {str(e)}")


@router.get("/category-colors")
async def get_category_colors(project_id: str):
    """프로젝트의 카테고리 색상 맵 조회"""
    try:
        storage = get_storage()
        colors = storage.get_category_colors(project_id)
        return {"colors": colors}
    except Exception as e:
        raise StorageError(f"카테고리 색상 조회 실패: {str(e)}")


@router.put("/category-colors")
async def update_category_colors(project_id: str, colors_update: CategoryColorsUpdate):
    """프로젝트의 카테고리 색상 맵 업데이트"""
    try:
        storage = get_storage()
        updated_colors = storage.update_category_colors(project_id, colors_update.colors)
        return {"colors": updated_colors}
    except Exception as e:
        raise StorageError(f"카테고리 색상 업데이트 실패: {str(e)}")


@router.get("/connection-color-palette")
async def get_connection_color_palette(project_id: str):
    """프로젝트의 연결선 색상 팔레트 조회"""
    try:
        storage = get_storage()
        colors = storage.get_connection_color_palette(project_id)
        return {"colors": colors}
    except Exception as e:
        raise StorageError(f"연결선 색상 팔레트 조회 실패: {str(e)}")


@router.put("/connection-color-palette")
async def update_connection_color_palette(project_id: str, palette_update: ConnectionColorPaletteUpdate):
    """프로젝트의 연결선 색상 팔레트 업데이트"""
    try:
        storage = get_storage()
        updated_colors = storage.update_connection_color_palette(project_id, palette_update.colors)
        return {"colors": updated_colors}
    except Exception as e:
        raise StorageError(f"연결선 색상 팔레트 업데이트 실패: {str(e)}")

