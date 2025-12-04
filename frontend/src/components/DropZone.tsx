import React from 'react';
import { useDroppable } from '@dnd-kit/core';

interface DropZoneProps {
  level: number;
  children: React.ReactNode;
}

export const DropZone: React.FC<DropZoneProps> = ({ level, children }) => {
  const { setNodeRef, isOver } = useDroppable({
    id: `dropzone-level-${level}`,
  });

  return (
    <div
      ref={setNodeRef}
      style={{
        width: '100%',
        position: 'relative' as const,
        // 드래그 중일 때 시각적 피드백
        outline: isOver ? '2px dashed #6366f1' : 'none',
        outlineOffset: isOver ? '2px' : '0',
        borderRadius: isOver ? '8px' : '0',
        transition: 'all 0.2s ease',
      }}
    >
      {children}
    </div>
  );
};

