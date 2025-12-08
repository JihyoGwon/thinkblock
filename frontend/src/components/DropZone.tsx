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
  dragOverIndex: _dragOverIndex = null,
  draggedBlockId: _draggedBlockId = null,
  blocks = [],
  onDragOver,
  onDragLeave,
  onDrop,
}) => {
  // 드래그 중인 마우스 위치를 기반으로 삽입 인덱스 계산
  const calculateDropIndex = (e: React.DragEvent): number | undefined => {
    if (!blocks || blocks.length === 0) return 0;
    
    const dropZoneElement = e.currentTarget as HTMLElement;
    const mouseY = e.clientY;
    
    // 블록 요소들을 찾아서 위치 계산
    const blockElements = dropZoneElement.querySelectorAll('[data-block-id]');
    let insertIndex = blocks.length; // 기본값: 맨 끝
    
    for (let i = 0; i < blockElements.length; i++) {
      const blockElement = blockElements[i] as HTMLElement;
      const blockRect = blockElement.getBoundingClientRect();
      const blockCenterY = blockRect.top + blockRect.height / 2;
      
      // 마우스가 블록의 위쪽 절반에 있으면 그 앞에 삽입
      if (mouseY < blockCenterY) {
        insertIndex = i;
        break;
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

