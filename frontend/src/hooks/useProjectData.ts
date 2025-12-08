import { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';
import { handleError } from '../utils/errorHandler';
import { DEFAULT_CATEGORIES } from '../constants/categories';

export const useProjectData = (projectId: string | undefined) => {
  const [categories, setCategories] = useState<string[]>([]);
  const [categoryColors, setCategoryColors] = useState<Record<string, { bg: string; text: string }>>({});
  const [project, setProject] = useState<{ id: string; name: string; arrangement_reasoning?: string } | null>(null);
  const [arrangementReasoning, setArrangementReasoning] = useState<string>('');
  const [loading, setLoading] = useState(true);

  const fetchProjectData = useCallback(async () => {
    if (!projectId) return;
    
    try {
      setLoading(true);
      const [categoriesData, categoryColorsData, projectData] = await Promise.all([
        api.getCategories(projectId),
        api.getCategoryColors(projectId),
        api.getProject(projectId),
      ]);
      
      setCategories(categoriesData.length > 0 ? categoriesData : [...DEFAULT_CATEGORIES]);
      setCategoryColors(categoryColorsData || {});
      setProject(projectData);
      
      if (projectData?.arrangement_reasoning) {
        setArrangementReasoning(projectData.arrangement_reasoning);
      }
    } catch (error) {
      console.error('프로젝트 데이터 로드 실패:', error);
      setCategories([...DEFAULT_CATEGORIES]);
      setCategoryColors({});
      handleError(error, '프로젝트 데이터 로드에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  const updateCategories = useCallback(async (newCategories: string[]) => {
    if (!projectId) return;
    try {
      await api.updateCategories(projectId, newCategories);
      setCategories(newCategories);
    } catch (error) {
      handleError(error, '카테고리 업데이트에 실패했습니다.');
      throw error;
    }
  }, [projectId]);

  const updateCategoryColors = useCallback(async (newColors: Record<string, { bg: string; text: string }>) => {
    if (!projectId) return;
    try {
      await api.updateCategoryColors(projectId, newColors);
      setCategoryColors(newColors);
    } catch (error) {
      handleError(error, '카테고리 색상 업데이트에 실패했습니다.');
      throw error;
    }
  }, [projectId]);

  const updateProject = useCallback(async (updates: { name?: string }) => {
    if (!projectId) return;
    try {
      const updatedProject = await api.updateProject(projectId, updates);
      setProject(updatedProject);
      return updatedProject;
    } catch (error) {
      handleError(error, '프로젝트 업데이트에 실패했습니다.');
      throw error;
    }
  }, [projectId]);

  useEffect(() => {
    fetchProjectData();
  }, [fetchProjectData]);

  return {
    categories,
    categoryColors,
    project,
    arrangementReasoning,
    loading,
    setArrangementReasoning,
    updateCategories,
    updateCategoryColors,
    updateProject,
    refetch: fetchProjectData,
  };
};

