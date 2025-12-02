import React from 'react';
import { Block as BlockType } from '../types/block';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface BlockProps {
  block: BlockType;
  onEdit: (block: BlockType) => void;
  onDelete: (blockId: string) => void;
}

export const Block: React.FC<BlockProps> = ({ block, onEdit, onDelete }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: block.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  // 레벨에 따른 색상 (아래에서 위로 갈수록 진해짐)
  const getLevelColor = (level: number) => {
    const colors = [
      '#e3f2fd', // level 0 - 가장 밝음 (기반)
      '#bbdefb',
      '#90caf9',
      '#64b5f6',
      '#42a5f5',
      '#2196f3', // level 5
      '#1e88e5',
      '#1976d2',
      '#1565c0',
      '#0d47a1', // level 9 - 가장 어두움 (목표)
    ];
    return colors[Math.min(level, colors.length - 1)];
  };

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      className="block"
      style={{
        ...style,
        backgroundColor: getLevelColor(block.level),
        border: '1px solid #1976d2',
        borderRadius: '8px',
        padding: '16px',
        margin: '8px',
        cursor: 'grab',
        minWidth: '200px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
        <div style={{ flex: 1 }}>
          <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: 'bold' }}>
            {block.title}
          </h3>
          <p style={{ margin: 0, fontSize: '14px', color: '#555' }}>
            {block.description}
          </p>
          <div style={{ marginTop: '8px', fontSize: '12px', color: '#666' }}>
            Level {block.level}
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px', marginLeft: '12px' }}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit(block);
            }}
            style={{
              padding: '4px 8px',
              fontSize: '12px',
              border: 'none',
              borderRadius: '4px',
              backgroundColor: '#1976d2',
              color: 'white',
              cursor: 'pointer',
            }}
          >
            수정
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(block.id);
            }}
            style={{
              padding: '4px 8px',
              fontSize: '12px',
              border: 'none',
              borderRadius: '4px',
              backgroundColor: '#d32f2f',
              color: 'white',
              cursor: 'pointer',
            }}
          >
            삭제
          </button>
        </div>
      </div>
    </div>
  );
};

