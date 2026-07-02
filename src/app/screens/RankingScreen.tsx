import React, { useState, useEffect, useMemo } from 'react';
import { ranking } from '../../api/ranking';
import { RankingResponse } from '../types';

interface RankingScreenProps {
  isCoordinator?: boolean;
}

export const RankingScreen: React.FC<RankingScreenProps> = ({ isCoordinator = true }) => {
  // --- TẦNG 1: STATE QUẢN LÝ EVENT & CATEGORY KHỞI TẠO ---
  const [events, setEvents] = useState<{id: number, name: string}[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<number | null>(null);
  
  // STATE MỚI: Danh sách danh mục được tải độc lập theo Event
  const [categories, setCategories] = useState<{id: number, name: string}[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | 'ALL'>('ALL');

  // --- TẦNG 2: STATE QUẢN LÝ ROUND (TABS) ---
  const [rounds, setRounds] = useState<{id: number, name: string}[]>([]);
  const [activeRoundId, setActiveRoundId] = useState<number | null>(null);

  // --- TẦNG 3: STATE QUẢN LÝ RANKING ---
  const [rankings, setRankings] = useState<RankingResponse[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // --- STATE QUẢN LÝ TÁC VỤ THỦ CÔNG ---
  const [selectedTeamIds, setSelectedTeamIds] = useState<number[]>([]);
  const [isPromoting, setIsPromoting] = useState<boolean>(false);

  // State cho Modal Disqualify
  const [disqualifyData, setDisqualifyData] = useState<{ teamId: number, teamName: string } | null>(null);
  const [disqualifyReason, setDisqualifyReason] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isPublished, setIsPublished] = useState<boolean>(false);
  
  // State cho Modal Xem Blacklist
  const [isDisqualifiedModalOpen, setIsDisqualifiedModalOpen] = useState(false);
  const [disqualifiedTeams, setDisqualifiedTeams] = useState<any[]>([]);
  const [isLoadingBlacklist, setIsLoadingBlacklist] = useState(false);

  // --- LUỒNG 1: CHẠY NGAY KHI VÀO TRANG -> TẢI DANH SÁCH EVENT ---
  useEffect(() => {
    const fetchInitialEvents = async () => {
      try {
        const eventsData = await ranking.getEvents(); 
        setEvents(eventsData || []);
        if (eventsData && eventsData.length > 0) {
          setSelectedEventId(eventsData[0].id);
        }
      } catch (error) {
        console.error("Lỗi khi tải danh sách sự kiện:", error);
      }
    };
    fetchInitialEvents();
  }, []);

  // --- LUỒNG 2: KHI EVENT THAY ĐỔI -> TẢI LẠI ROUNDS VÀ CATEGORIES ---
  useEffect(() => {
    const fetchEventData = async () => {
      if (!selectedEventId) return;
      
      try {
        // Tải danh sách Vòng thi
        const roundsData = await ranking.getRoundsByEvent(selectedEventId); 
        setRounds(roundsData || []);
        if (roundsData && roundsData.length > 0) {
          setActiveRoundId(roundsData[0].id);
        } else {
          setActiveRoundId(null);
          setRankings([]); 
        }

        // Tải danh sách Hạng mục (Category) của sự kiện này
        // (Yêu cầu API ranking.getCategoriesByEvent phải được định nghĩa trong file API)
        if (ranking.getCategoriesByEvent) {
          const catData = await ranking.getCategoriesByEvent(selectedEventId);
          setCategories(catData || []);
        }
      } catch (error) {
        console.error("Lỗi khi tải dữ liệu phụ trợ sự kiện:", error);
      }
    };

    fetchEventData();
  }, [selectedEventId]);

  // --- LUỒNG 3: KHI ĐỔI ROUND -> TẢI LẠI BẢNG XẾP HẠNG TỔNG ---
  useEffect(() => {
    if (activeRoundId !== null) {
      fetchRankings(activeRoundId);
      setSelectedCategoryId('ALL'); // Reset bộ lọc hạng mục
      setSelectedTeamIds([]); // Xóa danh sách đội đã chọn
    }
  }, [activeRoundId]);

  const fetchRankings = async (targetRoundId: number) => {
    setIsLoading(true);
    try {
      const data = await ranking.getRankings(targetRoundId); 
      setRankings(data);
      setError(null);
    } catch (err: any) {
      setError('Không thể tải dữ liệu xếp hạng.');
    } finally {
      setIsLoading(false);
    }
  };

  // --- XỬ LÝ TÍNH TOÁN THEO CATEGORY ---
  const handleComputeRanking = async () => {
    if (!activeRoundId) return;
    setIsLoading(true);
    try {
      // Truyền categoryId xuống, nếu là 'ALL' thì Backend nhận 0
      const targetCatId = selectedCategoryId === 'ALL' ? 0 : Number(selectedCategoryId);
      
      const data = await ranking.computeRanking(activeRoundId, targetCatId); 
      setRankings(data); // Render lại bảng
      setError(null);
      alert('Đã tính toán và cập nhật xếp hạng thành công!');
    } catch (err: any) {
      setError('Lỗi khi tính toán xếp hạng.');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePromoteTeams = async () => {
    if (selectedTeamIds.length === 0 || !activeRoundId) return;
    setIsPromoting(true);
    try {
      await ranking.promoteTeams(activeRoundId, selectedTeamIds);
      alert(`Đã thăng hạng thành công ${selectedTeamIds.length} đội sang vòng tiếp theo!`);
      setSelectedTeamIds([]); 

      const currentRoundIndex = rounds.findIndex(round => round.id === activeRoundId);
      const nextRound = currentRoundIndex >= 0 ? rounds[currentRoundIndex + 1] : undefined;
      if (nextRound) {
        setActiveRoundId(nextRound.id);
        await fetchRankings(nextRound.id);
      } else {
        await fetchRankings(activeRoundId);
      }
    } catch (err: any) {
      alert("Lỗi khi chuyển vòng: " + err.message);
    } finally {
      setIsPromoting(false);
    }
  };

  const handleConfirmDisqualify = async () => {
    if (!disqualifyReason.trim() || !activeRoundId) {
      alert('Vui lòng nhập lý do đình chỉ để lưu vào Audit Log!');
      return;
    }
    
    setIsSubmitting(true);
    try {
      await ranking.disqualifyTeam(disqualifyData!.teamId, disqualifyReason);
      alert(`Đã đình chỉ thành công đội ${disqualifyData!.teamName}.`);
      setDisqualifyData(null);
      setDisqualifyReason('');
      await handleComputeRanking(); 
    } catch (err: any) {
      alert('Có lỗi xảy ra khi đình chỉ đội thi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleViewDisqualified = async () => {
    if (!selectedEventId) return;
    setIsLoadingBlacklist(true);
    setIsDisqualifiedModalOpen(true);
    try {
        const data = await ranking.getDisqualifiedTeams(selectedEventId);
        setDisqualifiedTeams(data);
    } catch (err) {
        alert("Lỗi tải danh sách đình chỉ!");
    } finally {
        setIsLoadingBlacklist(false);
    }
  };

  // --- LỌC UI THEO CATEGORY ID ---
  const filteredRankings = useMemo(() => {
    if (selectedCategoryId === 'ALL') return rankings;
    
    // Tìm tên Category từ mảng categories đang có
    const targetCategoryName = categories.find(c => c.id === Number(selectedCategoryId))?.name;
    
    // Nếu không tìm thấy tên (có thể API chưa đồng bộ), giữ nguyên mảng rỗng
    if (!targetCategoryName) return [];

    return rankings.filter(r => r.categoryName === targetCategoryName);
  }, [rankings, selectedCategoryId, categories]);

  const activeRoundName = rounds.find(r => r.id === activeRoundId)?.name || 'Chưa có vòng thi';

  return (
    <div className="space-y-4">
      {/* TẦNG 1: BỘ LỌC EVENT TỔNG */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200 flex items-center justify-between">
        <div className="flex items-center gap-4 w-full max-w-2xl">
          <label className="font-semibold text-slate-700 whitespace-nowrap">Sự kiện (Event):</label>
          <select 
            value={selectedEventId || ''}
            onChange={(e) => setSelectedEventId(Number(e.target.value))}
            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {events.length === 0 && <option value="">Đang tải danh sách sự kiện...</option>}
            {events.map(event => (
              <option key={event.id} value={event.id}>{event.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* TẦNG 2 & 3: TABS VÀ BẢNG XẾP HẠNG */}
      <div className="p-6 bg-white rounded-lg shadow-md relative">
        
        {/* TẦNG 2: TABS VÒNG THI */}
        <div className="flex border-b border-slate-200 mb-6 overflow-x-auto hide-scrollbar">
          {rounds.map(round => (
            <button
              key={round.id}
              onClick={() => setActiveRoundId(round.id)}
              className={`py-3 px-6 font-semibold text-sm whitespace-nowrap transition-all border-b-2 ${
                activeRoundId === round.id
                  ? 'border-blue-600 text-blue-700 bg-blue-50/50'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300 hover:bg-slate-50'
              }`}
            >
              {round.name}
            </button>
          ))}
          {rounds.length === 0 && selectedEventId && (
            <div className="py-3 px-6 text-sm text-slate-400 italic">Sự kiện này chưa có vòng thi nào</div>
          )}
        </div>

        <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center mb-6 gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-bold text-gray-800">Bảng Xếp Hạng: {activeRoundName}</h2>
              {activeRoundId && (
                isPublished ? (
                  <span className="px-2.5 py-1 inline-flex text-xs font-semibold rounded-full bg-blue-50 text-blue-700 border border-blue-200">🌍 Đã công bố cho thí sinh</span>
                ) : (
                  <span className="px-2.5 py-1 inline-flex text-xs font-semibold rounded-full bg-slate-100 text-slate-600 border border-slate-200">🔒 Nội bộ (Chưa công bố)</span>
                )
              )}
            </div>
            <p className="text-sm text-gray-500 mt-1">Danh sách xếp hạng các đội theo tổng điểm (Event & Category Level)</p>
          </div>
          
          <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
            {/* TẦNG 3: LỌC HẠNG MỤC DỰA TRÊN STATE CATEGORIES */}
            <select 
              value={selectedCategoryId}
              onChange={(e) => setSelectedCategoryId(e.target.value === 'ALL' ? 'ALL' : Number(e.target.value))}
              disabled={!activeRoundId}
              className="px-3 py-2 bg-slate-50 border border-slate-300 rounded-md text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 min-w-[200px]"
            >
              <option value="ALL">Tất cả hạng mục (Event Level)</option>
              {categories.length === 0 && <option disabled>Chưa có dữ liệu danh mục</option>}
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>

            {isCoordinator && (
              <div className="flex gap-2 w-full sm:w-auto">
                <button 
                  onClick={handlePromoteTeams}
                  disabled={selectedTeamIds.length === 0 || isPromoting || !activeRoundId}
                  className={`flex-1 sm:flex-none px-4 py-2 font-semibold text-white rounded-md transition-all whitespace-nowrap
                    ${selectedTeamIds.length === 0 || isPromoting || !activeRoundId ? 'bg-emerald-300 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-700 shadow-sm'}`}
                >
                  {isPromoting ? 'Đang xử lý...' : `Thăng hạng (${selectedTeamIds.length})`}
                </button>

                <button 
                    onClick={handleViewDisqualified}
                    disabled={!selectedEventId}
                    className="flex-1 sm:flex-none px-4 py-2 font-semibold text-red-600 bg-red-50 border border-red-200 rounded-md hover:bg-red-100 transition-all whitespace-nowrap"
                >
                    📋 Đội đình chỉ
                </button>

               <button 
                  onClick={handleComputeRanking}
                  disabled={isLoading || !activeRoundId || (categories.length > 0 && selectedCategoryId === 'ALL')}
                  className={`flex-1 sm:flex-none px-4 py-2 font-semibold text-white rounded-md transition-all whitespace-nowrap
                    ${(isLoading || !activeRoundId || (categories.length > 0 && selectedCategoryId === 'ALL')) 
                      ? 'bg-blue-300 cursor-not-allowed' 
                      : 'bg-blue-600 hover:bg-blue-700 shadow-sm'}`}
                >
                  {isLoading ? 'Đang xử lý...' : 'Tính toán Xếp hạng'}
                </button>
              </div>
            )}
          </div>
        </div>

        {error && <div className="p-3 mb-4 text-sm text-red-700 bg-red-50 rounded-lg border border-red-200">{error}</div>}

        <div className="overflow-x-auto border border-gray-200 rounded-lg">
          <table className="min-w-full bg-white">
            <thead className="bg-slate-50 border-b border-gray-200">
              <tr>
                {isCoordinator && <th className="px-6 py-3 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider w-16">Chọn</th>}
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Hạng</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Đội thi</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Hạng mục</th>
                <th className="px-6 py-3 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider">Tổng Điểm</th>
                <th className="px-6 py-3 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider">Trạng Thái</th>
                {isCoordinator && <th className="px-6 py-3 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider">Hành động</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredRankings.length === 0 && !isLoading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-slate-500">
                    {!activeRoundId ? 'Vui lòng chọn một vòng thi hợp lệ.' : 
                     (rankings.length === 0 ? 'Chưa có dữ liệu xếp hạng. Hãy ấn tính toán!' : 
                     'Không có đội nào trong hạng mục được chọn.')}
                  </td>
                </tr>
              ) : (
                filteredRankings.map((team) => (
                  <tr key={team.teamId} className="hover:bg-slate-50/50 transition-colors">
                    {isCoordinator && (
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <input 
                          type="checkbox"
                          className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                          checked={selectedTeamIds.includes(team.teamId)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedTeamIds([...selectedTeamIds, team.teamId]);
                            } else {
                              setSelectedTeamIds(selectedTeamIds.filter(id => id !== team.teamId));
                            }
                          }}
                        />
                      </td>
                    )}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-sm font-bold 
                        ${team.rankPosition === 1 ? 'bg-yellow-100 text-yellow-700' 
                        : team.rankPosition === 2 ? 'bg-slate-200 text-slate-700' 
                        : team.rankPosition === 3 ? 'bg-amber-100 text-amber-700' 
                        : 'bg-transparent text-slate-600'}`}>
                        #{team.rankPosition}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-blue-700">{team.teamName}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">{team.categoryName || '—'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-slate-800 text-center font-mono">{team.totalScore.toFixed(3)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      {team.isPromoted ? (
                        <span className="px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-emerald-100 text-emerald-700">Thăng hạng</span>
                      ) : (
                        <span className="px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-slate-100 text-slate-500">Dừng bước</span>
                      )}
                    </td>
                    {isCoordinator && (
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <button 
                          onClick={() => setDisqualifyData({ teamId: team.teamId, teamName: team.teamName })}
                          className="px-3 py-1.5 text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 rounded-md transition-colors"
                        >
                          Đình chỉ
                        </button>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* CÁC MODAL ĐÌNH CHỈ & XEM DANH SÁCH GIỮ NGUYÊN (Không đổi code) */}
        {disqualifyData && (
           <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm">
             <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden">
               <div className="p-5 border-b border-slate-100 flex items-center gap-3 bg-red-50/50">
                 <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center font-bold text-red-600">!</div>
                 <h3 className="text-lg font-bold text-slate-800">Đình chỉ đội thi</h3>
               </div>
               <div className="p-6">
                 <p className="text-sm text-slate-600 mb-4">Bạn đang đình chỉ đội <span className="font-bold text-slate-900">{disqualifyData.teamName}</span>.</p>
                 <div className="space-y-2">
                   <label className="block text-sm font-medium text-slate-700">Lý do vi phạm <span className="text-red-500">*</span></label>
                   <textarea value={disqualifyReason} onChange={(e) => setDisqualifyReason(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500 min-h-[100px]" />
                 </div>
               </div>
               <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
                 <button onClick={() => { setDisqualifyData(null); setDisqualifyReason(''); }} disabled={isSubmitting} className="px-4 py-2 text-sm text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50">Hủy bỏ</button>
                 <button onClick={handleConfirmDisqualify} disabled={isSubmitting} className={`px-4 py-2 text-sm font-medium text-white rounded-lg ${isSubmitting ? 'bg-red-400' : 'bg-red-600 hover:bg-red-700'}`}>Xác nhận đình chỉ</button>
               </div>
             </div>
           </div>
        )}

        {isDisqualifiedModalOpen && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm">
                  <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[80vh]">
                      <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-red-50/50">
                          <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center font-bold text-red-600">!</div>
                              <h3 className="text-lg font-bold text-slate-800">Danh sách Đội bị đình chỉ</h3>
                          </div>
                          <button onClick={() => setIsDisqualifiedModalOpen(false)} className="text-slate-400 hover:text-slate-600 text-xl font-bold">&times;</button>
                      </div>
                      
                      <div className="p-6 overflow-y-auto">
                          {isLoadingBlacklist ? (
                              <p className="text-center text-slate-500 py-4">Đang tải dữ liệu...</p>
                          ) : disqualifiedTeams.length === 0 ? (
                              <p className="text-center text-slate-500 py-8 italic">Chưa có đội nào bị đình chỉ trong sự kiện này.</p>
                          ) : (
                              <div className="space-y-3">
                                  {disqualifiedTeams.map(team => (
                                      <div key={team.id} className="p-4 border border-red-100 bg-red-50/30 rounded-lg flex flex-col gap-1">
                                          <div className="flex justify-between items-center">
                                              <span className="font-bold text-slate-800 text-lg">{team.name}</span>
                                              <span className="text-xs px-2 py-1 bg-red-100 text-red-700 font-semibold rounded uppercase">Disqualified</span>
                                          </div>
                                          <p className="text-sm text-slate-600 mt-2">
                                              <span className="font-semibold text-slate-700">Lý do: </span> 
                                              {team.DISQUALIFIED_REASON || team.disqualifiedReason || 'Không có lý do cụ thể'}
                                          </p>
                                      </div>
                                  ))}
                              </div>
                          )}
                      </div>
                      
                      <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
                          <button 
                              onClick={() => setIsDisqualifiedModalOpen(false)} 
                              className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50"
                          >
                              Đóng
                          </button>
                      </div>
                  </div>
              </div>
          )}
      </div>
    </div>
  );
};