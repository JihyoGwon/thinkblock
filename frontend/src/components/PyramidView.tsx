import React, { useMemo } from 'react';
import { DndContext, DragEndEvent, closestCenter } from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable';
import { Block as BlockType } from '../types/block';
import { Block } from './Block';

interface PyramidViewProps {
  blocks: BlockType[];
  onBlockUpdate: (blockId: string, updates: Partial<BlockType>) => void;
  onBlockDelete: (blockId: string) => void;
  onBlockEdit: (block: BlockType) => void;
}

export const PyramidView: React.FC<PyramidViewProps> = ({
  blocks,
  onBlockUpdate,
  onBlockDelete,
  onBlockEdit,
}) => {
  // 레벨별로 블록 그룹화
  const blocksByLevel = useMemo(() => {
    const grouped: { [level: number]: BlockType[] } = {};
    blocks.forEach((block) => {
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
    return Math.max(...blocks.map((b) => b.level), 0);
  }, [blocks]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) return;

    const activeBlock = blocks.find((b) => b.id === active.id);
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

  // 레벨별로 렌더링 (아래에서 위로)
  const levels = Array.from({ length: maxLevel + 1 }, (_, i) => i);

  return (
    <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column-reverse',
          alignItems: 'center',
          padding: '20px',
          minHeight: '100vh',
          backgroundColor: '#f5f5f5',
        }}
      >
        {levels.map((level) => {
          const levelBlocks = blocksByLevel[level] || [];
          if (levelBlocks.length === 0) return null;

          return (
            <div
              key={level}
              style={{
                marginBottom: '20px',
                width: '100%',
                maxWidth: '1200px',
              }}
            >
              <div
                style={{
                  textAlign: 'center',
                  marginBottom: '8px',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  color: '#666',
                }}
              >
                {level === 0 ? '기반 (Foundation)' : `Level ${level}`}
                {level === maxLevel && level > 0 && ' - 목표 (Goal)'}
              </div>
              <SortableContext
                items={levelBlocks.map((b) => b.id)}
                strategy={verticalListSortingStrategy}
              >
                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    justifyContent: 'center',
                    gap: '8px',
                  }}
                >
                  {levelBlocks.map((block) => (
                    <Block
                      key={block.id}
                      block={block}
                      onEdit={onBlockEdit}
                      onDelete={onBlockDelete}
                    />
                  ))}
                </div>
              </SortableContext>
            </div>
          );
        })}
      </div>
    </DndContext>
  );
};

