/**
 * 프로젝트 관련 커스텀 훅
 */
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { Project } from '../types/common';
import { Block } from '../types/block';
import { DEFAULT_CATEGORIES } from '../constants/categories';

export const useProject = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [arrangementReasoning, setArrangementReasoning] = useState<string>('');

  useEffect(() => {
    if (!projectId) {
      navigate('/projects');
      return;
    }

    let cancelled = false;

    const fetchData = async () => {
      try {
        setLoading(true);
        const [blocksData, categoriesData, projectData] = await Promise.all([
          api.getBlocks(projectId),
          api.getCategories(projectId),
          api.getProject(projectId),
        ]);

        if (!cancelled) {
          setBlocks(Array.isArray(blocksData) ? blocksData : []);
          setCategories(categoriesData.length > 0 ? categoriesData : [...DEFAULT_CATEGORIES]);
          setProject(projectData);
          
          // 저장된 배치 이유 불러오기
          if (projectData?.arrangement_reasoning) {
            setArrangementReasoning(projectData.arrangement_reasoning);
          }
          
          setLoading(false);
        }
      } catch (error) {
        console.error('데이터 로드 실패:', error);
        if (!cancelled) {
          setBlocks([]);
          setCategories([...DEFAULT_CATEGORIES]);
          setLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      cancelled = true;
    };
  }, [projectId, navigate]);

  const refreshBlocks = async () => {
    if (!projectId) return;
    try {
      const blocksData = await api.getBlocks(projectId);
      setBlocks(Array.isArray(blocksData) ? blocksData : []);
    } catch (error) {
      console.error('블록 로드 실패:', error);
    }
  };

  const updateProject = async (updates: Partial<Project>) => {
    if (!projectId) return;
    try {
      const updatedProject = await api.updateProject(projectId, updates);
      setProject(updatedProject);
      if (updates.arrangement_reasoning !== undefined) {
        setArrangementReasoning(updates.arrangement_reasoning || '');
      }
      return updatedProject;
    } catch (error) {
      console.error('프로젝트 업데이트 실패:', error);
      throw error;
    }
  };

  return {
    projectId,
    blocks,
    setBlocks,
    categories,
    setCategories,
    project,
    setProject,
    loading,
    arrangementReasoning,
    setArrangementReasoning,
    refreshBlocks,
    updateProject,
  };
};

