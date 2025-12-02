import axios from 'axios';
import { Block, BlockCreate } from '../types/block';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8002';

export const api = {
  // 모든 블록 조회
  getBlocks: async (): Promise<Block[]> => {
    const response = await axios.get(`${API_BASE_URL}/api/blocks`);
    return response.data.blocks || [];
  },

  // 블록 생성
  createBlock: async (block: BlockCreate): Promise<Block> => {
    const response = await axios.post(`${API_BASE_URL}/api/blocks`, block);
    return response.data.block;
  },

  // 블록 업데이트
  updateBlock: async (blockId: string, updates: Partial<Block>): Promise<Block> => {
    const response = await axios.put(`${API_BASE_URL}/api/blocks/${blockId}`, updates);
    return response.data.block;
  },

  // 블록 삭제
  deleteBlock: async (blockId: string): Promise<void> => {
    await axios.delete(`${API_BASE_URL}/api/blocks/${blockId}`);
  },
};

