import axios from 'axios';
import { AwardResponse, AwardCreateRequest, ApiResponse } from '../app/types';

const BASE_URL = 'http://localhost:8080/api/awards';

export const award = {
  // Lấy danh sách giải thưởng theo sự kiện
  getAwardsByEvent: async (eventId: number): Promise<AwardResponse[]> => {
    const response = await axios.get<ApiResponse<AwardResponse[]>>(`${BASE_URL}/events/${eventId}`);
    return response.data.data;
  },

  // Gán giải thưởng mới cho một đội
  createAward: async (request: AwardCreateRequest): Promise<AwardResponse> => {
    const response = await axios.post<ApiResponse<AwardResponse>>(BASE_URL, request);
    return response.data.data;
  }
};