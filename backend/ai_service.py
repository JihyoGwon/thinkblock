"""
Vertex AI를 사용한 AI 서비스

이 모듈은 Vertex AI (Gemini)를 사용하여 블록 생성 및 배치 기능을 제공합니다.
- generate_blocks: 프로젝트 정보를 바탕으로 블록들을 생성
- arrange_blocks: 생성된 블록들을 적절한 레벨에 배치
"""
import os
import json
import pathlib
from typing import List, Dict, Optional, TypedDict
from dotenv import load_dotenv
import vertexai
from vertexai.preview.generative_models import GenerativeModel

# 타입 정의
class GenerateBlocksResult(TypedDict, total=False):
    """블록 생성 결과"""
    blocks: List[Dict]
    project_analysis: Optional[str]

# 유틸리티 함수
def _parse_ai_response(response_text: str) -> Dict:
    """
    AI 응답 텍스트를 파싱하여 JSON 객체로 변환
    
    Args:
        response_text: AI가 반환한 원본 텍스트
    
    Returns:
        파싱된 JSON 객체 (dict)
    
    Raises:
        ValueError: JSON 파싱 실패 시
    """
    import re
    
    text = response_text.strip()
    
    # 디버깅: 원본 응답 출력
    print(f"🔍 AI 원본 응답 (처음 2000자):\n{text[:2000]}")
    
    # JSON 추출 (마크다운 코드 블록 제거)
    if "```json" in text:
        # ```json ... ``` 패턴 찾기
        json_match = re.search(r'```json\s*(.*?)\s*```', text, re.DOTALL)
        if json_match:
            text = json_match.group(1).strip()
        else:
            # fallback: 첫 번째 ```json 이후부터 찾기
            text = text.split("```json")[1].split("```")[0].strip()
    elif "```" in text:
        # 일반 코드 블록에서 JSON 추출
        code_match = re.search(r'```\s*(.*?)\s*```', text, re.DOTALL)
        if code_match:
            text = code_match.group(1).strip()
            # json 키워드가 있으면 제거
            if text.startswith("json"):
                text = text[4:].strip()
        else:
            # fallback
            text = text.split("```")[1].split("```")[0].strip()
    
    # JSON 객체 찾기 (중괄호로 시작하는 부분)
    if not text.startswith("{"):
        # 첫 번째 { 찾기
        start_idx = text.find("{")
        if start_idx != -1:
            text = text[start_idx:]
        else:
            raise ValueError("JSON 객체를 찾을 수 없습니다 (중괄호 없음)")
    
    # 마지막 } 찾기 (중첩된 중괄호 고려)
    brace_count = 0
    end_idx = -1
    for i, char in enumerate(text):
        if char == "{":
            brace_count += 1
        elif char == "}":
            brace_count -= 1
            if brace_count == 0:
                end_idx = i + 1
                break
    
    if end_idx != -1:
        text = text[:end_idx]
    else:
        # }를 찾지 못한 경우, 마지막 } 사용
        last_brace = text.rfind("}")
        if last_brace != -1:
            text = text[:last_brace + 1]
    
    # 불필요한 공백 및 줄바꿈 정리
    text = text.strip()
    
    # JSON 파싱
    try:
        parsed = json.loads(text)
        print(f"✅ JSON 파싱 성공")
        return parsed
    except json.JSONDecodeError as e:
        print(f"❌ JSON 파싱 실패: {e}")
        print(f"파싱 시도한 텍스트 (처음 1000자):\n{text[:1000]}")
        print(f"파싱 시도한 텍스트 (오류 위치 주변):")
        error_pos = e.pos if hasattr(e, 'pos') else 0
        start = max(0, error_pos - 200)
        end = min(len(text), error_pos + 200)
        print(f"{text[start:end]}")
        print(f"오류 위치: {error_pos}")
        
        # 부분 복구 시도: 마지막 불완전한 항목 제거
        if "arrangements" in text and text.count("[") > 0:
            try:
                # arrangements 배열의 마지막 불완전한 항목 제거 시도
                last_comma = text.rfind(",")
                if last_comma != -1:
                    # 마지막 쉼표 이후 부분 제거 시도
                    text_fixed = text[:last_comma] + "\n  ]\n}"
                    parsed = json.loads(text_fixed)
                    print(f"⚠️  부분 복구 성공 (마지막 항목 제거)")
                    return parsed
            except:
                pass
        
        raise ValueError(f"AI 응답을 파싱할 수 없습니다: {str(e)}")

