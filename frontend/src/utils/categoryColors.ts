// 카테고리별 색상을 일관되게 생성하는 유틸리티

// 미리 정의된 색상 팔레트 (밝고 구분하기 쉬운 색상들)
export const CATEGORY_COLORS = [
  { bg: '#eef2ff', text: '#6366f1' }, // 인디고
  { bg: '#ecfdf5', text: '#10b981' }, // 그린
  { bg: '#fef3c7', text: '#f59e0b' }, // 앰버
  { bg: '#fce7f3', text: '#ec4899' }, // 핑크
  { bg: '#f3f4f6', text: '#6b7280' }, // 그레이
  { bg: '#dbeafe', text: '#3b82f6' }, // 블루
  { bg: '#f0fdf4', text: '#22c55e' }, // 에메랄드
  { bg: '#fef2f2', text: '#ef4444' }, // 레드
  { bg: '#fff7ed', text: '#f97316' }, // 오렌지
  { bg: '#f5f3ff', text: '#a855f7' }, // 퍼플
  { bg: '#ecfeff', text: '#06b6d4' }, // 시안
  { bg: '#f0f9ff', text: '#0ea5e9' }, // 스카이
];

/**
 * 카테고리 이름을 기반으로 일관된 색상을 반환합니다.
 * 같은 카테고리는 항상 같은 색상을 가집니다.
 * 
 * @param category 카테고리 이름
 * @param savedColors 저장된 카테고리 색상 맵 (선택사항)
 * @returns { bg: string, text: string } 색상 객체
 */
export function getCategoryColor(
  category: string,
  savedColors?: Record<string, { bg: string; text: string }>
): { bg: string; text: string } {
  if (!category) {
    return { bg: '#f1f3f5', text: '#6c757d' }; // 기본 회색
  }

  // 저장된 색상이 있으면 우선 사용
  if (savedColors && savedColors[category]) {
    return savedColors[category];
  }

  // 카테고리 이름을 해시하여 색상 인덱스 생성
  let hash = 0;
  for (let i = 0; i < category.length; i++) {
    hash = category.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  const index = Math.abs(hash) % CATEGORY_COLORS.length;
  return CATEGORY_COLORS[index];
}

