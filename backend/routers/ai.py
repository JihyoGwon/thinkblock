"""
AI 관련 API 엔드포인트
"""
from fastapi import APIRouter, HTTPException
from models import AIGenerateBlocksRequest, AIArrangeBlocksRequest, BlockCreate
from storage import get_storage
from ai_service import generate_blocks, arrange_blocks, init_vertex_ai

router = APIRouter(prefix="/api/projects/{project_id}/ai", tags=["ai"])

# 저장소 인스턴스 가져오기
storage = get_storage()


@router.post("/generate-blocks")
async def ai_generate_blocks(project_id: str, request: AIGenerateBlocksRequest):
    """AI를 사용하여 블록 생성"""
    try:
        # Vertex AI 초기화
        try:
            if not init_vertex_ai():
                raise HTTPException(status_code=500, detail="Vertex AI 초기화 실패")
        except FileNotFoundError as e:
            raise HTTPException(status_code=500, detail=f"AI 블록 생성 실패: {str(e)}")
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"AI 블록 생성 실패: {str(e)}")
        
        # 기존 카테고리 가져오기
        existing_categories = storage.get_categories(project_id)
        
        # AI로 블록 생성
        generate_result = generate_blocks(
            project_overview=request.project_overview,
            current_status=request.current_status,
            problems=request.problems,
            additional_info=request.additional_info,
            existing_categories=existing_categories
        )
        
        # 결과에서 blocks와 project_analysis 추출
        if isinstance(generate_result, dict):
            generated_blocks = generate_result.get("blocks", [])
            project_analysis = generate_result.get("project_analysis")
        else:
            # 레거시 호환성 (리스트로 반환된 경우)
            generated_blocks = generate_result
            project_analysis = None
        
        # project_analysis를 프로젝트에 저장
        if project_analysis:
            project_updates = {"project_analysis": project_analysis}
            storage.update_project(project_id, project_updates)
            print(f"✅ 프로젝트 분석 저장 완료: {len(project_analysis)} 문자")
        
        # 생성된 블록들을 저장
        created_blocks = []
        for block_data in generated_blocks:
            block_create = BlockCreate(
                title=block_data.get("title", ""),
                description=block_data.get("description", ""),
                level=-1,  # 기본값: 좌측 리스트에 표시
                order=0,
                category=block_data.get("category")
            )
            
            created_block = storage.create_block(project_id, block_create.dict())
            created_blocks.append(created_block)
        
        # 새로 생성된 카테고리들을 프로젝트 카테고리 목록에 추가
        new_categories = set()
        for block in created_blocks:
            if block.get("category"):
                new_categories.add(block["category"])
        
        if new_categories:
            updated_categories = list(set(existing_categories) | new_categories)
            storage.update_categories(project_id, updated_categories)
        
        return {"blocks": created_blocks}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI 블록 생성 실패: {str(e)}")


@router.post("/arrange-blocks")
async def ai_arrange_blocks(project_id: str, request: AIArrangeBlocksRequest):
    """AI를 사용하여 블록들을 적절한 레벨에 배치"""
    try:
        # Vertex AI 초기화
        try:
            if not init_vertex_ai():
                raise HTTPException(status_code=500, detail="Vertex AI 초기화 실패")
        except FileNotFoundError as e:
            raise HTTPException(status_code=500, detail=f"AI 블록 배치 실패: {str(e)}")
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"AI 블록 배치 실패: {str(e)}")
        
        # 배치할 블록들 가져오기
        all_blocks = storage.get_all_blocks(project_id)
        
        # 요청된 블록 ID들만 필터링
        blocks_to_arrange = [block for block in all_blocks if block.get("id") in request.block_ids]
        
        if not blocks_to_arrange:
            raise HTTPException(status_code=400, detail="배치할 블록을 찾을 수 없습니다")
        
        # 프로젝트에서 저장된 project_analysis 가져오기
        project = storage.get_project(project_id)
        project_analysis = project.get("project_analysis") if project else None
        
        # AI로 블록 배치 (저장된 project_analysis 사용)
        arranged_blocks = arrange_blocks(
            blocks_to_arrange,
            project_overview=project_analysis,  # generate_blocks에서 생성된 project_analysis 사용
            current_status=None,
            problems=None,
            additional_info=None
        )
        
        # 배치 이유 추출 (첫 번째 블록에서)
        arrangement_reasoning = ""
        if arranged_blocks and len(arranged_blocks) > 0:
            arrangement_reasoning = arranged_blocks[0].get("arrangement_reasoning", "")
            print(f"🔍 추출된 배치 이유 길이: {len(arrangement_reasoning)} 문자")
            if arrangement_reasoning:
                print(f"🔍 배치 이유 일부: {arrangement_reasoning[:200]}")
        
        # 블록들의 레벨 업데이트
        updated_blocks = []
        for arranged_block in arranged_blocks:
            block_id = arranged_block.get("id")
            new_level = arranged_block.get("level", 0)
            
            # 블록 업데이트
            updates = {"level": new_level}
            updated_block = storage.update_block(project_id, block_id, updates)
            updated_blocks.append(updated_block)
        
        # 배치 이유를 프로젝트에 저장
        if arrangement_reasoning:
            project_updates = {"arrangement_reasoning": arrangement_reasoning}
            storage.update_project(project_id, project_updates)
            print(f"✅ 배치 이유 프로젝트에 저장 완료: {len(arrangement_reasoning)} 문자")
        
        print(f"🔍 API 응답에 포함할 reasoning: {len(arrangement_reasoning)} 문자")
        return {"blocks": updated_blocks, "reasoning": arrangement_reasoning}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"AI 블록 배치 실패: {str(e)}")

