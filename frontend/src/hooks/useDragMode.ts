/**
 * 드래그 모드 관련 커스텀 훅
 */
import { useState, useCallback } from 'react';
import { Mode } from '../types/common';
import { Block as BlockType } from '../types/block';
import { handleError } from '../utils/errorHandler';

interface UseDragModeProps {
  blocks: BlockType[];
  updateBlock: (blockId: string, updates: Partial<BlockType>) => Promise<BlockType>;
}

export const useDragMode = ({
  blocks,
  updateBlock,
}: UseDragModeProps) => {
  const [draggedBlockId, setDraggedBlockId] = useState<string | null>(null);
  const [dragOverLevel, setDragOverLevel] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const handleDragStart = useCallback((blockId: string, currentMode: Mode) => {
    if (currentMode !== 'drag') return;
    setDraggedBlockId(blockId);
  }, []);

  const handleDragEnd = useCallback(() => {
    setDraggedBlockId(null);
    setDragOverLevel(null);
    setDragOverIndex(null);
  }, []);

  const handleDrop = useCallback(async (targetLevel: number, currentMode: Mode, targetIndex?: number) => {
    if (!draggedBlockId || currentMode !== 'drag') return;
    
    try {
      const draggedBlock = blocks.find(b => b.id === draggedBlockId);
      if (!draggedBlock) return;

      // 같은 레벨 내에서 순서 변경인 경우
      if (draggedBlock.level === targetLevel) {
        const allLevelBlocks = blocks
          .filter(b => b.level === targetLevel)
          .sort((a, b) => a.order - b.order);
        
        const currentIndex = allLevelBlocks.findIndex(b => b.id === draggedBlockId);
        
        if (currentIndex === -1) {
          throw new Error('드래그 중인 블록을 찾을 수 없습니다.');
        }
        
        let actualInsertIndex: number;
        if (targetIndex !== undefined && targetIndex !== null) {
          actualInsertIndex = targetIndex;
        } else {
          actualInsertIndex = allLevelBlocks.length;
        }
        
        const targetLevelBlocks = allLevelBlocks.filter(b => b.id !== draggedBlockId);
        let insertIndex: number;
        if (targetIndex !== undefined && targetIndex !== null) {
          if (currentIndex < actualInsertIndex) {
            insertIndex = actualInsertIndex - 1;
          } else {
            insertIndex = actualInsertIndex;
          }
        } else {
          insertIndex = targetLevelBlocks.length;
        }
        
        let newOrder: number;
        if (targetLevelBlocks.length === 0) {
          newOrder = 0;
        } else if (insertIndex === 0) {
          newOrder = Math.max(0, targetLevelBlocks[0].order - 1);
        } else if (insertIndex >= targetLevelBlocks.length) {
          newOrder = targetLevelBlocks[targetLevelBlocks.length - 1].order + 1;
        } else {
          const prevOrder = targetLevelBlocks[insertIndex - 1].order;
          const nextOrder = targetLevelBlocks[insertIndex].order;
          if (nextOrder - prevOrder <= 1) {
            newOrder = prevOrder + 1;
          } else {
            newOrder = Math.floor((prevOrder + nextOrder) / 2);
          }
        }
        
        if (actualInsertIndex < currentIndex) {
          const blocksToUpdate = allLevelBlocks
            .slice(actualInsertIndex, currentIndex)
            .map(b => ({ ...b, newOrder: b.order + 1 }));
          
          const updatePromises = [
            updateBlock(draggedBlockId, { level: targetLevel, order: newOrder }),
            ...blocksToUpdate.map(b => 
              updateBlock(b.id, { order: b.newOrder })
            )
          ];
          await Promise.all(updatePromises);
        } else if (actualInsertIndex > currentIndex) {
          const blocksToUpdate = allLevelBlocks
            .slice(currentIndex + 1, actualInsertIndex)
            .map(b => ({ ...b, newOrder: b.order - 1 }));
          
          const updatePromises = [
            updateBlock(draggedBlockId, { level: targetLevel, order: newOrder }),
            ...blocksToUpdate.map(b => 
              updateBlock(b.id, { order: b.newOrder })
            )
          ];
          await Promise.all(updatePromises);
        }
      } else {
        // 다른 레벨로 이동하는 경우
        const targetLevelBlocks = blocks
          .filter(b => b.level === targetLevel && b.id !== draggedBlockId)
          .sort((a, b) => a.order - b.order);

        let insertIndex: number;
        if (targetIndex !== undefined && targetIndex !== null) {
          insertIndex = Math.min(Math.max(0, targetIndex), targetLevelBlocks.length);
        } else {
          insertIndex = targetLevelBlocks.length;
        }

        let newOrder: number;
        if (targetLevelBlocks.length === 0) {
          newOrder = 0;
        } else if (insertIndex === 0) {
          newOrder = Math.max(0, targetLevelBlocks[0].order - 1);
        } else if (insertIndex >= targetLevelBlocks.length) {
          newOrder = targetLevelBlocks[targetLevelBlocks.length - 1].order + 1;
        } else {
          const prevOrder = targetLevelBlocks[insertIndex - 1].order;
          const nextOrder = targetLevelBlocks[insertIndex].order;
          if (nextOrder - prevOrder <= 1) {
            newOrder = prevOrder + 1;
          } else {
            newOrder = Math.floor((prevOrder + nextOrder) / 2);
          }
        }
        
        const blocksToUpdate = targetLevelBlocks
          .slice(insertIndex)
          .filter(b => b.order >= newOrder);
        
        const updatePromises = [
          updateBlock(draggedBlockId, { level: targetLevel, order: newOrder }),
          ...blocksToUpdate.map(b => 
            updateBlock(b.id, { order: b.order + 1 })
          )
        ];
        await Promise.all(updatePromises);
      }
    } catch (error) {
      handleError(error, '블록 이동에 실패했습니다.');
    } finally {
      setDraggedBlockId(null);
      setDragOverLevel(null);
      setDragOverIndex(null);
    }
  }, [draggedBlockId, blocks, updateBlock]);

  const handleDragOver = useCallback((level: number, index?: number) => {
    setDragOverLevel(level);
    setDragOverIndex(index ?? null);
  }, []);

  const handleDragLeave = useCallback(() => {
    setDragOverLevel(null);
    setDragOverIndex(null);
  }, []);

  return {
    draggedBlockId,
    dragOverLevel,
    dragOverIndex,
    handleDragStart,
    handleDragEnd,
    handleDrop,
    handleDragOver,
    handleDragLeave,
  };
};

