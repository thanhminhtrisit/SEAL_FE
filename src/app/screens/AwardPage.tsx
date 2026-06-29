import React, { useState, useEffect } from 'react';
import { award } from '../../api/award';
import { AwardResponse } from '../../app/types';

export const AwardsPage: React.FC = () => {
  const eventId = 1; // Giả định đang ở Event ID 1 để test khớp dữ liệu MySQL
  const [awards, setAwards] = useState<AwardResponse[]>([]);
  const [eligibleTeams, setEligibleTeams] = useState<any[]>([]); // Thêm state lưu đội đủ điều kiện
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // State cho Form tạo giải thưởng mới
  const [teamId, setTeamId] = useState<string>('');
  const [awardType, setAwardType] = useState<string>('FIRST_PLACE');
  const [description, setDescription] = useState<string>('');

  // Tải danh sách giải thưởng và đội đủ điều kiện khi mở màn hình
  useEffect(() => {
    loadAwards();
    loadEligibleTeams();
  }, [eventId]);

  const loadAwards = async () => {
    try {
      const data = await award.getAwardsByEvent(eventId);
      setAwards(data);
    } catch (err) {
      console.error('Lỗi tải danh sách giải thưởng:', err);
    }
  };

  const loadEligibleTeams = async () => {
    try {
      const data = await award.getEligibleTeams(eventId);
      setEligibleTeams(data || []);
    } catch (err) {
      console.error('Lỗi tải danh sách đội đủ điều kiện:', err);
    }
  };

  const handleSubmitAward = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamId) {
      alert('Vui lòng chọn đội thi nhận giải!');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await award.createAward({
        eventId,
        teamId: Number(teamId),
        rankingId: null, // Đã cấu hình subquery tự động ở tầng DB
        awardType,
        description
      });

      alert('Trao giải thưởng thành công!');
      // Reset form và làm mới danh sách
      setTeamId('');
      setDescription('');
      loadAwards();
    } catch (err: any) {
      setError('Không thể trao giải. Vui lòng kiểm tra lại kết nối mạng.');
    } finally {
      setIsLoading(false);
    }
  };

  // Hàm helper định dạng màu sắc cho từng loại giải thưởng
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
        <p className="text-sm text-slate-500 mt-0.5">Cấp phát và vinh danh các đội thi có thành tích xuất sắc</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* CỘT TẠO GIẢI THƯỞNG (FORM) */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm h-fit">
          <h2 className="text-lg font-bold text-slate-800 mb-4">Cấp Giải Thưởng Mới</h2>
          
          {error && <div className="p-3 mb-4 text-sm text-red-700 bg-red-50 rounded-lg border border-red-200">{error}</div>}

          <form onSubmit={handleSubmitAward} className="space-y-4">
            {/* ĐÃ THAY THẾ INPUT BẰNG SELECT */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Đội Thi Đạt Giải *</label>
              <select 
                value={teamId}
                onChange={(e) => setTeamId(e.target.value)}
                required
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white"
              >
                <option value="" disabled>-- Chọn đội thi từ Vòng Chung Kết --</option>
                {eligibleTeams.map((team) => (
                  <option key={team.teamId} value={team.teamId}>
                    Hạng {team.rankPosition}: {team.teamName} ({Number(team.totalScore).toFixed(3)} điểm)
                  </option>
                ))}
              </select>
              {eligibleTeams.length === 0 && (
                <p className="text-xs text-amber-600 mt-1 italic">
                  *Chưa có dữ liệu xếp hạng chung kết. Hãy tính toán xếp hạng trước!
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Hạng Mục Giải Thưởng *</label>
              <select 
                value={awardType}
                onChange={(e) => setAwardType(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white"
              >
                <option value="FIRST_PLACE">FIRST PLACE (Giải Nhất)</option>
                <option value="SECOND_PLACE">SECOND PLACE (Giải Nhì)</option>
                <option value="THIRD_PLACE">THIRD PLACE (Giải Ba)</option>
                <option value="BEST_TECHNICAL">BEST TECHNICAL (Giải Kỹ Thuật Xuất Sắc)</option>
                <option value="BEST_PRESENTATION">BEST PRESENTATION (Giải Thuyết Trình Ấn Tượng)</option>
                <option value="SPECIAL">SPECIAL (Giải Đặc Biệt / Khuyến Khích)</option>
              </select>
            </div>

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
              disabled={isLoading || eligibleTeams.length === 0}
              className={`w-full py-2 px-4 rounded-lg text-white font-semibold text-sm transition-colors
                ${isLoading || eligibleTeams.length === 0 ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-800 hover:bg-blue-900'}`}
            >
              {isLoading ? 'Đang hệ thống hóa...' : 'Xác Nhận Trao Giải'}
            </button>
          </form>
        </div>

        {/* CỘT HIỂN THỊ DANH SÁCH GIẢI THƯỞNG */}
        <div className="lg:col-span-2 bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <h2 className="text-lg font-bold text-slate-800 mb-4">Danh Sách Đội Đoạt Giải Hiện Tại</h2>
          
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
                {awards.length === 0 ? (
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