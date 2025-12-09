/**
 * 연결선 색상 관리 커스텀 훅
 */
import { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';
import { CONNECTION_COLOR_PALETTE } from '../constants/connectionColors';
import { handleError } from '../utils/errorHandler';
import { logger } from '../utils/logger';

export const useConnectionColors = (projectId: string | undefined) => {
  const [connectionColorPalette, setConnectionColorPalette] = useState<string[]>([]);
  const [selectedConnectionColor, setSelectedConnectionColor] = useState<string | null>(null);
  const [dependencyColors, setDependencyColors] = useState<Record<string, string>>({});

  // 연결선 색상 팔레트 로드
  useEffect(() => {
    if (!projectId) return;
    
    const loadColorPalette = async () => {
      try {
        const colors = await api.getConnectionColorPalette(projectId);
        const defaultColors = [...CONNECTION_COLOR_PALETTE];
        const defaultColorsArray = defaultColors as readonly string[];
        const isValidPalette = colors.length > 0 && 
          colors.every(color => defaultColorsArray.includes(color));
        
        if (colors.length === 0) {
          const defaultColor = [defaultColors[0]];
          setConnectionColorPalette(defaultColor);
          setSelectedConnectionColor(defaultColor[0]);
          try {
            await api.updateConnectionColorPalette(projectId, defaultColor);
          } catch (e) {
            logger.warn('기본 색상 저장 실패 (무시됨):', e);
          }
        } else if (isValidPalette) {
          setConnectionColorPalette(colors);
          setSelectedConnectionColor(colors[0]);
        } else {
          const defaultColor = [defaultColors[0]];
          setConnectionColorPalette(defaultColor);
          setSelectedConnectionColor(defaultColor[0]);
          try {
            await api.updateConnectionColorPalette(projectId, defaultColor);
          } catch (e) {
            logger.warn('기본 색상 저장 실패 (무시됨):', e);
          }
        }
      } catch (error) {
        logger.error('색상 팔레트 로드 실패:', error);
        const defaultColors = [...CONNECTION_COLOR_PALETTE];
        const defaultColor = [defaultColors[0]];
        setConnectionColorPalette(defaultColor);
        setSelectedConnectionColor(defaultColor[0]);
      }
    };

    const loadDependencyColors = async () => {
      try {
        const colors = await api.getDependencyColors(projectId);
        setDependencyColors(colors || {});
      } catch (error) {
        logger.error('의존성 색상 로드 실패:', error);
        setDependencyColors({});
      }
    };

    loadColorPalette();
    loadDependencyColors();
  }, [projectId]);

  const handleColorSelect = useCallback((color: string) => {
    setSelectedConnectionColor(color);
  }, []);

  const handleColorAdd = useCallback(async (color: string) => {
    if (!projectId) return;
    
    if (!CONNECTION_COLOR_PALETTE.includes(color as any)) {
      return;
    }
    
    if (connectionColorPalette.includes(color)) {
      return;
    }
    
    try {
      const newPalette = [...connectionColorPalette, color];
      await api.updateConnectionColorPalette(projectId, newPalette);
      setConnectionColorPalette(newPalette);
      setSelectedConnectionColor(color);
    } catch (error) {
      handleError(error, '색상 추가에 실패했습니다.');
    }
  }, [projectId, connectionColorPalette]);

  return {
    connectionColorPalette,
    selectedConnectionColor,
    dependencyColors,
    setDependencyColors,
    handleColorSelect,
    handleColorAdd,
  };
};

