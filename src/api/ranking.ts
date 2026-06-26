// src/api/rankingApi.ts
import { apiClient } from './client';
import { RankingResponse, ApiResponse } from '../app/types';

export const ranking = {
  // Lấy danh sách Sự kiện (Events)
  getEvents: async () => {
    // Gọi endpoint của nhóm bạn. Có thể là /api/events hoặc /api/coordinator/events
    const response = await apiClient.get('/api/events');
    return response.data.data; 
  },

  // Lấy danh sách Vòng thi (Rounds) theo Event ID
  getRoundsByEvent: async (eventId: number) => {
    const response = await apiClient.get(`/api/events/${eventId}/rounds`);
    return response.data.data;
  },
  
  // Lấy danh sách xếp hạng đã có
  getRankings: async (roundId: number): Promise<RankingResponse[]> => {
    const response = await apiClient.get<ApiResponse<RankingResponse[]>>(`api/rankings/rounds/${roundId}`);
    return response.data.data;
  },

  // Ra lệnh tính toán lại xếp hạng
  computeRanking: async (roundId: number): Promise<RankingResponse[]> => {
    const response = await apiClient.post<ApiResponse<RankingResponse[]>>(`api/rankings/rounds/${roundId}/compute`);
    return response.data.data;
  },

  disqualifyTeam: async (teamId: number, reason: string): Promise<void> => {
    // Đảm bảo có endpoint này ở Backend để xử lý set status = 'DISQUALIFIED' và lưu Audit Log
    await apiClient.post(`/api/rankings/teams/${teamId}/disqualify`, { reason });
  }
};