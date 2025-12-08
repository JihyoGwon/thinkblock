/**
 * 연결선 색상 팔레트
 * 카테고리 색상과 통일된 팔레트를 사용하되, 연결선은 더 진하게 표시
 */

// 카테고리 색상의 text 색상을 기반으로 한 연결선 색상 팔레트 (10개)
// 연결선은 카테고리보다 채도/명도를 약간 더 높여서 잘 보이도록 조정
export const CONNECTION_COLOR_PALETTE = [
  '#6366f1', // 인디고
  '#10b981', // 그린
  '#f59e0b', // 앰버
  '#ec4899', // 핑크
  '#6b7280', // 그레이
  '#3b82f6', // 블루
  '#22c55e', // 에메랄드
  '#ef4444', // 레드
  '#f97316', // 오렌지
  '#06b6d4', // 시안
] as const;

/**
 * 연결선용 색상을 더 진하게 만드는 함수
 * RGB 값을 약간 감소시켜 더 진한 색상으로 변환
 */
export function darkenColorForConnection(color: string, amount: number = 10): string {
  if (!color.startsWith('#')) return color;
  
  const hex = color.slice(1);
  const r = Math.max(0, parseInt(hex.substr(0, 2), 16) - amount);
  const g = Math.max(0, parseInt(hex.substr(2, 2), 16) - amount);
  const b = Math.max(0, parseInt(hex.substr(4, 2), 16) - amount);
  
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

