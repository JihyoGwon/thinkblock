import React from 'react';
import {
  SortableContext,
  horizontalListSortingStrategy,
} from '@dnd-kit/sortable';
import { Block as BlockType } from '../types/block';
import { Block } from './Block';
import { DropZone } from './DropZone';

interface PyramidViewProps {
  blocksByLevel: { [level: number]: BlockType[] };
  maxLevel: number;
  onBlockDelete: (blockId: string) => void;
  onBlockEdit: (block: BlockType) => void;
  isEditMode?: boolean;
}

export const PyramidView: React.FC<PyramidViewProps> = ({
  blocksByLevel,
  maxLevel,
  onBlockDelete,
  onBlockEdit,
  isEditMode = false,
}) => {

  // 레벨별로 렌더링 (아래에서 위로, 낮은 레벨부터 - 일반 피라미드: 아래가 기반, 위가 목표)
  const levels = Array.from({ length: maxLevel + 1 }, (_, i) => i);

  // 레벨에 따른 배경색 (깔끔한 그레이 톤)
  const getLevelBgColor = (level: number) => {
    const colors = [
      '#ffffff', // level 0 - 가장 밝음 (기반)
      '#f8f9fa',
      '#f1f3f5',
      '#e9ecef',
      '#dee2e6',
      '#ced4da', // level 5
    ];
    return colors[Math.min(level, colors.length - 1)];
  };

  // 레벨에 따른 너비 (모든 레벨 동일한 너비)
  const getLevelWidth = (level: number) => {
    return 100; // 모든 레벨 100% 너비
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        height: '100%',
      }}
    >
      {/* 피라미드 영역 */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          alignItems: 'flex-start',
          overflowY: 'auto',
          padding: '16px 20px',
        }}
      >
        {levels.map((level) => {
          const levelBlocks = blocksByLevel[level] || [];
          const hasBlocks = levelBlocks.length > 0;
          const levelWidth = getLevelWidth(level);
          const blockCount = levelBlocks.length;
          const isSingleBlock = blockCount === 1;

          return (
            <DropZone key={level} level={level}>
              <div
                style={{
                  width: `${levelWidth}%`,
                  backgroundColor: getLevelBgColor(level),
                  borderRadius: '16px',
                  padding: isSingleBlock ? '8px 12px' : '12px',
                  border: '1px solid',
                  borderColor: level === maxLevel ? '#6366f1' : level === 0 ? '#10b981' : '#e9ecef',
                  transition: 'all 0.3s ease',
                  boxShadow: hasBlocks ? '0 4px 12px rgba(0,0,0,0.06)' : '0 2px 6px rgba(0,0,0,0.03)',
                  display: 'flex',
                  flexDirection: 'column',
                  minHeight: '80px',
                }}
              >
                {/* 레벨 태그 */}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'flex-start',
                    marginBottom: hasBlocks ? (isSingleBlock ? '4px' : '8px') : '0',
                  }}
                >
                  <span
                    style={{
                      fontSize: '12px',
                      fontWeight: '600',
                      color: level === maxLevel ? '#6366f1' : level === 0 ? '#10b981' : '#6c757d',
                      padding: '6px 12px',
                      borderRadius: '8px',
                      backgroundColor: level === maxLevel ? '#eef2ff' : level === 0 ? '#ecfdf5' : '#f1f3f5',
                      border: 'none',
                      display: 'inline-block',
                    }}
                  >
                    {level === maxLevel ? '목표' : level === 0 ? '기반' : `Level ${level}`}
                  </span>
                </div>
                {hasBlocks ? (
                  <SortableContext
                    items={levelBlocks.map((b) => b.id)}
                    strategy={horizontalListSortingStrategy}
                  >
                    <div style={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap', gap: '4px', justifyContent: 'flex-start', width: '100%' }}>
                      {levelBlocks.map((block) => (
                        <Block
                          key={block.id}
                          block={block}
                          onEdit={onBlockEdit}
                          onDelete={onBlockDelete}
                          isEditMode={isEditMode}
                        />
                      ))}
                    </div>
                  </SortableContext>
                ) : (
                  <span style={{ color: '#adb5bd', fontSize: '13px', fontStyle: 'italic', textAlign: 'left' }}>
                    여기에 블록을 드롭하세요
                  </span>
                )}
              </div>
            </DropZone>
          );
        })}
      </div>
    </div>
  );
};

