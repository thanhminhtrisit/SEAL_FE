// src/api/rankingApi.ts
import axios from 'axios';
import { RankingResponse, ApiResponse } from '../app/types';

// Thay đổi URL này nếu backend của bạn chạy port khác
const BASE_URL = 'http://localhost:8080/api/rankings'; 

export const ranking = {
  // Lấy danh sách xếp hạng đã có
  getRankings: async (roundId: number): Promise<RankingResponse[]> => {
    const response = await axios.get<ApiResponse<RankingResponse[]>>(`${BASE_URL}/rounds/${roundId}`);
    return response.data.data;
  },

  // Ra lệnh tính toán lại xếp hạng
  computeRanking: async (roundId: number): Promise<RankingResponse[]> => {
    const response = await axios.post<ApiResponse<RankingResponse[]>>(`${BASE_URL}/rounds/${roundId}/compute`);
    return response.data.data;
  }
};