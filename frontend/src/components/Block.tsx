import React from 'react';
import { Block as BlockType } from '../types/block';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { getCategoryColor } from '../utils/categoryColors';

interface BlockProps {
  block: BlockType;
  onEdit: (block: BlockType) => void;
  onDelete: (blockId: string) => void;
  isEditMode?: boolean; // 수정 모드 여부
}

export const Block: React.FC<BlockProps> = ({ block, onEdit, onDelete, isEditMode = false }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ 
    id: block.id,
    disabled: !isEditMode, // 수정 모드가 아니면 드래그 비활성화
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.8 : 1,
    position: 'relative' as const,
    zIndex: isDragging ? 9999 : 'auto', // 드래그 중일 때 매우 높은 z-index
  };

  // 레벨에 따른 색상 (밝은 회색+반투명)
  const getLevelColor = (level: number) => {
    // 밝은 회색 배경에 반투명 효과 적용
    // 레벨이 높을수록(목표) 약간 더 어둡게
    const baseColor = level >= 5 ? 'rgba(240, 240, 240, 0.95)' : 'rgba(250, 250, 250, 0.95)';
    return baseColor;
  };

  const [showDelete, setShowDelete] = React.useState(false);
  
  // 카테고리 색상 가져오기
  const categoryColor = block.category ? getCategoryColor(block.category) : null;

  // 수정 모드에 따라 드래그 리스너 적용
  const dragListeners = isEditMode ? listeners : {};

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...dragListeners}
      className="block"
      style={{
        ...style,
        backgroundColor: getLevelColor(block.level),
        border: '1px solid',
        borderColor: isDragging ? '#6366f1' : '#e9ecef',
        borderRadius: '12px',
        padding: '12px',
        margin: '4px',
        cursor: isEditMode ? (isDragging ? 'grabbing' : 'grab') : 'pointer',
        minWidth: '320px',
        maxWidth: '480px',
        boxShadow: isDragging 
          ? '0 12px 24px rgba(99, 102, 241, 0.2)' 
          : '0 2px 8px rgba(0,0,0,0.04)',
        transition: isDragging ? 'none' : 'all 0.2s ease',
      }}
      onMouseEnter={() => setShowDelete(true)}
      onMouseLeave={() => setShowDelete(false)}
      onClick={(e) => {
        // 수정 모드가 아닐 때만 클릭으로 편집 모달 열기
        // 수정 모드일 때는 클릭 이벤트 무시 (드래그만 가능)
        if (!isEditMode) {
          e.stopPropagation();
          onEdit(block);
        } else {
          // 수정 모드일 때는 클릭 이벤트 차단
          e.stopPropagation();
        }
      }}
    >
      {/* 삭제 버튼 - 우측 상단 모서리 */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
          onDelete(block.id);
        }}
        onMouseDown={(e) => {
          e.stopPropagation();
          e.preventDefault();
        }}
        onPointerDown={(e) => {
          e.stopPropagation();
          e.preventDefault();
        }}
        style={{
          position: 'absolute',
          top: '8px',
          right: '8px',
          padding: '6px',
          border: 'none',
          borderRadius: '6px',
          backgroundColor: showDelete ? '#fff5f5' : 'transparent',
          color: '#dc3545',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.2s',
          opacity: showDelete ? 1 : 0,
          zIndex: 10,
          pointerEvents: showDelete ? 'auto' : 'none',
          width: '24px',
          height: '24px',
        }}
        title="삭제"
      >
        <svg
          width="16"
          height="16"
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

      {/* 카테고리 - 상단 */}
      {block.category && categoryColor && (
        <div style={{ marginBottom: '8px' }}>
          <span
            style={{
              fontSize: '11px',
              fontWeight: '600',
              color: categoryColor.text,
              backgroundColor: categoryColor.bg,
              padding: '4px 10px',
              borderRadius: '6px',
              whiteSpace: 'nowrap',
              display: 'inline-block',
            }}
          >
            {block.category}
          </span>
        </div>
      )}

      {/* 제목 */}
      <div 
        style={{ paddingRight: block.category ? '0' : '32px' }}
      >
        <h3 style={{ 
          margin: '0', 
          fontSize: '16px', 
          fontWeight: '600', 
          color: '#212529', 
          lineHeight: '1.5',
          wordBreak: 'break-word',
        }}>
          {block.title}
        </h3>
      </div>
    </div>
  );
};

