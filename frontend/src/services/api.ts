import axios from 'axios';
import { Block, BlockCreate } from '../types/block';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8002';

// axios 인스턴스 생성 (타임아웃 2초)
const apiClient = axios.create({
  timeout: 2000,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const api = {
  // 모든 블록 조회
  getBlocks: async (): Promise<Block[]> => {
    try {
      console.log('API 호출 시도:', `${API_BASE_URL}/api/blocks`);
      const response = await apiClient.get(`${API_BASE_URL}/api/blocks`);
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
  createBlock: async (block: BlockCreate): Promise<Block> => {
    const response = await apiClient.post(`${API_BASE_URL}/api/blocks`, block);
    return response.data.block;
  },

  // 블록 업데이트
  updateBlock: async (blockId: string, updates: Partial<Block>): Promise<Block> => {
    const response = await apiClient.put(`${API_BASE_URL}/api/blocks/${blockId}`, updates);
    return response.data.block;
  },

  // 블록 삭제
  deleteBlock: async (blockId: string): Promise<void> => {
    await apiClient.delete(`${API_BASE_URL}/api/blocks/${blockId}`);
  },
};

