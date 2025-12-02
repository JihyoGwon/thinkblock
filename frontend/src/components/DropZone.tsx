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
        border: isOver ? '3px dashed #1976d2' : '2px dashed transparent',
        borderRadius: '8px',
        backgroundColor: isOver ? '#e3f2fd' : 'transparent',
        transition: 'all 0.2s ease',
        padding: isOver ? '20px' : '16px',
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'center',
        alignItems: 'center',
        gap: '8px',
      }}
    >
      {children}
    </div>
  );
};

