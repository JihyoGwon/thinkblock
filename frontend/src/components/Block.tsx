import React from 'react';
import { Block as BlockType } from '../types/block';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface BlockProps {
  block: BlockType;
  onEdit: (block: BlockType) => void;
  onDelete: (blockId: string) => void;
  onClick?: (block: BlockType) => void;
}

export const Block: React.FC<BlockProps> = ({ block, onEdit, onDelete, onClick }) => {
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

  const handleClick = (e: React.MouseEvent) => {
    // 버튼 클릭이 아닐 때만 클릭 이벤트 발생
    const target = e.target as HTMLElement;
    if (target.tagName !== 'BUTTON' && !target.closest('button')) {
      if (onClick && !isDragging) {
        onClick(block);
      }
    }
  };

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      className="block"
      onClick={handleClick}
      style={{
        ...style,
        backgroundColor: getLevelColor(block.level),
        border: '2px solid',
        borderColor: isDragging ? '#1976d2' : 'rgba(25, 118, 210, 0.3)',
        borderRadius: '10px',
        padding: '16px',
        margin: '6px',
        cursor: isDragging ? 'grabbing' : 'pointer',
        minWidth: '220px',
        maxWidth: '300px',
        boxShadow: isDragging 
          ? '0 8px 16px rgba(0,0,0,0.2)' 
          : '0 2px 6px rgba(0,0,0,0.1)',
        transition: 'all 0.2s ease',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
        <div style={{ flex: 1 }}>
          <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: 'bold', color: '#333' }}>
            {block.title}
          </h3>
          {block.description && (
            <p style={{ margin: '8px 0 0 0', fontSize: '14px', color: '#555' }}>
              {block.description}
            </p>
          )}
          {!block.description && (
            <p style={{ margin: '8px 0 0 0', fontSize: '12px', color: '#999', fontStyle: 'italic' }}>
              클릭하여 설명 추가
            </p>
          )}
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(block.id);
          }}
          style={{
            padding: '6px',
            border: 'none',
            borderRadius: '4px',
            backgroundColor: 'transparent',
            color: '#d32f2f',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#ffebee';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
          }}
          title="삭제"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M6 19C6 20.1 6.9 21 8 21H16C17.1 21 18 20.1 18 19V7H6V19ZM19 4H15.5L14.5 3H9.5L8.5 4H5V6H19V4Z"
              fill="currentColor"
            />
          </svg>
        </button>
      </div>
    </div>
  );
};

