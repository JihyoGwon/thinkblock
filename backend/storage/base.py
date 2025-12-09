"""
저장소 인터페이스 정의
모든 저장소 구현체는 이 인터페이스를 구현해야 함
"""
from abc import ABC, abstractmethod
from typing import List, Optional, Dict


class StorageInterface(ABC):
    """저장소 인터페이스 - 모든 저장소 구현체의 공통 계약"""
    
    # 블록 관련 메서드
    @abstractmethod
    def get_all_blocks(self, project_id: str) -> List[dict]:
        """프로젝트의 모든 블록 조회"""
        pass
    
    @abstractmethod
    def get_block(self, project_id: str, block_id: str) -> Optional[dict]:
        """특정 블록 조회"""
        pass
    
    @abstractmethod
    def create_block(self, project_id: str, block_data: dict) -> dict:
        """블록 생성"""
        pass
    
    @abstractmethod
    def update_block(self, project_id: str, block_id: str, updates: dict) -> Optional[dict]:
        """블록 업데이트"""
        pass
    
    @abstractmethod
    def delete_block(self, project_id: str, block_id: str) -> bool:
        """블록 삭제"""
        pass
    
    # 카테고리 관련 메서드
    @abstractmethod
    def get_categories(self, project_id: str) -> List[str]:
        """프로젝트의 카테고리 목록 조회"""
        pass
    
    @abstractmethod
    def update_categories(self, project_id: str, categories: List[str]) -> List[str]:
        """프로젝트의 카테고리 목록 업데이트"""
        pass
    
    # 의존성 색상 관련 메서드
    @abstractmethod
    def get_dependency_colors(self, project_id: str) -> Dict[str, str]:
        """프로젝트의 의존성 색상 맵 조회"""
        pass
    
    @abstractmethod
    def update_dependency_color(self, project_id: str, from_block_id: str, to_block_id: str, color: str) -> Dict[str, str]:
        """의존성 색상 업데이트"""
        pass
    
    @abstractmethod
    def remove_dependency_color(self, project_id: str, from_block_id: str, to_block_id: str) -> Dict[str, str]:
        """의존성 색상 제거"""
        pass
    
    # 카테고리 색상 관련 메서드
    @abstractmethod
    def get_category_colors(self, project_id: str) -> Dict[str, Dict[str, str]]:
        """프로젝트의 카테고리 색상 맵 조회"""
        pass
    
    @abstractmethod
    def update_category_colors(self, project_id: str, colors: Dict[str, Dict[str, str]]) -> Dict[str, Dict[str, str]]:
        """카테고리 색상 맵 업데이트"""
        pass
    
    # 연결선 색상 팔레트 관련 메서드
    @abstractmethod
    def get_connection_color_palette(self, project_id: str) -> List[str]:
        """프로젝트의 연결선 색상 팔레트 조회"""
        pass
    
    @abstractmethod
    def update_connection_color_palette(self, project_id: str, colors: List[str]) -> List[str]:
        """연결선 색상 팔레트 업데이트"""
        pass
    
    # 프로젝트 관련 메서드
    @abstractmethod
    def create_project(self, project_name: str) -> dict:
        """새 프로젝트 생성"""
        pass
    
    @abstractmethod
    def get_project(self, project_id: str) -> Optional[dict]:
        """프로젝트 조회"""
        pass
    
    @abstractmethod
    def get_all_projects(self) -> List[dict]:
        """모든 프로젝트 조회"""
        pass
    
    @abstractmethod
    def update_project(self, project_id: str, updates: dict) -> Optional[dict]:
        """프로젝트 업데이트"""
        pass
    
    @abstractmethod
    def delete_project(self, project_id: str) -> bool:
        """프로젝트 삭제"""
        pass
    
    @abstractmethod
    def duplicate_project(self, source_project_id: str, new_project_name: str, copy_structure: bool = True) -> dict:
        """프로젝트 복제"""
        pass

