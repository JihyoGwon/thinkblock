import axios, { AxiosError } from 'axios';
import { Block, BlockCreate } from '../types/block';

// 프로덕션에서는 같은 도메인에서 서빙되므로 상대 경로 사용
const API_BASE_URL = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '' : 'http://localhost:8002');

// axios 인스턴스 생성 (타임아웃 60초 - AI 블록 생성은 시간이 걸릴 수 있음)
const apiClient = axios.create({
  timeout: 60000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 공통 에러 핸들러
const handleApiError = (error: unknown, defaultMessage: string): never => {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<{ detail?: string }>;
    const message = axiosError.response?.data?.detail || axiosError.message || defaultMessage;
    throw new Error(message);
  }
  throw error instanceof Error ? error : new Error(defaultMessage);
};

export const api = {
  // 모든 블록 조회
  getBlocks: async (projectId: string): Promise<Block[]> => {
    try {
      console.log('API 호출 시도:', `${API_BASE_URL}/api/projects/${projectId}/blocks`);
      const response = await apiClient.get(`${API_BASE_URL}/api/projects/${projectId}/blocks`);
      console.log('API 응답:', response.data);
      return response.data?.blocks || [];
    } catch (error: any) {
      console.error('API 호출 실패:', error);
      console.error('에러 코드:', error.code);
      console.error('에러 메시지:', error.message);
      
      // 타임아웃이나 연결 실패 시 빈 배열 반환 (로딩 상태 해제를 위해)
      if (error.code === 'ECONNABORTED' || error.code === 'ECONNREFUSED' || error.message?.includes('Network Error')) {
        console.warn('백엔드 서버에 연결할 수 없습니다. 빈 배열을 반환합니다.');
        return [];
      }
      throw error;
    }
  },

  // 블록 생성
  createBlock: async (projectId: string, block: BlockCreate): Promise<Block> => {
    try {
      const response = await apiClient.post(`${API_BASE_URL}/api/projects/${projectId}/blocks`, block);
      return response.data.block;
    } catch (error) {
      return handleApiError(error, '블록 생성에 실패했습니다.');
    }
  },

  // 블록 업데이트
  updateBlock: async (projectId: string, blockId: string, updates: Partial<Block>): Promise<Block> => {
    try {
      const response = await apiClient.put(`${API_BASE_URL}/api/projects/${projectId}/blocks/${blockId}`, updates);
      return response.data.block;
    } catch (error) {
      return handleApiError(error, '블록 업데이트에 실패했습니다.');
    }
  },

  // 블록 삭제
  deleteBlock: async (projectId: string, blockId: string): Promise<void> => {
    try {
      await apiClient.delete(`${API_BASE_URL}/api/projects/${projectId}/blocks/${blockId}`);
    } catch (error) {
      handleApiError(error, '블록 삭제에 실패했습니다.');
    }
  },

  // 카테고리 목록 조회
  getCategories: async (projectId: string): Promise<string[]> => {
    try {
      const response = await apiClient.get(`${API_BASE_URL}/api/projects/${projectId}/categories`);
      return response.data?.categories || [];
    } catch (error) {
      console.error('카테고리 조회 실패:', error);
      return [];
    }
  },

  // 카테고리 목록 업데이트
  updateCategories: async (projectId: string, categories: string[]): Promise<string[]> => {
    try {
      const response = await apiClient.put(`${API_BASE_URL}/api/projects/${projectId}/categories`, { categories });
      return response.data.categories;
    } catch (error) {
      return handleApiError(error, '카테고리 업데이트에 실패했습니다.');
    }
  },

  // 프로젝트 관련
  getProjects: async (): Promise<any[]> => {
    const response = await apiClient.get(`${API_BASE_URL}/api/projects`);
    return response.data?.projects || [];
  },

  getProject: async (projectId: string): Promise<any> => {
    try {
      const response = await apiClient.get(`${API_BASE_URL}/api/projects/${projectId}`);
      return response.data.project;
    } catch (error) {
      return handleApiError(error, '프로젝트 조회에 실패했습니다.');
    }
  },

  createProject: async (name: string): Promise<any> => {
    try {
      const response = await apiClient.post(`${API_BASE_URL}/api/projects`, { name });
      return response.data.project;
    } catch (error) {
      return handleApiError(error, '프로젝트 생성에 실패했습니다.');
    }
  },

  updateProject: async (projectId: string, updates: { name?: string }): Promise<any> => {
    try {
      const response = await apiClient.put(`${API_BASE_URL}/api/projects/${projectId}`, updates);
      return response.data.project;
    } catch (error) {
      return handleApiError(error, '프로젝트 업데이트에 실패했습니다.');
    }
  },

  deleteProject: async (projectId: string): Promise<void> => {
    try {
      await apiClient.delete(`${API_BASE_URL}/api/projects/${projectId}`);
    } catch (error) {
      handleApiError(error, '프로젝트 삭제에 실패했습니다.');
    }
  },

  duplicateProject: async (projectId: string, name: string, copyStructure: boolean): Promise<any> => {
    const response = await apiClient.post(`${API_BASE_URL}/api/projects/${projectId}/duplicate`, {
      name,
      copy_structure: copyStructure,
    });
    return response.data.project;
  },

  // AI 블록 생성
  generateBlocks: async (
    projectId: string,
    projectOverview: string,
    currentStatus: string,
    problems: string,
    additionalInfo: string = ''
  ): Promise<Block[]> => {
    try {
      const response = await apiClient.post(`${API_BASE_URL}/api/projects/${projectId}/ai/generate-blocks`, {
        project_overview: projectOverview,
        current_status: currentStatus,
        problems: problems,
        additional_info: additionalInfo,
      });
      return response.data.blocks || [];
    } catch (error) {
      return handleApiError(error, 'AI 블록 생성에 실패했습니다.');
    }
  },

  // AI 블록 배치
  arrangeBlocks: async (projectId: string, blockIds: string[]): Promise<Block[] & { reasoning?: string }> => {
    try {
      const response = await apiClient.post(`${API_BASE_URL}/api/projects/${projectId}/ai/arrange-blocks`, {
        block_ids: blockIds,
      });
      // reasoning을 포함하여 반환
      const result = response.data.blocks || [];
      const reasoning = response.data.reasoning || '';
      (result as any).reasoning = reasoning;
      return result;
    } catch (error) {
      return handleApiError(error, 'AI 블록 배치에 실패했습니다.');
    }
  },

  // 의존성 추가
  addDependency: async (projectId: string, blockId: string, dependencyId: string, color?: string): Promise<Block> => {
    try {
      const response = await apiClient.post(
        `${API_BASE_URL}/api/projects/${projectId}/blocks/${blockId}/dependencies`,
        { dependency_id: dependencyId, color }
      );
      return response.data.block;
    } catch (error) {
      return handleApiError(error, '의존성 추가에 실패했습니다.');
    }
  },

  // 의존성 제거
  removeDependency: async (projectId: string, blockId: string, dependencyId: string): Promise<Block> => {
    try {
      const response = await apiClient.delete(
        `${API_BASE_URL}/api/projects/${projectId}/blocks/${blockId}/dependencies/${dependencyId}`
      );
      return response.data.block;
    } catch (error) {
      return handleApiError(error, '의존성 제거에 실패했습니다.');
    }
  },

  // 의존성 색상 맵 조회
  getDependencyColors: async (projectId: string): Promise<Record<string, string>> => {
    try {
      const response = await apiClient.get(
        `${API_BASE_URL}/api/projects/${projectId}/dependency-colors`
      );
      return response.data.colors || {};
    } catch (error) {
      console.error('의존성 색상 조회 실패:', error);
      // 에러 발생 시 빈 객체 반환
      return {};
    }
  },

  // 연결선 색상 팔레트 조회
  getConnectionColorPalette: async (projectId: string): Promise<string[]> => {
    try {
      const response = await apiClient.get(
        `${API_BASE_URL}/api/projects/${projectId}/connection-color-palette`
      );
      return response.data.colors || [];
    } catch (error) {
      console.error('연결선 색상 팔레트 조회 실패:', error);
      // 에러 발생 시 빈 배열 반환 (기본 색상은 App.tsx에서 설정)
      return [];
    }
  },

  // 연결선 색상 팔레트 업데이트
  updateConnectionColorPalette: async (projectId: string, colors: string[]): Promise<string[]> => {
    try {
      const response = await apiClient.put(
        `${API_BASE_URL}/api/projects/${projectId}/connection-color-palette`,
        { colors }
      );
      return response.data.colors || [];
    } catch (error) {
      console.error('연결선 색상 팔레트 업데이트 실패:', error);
      // 에러 발생 시 입력받은 색상 그대로 반환
      return colors;
    }
  },

  // 카테고리 색상 맵 조회
  getCategoryColors: async (projectId: string): Promise<Record<string, { bg: string; text: string }>> => {
    try {
      const response = await apiClient.get(
        `${API_BASE_URL}/api/projects/${projectId}/category-colors`
      );
      return response.data.colors || {};
    } catch (error) {
      console.error('카테고리 색상 조회 실패:', error);
      return {};
    }
  },

  // 카테고리 색상 맵 업데이트
  updateCategoryColors: async (
    projectId: string,
    colors: Record<string, { bg: string; text: string }>
  ): Promise<Record<string, { bg: string; text: string }>> => {
    try {
      const response = await apiClient.put(
        `${API_BASE_URL}/api/projects/${projectId}/category-colors`,
        { colors }
      );
      return response.data.colors || {};
    } catch (error) {
      console.error('카테고리 색상 업데이트 실패:', error);
      return colors;
    }
  },
};

