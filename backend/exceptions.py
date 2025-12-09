"""
커스텀 예외 클래스 정의
"""
from typing import Optional


class BaseAPIException(Exception):
    """API 예외의 기본 클래스"""
    def __init__(self, message: str, status_code: int = 500, detail: Optional[str] = None):
        self.message = message
        self.status_code = status_code
        self.detail = detail or message
        super().__init__(self.message)


class NotFoundError(BaseAPIException):
    """리소스를 찾을 수 없을 때 발생하는 예외"""
    def __init__(self, resource_type: str, resource_id: Optional[str] = None):
        if resource_id:
            message = f"{resource_type}을(를) 찾을 수 없습니다 (ID: {resource_id})"
        else:
            message = f"{resource_type}을(를) 찾을 수 없습니다"
        super().__init__(message, status_code=404)


class BlockNotFoundError(NotFoundError):
    """블록을 찾을 수 없을 때 발생하는 예외"""
    def __init__(self, block_id: Optional[str] = None):
        super().__init__("블록", block_id)


class ProjectNotFoundError(NotFoundError):
    """프로젝트를 찾을 수 없을 때 발생하는 예외"""
    def __init__(self, project_id: Optional[str] = None):
        super().__init__("프로젝트", project_id)


class ValidationError(BaseAPIException):
    """입력값 검증 실패 시 발생하는 예외"""
    def __init__(self, message: str):
        super().__init__(message, status_code=400)


class AIServiceError(BaseAPIException):
    """AI 서비스 관련 오류 시 발생하는 예외"""
    def __init__(self, message: str, detail: Optional[str] = None):
        super().__init__(message, status_code=500, detail=detail)


class StorageError(BaseAPIException):
    """저장소 관련 오류 시 발생하는 예외"""
    def __init__(self, message: str, detail: Optional[str] = None):
        super().__init__(message, status_code=500, detail=detail)

