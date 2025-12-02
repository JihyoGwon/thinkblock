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
        minHeight: isOver ? '100px' : '60px',
        border: isOver ? '2px dashed #6366f1' : '1px dashed transparent',
        borderRadius: '12px',
        backgroundColor: isOver ? '#eef2ff' : 'transparent',
        transition: 'all 0.2s ease',
        padding: isOver ? '24px' : '20px',
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'center',
        alignItems: 'center',
        gap: '12px',
      }}
    >
      {children}
    </div>
  );
};

