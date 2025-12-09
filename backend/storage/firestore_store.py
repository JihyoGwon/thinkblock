"""
Firestore 저장소 구현체
"""
from typing import List, Optional, Dict
from .base import StorageInterface
import firebase_admin
from firebase_admin import credentials, firestore
import os


def init_firestore():
    """Firestore 초기화"""
    if not firebase_admin._apps:
        from utils import find_credentials_file
        
        cred_path = os.getenv("FIREBASE_CREDENTIALS_PATH") or find_credentials_file()
        
        if cred_path and os.path.exists(cred_path):
            try:
                cred = credentials.Certificate(cred_path)
                firebase_admin.initialize_app(cred)
                print(f"✅ Firestore 인증 파일 사용: {cred_path}")
            except Exception as e:
                print(f"⚠️  인증 파일 로드 실패: {e}")
                # 기본 인증 시도 (gcloud auth application-default login 사용)
                try:
                    firebase_admin.initialize_app()
                    print("✅ 기본 인증 사용 (gcloud auth)")
                except Exception as e2:
                    print(f"❌ Firestore 초기화 실패: {e2}")
                    raise
        else:
            # 기본 인증 사용 (GCP 환경에서 또는 gcloud auth 사용)
            try:
                firebase_admin.initialize_app()
                print("✅ 기본 인증 사용 (GCP 환경 또는 gcloud auth)")
            except Exception as e:
                print(f"❌ Firestore 초기화 실패: {e}")
                print("💡 해결 방법:")
                print("   1. vertex-ai-thinkblock.json 파일을 프로젝트 루트에 배치")
                print("   2. 또는 환경 변수 FIREBASE_CREDENTIALS_PATH 설정")
                print("   3. 또는 'gcloud auth application-default login' 실행")
                raise
    
    return firestore.client()


