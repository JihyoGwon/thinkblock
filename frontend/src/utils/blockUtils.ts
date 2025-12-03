import { Block } from '../types/block';

/**
 * 블록들을 레벨별로 그룹화하고 order로 정렬
 */
export const groupBlocksByLevel = (blocks: Block[]): { [level: number]: Block[] } => {
  const grouped: { [level: number]: Block[] } = {};
  
  blocks
    .filter((block) => block.level >= 0)
    .forEach((block) => {
      if (!grouped[block.level]) {
        grouped[block.level] = [];
      }
      grouped[block.level].push(block);
    });

  // 각 레벨 내에서 order로 정렬
  Object.keys(grouped).forEach((level) => {
    grouped[Number(level)].sort((a, b) => a.order - b.order);
  });

  return grouped;
};

/**
 * 블록들의 최대 레벨을 계산 (최소 4 보장)
 */
export const calculateMaxLevel = (blocks: Block[]): number => {
  const max = Math.max(...blocks.map((b) => b.level), -1);
  return Math.max(max, 4);
};

