import React, { useState, useEffect } from 'react';
import { award } from '../../api/award';
import { AwardResponse } from '../../app/types';

export const AwardsPage: React.FC = () => {
  const [selectedEventId, setSelectedEventId] = useState<string>(''); 
  const [events, setEvents] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]); 
  const [eligibleTeams, setEligibleTeams] = useState<any[]>([]); 
  const [awards, setAwards] = useState<AwardResponse[]>([]);
  
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [selectedCategoryId, setSelectedCategoryId] = useState<string>(''); 
  const [teamId, setTeamId] = useState<string>('');
  const [awardType, setAwardType] = useState<string>('FIRST_PLACE');
  const [description, setDescription] = useState<string>('');

  const getErrorMessage = (err: unknown) => {
    if (err instanceof Error && err.message.trim()) {
      return err.message
        .replace(/^Unexpected error:\s*/i, '')
        .replace(/^Lỗi:\s*/i, '')
        .trim();
    }

    return 'Không thể trao giải. Vui lòng kiểm tra lại hệ thống.';
  };

  // 1. Tải danh sách sự kiện khi mount component
  useEffect(() => {
    const loadAllEvents = async () => {
      try {
        const data = await award.getEvents();
        setEvents(data || []);
      } catch (err) {
        console.error('Lỗi tải danh sách sự kiện:', err);
      }
    };
    loadAllEvents();
  }, []);

  // 2. Load lại Hạng mục và Giải thưởng khi đổi Event
  useEffect(() => {
    if (selectedEventId) {
      loadCategories(Number(selectedEventId));
      loadAwards(Number(selectedEventId));
      
      // Reset state con để tránh lưu cache ID cũ
      setSelectedCategoryId('');
      setEligibleTeams([]);
      setTeamId('');
    } else {
      setCategories([]);
      setAwards([]);
      setSelectedCategoryId('');
      setEligibleTeams([]);
      setTeamId('');
    }
  }, [selectedEventId]);

  // 3. Load danh sách Đội thi khi đổi Hạng mục
  // Đã thêm selectedEventId vào dependency array để React theo dõi state chuẩn hơn
  useEffect(() => {
    if (selectedEventId && selectedCategoryId) {
      loadEligibleTeams(Number(selectedEventId), Number(selectedCategoryId));
    } else {
      setEligibleTeams([]);
      setTeamId('');
    }
  }, [selectedEventId, selectedCategoryId]);

  const loadAwards = async (eId: number) => {
    try {
      const data = await award.getAwardsByEvent(eId);
      setAwards(data || []);
    } catch (err) {
      console.error('Lỗi tải danh sách giải thưởng:', err);
    }
  };

  const loadCategories = async (eId: number) => {
    try {
      const data = await award.getCategoriesByEvent(eId);
      setCategories(data || []);
    } catch (err) {
      console.error('Lỗi tải danh mục:', err);
    }
  };

  const loadEligibleTeams = async (eId: number, cId: number) => {
    try {
      // Hàm này giờ đây sẽ gọi API với cId = 5, 7, 8... tự động theo DB
      const data = await award.getEligibleTeams(eId, cId);
      setEligibleTeams(data || []);
    } catch (err) {
      console.error('Lỗi tải danh sách đội đủ điều kiện:', err);
    }
  };

  const handleSubmitAward = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEventId || !selectedCategoryId || !teamId) {
      alert('Vui lòng điền đầy đủ các thông tin bắt buộc!');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await award.createAward({
        eventId: Number(selectedEventId),
        categoryId: Number(selectedCategoryId), // Giá trị truyền lên sẽ khớp 100% với Backend
        teamId: Number(teamId),
        rankingId: null, 
        awardType,
        description
      });

      alert('Trao giải thưởng thành công!');
      // Reset form sau khi thành công
      setTeamId('');
      setDescription('');
      loadAwards(Number(selectedEventId));
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  const getAwardBadgeStyle = (type: string) => {
    switch (type) {
      case 'FIRST_PLACE': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'SECOND_PLACE': return 'bg-slate-100 text-slate-800 border-slate-300';
      case 'THIRD_PLACE': return 'bg-amber-100 text-amber-800 border-amber-300';
      default: return 'bg-blue-100 text-blue-800 border-blue-300';
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-slate-900">Quản Lý Giải Thưởng & Danh Hiệu</h1>
        <p className="text-sm text-slate-500 mt-0.5">Cấp phát và vinh danh các đội thi theo từng Sự kiện và Hạng mục</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* CỘT TẠO GIẢI THƯỞNG */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm h-fit">
          <h2 className="text-lg font-bold text-slate-800 mb-4">Cấp Giải Thưởng Mới</h2>
          
          {error && <div className="p-3 mb-4 text-sm text-red-700 bg-red-50 rounded-lg border border-red-200">{error}</div>}

          <form onSubmit={handleSubmitAward} className="space-y-4">
            
            {/* SELECT 1: SỰ KIỆN */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Chọn Sự Kiện *</label>
              <select 
                value={selectedEventId}
                onChange={(e) => setSelectedEventId(e.target.value)}
                required
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white"
              >
                <option value="" disabled>-- Chọn Sự kiện muốn trao giải --</option>
                {events.map((ev) => (
                  <option key={ev.id} value={ev.id}>{ev.name}</option>
                ))}
              </select>
            </div>

            {/* SELECT 2: HẠNG MỤC */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Hạng Mục (Category) *</label>
              <select 
                value={selectedCategoryId}
                onChange={(e) => setSelectedCategoryId(e.target.value)}
                required
                disabled={!selectedEventId}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white disabled:bg-slate-100 disabled:text-slate-400"
              >
                <option value="" disabled>
                  {!selectedEventId ? '-- Vui lòng chọn Sự kiện trước --' : '-- Chọn Hạng mục thi đấu --'}
                </option>
                {categories.map((cat) => (
                  // Frontend sẽ tự động lấy cat.id (như 5, 7, 8) gán vào option thay vì index
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>

            {/* SELECT 3: ĐỘI THI */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Đội Thi Đạt Giải *</label>
              <select 
                value={teamId}
                onChange={(e) => setTeamId(e.target.value)}
                required
                disabled={!selectedCategoryId}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white disabled:bg-slate-100 disabled:text-slate-400"
              >
                <option value="" disabled>
                  {!selectedCategoryId ? '-- Vui lòng chọn Hạng mục trước --' : '-- Chọn đội thi từ Vòng Chung Kết --'}
                </option>
                {eligibleTeams.map((team) => (
                  <option key={team.teamId} value={team.teamId}>
                    Hạng {team.rankPosition}: {team.teamName} ({Number(team.totalScore).toFixed(3)} điểm)
                  </option>
                ))}
              </select>
            </div>

            {/* SELECT 4: CƠ CẤU GIẢI THƯỞNG */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Cơ Cấu Giải Thưởng *</label>
              <select 
                value={awardType}
                onChange={(e) => setAwardType(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white"
              >
                <option value="FIRST_PLACE">FIRST PLACE (Giải Nhất)</option>
                <option value="SECOND_PLACE">SECOND PLACE (Giải Nhì)</option>
                <option value="THIRD_PLACE">THIRD PLACE (Giải Ba)</option>
                <option value="BEST_TECHNICAL">BEST TECHNICAL (Giải Kỹ Thuật)</option>
                <option value="BEST_PRESENTATION">BEST PRESENTATION (Giải Thuyết Trình)</option>
                <option value="SPECIAL">SPECIAL (Giải Khuyến Khích)</option>
              </select>
            </div>

            {/* TEXTAREA: MÔ TẢ */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Mô Tả / Phần Thưởng</label>
              <textarea 
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Nhập giá trị giải thưởng hoặc lý do vinh danh..."
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>

            <button 
              type="submit"
              disabled={isLoading || !teamId}
              className={`w-full py-2 px-4 rounded-lg text-white font-semibold text-sm transition-colors
                ${isLoading || !teamId ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-800 hover:bg-blue-900'}`}
            >
              {isLoading ? 'Đang hệ thống hóa...' : 'Xác Nhận Trao Giải'}
            </button>
          </form>
        </div>

        {/* CỘT HIỂN THỊ DANH SÁCH GIẢI THƯỞNG */}
        <div className="lg:col-span-2 bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <h2 className="text-lg font-bold text-slate-800 mb-4">
            {selectedEventId ? 'Danh Sách Đội Đoạt Giải Hiện Tại' : 'Vui lòng chọn Sự kiện để xem danh sách giải'}
          </h2>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Tên Đội</th>
                  <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Giải Thưởng</th>
                  <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Chi Tiết Khen Thưởng</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {!selectedEventId ? (
                  <tr>
                    <td colSpan={3} className="px-4 py-8 text-center text-sm text-slate-400 italic">
                      Hãy chọn một sự kiện từ form bên trái để xem dữ liệu.
                    </td>
                  </tr>
                ) : awards.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-4 py-8 text-center text-sm text-slate-400">
                      Chưa có giải thưởng nào được ghi nhận cho sự kiện này.
                    </td>
                  </tr>
                ) : (
                  awards.map((item) => (
                    <tr key={item.awardId} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-4 py-4 text-sm font-semibold text-slate-900">
                        {item.teamName}
                      </td>
                      <td className="px-4 py-4">
                        <span className={`text-xs font-mono px-2.5 py-1 rounded-md border font-semibold ${getAwardBadgeStyle(item.awardType)}`}>
                          {item.awardType.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-sm text-slate-600 max-w-xs truncate" title={item.description}>
                        {item.description || 'Không có mô tả đi kèm.'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};