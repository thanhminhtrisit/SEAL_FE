
import { apiClient } from './client'; // File cấu hình axios của bạn
import { ApiResponse } from '../app/types';


export interface NotificationData {
  id: number;
  eventId: number | null;
  notificationType: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export const notificationApi = {
  // Lấy danh sách (có phân trang)
  getMyNotifications: async (page = 0, size = 10): Promise<NotificationData[]> => {
    const res = await apiClient.get<ApiResponse<any>>(`/api/notifications?page=${page}&size=${size}`);
    return res.data.data?.content ?? []; // Spring Boot Page trả về mảng trong thuộc tính 'content'; data có thể null
  },

  // Lấy số lượng chưa đọc
  getUnreadCount: async (): Promise<number> => {
    const res = await apiClient.get<ApiResponse<number>>('/api/notifications/unread-count');
    return res.data.data ?? 0;
  },

  // Đánh dấu 1 thông báo đã đọc
  markAsRead: async (id: number): Promise<void> => {
    await apiClient.put(`/api/notifications/${id}/read`);
  },

  // Đánh dấu tất cả đã đọc
  markAllAsRead: async (): Promise<void> => {
    await apiClient.put('/api/notifications/read-all');
  }
};