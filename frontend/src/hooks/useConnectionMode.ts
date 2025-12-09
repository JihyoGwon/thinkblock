/**
 * 연결선 모드 관련 커스텀 훅
 */
import { useState, useCallback } from 'react';
import { Mode } from '../types/common';
import { api } from '../services/api';
import { handleError } from '../utils/errorHandler';
import { logger } from '../utils/logger';

interface UseConnectionModeProps {
  projectId: string | undefined;
  fetchBlocks: () => Promise<void>;
  setDependencyColors: React.Dispatch<React.SetStateAction<Record<string, string>>>;
}

export const useConnectionMode = ({
  projectId,
  fetchBlocks,
  setDependencyColors,
}: UseConnectionModeProps) => {
  const [connectingFromBlockId, setConnectingFromBlockId] = useState<string | null>(null);
  const [hoveredBlockId, setHoveredBlockId] = useState<string | null>(null);

  const handleConnectionStart = useCallback((blockId: string, currentMode: Mode) => {
    if (currentMode !== 'connection') return;
    if (blockId === '') {
      setConnectingFromBlockId(null);
      setHoveredBlockId(null);
      return;
    }
    logger.debug('연결 시작:', blockId);
    setConnectingFromBlockId(blockId);
  }, []);

  const handleConnectionEnd = useCallback(async (
    toBlockId: string,
    selectedConnectionColor: string | null,
    currentMode: Mode
  ) => {
    if (currentMode !== 'connection' || !connectingFromBlockId || !projectId) {
      return;
    }
    if (connectingFromBlockId === toBlockId) {
      setConnectingFromBlockId(null);
      setHoveredBlockId(null);
      return;
    }
    try {
      await api.addDependency(projectId, connectingFromBlockId, toBlockId, selectedConnectionColor || undefined);
      await fetchBlocks();
      
      if (selectedConnectionColor) {
        const colorKey = `${connectingFromBlockId}_${toBlockId}`;
        setDependencyColors(prev => ({
          ...prev,
          [colorKey]: selectedConnectionColor,
        }));
      }
      
      setConnectingFromBlockId(null);
      setHoveredBlockId(null);
    } catch (error) {
      handleError(error, '의존성 추가에 실패했습니다.');
      setConnectingFromBlockId(null);
      setHoveredBlockId(null);
    }
  }, [connectingFromBlockId, projectId, fetchBlocks, setDependencyColors]);

  const handleConnectionCancel = useCallback((currentMode: Mode) => {
    if (currentMode !== 'connection') return;
    setConnectingFromBlockId(null);
    setHoveredBlockId(null);
  }, []);

  const handleRemoveDependency = useCallback(async (fromBlockId: string, toBlockId: string) => {
    if (!projectId) return;

    try {
      await api.removeDependency(projectId, fromBlockId, toBlockId);
      await fetchBlocks();
      
      const colorKey = `${fromBlockId}_${toBlockId}`;
      setDependencyColors(prev => {
        const newColors = { ...prev };
        delete newColors[colorKey];
        return newColors;
      });
    } catch (error) {
      handleError(error, '의존성 삭제에 실패했습니다.');
    }
  }, [projectId, fetchBlocks, setDependencyColors]);

  return {
    connectingFromBlockId,
    hoveredBlockId,
    setHoveredBlockId,
    handleConnectionStart,
    handleConnectionEnd,
    handleConnectionCancel,
    handleRemoveDependency,
  };
};

