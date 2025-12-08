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
    
    // 블록 요소들을 찾아서 위치 계산 (드래그 중인 블록 제외)
    const blockElements = Array.from(dropZoneElement.querySelectorAll('[data-block-id]'))
      .filter(el => {
        const blockId = (el as HTMLElement).getAttribute('data-block-id');
        return blockId !== draggedBlockId;
      }) as HTMLElement[];
    
    if (blockElements.length === 0) return 0;
    
    // 블록들을 X 좌표 순서로 정렬하고, 각 블록의 원래 인덱스도 함께 저장
    const blocksWithIndex = blockElements
      .map((el) => {
        const blockId = el.getAttribute('data-block-id');
        const originalIndex = blocks.findIndex(b => b.id === blockId);
        return {
          element: el,
          rect: el.getBoundingClientRect(),
          blockId,
          originalIndex: originalIndex !== -1 ? originalIndex : blocks.length,
        };
      })
      .sort((a, b) => a.rect.left - b.rect.left);
    
    let insertIndex = blocks.length; // 기본값: 맨 끝
    
    // 마우스 위치를 기반으로 삽입 위치 찾기
    for (let i = 0; i < blocksWithIndex.length; i++) {
      const blockRect = blocksWithIndex[i].rect;
      const blockCenterX = blockRect.left + blockRect.width / 2;
      
      // 마우스가 블록의 왼쪽 절반에 있으면 그 앞에 삽입
      if (mouseX < blockCenterX) {
        insertIndex = blocksWithIndex[i].originalIndex;
        break;
      }
    }
    
    // 마우스가 모든 블록보다 오른쪽에 있으면 맨 끝
    if (insertIndex === blocks.length && blocksWithIndex.length > 0) {
      const lastBlock = blocksWithIndex[blocksWithIndex.length - 1];
      if (mouseX > lastBlock.rect.right) {
        insertIndex = blocks.length;
      } else {
        // 마지막 블록의 오른쪽 절반에 있으면 그 뒤에 삽입
        insertIndex = blocks.length;
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

