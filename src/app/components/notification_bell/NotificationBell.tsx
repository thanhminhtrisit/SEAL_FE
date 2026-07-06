import React, { useState, useEffect } from 'react';
import { notificationApi, NotificationData } from '../../../api/notification';

export const NotificationBell: React.FC = () => {
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationData[]>([]);

  // Tải số lượng chưa đọc khi component load
  useEffect(() => {
    fetchUnreadCount();
  }, []);

  const fetchUnreadCount = async () => {
    try {
      const count = await notificationApi.getUnreadCount();
      setUnreadCount(count);
    } catch (error) {
      console.error("Lỗi khi tải số lượng thông báo", error);
    }
  };

  // Mở menu và tải danh sách thông báo
  const handleToggleMenu = async () => {
    const nextState = !isOpen;
    setIsOpen(nextState);
    if (nextState) {
      try {
        const data = await notificationApi.getMyNotifications(0, 10);
        setNotifications(data);
      } catch (error) {
        console.error("Lỗi tải danh sách thông báo", error);
      }
    }
  };

  const handleMarkAsRead = async (id: number, isRead: boolean) => {
    if (isRead) return; // Nếu đã đọc rồi thì bỏ qua
    try {
      await notificationApi.markAsRead(id);
      // Cập nhật UI ngay lập tức để tạo cảm giác mượt mà
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error("Lỗi đánh dấu đọc", error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationApi.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error("Lỗi đánh dấu đọc tất cả", error);
    }
  };

  return (
    <div className="relative">
      {/* Nút quả chuông */}
      <button onClick={handleToggleMenu} className="relative p-2 text-slate-600 hover:text-blue-600 transition-colors">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {/* Badge số lượng (Chỉ hiện khi > 0) */}
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold leading-none text-white bg-red-600 rounded-full">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown danh sách thông báo */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-slate-100 z-50 overflow-hidden">
          <div className="flex justify-between items-center px-4 py-3 bg-slate-50 border-b border-slate-100">
            <h3 className="font-bold text-slate-700">Thông báo</h3>
            {unreadCount > 0 && (
              <button onClick={handleMarkAllAsRead} className="text-xs font-medium text-blue-600 hover:underline">
                Đánh dấu đọc tất cả
              </button>
            )}
          </div>
          
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="text-center text-sm text-slate-500 py-6">Chưa có thông báo nào.</p>
            ) : (
              <div className="divide-y divide-slate-100">
                {notifications.map(notif => (
                  <div 
                    key={notif.id} 
                    onClick={() => handleMarkAsRead(notif.id, notif.isRead)}
                    className={`p-4 cursor-pointer transition-colors ${notif.isRead ? 'bg-white opacity-60' : 'bg-blue-50/50 hover:bg-blue-50'}`}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <p className={`text-sm ${notif.isRead ? 'font-medium text-slate-700' : 'font-bold text-slate-900'}`}>
                        {notif.title}
                      </p>
                      {/* Dấu chấm xanh báo chưa đọc */}
                      {!notif.isRead && <span className="w-2 h-2 rounded-full bg-blue-600 mt-1.5 flex-shrink-0"></span>}
                    </div>
                    <p className="text-xs text-slate-600 line-clamp-2">{notif.message}</p>
                    <p className="text-[10px] text-slate-400 mt-2">
                      {new Date(notif.createdAt).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};