# .env 파일 로드
load_dotenv()

# Vertex AI 초기화
def init_vertex_ai():
    """Vertex AI 초기화"""
    from utils import find_credentials_file
    
    # .env 파일에서 환경 변수 가져오기
    env_cred_path = os.getenv("GOOGLE_APPLICATION_CREDENTIALS")
    found_cred_path = find_credentials_file()
    cred_path = env_cred_path or found_cred_path
    
    project_id = os.getenv("GOOGLE_CLOUD_PROJECT")
    location = os.getenv("VERTEX_AI_LOCATION")
    
    # 기본값 설정
    if not project_id:
        project_id = "thinkblock"
    if not location:
        location = "asia-northeast3"
    
    # 경로 정규화 및 확인
    if cred_path:
        # 상대 경로인 경우 절대 경로로 변환
        if not os.path.isabs(cred_path):
            project_root = pathlib.Path(__file__).parent.parent
            cred_path = str(project_root / cred_path)
        
        # 절대 경로로 변환
        cred_path = str(pathlib.Path(cred_path).absolute())
        
        # 파일 존재 확인
        if os.path.exists(cred_path):
            # GOOGLE_APPLICATION_CREDENTIALS 환경 변수 설정 (Vertex AI가 자동으로 사용)
            os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = cred_path
            
            try:
                vertexai.init(project=project_id, location=location)
                print(f"✅ Vertex AI 초기화 완료: project={project_id}, location={location}, credentials={cred_path}")
                return True
            except Exception as e:
                error_msg = str(e)
                print(f"❌ Vertex AI 초기화 실패: {error_msg}")
                print(f"   인증 파일 경로: {cred_path}")
                print(f"   파일 존재 여부: {os.path.exists(cred_path)}")
                # 파일을 찾지 못하는 오류인 경우 더 명확한 메시지 제공
                if "was not found" in error_msg or "not found" in error_msg.lower():
                    raise FileNotFoundError(f"인증 파일을 찾을 수 없습니다: {cred_path}\n"
                                          f"프로젝트 루트에 vertex-ai-thinkblock.json 파일이 있는지 확인하세요.")
                raise
        else:
            # 파일이 존재하지 않는 경우
            error_msg = f"인증 파일을 찾을 수 없습니다: {cred_path}"
            print(f"❌ {error_msg}")
            print(f"   프로젝트 루트: {pathlib.Path(__file__).parent.parent}")
            print(f"   환경 변수 GOOGLE_APPLICATION_CREDENTIALS: {env_cred_path}")
            print(f"   find_credentials_file() 결과: {found_cred_path}")
            raise FileNotFoundError(f"{error_msg}\n프로젝트 루트에 vertex-ai-thinkblock.json 파일이 있는지 확인하세요.")
    else:
        # 인증 파일 경로를 찾지 못한 경우
        # GCP 환경(Cloud Run 등)에서는 Service Account를 통해 자동 인증 가능
        # 로컬 환경인지 확인 (GCP 환경 변수 확인)
        is_gcp_env = (
            os.getenv("K_SERVICE") is not None or  # Cloud Run
            os.getenv("GAE_SERVICE") is not None or  # App Engine
            os.getenv("GOOGLE_CLOUD_PROJECT") is not None  # GCP 프로젝트 환경 변수
        )
        
        try:
            vertexai.init(project=project_id, location=location)
            if is_gcp_env:
                print(f"✅ Vertex AI 초기화 완료 (GCP Service Account 사용): project={project_id}, location={location}")
            else:
                print(f"✅ Vertex AI 초기화 완료 (기본 인증 사용): project={project_id}, location={location}")
            return True
        except Exception as e:
            error_msg = str(e)
            print(f"❌ Vertex AI 초기화 실패: {error_msg}")
            print(f"   인증 파일 경로를 찾을 수 없습니다.")
            print(f"   프로젝트 루트: {pathlib.Path(__file__).parent.parent}")
            print(f"   환경 변수 GOOGLE_APPLICATION_CREDENTIALS: {env_cred_path}")
            print(f"   find_credentials_file() 결과: {found_cred_path}")
            print(f"   GCP 환경 여부: {is_gcp_env}")
            
            # GCP 환경이 아닌 경우에만 FileNotFoundError 발생
            # GCP 환경에서는 Service Account를 통해 인증할 수 있어야 함
            if not is_gcp_env:
                # 파일을 찾지 못하는 오류인 경우 더 명확한 메시지 제공
                if "was not found" in error_msg or "not found" in error_msg.lower():
                    raise FileNotFoundError(f"인증 파일을 찾을 수 없습니다.\n"
                                          f"프로젝트 루트({pathlib.Path(__file__).parent.parent})에 vertex-ai-thinkblock.json 파일이 있는지 확인하세요.\n"
                                          f"또는 환경 변수 GOOGLE_APPLICATION_CREDENTIALS를 설정하세요.")
            # GCP 환경에서도 실패한 경우는 다른 인증 오류일 수 있음
            raise

