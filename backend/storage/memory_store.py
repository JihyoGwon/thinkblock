"""
로컬 테스트를 위한 인메모리 저장소
Firestore 설정 없이도 테스트할 수 있도록 사용
"""
from typing import List, Optional, Dict
import uuid
from .base import StorageInterface


class MemoryStore(StorageInterface):
    def __init__(self):
        self.projects: Dict[str, Dict[str, dict]] = {}  # project_id -> blocks
        self.project_metadata: Dict[str, dict] = {}  # project_id -> metadata (categories, etc.)
        self.projects_list: Dict[str, dict] = {}  # project_id -> project info
    
    def get_all_blocks(self, project_id: str) -> List[dict]:
        """프로젝트의 모든 블록 조회"""
        if project_id not in self.projects:
            return []
        blocks = list(self.projects[project_id].values())
        blocks.sort(key=lambda x: (x["level"], x["order"]))
        return blocks
    
    def get_block(self, project_id: str, block_id: str) -> Optional[dict]:
        """특정 블록 조회"""
        if project_id not in self.projects:
            return None
        return self.projects[project_id].get(block_id)
    
    def create_block(self, project_id: str, block_data: dict) -> dict:
        """블록 생성"""
        if project_id not in self.projects:
            self.projects[project_id] = {}
        
        block_id = str(uuid.uuid4())
        block_data["id"] = block_id
        
        if "order" not in block_data or block_data["order"] is None:
            level_blocks = [b for b in self.projects[project_id].values() if b["level"] == block_data["level"]]
            block_data["order"] = len(level_blocks)
        
        self.projects[project_id][block_id] = block_data
        return block_data
    
    def update_block(self, project_id: str, block_id: str, updates: dict) -> Optional[dict]:
        """블록 업데이트"""
        if project_id not in self.projects or block_id not in self.projects[project_id]:
            return None
        
        updates = {k: v for k, v in updates.items() if v is not None}
        self.projects[project_id][block_id].update(updates)
        return self.projects[project_id][block_id].copy()
    
    def delete_block(self, project_id: str, block_id: str) -> bool:
        """블록 삭제"""
        if project_id in self.projects and block_id in self.projects[project_id]:
            del self.projects[project_id][block_id]
            return True
        return False
    
    def get_categories(self, project_id: str) -> List[str]:
        """카테고리 목록 조회"""
        if project_id not in self.project_metadata:
            return []
        return self.project_metadata[project_id].get("categories", [])
    
    def update_categories(self, project_id: str, categories: List[str]) -> List[str]:
        """카테고리 목록 업데이트"""
        if project_id not in self.project_metadata:
            self.project_metadata[project_id] = {}
        self.project_metadata[project_id]["categories"] = categories
        return categories
    
    def get_dependency_colors(self, project_id: str) -> Dict[str, str]:
        """의존성 색상 맵 조회"""
        if project_id not in self.project_metadata:
            return {}
        return self.project_metadata[project_id].get("dependency_colors", {})
    
    def update_dependency_color(self, project_id: str, from_block_id: str, to_block_id: str, color: str) -> Dict[str, str]:
        """의존성 색상 업데이트"""
        if project_id not in self.project_metadata:
            self.project_metadata[project_id] = {}
        if "dependency_colors" not in self.project_metadata[project_id]:
            self.project_metadata[project_id]["dependency_colors"] = {}
        key = f"{from_block_id}_{to_block_id}"
        self.project_metadata[project_id]["dependency_colors"][key] = color
        return self.project_metadata[project_id]["dependency_colors"].copy()
    
    def remove_dependency_color(self, project_id: str, from_block_id: str, to_block_id: str) -> Dict[str, str]:
        """의존성 색상 제거"""
        if project_id not in self.project_metadata:
            return {}
        if "dependency_colors" not in self.project_metadata[project_id]:
            return {}
        key = f"{from_block_id}_{to_block_id}"
        if key in self.project_metadata[project_id]["dependency_colors"]:
            del self.project_metadata[project_id]["dependency_colors"][key]
        return self.project_metadata[project_id]["dependency_colors"].copy()
    
    def get_connection_color_palette(self, project_id: str) -> List[str]:
        """연결선 색상 팔레트 조회"""
        if project_id not in self.project_metadata:
            return ['#6366f1']
        colors = self.project_metadata[project_id].get("connection_color_palette", ['#6366f1'])
        return colors if colors else ['#6366f1']
    
    def update_connection_color_palette(self, project_id: str, colors: List[str]) -> List[str]:
        """연결선 색상 팔레트 업데이트"""
        if project_id not in self.project_metadata:
            self.project_metadata[project_id] = {}
        self.project_metadata[project_id]["connection_color_palette"] = colors
        return colors
    
    def get_category_colors(self, project_id: str) -> Dict[str, Dict[str, str]]:
        """카테고리 색상 맵 조회"""
        if project_id not in self.project_metadata:
            return {}
        return self.project_metadata[project_id].get("category_colors", {})
    
    def update_category_colors(self, project_id: str, colors: Dict[str, Dict[str, str]]) -> Dict[str, Dict[str, str]]:
        """카테고리 색상 맵 업데이트"""
        if project_id not in self.project_metadata:
            self.project_metadata[project_id] = {}
        self.project_metadata[project_id]["category_colors"] = colors
        return colors.copy()
    
    def create_project(self, project_name: str) -> dict:
        """새 프로젝트 생성"""
        from datetime import datetime
        project_id = str(uuid.uuid4())
        project_data = {
            "id": project_id,
            "name": project_name,
            "createdAt": datetime.now(),
            "updatedAt": datetime.now(),
        }
        self.projects_list[project_id] = project_data
        self.projects[project_id] = {}
        self.project_metadata[project_id] = {}
        return project_data
    
    def get_project(self, project_id: str) -> Optional[dict]:
        """프로젝트 조회"""
        return self.projects_list.get(project_id)
    
    def get_all_projects(self) -> List[dict]:
        """모든 프로젝트 조회"""
        return list(self.projects_list.values())
    
    def update_project(self, project_id: str, updates: dict) -> Optional[dict]:
        """프로젝트 업데이트"""
        from datetime import datetime
        if project_id not in self.projects_list:
            return None
        updates["updatedAt"] = datetime.now()
        self.projects_list[project_id].update(updates)
        return self.projects_list[project_id].copy()
    
    def delete_project(self, project_id: str) -> bool:
        """프로젝트 삭제"""
        if project_id in self.projects_list:
            del self.projects_list[project_id]
            if project_id in self.projects:
                del self.projects[project_id]
            if project_id in self.project_metadata:
                del self.project_metadata[project_id]
            return True
        return False
    
    def duplicate_project(self, source_project_id: str, new_project_name: str, copy_structure: bool = True) -> dict:
        """프로젝트 복제"""
        from datetime import datetime
        
        # 원본 프로젝트 조회
        source_project = self.get_project(source_project_id)
        if not source_project:
            raise ValueError(f"원본 프로젝트를 찾을 수 없습니다: {source_project_id}")
        
        # 원본 블록과 카테고리 가져오기
        source_blocks = self.get_all_blocks(source_project_id)
        source_categories = self.get_categories(source_project_id)
        
        # 새 프로젝트 생성
        new_project_data = self.create_project(new_project_name)
        new_project_id = new_project_data["id"]
        
        # 카테고리 복사
        if source_categories:
            self.update_categories(new_project_id, source_categories)
        
        # 블록 복사
        for source_block in source_blocks:
            new_block_data = {
                "title": source_block.get("title", ""),
                "description": source_block.get("description", ""),
                "category": source_block.get("category"),
            }
            
            if copy_structure:
                # 전체 복사: level과 order 그대로 복사
                new_block_data["level"] = source_block.get("level", 0)
                new_block_data["order"] = source_block.get("order", 0)
            else:
                # 블록만 복사: level을 -1로 설정 (좌측 리스트에 표시)
                new_block_data["level"] = -1
                new_block_data["order"] = 0
            
            self.create_block(new_project_id, new_block_data)
        
        return new_project_data

