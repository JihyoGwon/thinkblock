import React, { useMemo } from 'react';
import { DndContext, DragEndEvent, closestCenter } from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable';
import { Block as BlockType } from '../types/block';
import { Block } from './Block';
import { DropZone } from './DropZone';

interface PyramidViewProps {
  blocks: BlockType[];
  onBlockUpdate: (blockId: string, updates: Partial<BlockType>) => void;
  onBlockDelete: (blockId: string) => void;
  onBlockEdit: (block: BlockType) => void;
  onBlockClick?: (block: BlockType) => void;
}

export const PyramidView: React.FC<PyramidViewProps> = ({
  blocks,
  onBlockUpdate,
  onBlockDelete,
  onBlockEdit,
  onBlockClick,
}) => {
  // 레벨별로 블록 그룹화 (레벨 0 이상만 피라미드에 표시)
  const blocksByLevel = useMemo(() => {
    const grouped: { [level: number]: BlockType[] } = {};
    blocks
      .filter((block) => block.level >= 0) // 레벨 0 이상만 피라미드에 표시
      .forEach((block) => {
        if (!grouped[block.level]) {
          grouped[block.level] = [];
        }
        grouped[block.level].push(block);
      });

    // 각 레벨 내에서 order로 정렬
    Object.keys(grouped).forEach((level) => {
      grouped[Number(level)].sort((a, b) => a.order - b.order);
    });

    return grouped;
  }, [blocks]);

  const maxLevel = useMemo(() => {
    const max = Math.max(...blocks.map((b) => b.level), -1);
    // 최소 5개의 계층 보장
    return Math.max(max, 4);
  }, [blocks]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) return;

    const activeBlock = blocks.find((b) => b.id === active.id);
    
    // 드롭존에 드롭한 경우
    if (typeof over.id === 'string' && over.id.startsWith('dropzone-level-')) {
      if (!activeBlock) return;
      const targetLevel = parseInt(over.id.replace('dropzone-level-', ''));
      const targetLevelBlocks = blocksByLevel[targetLevel] || [];
      const newOrder = targetLevelBlocks.length;

      onBlockUpdate(activeBlock.id, {
        level: targetLevel,
        order: newOrder,
      });
      return;
    }

    const overBlock = blocks.find((b) => b.id === over.id);

    if (!activeBlock || !overBlock) return;

    // 같은 레벨 내에서 드래그: order만 변경
    if (activeBlock.level === overBlock.level) {
      const levelBlocks = blocksByLevel[activeBlock.level];
      const oldIndex = levelBlocks.findIndex((b) => b.id === active.id);
      const newIndex = levelBlocks.findIndex((b) => b.id === over.id);
      const newOrder = arrayMove(levelBlocks, oldIndex, newIndex);

      newOrder.forEach((block, index) => {
        if (block.order !== index) {
          onBlockUpdate(block.id, { order: index });
        }
      });
    } else {
      // 다른 레벨로 드래그: level과 order 변경
      const targetLevel = overBlock.level;
      const targetLevelBlocks = blocksByLevel[targetLevel] || [];
      const newOrder = targetLevelBlocks.length;

      onBlockUpdate(activeBlock.id, {
        level: targetLevel,
        order: newOrder,
      });
    }
  };

  // 레벨별로 렌더링 (위에서 아래로, 높은 레벨부터 - 일반 피라미드: 위가 좁고 아래가 넓음)
  const levels = Array.from({ length: maxLevel + 1 }, (_, i) => maxLevel - i);

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

  // 레벨에 따른 너비 (일반 피라미드 효과: 위는 좁게, 아래는 넓게)
  // level이 높을수록(목표) 좁고, level이 낮을수록(기반) 넓음
  const getLevelWidth = (level: number) => {
    const baseWidth = 100; // 기반(level 0)이 100%
    const widthReduction = level * 8; // 레벨이 높을수록 8%씩 감소
    return Math.max(baseWidth - widthReduction, 50); // 최소 50%
  };

  return (
    <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
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
            gap: '16px',
            alignItems: 'center',
            overflowY: 'auto',
            padding: '32px 20px',
          }}
        >
          {levels.map((level) => {
            const levelBlocks = blocksByLevel[level] || [];
            const hasBlocks = levelBlocks.length > 0;
            const levelWidth = getLevelWidth(level);

            return (
              <div
                key={level}
                style={{
                  width: `${levelWidth}%`,
                  backgroundColor: getLevelBgColor(level),
                  borderRadius: '16px',
                  padding: '24px',
                  border: '1px solid',
                  borderColor: level === maxLevel && level > 0 ? '#6366f1' : level === 0 ? '#10b981' : '#e9ecef',
                  transition: 'all 0.3s ease',
                  boxShadow: hasBlocks ? '0 4px 12px rgba(0,0,0,0.06)' : '0 2px 6px rgba(0,0,0,0.03)',
                }}
              >
                {/* 레벨 태그 */}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'flex-start',
                    marginBottom: '16px',
                  }}
                >
                  <span
                    style={{
                      fontSize: '12px',
                      fontWeight: '600',
                      color: level === maxLevel && level > 0 ? '#6366f1' : level === 0 ? '#10b981' : '#6c757d',
                      padding: '6px 12px',
                      borderRadius: '8px',
                      backgroundColor: level === maxLevel && level > 0 ? '#eef2ff' : level === 0 ? '#ecfdf5' : '#f1f3f5',
                      border: 'none',
                      display: 'inline-block',
                    }}
                  >
                    {level === maxLevel && level > 0 ? '목표' : level === 0 ? '기반' : `Level ${level}`}
                  </span>
                </div>
                {hasBlocks ? (
                  <SortableContext
                    items={levelBlocks.map((b) => b.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <DropZone level={level}>
                      {levelBlocks.map((block) => (
                        <Block
                          key={block.id}
                          block={block}
                          onEdit={onBlockEdit}
                          onDelete={onBlockDelete}
                          onClick={onBlockClick}
                        />
                      ))}
                    </DropZone>
                  </SortableContext>
                ) : (
                <DropZone level={level}>
                  <span style={{ color: '#adb5bd', fontSize: '13px', fontStyle: 'italic' }}>
                    여기에 블록을 드롭하세요
                  </span>
                </DropZone>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </DndContext>
  );
};

