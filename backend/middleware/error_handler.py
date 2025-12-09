"""
통합 에러 핸들러 미들웨어
"""
from fastapi import Request, status
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from exceptions import (
    BaseAPIException,
    NotFoundError,
    BlockNotFoundError,
    ProjectNotFoundError,
    ValidationError,
    AIServiceError,
    StorageError,
)
import traceback
import logging

logger = logging.getLogger(__name__)


async def base_api_exception_handler(request: Request, exc: BaseAPIException) -> JSONResponse:
    """BaseAPIException 처리 핸들러"""
    logger.error(f"API 오류 발생: {exc.message}", exc_info=exc)
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "detail": exc.detail,
            "error": exc.message,
        }
    )


async def not_found_error_handler(request: Request, exc: NotFoundError) -> JSONResponse:
    """NotFoundError 처리 핸들러"""
    logger.warning(f"리소스를 찾을 수 없음: {exc.message}")
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "detail": exc.detail,
            "error": exc.message,
        }
    )


async def validation_error_handler(request: Request, exc: RequestValidationError) -> JSONResponse:
    """FastAPI RequestValidationError 처리 핸들러"""
    errors = exc.errors()
    error_messages = []
    for error in errors:
        field = ".".join(str(loc) for loc in error["loc"])
        message = error["msg"]
        error_messages.append(f"{field}: {message}")
    
    detail = "입력값 검증 실패: " + ", ".join(error_messages)
    logger.warning(f"입력값 검증 실패: {detail}")
    
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "detail": detail,
            "errors": errors,
        }
    )


async def general_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    """일반 예외 처리 핸들러 (마지막 방어선)"""
    error_trace = traceback.format_exc()
    logger.error(f"예상치 못한 오류 발생: {str(exc)}", exc_info=exc)
    
    # 프로덕션 환경에서는 상세한 에러 정보를 숨김
    import os
    is_dev = os.getenv("ENVIRONMENT", "production") == "development"
    
    return JSONResponse(
        status_code=500,
        content={
            "detail": "서버 내부 오류가 발생했습니다.",
            "error": str(exc) if is_dev else "Internal Server Error",
            "traceback": error_trace if is_dev else None,
        }
    )


def register_error_handlers(app):
    """에러 핸들러를 FastAPI 앱에 등록"""
    # 커스텀 예외 핸들러 (구체적인 순서대로)
    app.add_exception_handler(BlockNotFoundError, not_found_error_handler)
    app.add_exception_handler(ProjectNotFoundError, not_found_error_handler)
    app.add_exception_handler(NotFoundError, not_found_error_handler)
    app.add_exception_handler(ValidationError, base_api_exception_handler)
    app.add_exception_handler(AIServiceError, base_api_exception_handler)
    app.add_exception_handler(StorageError, base_api_exception_handler)
    app.add_exception_handler(BaseAPIException, base_api_exception_handler)
    
    # FastAPI 기본 예외 핸들러
    app.add_exception_handler(RequestValidationError, validation_error_handler)
    
    # 일반 예외 핸들러 (마지막에 등록)
    app.add_exception_handler(Exception, general_exception_handler)

