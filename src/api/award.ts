import { apiClient } from './client';
import { AwardResponse, AwardCreateRequest, ApiResponse } from '../app/types';

export const award = {
  // Lấy danh sách giải thưởng theo sự kiện
  getAwardsByEvent: async (eventId: number): Promise<AwardResponse[]> => {
    const response = await apiClient.get<ApiResponse<AwardResponse[]>>(`api/awards/events/${eventId}`);
    return response.data.data;
  },

  // Gán giải thưởng mới cho một đội
  createAward: async (request: AwardCreateRequest): Promise<AwardResponse> => {
    const response = await apiClient.post<ApiResponse<AwardResponse>>(`api/awards`, request);
    return response.data.data;
  }
};