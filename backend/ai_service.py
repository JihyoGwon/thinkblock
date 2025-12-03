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

def arrange_blocks(blocks: List[Dict]) -> List[Dict]:
    """
    AI를 사용하여 블록들을 적절한 레벨에 배치
    
    Args:
        blocks: 배치할 블록 리스트 (각 블록은 id, title, description, category 포함)
    
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
        
        prompt = f"""당신은 시스템적 사고를 돕는 전문가입니다. 주어진 블록들을 분석하여 적절한 레벨(0-5)에 배치해주세요.

블록 목록:
{blocks_text}

레벨 배치 기준 (반드시 다양한 레벨에 분산 배치해야 함):
- 레벨 0 (기반): 가장 먼저 구축해야 할 기반 인프라, 기본 설정, 필수 전제 조건
  예: 서버 인프라, 데이터베이스 설계, 기본 인증 시스템, 개발 환경 구축, 기본 API 구조
  특징: 다른 모든 작업의 기반이 되는 것, 없으면 다른 작업을 시작할 수 없는 것
  
- 레벨 1 (초기 핵심 기능): 기반 위에 구축되는 핵심 기능의 첫 단계
  예: 핵심 API 개발, 기본 UI 컴포넌트, 데이터 수집 시스템, 기본 사용자 인증
  특징: 레벨 0이 완료된 후 바로 시작할 수 있는 핵심 기능
  
- 레벨 2 (중간 핵심 기능): 레벨 1의 확장 또는 추가 핵심 기능
  예: 고급 API 기능, 주요 UI 화면, 데이터 분석 기본 기능
  특징: 레벨 1의 기능이 어느 정도 완성된 후 구축하는 기능
  
- 레벨 3 (고급 기능): 핵심 기능이 완성된 후 추가하는 고급 기능
  예: 고급 분석 기능, 사용자 경험 개선, 성능 최적화, 고급 UI/UX
  특징: 기본 기능이 동작한 후 추가하는 개선 사항
  
- 레벨 4 (최적화 및 확장): 시스템이 안정화된 후의 최적화 작업
  예: 대규모 확장, 고급 모니터링, A/B 테스트 시스템, 고급 분석 도구
  특징: 시스템이 잘 동작한 후 추가하는 고급 기능
  
- 레벨 5 (목표 달성): 최종적으로 달성하고자 하는 목표, 최상위 성과
  예: 비즈니스 목표 달성, 사용자 만족도 향상, 시장 진입, 수익화
  특징: 모든 기반과 기능이 완성된 후 달성할 수 있는 최종 목표

배치 시 필수 고려사항:
1. **의존성 관계**: 블록 A가 블록 B에 의존한다면, A는 B보다 낮은 레벨(먼저 해야 함)에 배치
2. **우선순위**: 긴급하고 중요한 작업은 낮은 레벨에, 나중에 해도 되는 작업은 높은 레벨에
3. **기반 인프라 우선**: 인프라, 데이터베이스, 기본 시스템은 반드시 낮은 레벨에
4. **논리적 순서**: 논리적으로 먼저 완료되어야 하는 작업은 낮은 레벨에
5. **위험도**: 높은 위험을 가진 작업은 낮은 레벨에 배치하여 조기에 검증
6. **레벨 분산**: 모든 블록을 레벨 0에 배치하지 말고, 0-5 레벨에 골고루 분산 배치해야 함

중요: 블록들을 분석하여 각 블록의 특성에 맞는 레벨을 배정하세요. 모든 블록이 같은 레벨에 배치되면 안 됩니다.

응답 형식: JSON 배열로 반환해주세요. 각 블록에 level과 reason 필드를 반드시 포함해야 합니다.
[
  {{"id": "블록1의id", "level": 0, "reason": "이 블록을 레벨 0에 배치한 이유를 간단히 설명 (예: 다른 모든 작업의 기반이 되는 인프라)"}},
  {{"id": "블록2의id", "level": 1, "reason": "이 블록을 레벨 1에 배치한 이유를 간단히 설명 (예: 레벨 0 완료 후 바로 시작할 수 있는 핵심 기능)"}},
  {{"id": "블록3의id", "level": 2, "reason": "이 블록을 레벨 2에 배치한 이유를 간단히 설명"}},
  ...
]

각 블록의 reason 필드는 다음을 포함해야 합니다:
- 해당 레벨에 배치한 이유
- 다른 블록과의 의존성 관계 (있는 경우)
- 우선순위나 위험도 고려사항 (있는 경우)

레벨은 0부터 5까지의 정수여야 하며, 블록들을 다양한 레벨에 분산 배치해야 합니다.
모든 블록에 반드시 reason 필드를 포함해주세요."""

        response = model.generate_content(prompt)
        
        # 응답 파싱
        response_text = response.text.strip()
        
        # 디버깅: 원본 응답 출력
        print(f"🔍 AI 원본 응답:\n{response_text[:1000]}")
        
        # JSON 추출 (마크다운 코드 블록 제거)
        if "```json" in response_text:
            response_text = response_text.split("```json")[1].split("```")[0].strip()
        elif "```" in response_text:
            response_text = response_text.split("```")[1].split("```")[0].strip()
        
        # JSON 파싱
        try:
            response_data = json.loads(response_text)
        except json.JSONDecodeError as e:
            print(f"❌ JSON 파싱 실패: {e}")
            print(f"파싱 시도한 텍스트: {response_text[:500]}")
            raise
        
        # 디버깅: 파싱된 데이터 출력
        print(f"🔍 파싱된 배치 데이터: {response_data}")
        
        # 응답 형식 확인 (배열 또는 객체)
        if isinstance(response_data, list):
            # 배열 형식 (각 블록에 reason이 포함될 수 있음)
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
            # 객체 형식 (arrangements와 reasoning 포함)
            arranged_data = response_data.get("arrangements", [])
            reasoning = response_data.get("reasoning", "")
            # reasoning이 없으면 각 블록의 reason을 모아서 생성
            if not reasoning:
                reasons = []
                for item in arranged_data:
                    if item.get("reason"):
                        block_id = item.get("id", "")
                        block_title = next((b.get("title", "") for b in blocks if b.get("id") == block_id), "")
                        reasons.append(f"- {block_title} (레벨 {item.get('level', 0)}): {item.get('reason')}")
                reasoning = "\n\n".join(reasons) if reasons else ""
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
        
    except json.JSONDecodeError as e:
        print(f"❌ JSON 파싱 실패: {e}")
        print(f"응답 텍스트: {response_text[:500]}")
        raise ValueError(f"AI 응답을 파싱할 수 없습니다: {str(e)}")
    except Exception as e:
        print(f"❌ AI 블록 배치 실패: {e}")
        raise

