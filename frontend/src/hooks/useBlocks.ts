import { useState, useEffect, useCallback } from 'react';
import { Block as BlockType } from '../types/block';
import { api } from '../services/api';
import { handleError } from '../utils/errorHandler';
import { logger } from '../utils/logger';

export const useBlocks = (projectId: string | undefined) => {
  const [blocks, setBlocks] = useState<BlockType[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchBlocks = useCallback(async () => {
    if (!projectId) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const blocksData = await api.getBlocks(projectId);
      setBlocks(Array.isArray(blocksData) ? blocksData : []);
    } catch (error) {
      logger.error('블록 로드 실패:', error);
      setBlocks([]);
      handleError(error, '블록 로드에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchBlocks();
  }, [fetchBlocks]);

  const createBlock = useCallback(async (blockData: Omit<BlockType, 'id'>) => {
    if (!projectId) return;
    try {
      const newBlock = await api.createBlock(projectId, blockData);
      setBlocks((prev) => [...prev, newBlock]);
      return newBlock;
    } catch (error) {
      handleError(error, '블록 생성에 실패했습니다.');
      throw error;
    }
  }, [projectId]);

  const updateBlock = useCallback(async (blockId: string, updates: Partial<BlockType>) => {
    if (!projectId) return;
    try {
      const updatedBlock = await api.updateBlock(projectId, blockId, updates);
      setBlocks((prev) => prev.map((b) => (b.id === blockId ? updatedBlock : b)));
      return updatedBlock;
    } catch (error) {
      handleError(error, '블록 업데이트에 실패했습니다.');
      throw error;
    }
  }, [projectId]);

  const deleteBlock = useCallback(async (blockId: string) => {
    if (!projectId) return;
    try {
      await api.deleteBlock(projectId, blockId);
      setBlocks((prev) => prev.filter((b) => b.id !== blockId));
    } catch (error) {
      handleError(error, '블록 삭제에 실패했습니다.');
      throw error;
    }
  }, [projectId]);

  return {
    blocks,
    loading,
    fetchBlocks,
    createBlock,
    updateBlock,
    deleteBlock,
    setBlocks,
  };
};

