/**
 * 로깅 유틸리티
 * 개발 환경에서만 로그를 출력하고, 프로덕션에서는 로그를 출력하지 않습니다.
 */

const isDevelopment = import.meta.env.DEV;

export const logger = {
  /**
   * 일반 정보 로그 (개발 환경에서만 출력)
   */
  log: (...args: any[]) => {
    if (isDevelopment) {
      console.log(...args);
    }
  },

  /**
   * 경고 로그 (개발 환경에서만 출력)
   */
  warn: (...args: any[]) => {
    if (isDevelopment) {
      console.warn(...args);
    }
  },

  /**
   * 에러 로그 (항상 출력 - 프로덕션에서도 에러는 추적 필요)
   */
  error: (...args: any[]) => {
    console.error(...args);
    // TODO: 프로덕션에서는 에러 트래킹 서비스로 전송 (예: Sentry)
  },

  /**
   * 디버그 로그 (개발 환경에서만 출력)
   */
  debug: (...args: any[]) => {
    if (isDevelopment) {
      console.debug(...args);
    }
  },
};

