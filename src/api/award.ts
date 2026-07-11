import { apiClient } from './client';
import { AwardResponse, AwardCreateRequest, ApiResponse, ParticipantResultResponse } from '../app/types';

export const award = {
  getEvents: async () => {
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

  getEligibleTeamsForAward: async (eventId: number, categoryId: number) => {
    const response = await apiClient.get(`/api/awards/events/${eventId}/eligible-teams`, {
      params: { categoryId }
    });
    return response.data;
  },

  publishResults: async (eventId: number) => {
    const response = await apiClient.put(`/api/awards/events/${eventId}/publish`);
    return response.data;
  },

  getMyResult: async (eventId: number): Promise<ParticipantResultResponse> => {
    const token = localStorage.getItem('token');
    const response = await apiClient.get(`/api/awards/events/${eventId}/my-result`, {
      headers: token ? { 'Authorization': `Bearer ${token}` } : {}
    });
    return response.data?.data || response.data;
  },


  
};