class FirestoreStore(StorageInterface):
    """Firestore 저장소 구현체"""
    
    def __init__(self):
        self.db = init_firestore()
        self.PROJECTS_COLLECTION = "projects"
        self.BLOCKS_COLLECTION = "blocks"
        self.CATEGORIES_DOC_ID = "categories"
        self.DEPENDENCY_COLORS_DOC_ID = "dependency_colors"
        self.CATEGORY_COLORS_DOC_ID = "category_colors"
    
    def get_all_blocks(self, project_id: str) -> List[dict]:
        """프로젝트의 모든 블록 조회"""
        try:
            blocks_ref = self.db.collection(self.PROJECTS_COLLECTION).document(project_id).collection(self.BLOCKS_COLLECTION)
            
            # 인덱스가 없을 수 있으므로 먼저 단순 조회 후 정렬
            docs = blocks_ref.stream()
            
            blocks = []
            for doc in docs:
                block = doc.to_dict()
                block["id"] = doc.id
                blocks.append(block)
            
            # 메모리에서 정렬
            blocks.sort(key=lambda x: (x.get("level", 0), x.get("order", 0)))
            
            print(f"✅ 블록 조회 성공: project_id={project_id}, count={len(blocks)}")
            return blocks
        except Exception as e:
            print(f"❌ 블록 조회 실패: project_id={project_id}, error={e}")
            # 에러 발생 시 빈 배열 반환
            return []
    
    def get_block(self, project_id: str, block_id: str) -> Optional[dict]:
        """특정 블록 조회"""
        doc_ref = self.db.collection(self.PROJECTS_COLLECTION).document(project_id).collection(self.BLOCKS_COLLECTION).document(block_id)
        doc = doc_ref.get()
        
        if doc.exists:
            block = doc.to_dict()
            block["id"] = doc.id
            return block
        return None
    
    def create_block(self, project_id: str, block_data: dict) -> dict:
        """블록 생성"""
        try:
            # 같은 레벨의 블록 수를 확인하여 order 설정
            if "order" not in block_data or block_data["order"] is None:
                level_blocks = self.db.collection(self.PROJECTS_COLLECTION).document(project_id).collection(self.BLOCKS_COLLECTION).where("level", "==", block_data["level"]).stream()
                block_data["order"] = sum(1 for _ in level_blocks)
            
            doc_ref = self.db.collection(self.PROJECTS_COLLECTION).document(project_id).collection(self.BLOCKS_COLLECTION).document()
            block_data["id"] = doc_ref.id
            
            # Firestore에 저장
            doc_ref.set(block_data)
            print(f"✅ 블록 생성 성공: project_id={project_id}, block_id={block_data['id']}, title={block_data.get('title', '')}")
            
            return block_data
        except Exception as e:
            print(f"❌ 블록 생성 실패: project_id={project_id}, error={e}")
            raise
    
    def update_block(self, project_id: str, block_id: str, updates: dict) -> Optional[dict]:
        """블록 업데이트"""
        doc_ref = self.db.collection(self.PROJECTS_COLLECTION).document(project_id).collection(self.BLOCKS_COLLECTION).document(block_id)
        doc = doc_ref.get()
        
        if not doc.exists:
            return None
        
        # None 값 제거
        updates = {k: v for k, v in updates.items() if v is not None}
        
        doc_ref.update(updates)
        
        # 업데이트된 문서 반환
        updated_doc = doc_ref.get()
        block = updated_doc.to_dict()
        block["id"] = updated_doc.id
        return block
    
    def delete_block(self, project_id: str, block_id: str) -> bool:
        """블록 삭제"""
        doc_ref = self.db.collection(self.PROJECTS_COLLECTION).document(project_id).collection(self.BLOCKS_COLLECTION).document(block_id)
        doc = doc_ref.get()
        
        if doc.exists:
            doc_ref.delete()
            return True
        return False
    
    def get_categories(self, project_id: str) -> List[str]:
        """프로젝트의 카테고리 목록 조회"""
        doc_ref = self.db.collection(self.PROJECTS_COLLECTION).document(project_id).collection("metadata").document(self.CATEGORIES_DOC_ID)
        doc = doc_ref.get()
        
        if doc.exists:
            data = doc.to_dict()
            return data.get("categories", [])
        return []
    
    def update_categories(self, project_id: str, categories: List[str]) -> List[str]:
        """프로젝트의 카테고리 목록 업데이트"""
        doc_ref = self.db.collection(self.PROJECTS_COLLECTION).document(project_id).collection("metadata").document(self.CATEGORIES_DOC_ID)
        doc_ref.set({"categories": categories})
        return categories
    
    def get_dependency_colors(self, project_id: str) -> Dict[str, str]:
        """프로젝트의 의존성 색상 맵 조회"""
        doc_ref = self.db.collection(self.PROJECTS_COLLECTION).document(project_id).collection("metadata").document(self.DEPENDENCY_COLORS_DOC_ID)
        doc = doc_ref.get()
        
        if doc.exists:
            data = doc.to_dict()
            return data.get("colors", {})
        return {}
    
    def update_dependency_color(self, project_id: str, from_block_id: str, to_block_id: str, color: str) -> Dict[str, str]:
        """의존성 색상 업데이트"""
        doc_ref = self.db.collection(self.PROJECTS_COLLECTION).document(project_id).collection("metadata").document(self.DEPENDENCY_COLORS_DOC_ID)
        doc = doc_ref.get()
        
        colors = {}
        if doc.exists:
            colors = doc.to_dict().get("colors", {})
        
        key = f"{from_block_id}_{to_block_id}"
        colors[key] = color
        doc_ref.set({"colors": colors})
        return colors
    
    def remove_dependency_color(self, project_id: str, from_block_id: str, to_block_id: str) -> Dict[str, str]:
        """의존성 색상 제거"""
        doc_ref = self.db.collection(self.PROJECTS_COLLECTION).document(project_id).collection("metadata").document(self.DEPENDENCY_COLORS_DOC_ID)
        doc = doc_ref.get()
        
        if not doc.exists:
            return {}
        
        colors = doc.to_dict().get("colors", {})
        key = f"{from_block_id}_{to_block_id}"
        if key in colors:
            del colors[key]
            doc_ref.set({"colors": colors})
        return colors
    
    def get_category_colors(self, project_id: str) -> Dict[str, Dict[str, str]]:
        """프로젝트의 카테고리 색상 맵 조회"""
        doc_ref = self.db.collection(self.PROJECTS_COLLECTION).document(project_id).collection("metadata").document(self.CATEGORY_COLORS_DOC_ID)
        doc = doc_ref.get()
        
        if doc.exists:
            data = doc.to_dict()
            return data.get("colors", {})
        return {}
    
    def update_category_colors(self, project_id: str, colors: Dict[str, Dict[str, str]]) -> Dict[str, Dict[str, str]]:
        """카테고리 색상 맵 업데이트"""
        doc_ref = self.db.collection(self.PROJECTS_COLLECTION).document(project_id).collection("metadata").document(self.CATEGORY_COLORS_DOC_ID)
        doc_ref.set({"colors": colors})
        return colors
    
    def get_connection_color_palette(self, project_id: str) -> List[str]:
        """프로젝트의 연결선 색상 팔레트 조회"""
        doc_ref = self.db.collection(self.PROJECTS_COLLECTION).document(project_id).collection("metadata").document("connection_color_palette")
        doc = doc_ref.get()
        
        if doc.exists:
            data = doc.to_dict()
            colors = data.get("colors", [])
            return colors if colors else ['#6366f1']
        # 기본 색상 반환 (1개만)
        return ['#6366f1']
    
    def update_connection_color_palette(self, project_id: str, colors: List[str]) -> List[str]:
        """연결선 색상 팔레트 업데이트"""
        doc_ref = self.db.collection(self.PROJECTS_COLLECTION).document(project_id).collection("metadata").document("connection_color_palette")
        doc_ref.set({"colors": colors})
        return colors
    
    def create_project(self, project_name: str) -> dict:
        """새 프로젝트 생성"""
        import uuid
        from datetime import datetime
        
        project_id = str(uuid.uuid4())
        project_data = {
            "id": project_id,
            "name": project_name,
            "createdAt": datetime.now(),
            "updatedAt": datetime.now(),
        }
        
        doc_ref = self.db.collection(self.PROJECTS_COLLECTION).document(project_id)
        doc_ref.set(project_data)
        
        return project_data
    
    def get_project(self, project_id: str) -> Optional[dict]:
        """프로젝트 조회"""
        doc_ref = self.db.collection(self.PROJECTS_COLLECTION).document(project_id)
        doc = doc_ref.get()
        
        if doc.exists:
            project = doc.to_dict()
            project["id"] = doc.id
            return project
        return None
    
    def get_all_projects(self) -> List[dict]:
        """모든 프로젝트 조회"""
        from google.cloud.firestore import Query
        
        projects_ref = self.db.collection(self.PROJECTS_COLLECTION)
        docs = projects_ref.order_by("updatedAt", direction=Query.DESCENDING).stream()
        
        projects = []
        for doc in docs:
            project = doc.to_dict()
            project["id"] = doc.id
            projects.append(project)
        
        return projects
    
    def update_project(self, project_id: str, updates: dict) -> Optional[dict]:
        """프로젝트 업데이트"""
        from datetime import datetime
        
        doc_ref = self.db.collection(self.PROJECTS_COLLECTION).document(project_id)
        doc = doc_ref.get()
        
        if not doc.exists:
            return None
        
        updates["updatedAt"] = datetime.now()
        doc_ref.update(updates)
        
        updated_doc = doc_ref.get()
        project = updated_doc.to_dict()
        project["id"] = updated_doc.id
        return project
    
    def delete_project(self, project_id: str) -> bool:
        """프로젝트 삭제 (블록과 카테고리도 함께 삭제)"""
        project_ref = self.db.collection(self.PROJECTS_COLLECTION).document(project_id)
        project_doc = project_ref.get()
        
        if not project_doc.exists:
            return False
        
        # 모든 블록 삭제
        blocks_ref = project_ref.collection(self.BLOCKS_COLLECTION)
        for block_doc in blocks_ref.stream():
            block_doc.reference.delete()
        
        # 메타데이터 삭제
        metadata_ref = project_ref.collection("metadata")
        for metadata_doc in metadata_ref.stream():
            metadata_doc.reference.delete()
        
        # 프로젝트 문서 삭제
        project_ref.delete()
        
        return True
    
    def duplicate_project(self, source_project_id: str, new_project_name: str, copy_structure: bool = True) -> dict:
        """프로젝트 복제"""
        import uuid
        from datetime import datetime
        
        # 원본 프로젝트 조회
        source_project = self.get_project(source_project_id)
        if not source_project:
            raise ValueError(f"원본 프로젝트를 찾을 수 없습니다: {source_project_id}")
        
        # 원본 블록과 카테고리 가져오기
        source_blocks = self.get_all_blocks(source_project_id)
        source_categories = self.get_categories(source_project_id)
        
        # 새 프로젝트 생성
        new_project_id = str(uuid.uuid4())
        new_project_data = {
            "id": new_project_id,
            "name": new_project_name,
            "createdAt": datetime.now(),
            "updatedAt": datetime.now(),
        }
        
        project_ref = self.db.collection(self.PROJECTS_COLLECTION).document(new_project_id)
        project_ref.set(new_project_data)
        
        # 카테고리 복사 (무조건 복사)
        if source_categories:
            self.update_categories(new_project_id, source_categories)
        
        # 블록 복사
        blocks_ref = project_ref.collection(self.BLOCKS_COLLECTION)
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
            
            # 새 블록 생성
            block_doc_ref = blocks_ref.document()
            new_block_data["id"] = block_doc_ref.id
            block_doc_ref.set(new_block_data)
        
        print(f"✅ 프로젝트 복제 성공: source_id={source_project_id}, new_id={new_project_id}, copy_structure={copy_structure}, blocks={len(source_blocks)}")
        
        return new_project_data