def generate_blocks(
    project_overview: str,
    current_status: str,
    problems: str,
    additional_info: str,
    existing_categories: List[str]
) -> GenerateBlocksResult:
    """
    AI를 사용하여 블록 생성
    
    체계적인 사고 과정(thinking_process)을 거쳐 프로젝트에 필요한 블록들을 생성합니다.
    생성된 블록은 최소 20개 이상이며, 프로젝트 분석(project_analysis)도 함께 반환됩니다.
    
    Args:
        project_overview: 프로젝트 개요
        current_status: 현재 진행 상황
        problems: 문제점/병목지점
        additional_info: 기타 참고 사항
        existing_categories: 기존 카테고리 목록
    
    Returns:
        {
            "blocks": List[Dict],  # 생성된 블록 리스트 (최소 20개)
            "project_analysis": Optional[str]  # 프로젝트 분석 결과
        }
    
    Raises:
        ValueError: AI 응답을 파싱할 수 없을 때
        Exception: Vertex AI 호출 실패 시
    """
    try:
        model = GenerativeModel("gemini-2.0-flash-exp")  # gemini-2.5-flash는 아직 사용 불가, gemini-2.0-flash-exp 사용
        
        # 프롬프트 구성
        categories_context = ""
        if existing_categories:
            categories_context = f"\n\n기존 카테고리 목록: {', '.join(existing_categories)}\n위 카테고리 중 적절한 것을 사용하거나, 필요시 새로운 카테고리를 체계적으로 생성할 수 있습니다."
        
        prompt = f"""당신은 서비스 설계자입니다. 사용자가 제공한 정보를 바탕으로 프로젝트를 위한 블록들을 체계적으로 생성해주세요.

프로젝트 개요:
{project_overview}

현재 진행 상황:
{current_status}

문제점/병목지점:
{problems}

기타 참고 사항:
{additional_info}

기존 카테고리:
{categories_context}

## 블록 생성 전 사고 과정 (thinking_process)

블록을 생성하기 전에 다음 사고 과정을 거쳐 체계적으로 분석하세요:

1. **프로젝트 핵심 분석**:
   - 이 프로젝트의 핵심 목표와 가치는 무엇인가?
   - 사용자가 언급한 문제점/병목지점을 해결하기 위해 필요한 핵심 요소는 무엇인가?
   - 현재 진행 상황을 고려할 때, 가장 시급하게 다뤄야 할 영역은 무엇인가?

2. **카테고리 체계 설계**:
   - 프로젝트 특성에 맞는 카테고리 구조는 무엇인가?
   - 기존 카테고리를 활용할 것인가, 아니면 새로운 카테고리 체계를 설계할 것인가?
   - 각 카테고리의 목적과 범위는 무엇인가?
   - 카테고리 간의 관계와 위계는 어떻게 구성할 것인가?

3. **블록 범위 및 우선순위 결정**:
   - 프로젝트를 성공적으로 완성하기 위해 필요한 블록 영역은 무엇인가?
   - 각 영역별로 몇 개의 블록이 필요한가? (예: 인프라 5개, 핵심 기능 8개, UI/UX 4개 등)
   - 어떤 블록들이 가장 우선순위가 높은가?
   - 놓치기 쉬운 중요한 블록은 무엇인가?

4. **블록 생성 계획**:
   - 각 카테고리별로 생성할 블록의 개수와 목록을 계획하세요.
   - 블록들이 서로 중복되지 않고, 프로젝트의 모든 측면을 커버하는지 확인하세요.
   - 각 블록이 구체적이고 실행 가능한 작업 단위가 되도록 계획하세요.

5. **서비스 설계자 관점의 검토**:
   - 현재 계획에서 놓치고 있는 중요한 블록이 있는가?
   - 프로젝트의 안정성과 확장성을 고려한 블록들이 포함되어 있는가?
   - 사용자가 언급한 문제점을 해결하기 위한 블록들이 충분한가?

6. **최종 블록 생성**:
   - 위의 분석과 계획을 바탕으로 구체적인 블록들을 생성하세요.
   - 각 블록의 제목, 설명, 카테고리를 명확하게 작성하세요.

## 요구사항

1. 최소 20개 이상의 블록을 생성해야 합니다. (최대 50개)
2. 각 블록은 다음 형식의 JSON으로 제공해주세요:
   {{
     "title": "블록 제목",
     "description": "블록 설명 (구체적이고 실용적이어야 함)",
     "category": "카테고리명"
   }}

3. 카테고리는 프로젝트 특성에 맞게 체계적으로 구성해야 합니다.
   - 예시1: UI/UX, 기능, 데이터, 보안, 운영, 마케팅, 판매, 고객 서비스, 기타
   - 예시2: 프롬프팅, 아키텍처, 레퍼런스, 인프라
   - 기존 카테고리가 있으면 적절히 활용하되, 필요시 새로운 카테고리를 추가할 수 있습니다.

4. 블록들은 프로젝트의 핵심 요소들을 포함해야 합니다.
5. 각 블록은 독립적으로 이해할 수 있어야 하며, 설명은 구체적이어야 합니다.
6. 블록들은 다양한 영역을 골고루 커버해야 합니다 (인프라, 기능, UI, 보안, 운영 등).

## 응답 형식

다음 JSON 형식으로 응답해주세요:

{{
  "thinking_process": {{
    "project_analysis": "프로젝트 핵심 목표와 가치, 시급한 영역 분석",
    "category_design": "카테고리 체계 설계 및 각 카테고리의 목적과 범위",
    "block_scope": "필요한 블록 영역과 우선순위, 각 영역별 필요 블록 수",
    "generation_plan": "각 카테고리별 생성할 블록의 개수와 목록 계획",
    "designer_review": "서비스 설계자 관점의 검토 및 추가 제안",
    "final_notes": "최종 블록 생성에 대한 요약 및 특이사항"
  }},
  "blocks": [
    {{"title": "블록 제목", "description": "블록 설명", "category": "카테고리명"}},
    {{"title": "블록 제목", "description": "블록 설명", "category": "카테고리명"}},
    ...
  ]
}}

중요 사항:
- thinking_process의 각 항목을 상세하고 논리적으로 작성하세요.
- blocks 배열에는 최소 20개 이상의 블록이 포함되어야 합니다.
- 각 블록의 description은 구체적이고 실행 가능해야 합니다.
- 카테고리는 일관성 있게 사용하고, 프로젝트 특성에 맞게 구성하세요."""

        response = model.generate_content(prompt)
        
        # 응답 파싱
        response_data = _parse_ai_response(response.text)
        
        # 디버깅: 파싱된 데이터 출력
        print(f"🔍 파싱된 생성 데이터 타입: {type(response_data)}")
        
        # 응답 형식 확인 (배열 또는 객체)
        if isinstance(response_data, list):
            # 배열 형식 (레거시 호환성)
            blocks_data = response_data
            print(f"🔍 레거시 배열 형식 감지: {len(blocks_data)}개 블록")
        elif isinstance(response_data, dict):
            # 객체 형식 (thinking_process와 blocks 포함)
            blocks_data = response_data.get("blocks", [])
            thinking_process = response_data.get("thinking_process", {})
            
            if thinking_process:
                print(f"🔍 thinking_process 포함됨")
                # thinking_process 내용 출력 (디버깅용)
                if thinking_process.get("project_analysis"):
                    print(f"   프로젝트 분석: {thinking_process.get('project_analysis')[:100]}...")
                if thinking_process.get("category_design"):
                    print(f"   카테고리 설계: {thinking_process.get('category_design')[:100]}...")
        else:
            raise ValueError("예상치 못한 응답 형식입니다.")
        
        # 최소 20개 보장
        if len(blocks_data) < 20:
            print(f"⚠️  생성된 블록이 20개 미만입니다 ({len(blocks_data)}개). 추가 생성이 필요할 수 있습니다.")
        
        # thinking_process에서 project_analysis 추출
        project_analysis = None
        if isinstance(response_data, dict):
            thinking_process = response_data.get("thinking_process", {})
            if thinking_process:
                project_analysis = thinking_process.get("project_analysis")
        
        print(f"✅ AI 블록 생성 성공: {len(blocks_data)}개")
        if project_analysis:
            print(f"✅ 프로젝트 분석 추출 완료: {len(project_analysis)} 문자")
        
        # blocks와 project_analysis를 함께 반환
        return {
            "blocks": blocks_data,
            "project_analysis": project_analysis
        }
        
    except ValueError as e:
        # _parse_ai_response에서 발생한 ValueError를 그대로 전달
        raise
    except Exception as e:
        print(f"❌ AI 블록 생성 실패: {e}")
        raise

