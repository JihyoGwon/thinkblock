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

  // 레벨에 따른 색상 (깔끔한 그레이 톤)
  const getLevelColor = (level: number) => {
    const colors = [
      '#ffffff', // level 0 - 가장 밝음 (기반)
      '#f8f9fa',
      '#f1f3f5',
      '#e9ecef',
      '#dee2e6',
      '#ced4da', // level 5
      '#adb5bd',
      '#868e96',
      '#495057',
      '#212529', // level 9 - 가장 어두움 (목표)
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
        border: '1px solid',
        borderColor: isDragging ? '#6366f1' : '#e9ecef',
        borderRadius: '12px',
        padding: '16px',
        margin: '8px',
        cursor: isDragging ? 'grabbing' : 'grab',
        minWidth: '320px',
        maxWidth: '480px',
        boxShadow: isDragging 
          ? '0 12px 24px rgba(99, 102, 241, 0.2)' 
          : '0 2px 8px rgba(0,0,0,0.04)',
        transition: 'all 0.2s ease',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div 
          style={{ flex: 1, cursor: 'pointer' }}
          onDoubleClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            onEdit(block);
          }}
        >
          <h3 style={{ margin: '0', fontSize: '16px', fontWeight: '600', color: '#212529', lineHeight: '1.4' }}>
            {block.title}
          </h3>
          {block.description && (
            <p style={{ margin: '10px 0 0 0', fontSize: '14px', color: '#6c757d', lineHeight: '1.5' }}>
              {block.description}
            </p>
          )}
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(block.id);
          }}
          style={{
            padding: '8px',
            border: 'none',
            borderRadius: '8px',
            backgroundColor: 'transparent',
            color: '#dc3545',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s',
            opacity: 0.6,
            position: 'relative',
            zIndex: 2,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#fff5f5';
            e.currentTarget.style.opacity = '1';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
            e.currentTarget.style.opacity = '0.6';
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

