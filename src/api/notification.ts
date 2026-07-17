import { apiClient } from './client';
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

// Định nghĩa chuẩn cho cấu trúc phân trang của Spring Boot
export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  empty: boolean;
}

export const notificationApi = {
  // Lấy danh sách (có phân trang)
  getMyNotifications: async (page = 0, size = 10): Promise<NotificationData[]> => {
    const res = await apiClient.get<ApiResponse<PageResponse<NotificationData>>>('/api/notifications', {
      params: {
        page,
        size
      }
    });
    // Trả về trực tiếp mảng content
    return res.data.data?.content ?? []

  },

  // Lấy số lượng chưa đọc
  getUnreadCount: async (): Promise<number> => {
    const res = await apiClient.get<ApiResponse<number>>('/api/notifications/unread-count');
    return res.data.data ?? 0;
  },

  // Đánh dấu 1 thông báo đã đọc
  markAsRead: async (id: number): Promise<void> => {
    await apiClient.put<ApiResponse<string>>(`/api/notifications/${id}/read`);
  },

  // Đánh dấu tất cả đã đọc
  markAllAsRead: async (): Promise<void> => {
    await apiClient.put<ApiResponse<string>>('/api/notifications/read-all');
  }
};
