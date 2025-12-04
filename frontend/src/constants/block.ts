/**
 * 블록 관련 상수
 */

// 레벨 관련 상수
export const LEVELS = {
  UNASSIGNED: -1,
  MIN: 0,
  MAX: 5,
} as const;

// 드래그 관련 상수
export const DRAG_THRESHOLD = 5; // 5px 이상 이동해야 드래그로 인정

// 블록 스타일 상수
export const BLOCK_STYLES = {
  MIN_WIDTH: 240,
  MAX_WIDTH: 360,
  BORDER_RADIUS: 12,
  PADDING: 12,
  MARGIN: 4,
} as const;

// 레벨별 배경색
export const LEVEL_BG_COLORS = [
  '#ffffff', // level 0 - 가장 밝음 (기반)
  '#f8f9fa',
  '#f1f3f5',
  '#e9ecef',
  '#dee2e6',
  '#ced4da', // level 5
] as const;

// 레벨별 블록 배경색
export const LEVEL_BLOCK_COLORS = {
  LOW: 'rgba(250, 250, 250, 0.95)',
  HIGH: 'rgba(240, 240, 240, 0.95)',
} as const;

