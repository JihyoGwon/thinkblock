"""
Vertex AI를 사용한 AI 서비스
"""
import os
import json
from typing import List, Dict, Optional
from dotenv import load_dotenv
import vertexai
from vertexai.preview.generative_models import GenerativeModel

# .env 파일 로드
load_dotenv()

# Vertex AI 초기화
def init_vertex_ai():
    """Vertex AI 초기화"""
    import pathlib
    
    # .env 파일에서 환경 변수 가져오기
    cred_path = os.getenv("GOOGLE_APPLICATION_CREDENTIALS")
    project_id = os.getenv("GOOGLE_CLOUD_PROJECT")
    location = os.getenv("VERTEX_AI_LOCATION")
    
    # 프로젝트 루트 경로 계산
    project_root = pathlib.Path(__file__).parent.parent
    
    # cred_path가 있으면 절대 경로로 변환 (상대 경로인 경우 프로젝트 루트 기준)
    if cred_path:
        if not os.path.isabs(cred_path):
            # 상대 경로인 경우 프로젝트 루트 기준으로 변환
            cred_path = str(project_root / cred_path)
        # 파일이 존재하는지 확인
        if not os.path.exists(cred_path):
            print(f"⚠️  지정된 인증 파일을 찾을 수 없습니다: {cred_path}")
            cred_path = None
    
    # 환경 변수가 없거나 파일이 없으면 프로젝트 루트에서 찾기
    if not cred_path:
        possible_paths = [
            project_root / "vertex-ai-thinkblock.json",
            project_root / "firebase-credentials.json",
        ]
        for path in possible_paths:
            if path.exists():
                cred_path = str(path.absolute())
                break
    
    # 기본값 설정
    if not project_id:
        project_id = "thinkblock"
    if not location:
        location = "asia-northeast3"
    
    if cred_path and os.path.exists(cred_path):
        # 절대 경로로 변환
        cred_path = str(pathlib.Path(cred_path).absolute())
        # GOOGLE_APPLICATION_CREDENTIALS 환경 변수 설정 (Vertex AI가 자동으로 사용)
        os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = cred_path
        
        vertexai.init(project=project_id, location=location)
        print(f"✅ Vertex AI 초기화 완료: project={project_id}, location={location}, credentials={cred_path}")
        return True
    else:
        # 환경 변수만으로도 시도 (GCP 환경에서 실행 중일 경우)
        try:
            vertexai.init(project=project_id, location=location)
            print(f"✅ Vertex AI 초기화 완료 (환경 변수 사용): project={project_id}, location={location}")
            return True
        except Exception as e:
            print(f"⚠️  Vertex AI 초기화 실패: {e}")
            print(f"   인증 파일 경로: {cred_path}")
            print(f"   프로젝트 루트: {project_root}")
            return False

def generate_blocks(
    project_overview: str,
    current_status: str,
    problems: str,
    additional_info: str,
    existing_categories: List[str]
) -> List[Dict]:
    """
    AI를 사용하여 블록 생성
    
    Args:
        project_overview: 프로젝트 개요
        current_status: 현재 진행 상황
        problems: 문제점/병목지점
        additional_info: 기타 참고 사항
        existing_categories: 기존 카테고리 목록
    
    Returns:
        생성된 블록 리스트 (최소 5개)
    """
    try:
        model = GenerativeModel("gemini-2.0-flash-exp")  # gemini-2.5-flash는 아직 사용 불가, gemini-2.0-flash-exp 사용
        
        # 프롬프트 구성
        categories_context = ""
        if existing_categories:
            categories_context = f"\n\n기존 카테고리 목록: {', '.join(existing_categories)}\n위 카테고리 중 적절한 것을 사용하거나, 필요시 새로운 카테고리를 체계적으로 생성할 수 있습니다."
        
        prompt = f"""당신은 시스템적 사고를 돕는 전문가입니다. 사용자가 제공한 정보를 바탕으로 프로젝트를 위한 블록들을 생성해주세요.

프로젝트 개요:
{project_overview}

현재 진행 상황:
{current_status}

문제점/병목지점:
{problems}

기타 참고 사항:
{additional_info}
{categories_context}

요구사항:
1. 최소 5개 이상의 블록을 생성해야 합니다.
2. 각 블록은 다음 형식의 JSON으로 제공해주세요:
   {{
     "title": "블록 제목",
     "description": "블록 설명 (구체적이고 실용적이어야 함)",
     "category": "카테고리명"
   }}

3. 카테고리는 체계적으로 구성되어야 합니다. 예를 들어:
   - 기능 관련: "기능/인증", "기능/결제", "기능/알림" 등
   - 인프라 관련: "인프라/서버", "인프라/데이터베이스", "인프라/보안" 등
   - 기타: "디자인/UI", "디자인/UX", "운영/모니터링" 등

4. 블록들은 프로젝트의 핵심 요소들을 포함해야 합니다.
5. 각 블록은 독립적으로 이해할 수 있어야 하며, 설명은 구체적이어야 합니다.

응답 형식: JSON 배열로 반환해주세요.
[
  {{"title": "...", "description": "...", "category": "..."}},
  {{"title": "...", "description": "...", "category": "..."}},
  ...
]"""

        response = model.generate_content(prompt)
        
        # 응답 파싱
        response_text = response.text.strip()
        
        # JSON 추출 (마크다운 코드 블록 제거)
        if "```json" in response_text:
            response_text = response_text.split("```json")[1].split("```")[0].strip()
        elif "```" in response_text:
            response_text = response_text.split("```")[1].split("```")[0].strip()
        
        # JSON 파싱
        blocks_data = json.loads(response_text)
        
        # 최소 5개 보장
        if len(blocks_data) < 5:
            print(f"⚠️  생성된 블록이 5개 미만입니다 ({len(blocks_data)}개). 추가 생성이 필요할 수 있습니다.")
        
        print(f"✅ AI 블록 생성 성공: {len(blocks_data)}개")
        return blocks_data
        
    except json.JSONDecodeError as e:
        print(f"❌ JSON 파싱 실패: {e}")
        print(f"응답 텍스트: {response_text[:500]}")
        raise ValueError(f"AI 응답을 파싱할 수 없습니다: {str(e)}")
    except Exception as e:
        print(f"❌ AI 블록 생성 실패: {e}")
        raise

