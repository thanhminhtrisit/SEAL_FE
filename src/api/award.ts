import { apiClient } from './client';
import { AwardResponse, AwardCreateRequest, ApiResponse } from '../app/types';

export const award = {
  // THÊM MỚI: API lấy danh sách tất cả các sự kiện để chọn
  getEvents: async () => {
    // Điều chỉnh endpoint /api/events cho đúng với EventController của bạn
    const response = await apiClient.get('/api/events'); 
    return response.data.data;
  },

  getAwardsByEvent: async (eventId: number): Promise<AwardResponse[]> => {
    const response = await apiClient.get<ApiResponse<AwardResponse[]>>(`api/awards/events/${eventId}`);
    return response.data.data;
  },

  getAwardTypes: async () => {
    const response = await apiClient.get<ApiResponse<Array<{ code: string; label: string; isMainAward: boolean }>>>(`api/awards/types`);
    return response.data.data;
  },

  createAward: async (request: AwardCreateRequest): Promise<AwardResponse> => {
    const response = await apiClient.post<ApiResponse<AwardResponse>>(`api/awards`, request);
    return response.data.data;
  },

  getEligibleTeams: async (eventId: number, categoryId: number) => {
    const response = await apiClient.get(`/api/awards/events/${eventId}/eligible-teams?categoryId=${categoryId}`);
    return response.data.data;
  },

  getCategoriesByEvent: async (eventId: number) => {
    const response = await apiClient.get(`/api/awards/events/${eventId}/categories`); 
    return response.data.data;
  },

  getSuggestedAwards: async (eventId: number, categoryId: number) => {
    const response = await apiClient.get<ApiResponse<any[]>>(`/api/awards/events/${eventId}/suggestions?categoryId=${categoryId}`);
    return response.data.data;
  },
  
};