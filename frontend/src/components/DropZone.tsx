import React from 'react';
import { Block as BlockType } from '../types/block';

interface DropZoneProps {
  level: number;
  children: React.ReactNode;
  isDragMode?: boolean;
  dragOverLevel?: number | null;
  dragOverIndex?: number | null;
  draggedBlockId?: string | null;
  blocks?: BlockType[]; // 해당 레벨의 블록 목록 (드롭 위치 계산용)
  onDragOver?: (level: number, index?: number) => void;
  onDragLeave?: () => void;
  onDrop?: (level: number, index?: number) => void;
}

export const DropZone: React.FC<DropZoneProps> = ({ 
  level, 
  children,
  isDragMode = false,
  dragOverLevel = null,
  dragOverIndex = null,
  draggedBlockId = null,
  blocks = [],
  onDragOver,
  onDragLeave,
  onDrop,
}) => {
  // 드래그 중인 마우스 위치를 기반으로 삽입 인덱스 계산
  const calculateDropIndex = (e: React.DragEvent): number | undefined => {
    if (!blocks || blocks.length === 0) return 0;
    
    const dropZoneElement = e.currentTarget as HTMLElement;
    const mouseX = e.clientX;
    const mouseY = e.clientY;
    
    // 블록 요소들을 찾아서 위치 계산 (드래그 중인 블록 제외)
    const blockElements = Array.from(dropZoneElement.querySelectorAll('[data-block-id]'))
      .filter(el => {
        const blockId = (el as HTMLElement).getAttribute('data-block-id');
        return blockId !== draggedBlockId;
      }) as HTMLElement[];
    
    if (blockElements.length === 0) return 0;
    
    // 블록들을 위치 순서로 정렬 (Y 좌표 우선, 그 다음 X 좌표)
    const blocksWithIndex = blockElements
      .map((el) => {
        const blockId = el.getAttribute('data-block-id');
        const originalIndex = blocks.findIndex(b => b.id === blockId);
        const rect = el.getBoundingClientRect();
        return {
          element: el,
          rect,
          blockId,
          originalIndex: originalIndex !== -1 ? originalIndex : blocks.length,
          // 마우스와의 거리 계산 (Y 좌표 차이를 더 중요하게)
          distanceY: Math.abs(rect.top + rect.height / 2 - mouseY),
          distanceX: Math.abs(rect.left + rect.width / 2 - mouseX),
        };
      })
      .sort((a, b) => {
        // 같은 줄에 있는지 확인 (Y 좌표 차이가 작으면 같은 줄)
        const sameRowA = a.distanceY < a.rect.height;
        const sameRowB = b.distanceY < b.rect.height;
        
        if (sameRowA && !sameRowB) return -1;
        if (!sameRowA && sameRowB) return 1;
        
        // 같은 줄이면 X 좌표로 정렬, 다른 줄이면 Y 좌표로 정렬
        if (sameRowA && sameRowB) {
          return a.rect.left - b.rect.left;
        } else {
          return a.rect.top - b.rect.top;
        }
      });
    
    let insertIndex = blocks.length; // 기본값: 맨 끝
    
    // 마우스 위치를 기반으로 삽입 위치 찾기
    for (let i = 0; i < blocksWithIndex.length; i++) {
      const blockRect = blocksWithIndex[i].rect;
      const blockCenterX = blockRect.left + blockRect.width / 2;
      const blockCenterY = blockRect.top + blockRect.height / 2;
      
      // 마우스가 블록과 같은 줄에 있는지 확인 (Y 좌표 차이가 블록 높이의 절반 이하)
      const isSameRow = Math.abs(mouseY - blockCenterY) < blockRect.height / 2;
      
      if (isSameRow) {
        // 같은 줄에 있으면 X 좌표로 판단
        if (mouseX < blockCenterX) {
          // 마우스가 블록의 왼쪽 절반에 있으면 그 앞에 삽입
          insertIndex = blocksWithIndex[i].originalIndex;
          break;
        } else if (mouseX <= blockRect.right) {
          // 마우스가 블록의 오른쪽 절반에 있으면 그 뒤에 삽입
          // 다음 블록을 찾아서 그 앞에 삽입하거나, 마지막이면 맨 끝에 삽입
          if (i < blocksWithIndex.length - 1) {
            const nextBlock = blocksWithIndex[i + 1];
            const nextBlockRect = nextBlock.rect;
            const isNextSameRow = Math.abs(mouseY - (nextBlockRect.top + nextBlockRect.height / 2)) < nextBlockRect.height / 2;
            
            if (isNextSameRow && mouseX > blockRect.right) {
              // 다음 블록도 같은 줄에 있고 마우스가 현재 블록 오른쪽에 있으면 다음 블록 앞에 삽입
              insertIndex = nextBlock.originalIndex;
              break;
            } else {
              // 다음 블록이 다른 줄이거나 마우스가 블록 안에 있으면 현재 블록 뒤에 삽입
              insertIndex = blocksWithIndex[i].originalIndex + 1;
              break;
            }
          } else {
            // 마지막 블록이면 그 뒤에 삽입
            insertIndex = blocksWithIndex[i].originalIndex + 1;
            break;
          }
        }
      }
    }
    
    // 마우스가 모든 블록보다 오른쪽에 있고 같은 줄에 있으면 맨 끝
    if (insertIndex === blocks.length && blocksWithIndex.length > 0) {
      // 마지막 블록들 중에서 마우스와 같은 줄에 있는 블록 찾기
      const lastRowBlocks = blocksWithIndex.filter(b => {
        const blockCenterY = b.rect.top + b.rect.height / 2;
        return Math.abs(mouseY - blockCenterY) < b.rect.height / 2;
      });
      
      if (lastRowBlocks.length > 0) {
        const rightmostBlock = lastRowBlocks[lastRowBlocks.length - 1];
        if (mouseX > rightmostBlock.rect.right) {
          insertIndex = rightmostBlock.originalIndex + 1;
        }
      }
    }
    
    return insertIndex;
  };

  const handleDragOver = (e: React.DragEvent) => {
    if (!isDragMode) return;
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'move';
    
    // 드롭 위치 인덱스 계산
    const dropIndex = calculateDropIndex(e);
    
    if (onDragOver) {
      onDragOver(level, dropIndex);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    if (!isDragMode || !onDrop) return;
    e.preventDefault();
    e.stopPropagation();
    
    // 드롭 위치 인덱스 계산
    const dropIndex = calculateDropIndex(e);
    
    onDrop(level, dropIndex);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    if (!isDragMode || !onDragLeave) return;
    // 자식 요소로 이동한 경우는 무시
    if (e.currentTarget.contains(e.relatedTarget as Node)) {
      return;
    }
    onDragLeave();
  };

  // 드롭 오버 시 시각적 피드백
  const isDragOver = dragOverLevel === level;

  return (
    <div
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onDragLeave={handleDragLeave}
      style={{
        width: '100%',
        position: 'relative' as const,
        backgroundColor: isDragOver ? 'rgba(99, 102, 241, 0.05)' : 'transparent',
        border: isDragOver ? '2px dashed rgba(99, 102, 241, 0.5)' : 'none',
        borderRadius: isDragOver ? '8px' : '0',
        transition: 'all 0.2s ease',
      }}
    >
      {children}
    </div>
  );
};

