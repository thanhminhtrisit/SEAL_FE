import React, { useEffect, useState } from 'react';
import { Globe, Eye, Download, AlertTriangle, X,  Trophy } from 'lucide-react';
import { StatusBadge } from '../components/shared/Badge';
import { toast } from 'sonner';
import { award } from '../../api/award'; 

interface ResultPublicationProps {
  eventId?: number; 
}

interface EventData {
  id: number;
  name: string;
  status?: string; 
}

interface Category {
  id: number;
  name: string;
}

interface TeamResult {
  teamId: number;
  teamName: string;
  rankPosition: number;
  totalScore: number;
}

interface AwardResult {
  teamId: number;
  awardType: string;
}

// Hàm helper để dịch tên giải thưởng
const formatAwardType = (type: string) => {
  const map: Record<string, string> = {
    'FIRST_PLACE': 'Giải Nhất',
    'SECOND_PLACE': 'Giải Nhì',
    'THIRD_PLACE': 'Giải Ba',
    'BEST_TECHNICAL': 'Giải Kỹ Thuật',
    'BEST_PRESENTATION': 'Giải Thuyết Trình',
    'SPECIAL': 'Giải Khuyến Khích'
  };
  return map[type] || type;
};

export const ResultPublicationScreen: React.FC<ResultPublicationProps> = ({ eventId }) => {
  const [published, setPublished] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  
  // State quản lý việc chọn lọc
  const [events, setEvents] = useState<EventData[]>([]);
  const [currentEventId, setCurrentEventId] = useState<number | ''>(eventId || '');
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | ''>('');
  const [teams, setTeams] = useState<TeamResult[]>([]);
  const [awards, setAwards] = useState<AwardResult[]>([]); // State lưu giải thưởng
  const [isLoadingTeams, setIsLoadingTeams] = useState(false);

  // State cho Modal Xác nhận
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmText, setConfirmText] = useState('');

  // 1. Fetch danh sách Sự kiện (Events) khi vừa vào màn hình
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const res = await award.getEvents();
        
        const eventList = Array.isArray(res) ? res : [];
        
        setEvents(eventList);

        if (!currentEventId && eventList.length > 0) {
          setCurrentEventId(eventList[0].id);
        }
      } catch (error) {
        console.error('Lỗi khi tải danh sách Sự kiện:', error);
        toast.error('Không thể tải danh sách sự kiện!');
      }
    };
    fetchEvents();
  }, []); // Chỉ chạy 1 lần khi mount

  // 2. Tự động kiểm tra trạng thái COMPLETED và Fetch Awards khi đổi Sự kiện
  useEffect(() => {
    if (!currentEventId) return;

    // Kiểm tra status
    const selectedEvent = events.find(e => e.id === currentEventId);
    if (selectedEvent?.status === 'COMPLETED') {
      setPublished(true);
    } else {
      setPublished(false);
    }

    // Fetch Categories
    const fetchCategories = async () => {
      try {
        const res = await award.getCategoriesByEvent(Number(currentEventId));
        const categoryList = Array.isArray(res) ? res : (res.data || []); 
        setCategories(categoryList);
        
        if (categoryList && categoryList.length > 0) {
          setSelectedCategoryId(categoryList[0].id);
        } else {
          setSelectedCategoryId('');
        }
      } catch (error) {
        console.error('Lỗi khi tải danh mục:', error);
      }
    };

    // Fetch Awards
    const fetchAwards = async () => {
      try {
        const res = await award.getAwardsByEvent(Number(currentEventId));
        const awardList = Array.isArray(res) ? res : ((res as any).data || []);
        setAwards(awardList);
      } catch (error) {
        console.error('Lỗi khi tải giải thưởng:', error);
      }
    };

    fetchCategories();
    fetchAwards();
  }, [currentEventId, events]);

  // 3. Fetch danh sách Đội thi khi Hạng mục thay đổi
  useEffect(() => {
    const fetchTeams = async () => {
      if (!currentEventId || !selectedCategoryId) {
        setTeams([]);
        return;
      }
      
      setIsLoadingTeams(true);
      try {
        const res = await award.getEligibleTeamsForAward(Number(currentEventId), Number(selectedCategoryId));
        setTeams(Array.isArray(res) ? res : (res.data || []));
      } catch (error) {
        console.error('Lỗi khi tải đội thi:', error);
      } finally {
        setIsLoadingTeams(false);
      }
    };
    fetchTeams();
  }, [currentEventId, selectedCategoryId]);

  // Hàm xử lý gọi API Publish
  const handlePublishResults = async () => {
    if (!currentEventId) return;

    setIsPublishing(true);
    try {
      await award.publishResults(Number(currentEventId));
      
      // Cập nhật lại status của event trong state để UI đồng bộ
      setEvents(prev => prev.map(ev => ev.id === currentEventId ? { ...ev, status: 'COMPLETED' } : ev));
      
      toast.success('Đã công bố kết quả thành công!');
      setPublished(true);
    } catch (error: any) {
      console.error('Lỗi khi công bố kết quả:', error);
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra, vui lòng thử lại!');
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <div className="p-7 space-y-5">
      <div className="flex items-start justify-between mb-5">
        <div>
          <h1 className="text-xl font-bold text-slate-900" style={{ fontFamily: 'var(--font-display)' }}>
            Công Bố Kết Quả
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Xem trước và công bố kết quả chung cuộc cho thí sinh
          </p>
        </div>
      </div>
      
      {/* VÙNG CHỌN SỰ KIỆN VÀ HẠNG MỤC */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 flex items-end gap-5">
        <div className="flex-1">
          <label className="block text-sm font-semibold text-slate-700 mb-2">1. Chọn Sự kiện</label>
          <select 
            className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50"
            value={currentEventId}
            onChange={(e) => setCurrentEventId(Number(e.target.value))}
          >
            <option value="" disabled>-- Chọn sự kiện cần công bố --</option>
            {events.map((ev) => (
              <option key={ev.id} value={ev.id}>
                {ev.name} {ev.status === 'COMPLETED' ? '(Đã Công Bố)' : ''}
              </option>
            ))}
          </select>
        </div>
        
        <div className="flex-1">
          <label className="block text-sm font-semibold text-slate-700 mb-2">2. Lọc theo Hạng mục</label>
          <select 
            className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50 disabled:bg-slate-100 disabled:text-slate-400"
            value={selectedCategoryId}
            onChange={(e) => setSelectedCategoryId(Number(e.target.value))}
            disabled={!currentEventId || categories.length === 0}
          >
            <option value="" disabled>-- Chọn hạng mục --</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
        </div>
      </div>

      {!published ? (
        <div className="space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
            <Eye className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-blue-800">Xem Trước Kết Quả (Chưa Công Bố)</p>
              <p className="text-sm text-blue-700 mt-1">Kết quả hiện chỉ hiển thị với bạn. Thí sinh không thể xem bảng xếp hạng, điểm số hoặc giải thưởng cho đến khi bạn công bố.</p>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm border border-slate-200">
            <div className="px-5 py-4 border-b border-slate-100">
              <h3 className="font-semibold text-slate-900" style={{ fontFamily: 'var(--font-display)' }}>
                Xem Trước Kết Quả Chung Cuộc
              </h3>
            </div>

            <div className="p-5 space-y-3 min-h-[200px]">
              {isLoadingTeams ? (
                <div className="flex items-center justify-center h-full pt-10">
                  <span className="w-6 h-6 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin"></span>
                </div>
              ) : teams.length > 0 ? (
                teams.map((team) => {
                  // Tìm xem đội này có giải thưởng nào không
                  const teamAward = awards.find(a => a.teamId === team.teamId);

                  return (
                    <div key={team.teamId} className="flex items-center gap-4 p-3 rounded-lg border border-slate-100 hover:bg-slate-50 transition-colors">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${team.rankPosition === 1 ? 'bg-yellow-400 text-yellow-900' : team.rankPosition === 2 ? 'bg-slate-300 text-slate-700' : team.rankPosition === 3 ? 'bg-amber-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                        {team.rankPosition}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <p className="font-semibold text-slate-900 text-sm">{team.teamName}</p>
                          {teamAward && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-700 border border-amber-200">
                              <Trophy className="w-3.5 h-3.5" />
                              {formatAwardType(teamAward.awardType)}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">ID Đội: #{team.teamId}</p>
                      </div>
                      <span className="font-mono font-bold text-blue-800">{team.totalScore?.toFixed(2)} đ</span>
                    </div>
                  );
                })
              ) : (
                <div className="flex flex-col items-center justify-center py-10 text-slate-400">
                  <AlertTriangle className="w-8 h-8 mb-2 text-slate-300" />
                  <p className="text-sm">Chưa có dữ liệu bảng xếp hạng cho hạng mục này.</p>
                </div>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 border border-slate-200 text-slate-600 text-sm px-4 py-2 rounded-lg hover:bg-slate-50">
              <Download className="w-4 h-4" /> Xuất CSV
            </button>
            <button className="flex items-center gap-2 border border-slate-200 text-slate-600 text-sm px-4 py-2 rounded-lg hover:bg-slate-50">
              <Download className="w-4 h-4" /> Xuất Excel
            </button>
            
            <button 
              onClick={() => setShowConfirmModal(true)} 
              disabled={isPublishing || !currentEventId || teams.length === 0}
              className={`flex items-center gap-2 text-white text-sm font-semibold px-5 py-2 rounded-lg transition-colors ml-auto
                ${isPublishing || !currentEventId || teams.length === 0 ? 'bg-emerald-400 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-700 shadow-sm'}`}
            >
              <Globe className="w-4 h-4" />
              Công Bố & Thông Báo Cho Thí Sinh
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 text-center animate-in fade-in zoom-in-95 duration-500">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Globe className="w-8 h-8 text-emerald-600" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2" style={{ fontFamily: 'var(--font-display)' }}>Sự Kiện Đã Được Công Bố!</h2>
          <p className="text-slate-500 mb-5 max-w-md mx-auto">
            Kết quả của sự kiện này đã được ghi nhận là <strong>COMPLETED</strong>. Tất cả bảng xếp hạng, điểm số và giải thưởng hiện đang được công khai cho thí sinh.
          </p>
        </div>
      )}

      {/* MODAL XÁC NHẬN PUBLISH */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="text-lg font-bold text-slate-900" style={{ fontFamily: 'var(--font-display)' }}>Xác nhận Công bố</h3>
              <button onClick={() => setShowConfirmModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6">
              <p className="text-sm text-slate-600 mb-5 leading-relaxed">
                Hành động này sẽ mở khóa hiển thị toàn bộ <strong>Bảng Xếp Hạng</strong>, <strong>Điểm Số</strong> và <strong>Giải Thưởng</strong>. Đồng thời hệ thống sẽ tự động gửi thông báo đến các thí sinh.
              </p>
              
              <div className="bg-red-50 text-red-700 text-sm px-4 py-3 rounded-lg border border-red-100 mb-5">
                Vui lòng nhập chữ <strong className="font-mono text-red-800 tracking-wider">CONFIRM</strong> vào ô bên dưới để tiếp tục.
              </div>
              
              <input
                type="text"
                className="w-full border border-slate-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all font-mono tracking-wider"
                placeholder="Nhập CONFIRM"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                autoFocus
              />
            </div>
            
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3">
              <button
                onClick={() => { setShowConfirmModal(false); setConfirmText(''); }}
                className="px-5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-200 rounded-xl transition-colors"
              >
                Hủy bỏ
              </button>
              <button
                onClick={() => {
                  setShowConfirmModal(false);
                  setConfirmText('');
                  handlePublishResults();
                }}
                disabled={confirmText !== 'CONFIRM'}
                className="px-5 py-2.5 text-sm font-semibold text-white bg-emerald-600 rounded-xl hover:bg-emerald-700 disabled:bg-emerald-300 disabled:cursor-not-allowed transition-colors shadow-sm"
              >
                Xác nhận Công bố
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};