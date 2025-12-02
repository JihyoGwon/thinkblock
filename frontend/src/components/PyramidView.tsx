import React, { useMemo } from 'react';
import { DndContext, DragEndEvent, closestCenter, useDroppable } from '@dnd-kit/core';
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

  // 레벨에 따른 배경색 (높은 레벨일수록 진함)
  const getLevelBgColor = (level: number) => {
    const colors = [
      '#f5f5f5', // level 0 - 가장 밝음 (기반)
      '#f0f4f8',
      '#e8f0f7',
      '#e0ecf5',
      '#d8e8f3',
      '#d0e4f1', // level 5
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
        {/* 왼쪽 레벨 사이드바 */}
        <div
          style={{
            width: '100%',
            paddingBottom: '12px',
            display: 'flex',
            flexDirection: 'row',
            justifyContent: 'center',
            gap: '12px',
            flexWrap: 'wrap',
          }}
        >
          {levels.map((level) => (
            <div
              key={level}
              style={{
                fontSize: '12px',
                fontWeight: '600',
                color: level === maxLevel && level > 0 ? '#1976d2' : level === 0 ? '#4caf50' : '#888',
                padding: '6px 12px',
                borderRadius: '6px',
                backgroundColor: level === maxLevel && level > 0 ? '#e3f2fd' : level === 0 ? '#e8f5e9' : '#f5f5f5',
                border: '2px solid',
                borderColor: level === maxLevel && level > 0 ? '#1976d2' : level === 0 ? '#4caf50' : '#e0e0e0',
              }}
            >
              {level === maxLevel && level > 0 ? '목표 (Goal)' : level === 0 ? '기반 (Foundation)' : `Level ${level}`}
            </div>
          ))}
        </div>

        {/* 피라미드 영역 */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            alignItems: 'center',
            overflowY: 'auto',
            padding: '0 20px',
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
                  borderRadius: '12px',
                  padding: '16px',
                  border: '2px solid',
                  borderColor: level === maxLevel && level > 0 ? '#1976d2' : level === 0 ? '#4caf50' : '#e0e0e0',
                  transition: 'all 0.3s ease',
                  boxShadow: hasBlocks ? '0 4px 8px rgba(0,0,0,0.1)' : '0 2px 4px rgba(0,0,0,0.05)',
                }}
              >
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
                    <span style={{ color: '#999', fontSize: '13px', fontStyle: 'italic' }}>
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

