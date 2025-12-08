/**
 * 에러 처리 유틸리티
 */
import { logger } from './logger';

export const handleError = (error: unknown, defaultMessage: string) => {
  logger.error(defaultMessage, error);
  
  // 사용자에게 알림 (나중에 토스트 메시지로 변경 가능)
  const message = error instanceof Error ? error.message : defaultMessage;
  alert(message);
};

export const showConfirm = (message: string): boolean => {
  return confirm(message);
};

