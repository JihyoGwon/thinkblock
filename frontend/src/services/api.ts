import axios from 'axios';
import { Block, BlockCreate } from '../types/block';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8002';

// axios 인스턴스 생성 (타임아웃 3초)
const apiClient = axios.create({
  timeout: 3000,
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
      console.error('API 호출 실패:', error.message || error);
      if (error.code === 'ECONNABORTED') {
        throw new Error('요청 시간 초과: 백엔드 서버가 실행 중인지 확인하세요.');
      }
      if (error.code === 'ECONNREFUSED' || error.message?.includes('Network Error')) {
        throw new Error('백엔드 서버에 연결할 수 없습니다. 백엔드가 실행 중인지 확인하세요.');
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

