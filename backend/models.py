"""
API 요청/응답 모델 정의
"""
from pydantic import BaseModel
from typing import List, Optional


class Block(BaseModel):
    id: Optional[str] = None
    title: str
    description: str
    level: int  # 계층 레벨 (0이 가장 아래, 숫자가 클수록 위)
    order: int  # 같은 레벨 내 순서
    category: Optional[str] = None  # 카테고리
    dependencies: Optional[List[str]] = None  # 의존성 블록 ID 목록


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


class DependencyRequest(BaseModel):
    dependency_id: str
    color: Optional[str] = None  # 연결선 색상 (선택사항)


class CategoriesUpdate(BaseModel):
    categories: List[str]


class ConnectionColorPaletteUpdate(BaseModel):
    colors: List[str]


class CategoryColorsUpdate(BaseModel):
    colors: dict  # {category_name: {bg: string, text: string}}


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

