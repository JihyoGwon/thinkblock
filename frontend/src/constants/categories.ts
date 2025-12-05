/**
 * 카테고리 옵션 목록
 */
export const CATEGORIES = [
  '기능',
  '인프라',
  '디자인',
  '마케팅',
  '운영',
  '보안',
  '성능',
  '사용자 경험',
  '비즈니스',
  '기술',
] as const;

// DEFAULT_CATEGORIES는 CATEGORIES의 별칭 (호환성을 위해)
export const DEFAULT_CATEGORIES = [...CATEGORIES] as string[];

export type Category = typeof CATEGORIES[number] | '';

