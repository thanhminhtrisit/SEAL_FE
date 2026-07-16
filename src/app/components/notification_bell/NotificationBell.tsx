import React, { useState, useEffect, useRef } from 'react';
import { notificationApi, NotificationData } from '../../../api/notification';

export const NotificationBell: React.FC = () => {
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  
  // State phục vụ phân trang
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  // Ref để bắt sự kiện Click Outside
  const bellRef = useRef<HTMLDivElement>(null);

  // 1. Tải số lượng chưa đọc & Thiết lập Polling (60s/lần)
  useEffect(() => {
    fetchUnreadCount();
    
    const intervalId = setInterval(() => {
      fetchUnreadCount();
    }, 60000); // 60 giây
    
    return () => clearInterval(intervalId); // Cleanup khi rời trang
  }, []);

  // 2. Lắng nghe sự kiện Click ra ngoài vùng Component
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (bellRef.current && !bellRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchUnreadCount = async () => {
    try {
      const count = await notificationApi.getUnreadCount();
      setUnreadCount(count);
    } catch (error) {
      console.error("Lỗi khi tải số lượng thông báo", error);
    }
  };

  // Mở menu và tải danh sách trang đầu tiên
  const handleToggleMenu = async () => {
    const nextState = !isOpen;
    setIsOpen(nextState);
    
    if (nextState) {
      setPage(0);
      setIsLoading(true);
      try {
        const res = await notificationApi.getMyNotifications(0, 10);
        const content = Array.isArray(res) ? res : ((res as any)?.content || (res as any)?.data?.content || []);
        
        setNotifications(content);
        setHasMore(content.length === 10);
      } catch (error) {
        console.error("Lỗi tải danh sách thông báo", error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  // 3. Xử lý tải thêm thông báo (Load More)
  const handleLoadMore = async () => {
    if (isLoading || !hasMore) return;
    
    const nextPage = page + 1;
    setIsLoading(true);
    try {
      const res = await notificationApi.getMyNotifications(nextPage, 10);
const content = await notificationApi.getMyNotifications(0, 10);      
      if (content.length > 0) {
        setNotifications(prev => [...prev, ...content]);
        setPage(nextPage);
        setHasMore(content.length === 10);
      } else {
        setHasMore(false);
      }
    } catch (error) {
      console.error("Lỗi khi tải thêm thông báo", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMarkAsRead = async (id: number, isRead: boolean) => {
    if (isRead) return;
    try {
      await notificationApi.markAsRead(id);
      // Optimistic Update
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
    <div className="relative" ref={bellRef}>
      <button onClick={handleToggleMenu} className="relative p-2 text-slate-600 hover:text-blue-600 transition-colors bg-slate-50 hover:bg-blue-50 rounded-full">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 inline-flex items-center justify-center px-1.5 py-0.5 text-[10px] font-bold leading-none text-white bg-red-500 rounded-full border-2 border-white">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-3 w-80 sm:w-96 bg-white rounded-xl shadow-2xl border border-slate-100 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex justify-between items-center px-4 py-3 bg-slate-50/80 backdrop-blur-sm border-b border-slate-100">
            <h3 className="font-bold text-slate-800" style={{ fontFamily: 'var(--font-display)' }}>Thông báo</h3>
            {unreadCount > 0 && (
              <button onClick={handleMarkAllAsRead} className="text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors">
                Đánh dấu đọc tất cả
              </button>
            )}
          </div>
          
          <div className="max-h-[400px] overflow-y-auto overscroll-contain">
            {isLoading && page === 0 ? (
              <div className="flex justify-center items-center py-10">
                <span className="w-6 h-6 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin"></span>
              </div>
            ) : notifications.length === 0 ? (
              <div className="text-center py-10">
                <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3">
                  <svg className="w-6 h-6 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                  </svg>
                </div>
                <p className="text-sm text-slate-500 font-medium">Bạn chưa có thông báo nào.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {notifications.map(notif => (
                  <div 
                    key={notif.id} 
                    onClick={() => handleMarkAsRead(notif.id, notif.isRead)}
                    className={`p-4 cursor-pointer transition-colors hover:bg-slate-50 ${notif.isRead ? 'bg-white opacity-70' : 'bg-blue-50/30'}`}
                  >
                    <div className="flex justify-between items-start mb-1.5 gap-2">
                      <p className={`text-sm ${notif.isRead ? 'font-medium text-slate-700' : 'font-bold text-slate-900'}`}>
                        {notif.title}
                      </p>
                      {!notif.isRead && <span className="w-2 h-2 rounded-full bg-blue-600 mt-1.5 flex-shrink-0 shadow-sm shadow-blue-200"></span>}
                    </div>
                    <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">{notif.message}</p>
                    <p className="text-[10px] font-medium text-slate-400 mt-2.5">
                      {new Date(notif.createdAt).toLocaleString('vi-VN')}
                    </p>
                  </div>
                ))}
                
                {/* Nút Load More */}
                {hasMore && (
                  <div className="p-3 bg-white">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation(); // Tránh bị bắt sự kiện click outside
                        handleLoadMore();
                      }}
                      disabled={isLoading}
                      className="w-full py-2 text-xs font-semibold text-slate-500 bg-slate-50 hover:bg-slate-100 hover:text-slate-700 rounded-lg transition-colors flex items-center justify-center gap-2"
                    >
                      {isLoading ? (
                        <span className="w-3.5 h-3.5 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin"></span>
                      ) : (
                        "Xem thêm thông báo"
                      )}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};