def arrange_blocks(
    blocks: List[Dict],
    project_overview: Optional[str] = None,
    current_status: Optional[str] = None,
    problems: Optional[str] = None,
    additional_info: Optional[str] = None
) -> List[Dict]:
    """
    AI를 사용하여 블록들을 적절한 레벨에 배치
    
    Args:
        blocks: 배치할 블록 리스트 (각 블록은 id, title, description, category 포함)
        project_overview: 프로젝트 개요 (선택사항)
        current_status: 현재 진행 상황 (선택사항)
        problems: 문제점/병목지점 (선택사항)
        additional_info: 기타 참고 사항 (선택사항)
    
    Returns:
        레벨이 배정된 블록 리스트 (각 블록에 level 필드 추가)
    """
    try:
        model = GenerativeModel("gemini-2.0-flash-exp")
        
        # 블록 정보를 문자열로 변환 (ID를 명확히 포함)
        blocks_info = []
        for i, block in enumerate(blocks):
            block_id = block.get('id', '')
            block_str = f"블록 ID: {block_id}\n"
            block_str += f"  제목: {block.get('title', '')}\n"
            block_str += f"  설명: {block.get('description', '')}\n"
            if block.get('category'):
                block_str += f"  카테고리: {block.get('category')}\n"
            blocks_info.append(block_str)
        
        blocks_text = "\n".join(blocks_info)
        
        # 디버깅: 블록 ID 목록 출력
        block_ids = [block.get('id', '') for block in blocks]
        print(f"🔍 배치할 블록 ID 목록: {block_ids}")
        
        # 프로젝트 정보 구성 (project_overview가 project_analysis인 경우와 일반 프로젝트 정보인 경우 구분)
        project_context = ""
        if project_overview:
            # project_overview가 project_analysis인 경우 (generate_blocks에서 생성된 것)
            # project_analysis는 보통 "핵심 목표", "가치", "시급한 영역" 등의 키워드를 포함
            if len(project_overview) > 200 or "핵심 목표" in project_overview or "가치" in project_overview or "시급한 영역" in project_overview:
                project_context = "\n\n## 프로젝트 분석 (AI 생성)\n"
                project_context += f"{project_overview}\n"
                project_context += "\n위 프로젝트 분석을 바탕으로 블록 배치를 진행하세요."
            else:
                # 일반 프로젝트 정보인 경우
                project_context = "\n\n## 프로젝트 정보\n"
                project_context += f"프로젝트 개요:\n{project_overview}\n\n"
                if current_status:
                    project_context += f"현재 진행 상황:\n{current_status}\n\n"
                if problems:
                    project_context += f"문제점/병목지점:\n{problems}\n\n"
                if additional_info:
                    project_context += f"기타 참고 사항:\n{additional_info}\n"
                project_context += "\n위 프로젝트 정보를 참고하여 블록 배치를 진행하세요."
        elif current_status or problems or additional_info:
            # project_overview는 없지만 다른 정보는 있는 경우
            project_context = "\n\n## 프로젝트 정보\n"
            if current_status:
                project_context += f"현재 진행 상황:\n{current_status}\n\n"
            if problems:
                project_context += f"문제점/병목지점:\n{problems}\n\n"
            if additional_info:
                project_context += f"기타 참고 사항:\n{additional_info}\n"
            project_context += "\n위 프로젝트 정보를 참고하여 블록 배치를 진행하세요."
        
        prompt = f"""당신은 프로젝트 오너이자 제품 설계자입니다. 주어진 블록들을 체계적으로 분석하여 적절한 레벨(0-5)에 배치해주세요.
{project_context}
블록 목록:
{blocks_text}

레벨 배치 기준 (반드시 다양한 레벨에 분산 배치해야 함):
- 레벨 0 (기반): 가장 먼저 구축해야 할 기반 인프라, 기본 설정, 필수 전제 조건
  특징: 다른 모든 작업의 기반이 되는 것, 없으면 다른 작업을 시작할 수 없는 것
  
- 레벨 1 (초기 핵심 기능): 기반 위에 구축되는 핵심 기능의 첫 단계
  특징: 레벨 0이 완료된 후 바로 시작할 수 있는 핵심 기능
  
- 레벨 2 (중간 핵심 기능): 레벨 1의 확장 또는 추가 핵심 기능
  특징: 레벨 1의 기능이 어느 정도 완성된 후 구축하는 기능
  
- 레벨 3 (고급 기능): 핵심 기능이 완성된 후 추가하는 고급 기능
  특징: 기본 기능이 동작한 후 추가하는 개선 사항
  
- 레벨 4 (최적화 및 확장): 시스템이 안정화된 후의 최적화 작업
  특징: 시스템이 잘 동작한 후 추가하는 고급 기능
  
- 레벨 5 (목표 달성): 최종적으로 달성하고자 하는 목표, 최상위 성과
  특징: 모든 기반과 기능이 완성된 후 달성할 수 있는 최종 목표

배치 시 필수 고려사항:
1. **의존성 관계**: 블록 A가 블록 B에 의존한다면, A는 B보다 낮은 레벨(먼저 해야 함)에 배치
2. **논리적 순서**: 논리적으로 먼저 완료되어야 하는 작업은 낮은 레벨에
3. **위험도**: 높은 위험을 가진 작업은 낮은 레벨에 배치하여 조기에 검증
4. **레벨 분산**: 모든 블록을 레벨 0에 배치하지 말고, 0-5 레벨에 골고루 분산 배치해야 함

## 배치 전 사고 과정 (thinking_process)

블록 배치 전에 다음 사고 과정을 거쳐 체계적으로 분석하세요:

1. **프로젝트 분석** (프로젝트 정보가 제공된 경우):
   - 프로젝트의 핵심 목표와 가치는 무엇인가?
   - 현재 진행 상황을 고려할 때, 어떤 블록들이 우선적으로 완료되어야 하는가?
   - 문제점/병목지점을 해결하기 위해 어떤 블록들이 먼저 배치되어야 하는가?
   - 프로젝트의 전체적인 맥락을 고려하여 블록 배치의 방향성을 설정하세요.

2. **레벨 5 (목표) 분석**: 
   - 원활한 프로젝트 진행과 안정적인 구축을 위해 레벨 5에 배정할 블록은 무엇인가?
   - 최종 목표로 설정할 수 있는 블록들을 식별하고 그 이유를 설명하세요.
   - 프로젝트 정보가 있다면, 프로젝트의 최종 목표와 일치하는 블록을 레벨 5에 배치하세요.

3. **레벨별 목표 설정**:
   - 각 레벨(0-4)의 목표는 무엇인가?
   - 각 레벨에서 달성해야 할 핵심 가치와 목적을 명확히 정의하세요.
   - 프로젝트 정보를 바탕으로 각 레벨이 프로젝트의 어떤 단계를 나타내는지 설명하세요.

4. **의존성 및 우선순위 분석**:
   - 블록 간 의존성 관계를 분석하세요.
   - 어떤 블록이 다른 블록의 전제 조건인가?
   - 위험도가 높아 조기에 검증이 필요한 블록은 무엇인가?
   - 프로젝트의 문제점/병목지점을 해결하기 위해 어떤 블록들이 먼저 완료되어야 하는가?

5. **서비스 설계자 관점의 조언**:
   - 현재 블록 구성에서 놓치고 있는 것이 존재하는가?
   - 프로젝트의 안정성과 성공 가능성을 높이기 위한 조언은 무엇인가?
   - 잠재적 리스크나 개선점이 있는가?
   - 프로젝트 정보를 바탕으로 추가로 필요한 블록이나 고려사항이 있는가?

6. **최종 배치 결정**:
   - 위의 분석을 바탕으로 각 블록을 적절한 레벨에 배치하세요.
   - 각 배치 결정의 이유를 명확히 설명하세요.
   - 프로젝트 정보가 있다면, 프로젝트의 맥락과 일치하도록 배치하세요.

## 응답 형식

다음 JSON 형식으로 응답해주세요:

{{
  "thinking_process": {{
    "level5_analysis": "레벨 5에 배정할 블록과 그 이유",
    "level_goals": {{
      "level0": "레벨 0의 목표",
      "level1": "레벨 1의 목표",
      "level2": "레벨 2의 목표",
      "level3": "레벨 3의 목표",
      "level4": "레벨 4의 목표",
      "level5": "레벨 5의 목표"
    }},
    "dependency_analysis": "의존성 및 우선순위 분석",
    "designer_advice": "서비스 설계자 관점의 조언 및 개선 제안",
    "final_decision": "최종 배치 결정의 근거"
  }},
  "arrangements": [
    {{"id": "블록1의id", "level": 0, "reason": "이 블록을 레벨 0에 배치한 이유 (의존성, 우선순위, 위험도 등 포함)"}},
    {{"id": "블록2의id", "level": 1, "reason": "이 블록을 레벨 1에 배치한 이유"}},
    ...
  ]
}}

중요 사항:
- thinking_process의 각 항목을 상세하고 논리적으로 작성하세요.
- arrangements 배열에는 모든 블록이 포함되어야 합니다.
- 각 블록의 reason 필드는 해당 레벨에 배치한 구체적인 이유를 포함해야 합니다.
- 레벨은 0부터 5까지의 정수여야 하며, 블록들을 다양한 레벨에 분산 배치해야 합니다."""

        response = model.generate_content(prompt)
        
        # 응답 파싱
        response_data = _parse_ai_response(response.text)
        
        # 디버깅: 파싱된 데이터 출력
        print(f"🔍 파싱된 배치 데이터: {response_data}")
        
        # 응답 형식 확인 (배열 또는 객체)
        thinking_process = None
        if isinstance(response_data, list):
            # 배열 형식 (레거시 호환성)
            arranged_data = response_data
            # 각 블록의 reason을 모아서 전체 reasoning 생성
            reasons = []
            for item in arranged_data:
                reason_text = item.get("reason", "")
                if reason_text:
                    block_id = item.get("id", "")
                    block_title = next((b.get("title", "") for b in blocks if b.get("id") == block_id), "")
                    reasons.append(f"- {block_title} (레벨 {item.get('level', 0)}): {reason_text}")
            reasoning = "\n\n".join(reasons) if reasons else ""
            print(f"🔍 배열 형식에서 생성한 reasoning 길이: {len(reasoning)} 문자")
            if reasoning:
                print(f"🔍 reasoning 일부: {reasoning[:200]}")
        elif isinstance(response_data, dict):
            # 객체 형식 (thinking_process와 arrangements 포함)
            arranged_data = response_data.get("arrangements", [])
            thinking_process = response_data.get("thinking_process", {})
            
            # thinking_process가 있으면 이를 기반으로 reasoning 생성
            if thinking_process:
                reasoning_parts = []
                
                # 레벨 5 분석
                if thinking_process.get("level5_analysis"):
                    reasoning_parts.append(f"## 레벨 5 (목표) 분석\n{thinking_process.get('level5_analysis')}")
                
                # 레벨별 목표
                level_goals = thinking_process.get("level_goals", {})
                if level_goals:
                    reasoning_parts.append("\n## 레벨별 목표")
                    for level in ["level0", "level1", "level2", "level3", "level4", "level5"]:
                        if level_goals.get(level):
                            level_name = {"level0": "레벨 0 (기반)", "level1": "레벨 1", "level2": "레벨 2", 
                                        "level3": "레벨 3", "level4": "레벨 4", "level5": "레벨 5 (목표)"}.get(level, level)
                            reasoning_parts.append(f"- {level_name}: {level_goals.get(level)}")
                
                # 의존성 분석
                if thinking_process.get("dependency_analysis"):
                    reasoning_parts.append(f"\n## 의존성 및 우선순위 분석\n{thinking_process.get('dependency_analysis')}")
                
                # 설계자 조언
                if thinking_process.get("designer_advice"):
                    reasoning_parts.append(f"\n## 서비스 설계자 관점의 조언\n{thinking_process.get('designer_advice')}")
                
                # 최종 결정
                if thinking_process.get("final_decision"):
                    reasoning_parts.append(f"\n## 최종 배치 결정\n{thinking_process.get('final_decision')}")
                
                # 각 블록의 배치 이유 추가
                if arranged_data:
                    reasoning_parts.append("\n## 블록별 배치 이유")
                    for item in arranged_data:
                        reason_text = item.get("reason", "")
                        if reason_text:
                            block_id = item.get("id", "")
                            block_title = next((b.get("title", "") for b in blocks if b.get("id") == block_id), "")
                            reasoning_parts.append(f"- {block_title} (레벨 {item.get('level', 0)}): {reason_text}")
                
                reasoning = "\n\n".join(reasoning_parts)
            else:
                # thinking_process가 없으면 기존 방식으로 reasoning 생성
                reasoning = response_data.get("reasoning", "")
                if not reasoning:
                    reasons = []
                    for item in arranged_data:
                        if item.get("reason"):
                            block_id = item.get("id", "")
                            block_title = next((b.get("title", "") for b in blocks if b.get("id") == block_id), "")
                            reasons.append(f"- {block_title} (레벨 {item.get('level', 0)}): {item.get('reason')}")
                    reasoning = "\n\n".join(reasons) if reasons else ""
            
            print(f"🔍 thinking_process 포함 여부: {thinking_process is not None}")
            if reasoning:
                print(f"🔍 reasoning 길이: {len(reasoning)} 문자")
                print(f"🔍 reasoning 일부: {reasoning[:300]}")
        else:
            raise ValueError("예상치 못한 응답 형식입니다.")
        
        # 블록 ID를 키로 하는 딕셔너리 생성
        level_map = {}
        for item in arranged_data:
            block_id = item.get("id")
            level = item.get("level", 0)
            # level이 0-5 범위를 벗어나면 조정
            try:
                level = max(0, min(5, int(level)))
            except (ValueError, TypeError):
                print(f"⚠️  레벨 변환 실패: {level}, 기본값 0 사용")
                level = 0
            level_map[block_id] = level
            print(f"  블록 ID: {block_id} -> 레벨: {level}")
        
        # 원본 블록에 level 추가
        result = []
        for block in blocks:
            block_id = block.get("id")
            level = level_map.get(block_id, None)
            
            # 레벨이 매핑되지 않은 경우 경고
            if level is None:
                print(f"⚠️  블록 ID '{block_id}'에 대한 레벨이 매핑되지 않음. 기본값 0 사용")
                level = 0
            
            result_block = block.copy()
            result_block["level"] = level
            result.append(result_block)
            print(f"  최종 배치: 블록 '{block.get('title', '')}' (ID: {block_id}) -> 레벨 {level}")
        
        # 배치된 레벨 분포 확인
        level_distribution = {}
        for block in result:
            level = block.get("level", 0)
            level_distribution[level] = level_distribution.get(level, 0) + 1
        
        print(f"✅ AI 블록 배치 성공: {len(result)}개 블록 배치 완료")
        print(f"   레벨 분포: {level_distribution}")
        print(f"   배치 이유 길이: {len(reasoning)} 문자")
        
        # 배치 이유를 결과에 포함 (첫 번째 블록에만 포함하여 반환)
        if result:
            result[0]["arrangement_reasoning"] = reasoning
        
        return result
        
    except ValueError as e:
        # _parse_ai_response에서 발생한 ValueError를 그대로 전달
        raise
    except Exception as e:
        print(f"❌ AI 블록 배치 실패: {e}")
        raise

