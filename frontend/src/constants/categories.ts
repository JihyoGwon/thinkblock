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

export type Category = typeof CATEGORIES[number] | '';

