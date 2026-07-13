import React, { useEffect, useState } from 'react';
import { Trophy, Award, CheckCircle2, AlertTriangle, RefreshCw, Info } from 'lucide-react';
import { toast } from 'sonner';

import { getEvents, type EventSummary } from '../../api/events';
import { award } from '../../api/award'; 
import type { ParticipantResultResponse } from '../types';
import { getMySubmissionOverview, type SubmissionMyOverviewTeam, type SubmissionMyOverviewRound } from '../../api/submissions';
import { ranking, type ScoreBreakdownResponse } from '../../api/ranking';
import type { RankingResponse } from '../types';

function safeArray<T>(value: any): T[] {
  return Array.isArray(value) ? value : [];
}

type ResultBreakdownRow = {
  name: string;
  weight: number;
  score: number;
  weighted: number;
};

// Đã chuyển sang tiếng Việt (VD: Hạng 1, Hạng 2...)
function ordinalLabel(rank: number): string {
  return `Hạng ${rank}`;
}

// 1. ĐỔI TÊN GIẢI THƯỞNG SANG TIẾNG VIỆT ĐỂ ĐỒNG BỘ GIAO DIỆN
const formatAwardType = (type: string | null | undefined) => {
  if (!type) return null;
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

function aggregateBreakdown(rows: ScoreBreakdownResponse[]): ResultBreakdownRow[] {
  const grouped = new Map<string, { name: string; weight: number; total: number; count: number }>();

  rows.forEach(row => {
    const key = `${row.criterionName}::${row.criterionWeight}`;
    const current = grouped.get(key) ?? {
      name: row.criterionName,
      weight: Number(row.criterionWeight ?? 0),
      total: 0,
      count: 0,
    };
    current.total += Number(row.scoreValue ?? 0);
    current.count += 1;
    grouped.set(key, current);
  });

  return Array.from(grouped.values())
    .map(item => {
      const averageScore = item.count > 0 ? item.total / item.count : 0;
      return {
        name: item.name,
        weight: item.weight,
        score: averageScore,
        weighted: (averageScore * item.weight) / 100,
      };
    })
    .sort((left, right) => right.weight - left.weight);
}

function PageHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="flex items-start justify-between mb-7">
      <div>
        <h1 className="text-xl font-bold text-slate-900" style={{ fontFamily: 'var(--font-display)' }}>{title}</h1>
        {subtitle && <p className="text-sm text-slate-500 mt-0.5">{subtitle}</p>}
      </div>
    </div>
  );
}

export function ParticipantResultScreen() {
  const [events, setEvents] = useState<EventSummary[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<number | ''>('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [selectedTeam, setSelectedTeam] = useState<SubmissionMyOverviewTeam | null>(null);
  const [selectedRound, setSelectedRound] = useState<SubmissionMyOverviewRound | null>(null);
  const [selectedRanking, setSelectedRanking] = useState<(RankingResponse & { awardType?: string | null }) | null>(null);
  const [breakdown, setBreakdown] = useState<ResultBreakdownRow[]>([]);

  useEffect(() => {
    getEvents()
      .then(list => {
        const evs = safeArray<EventSummary>(list);
        setEvents(evs);
        if (evs.length > 0) {
          const completed = evs.find(e => e.status === 'COMPLETED');
          setSelectedEventId(completed ? completed.id : evs[0].id);
        }
      })
      .catch(() => {
        toast.error('Không thể tải danh sách sự kiện');
      });
  }, []);

  useEffect(() => {
    if (!selectedEventId) return;
    let isMounted = true;
    setLoading(true);
    setError(null);

    (async () => {
      try {
        let awardData: ParticipantResultResponse | null = null;
        try {
          awardData = await award.getMyResult(Number(selectedEventId));
        } catch (err: any) {
          throw new Error(err.response?.data?.message || err.message || 'Kết quả của sự kiện này chưa được công bố.');
        }

        if (!awardData) throw new Error('Không tìm thấy dữ liệu kết quả của bạn.');

        const overview = await getMySubmissionOverview().catch(() => ({ teams: [] }));
        
        const teamsList = safeArray<SubmissionMyOverviewTeam>(overview?.teams);
        const myTeam = teamsList.find(t => t.teamId === awardData?.teamId);
        
        let matchedRound: SubmissionMyOverviewRound | null = null;
        let breakdownRows: ScoreBreakdownResponse[] = [];

        if (myTeam) {
          const roundsList = safeArray<SubmissionMyOverviewRound>(myTeam.rounds);
          const orderedRounds = [...roundsList].sort((left: SubmissionMyOverviewRound, right: SubmissionMyOverviewRound) => 
            (right.orderNumber || 0) - (left.orderNumber || 0)
          );
          matchedRound = orderedRounds[0]; 
          
          if (matchedRound) {
            breakdownRows = await ranking.getScoreBreakdown(myTeam.teamId, matchedRound.roundId).catch(() => []);
          }
        }

        if (isMounted) {
          setSelectedTeam(myTeam || ({ teamName: awardData.teamName, categoryName: awardData.categoryName, eventName: '' } as unknown as SubmissionMyOverviewTeam));
          setSelectedRound(matchedRound || ({ roundName: 'Vòng Chung Kết', status: 'COMPLETED' } as unknown as SubmissionMyOverviewRound));
          
          setSelectedRanking({
            rankPosition: awardData.rankPosition,
            totalScore: awardData.totalScore,
            isPromoted: matchedRound ? matchedRound.status === 'COMPLETED' : false, 
            awardType: awardData.awardType,
            teamId: awardData.teamId
          } as RankingResponse & { awardType?: string });
          
          setBreakdown(aggregateBreakdown(breakdownRows));
        }
      } catch (err: any) {
        if (isMounted) {
          setError(err.message);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    })();

    return () => { isMounted = false; };
  }, [selectedEventId]);

  const EventSelector = (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 mb-6">
      <label className="block text-sm font-semibold text-slate-700 mb-2">Chọn sự kiện để xem kết quả</label>
      <select 
        className="w-full md:w-1/2 border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50"
        value={selectedEventId}
        onChange={(e) => setSelectedEventId(Number(e.target.value))}
      >
        <option value="" disabled>-- Chọn một sự kiện --</option>
        {events.map((ev) => (
          <option key={ev.id} value={ev.id}>
            {ev.name} {ev.status === 'COMPLETED' ? '🏆' : ''}
          </option>
        ))}
      </select>
    </div>
  );

  if (loading) {
    return (
      <div className="p-7 space-y-5">
        <PageHeader title="Kết Quả Của Tôi" subtitle="Đang tải dữ liệu xếp hạng..." />
        {EventSelector}
        <div className="flex flex-col items-center justify-center py-20 text-slate-400">
          <RefreshCw className="w-8 h-8 animate-spin mb-3 text-blue-600" />
          <p className="text-sm font-medium">Đang tải kết quả...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-7 space-y-5">
        <PageHeader title="Kết Quả Của Tôi" subtitle="Xem điểm số, xếp hạng và giải thưởng" />
        {EventSelector}
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-8 flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mb-4">
            <AlertTriangle className="w-8 h-8 text-amber-600" />
          </div>
          <h3 className="text-lg font-bold text-amber-900 mb-2">Chưa Có Kết Quả!</h3>
          <p className="text-sm text-amber-700 max-w-md">{error}</p>
        </div>
      </div>
    );
  }

  if (!selectedTeam || !selectedRound || !selectedRanking) return null;

  const isFinalRound = selectedRound.roundName.toLowerCase().includes('chung kết') || selectedRound.roundName.toLowerCase().includes('final');

  return (
    <div className="p-7 space-y-5 animate-in fade-in duration-300">
      <PageHeader title="Kết Quả Của Tôi" subtitle={`${selectedRound.roundName} — ${selectedTeam.eventName || 'Sự kiện'}`} />

      {EventSelector}

      <div className="bg-gradient-to-br from-blue-900 to-blue-700 rounded-2xl p-7 text-white shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-white opacity-5 blur-3xl"></div>
        
        <div className="flex flex-col md:flex-row items-start justify-between gap-6 relative z-10">
          <div>
            <p className="text-blue-200 text-sm mb-1 uppercase tracking-wider font-semibold">
              {selectedTeam.categoryName}
            </p>
            <h2 className="text-3xl font-bold mb-6">{selectedTeam.teamName}</h2>
            
            <div className="flex items-center gap-4 mb-2">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center shadow-inner
                ${selectedRanking.rankPosition === 1 ? 'bg-yellow-400' : selectedRanking.rankPosition === 2 ? 'bg-slate-300' : selectedRanking.rankPosition === 3 ? 'bg-amber-600' : 'bg-blue-800'}`}>
                <span className={`font-bold text-2xl ${selectedRanking.rankPosition === 1 ? 'text-yellow-900' : selectedRanking.rankPosition === 2 ? 'text-slate-800' : 'text-white'}`}>
                  {selectedRanking.rankPosition}
                </span>
              </div>
              <div>
                <p className="text-4xl font-bold" style={{ fontFamily: 'var(--font-display)' }}>
                  {ordinalLabel(selectedRanking.rankPosition)}
                </p>
                <p className="text-blue-200 text-sm mt-1">Xếp Hạng Chung Cuộc</p>
              </div>
            </div>
          </div>

          <div className="text-left md:text-right w-full md:w-auto p-5 bg-black/20 rounded-xl border border-white/10 backdrop-blur-sm">
            <p className="text-blue-200 text-sm mb-1 uppercase tracking-wider font-semibold">Tổng Điểm</p>
            <div className="flex items-baseline justify-start md:justify-end gap-1">
              {/* 2. ĐỔI MÀU SẮC ĐIỂM SỐ TỪ XANH SANG VÀNG SÁNG */}
              <p className="text-5xl font-bold font-mono text-yellow-400">
                {selectedRanking.totalScore?.toFixed(2)}
              </p>
              <p className="text-blue-300 text-lg font-medium">/ 10.00</p>
            </div>
          </div>
        </div>
        
        <div className="flex flex-wrap items-center gap-3 mt-8 pt-6 border-t border-white/20 relative z-10">
          {selectedRanking.isPromoted && !isFinalRound && (
            <span className="flex items-center gap-1.5 bg-emerald-500 text-white text-xs font-semibold px-4 py-2 rounded-full">
              <CheckCircle2 className="w-4 h-4" /> Lọt vào vòng trong
            </span>
          )}
          
          <span className="flex items-center gap-1.5 bg-white/15 text-white text-xs font-semibold px-4 py-2 rounded-full backdrop-blur-md">
            <Award className="w-4 h-4" /> Kết Quả Đã Được Công Bố
          </span>

          {selectedRanking.awardType && (
            <span className="flex items-center gap-1.5 bg-yellow-400 text-yellow-900 text-sm font-bold px-5 py-2 rounded-full shadow-[0_0_15px_rgba(250,204,21,0.4)] animate-in zoom-in duration-500 delay-300">
              <Trophy className="w-5 h-5" /> {formatAwardType(selectedRanking.awardType)}
            </span>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
        <h3 className="font-semibold text-slate-900 mb-4" style={{ fontFamily: 'var(--font-display)' }}>Chi Tiết Điểm Theo Tiêu Chí</h3>
        {breakdown.length === 0 ? (
          <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
            Dữ liệu chi tiết điểm chưa có sẵn cho sự kiện này.
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200">
                {/* 3. CĂN GIỮA (CENTER ALIGNMENT) CHO CÁC CỘT SỐ LIỆU THAY VÌ CĂN TRÁI */}
                <th className="text-left px-3 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Tiêu Chí</th>
                <th className="text-center px-3 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Trọng Số</th>
                <th className="text-center px-3 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Điểm Trung Bình / 10</th>
                <th className="text-center px-3 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Điểm Quy Đổi</th>
                <th className="text-left px-3 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Biểu Đồ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {breakdown.map(c => (
                <tr key={c.name} className="hover:bg-slate-50 transition-colors">
                  <td className="px-3 py-3 text-sm font-medium text-slate-900 text-left">{c.name}</td>
                  <td className="px-3 py-3 text-sm font-mono text-slate-600 text-center">{c.weight}%</td>
                  <td className="px-3 py-3 text-sm font-mono font-bold text-blue-800 text-center">{c.score.toFixed(2)}</td>
                  <td className="px-3 py-3 text-sm font-mono text-emerald-700 text-center">{c.weighted.toFixed(2)}</td>
                  <td className="px-3 py-3 w-1/4">
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-2 bg-blue-700 rounded-full transition-all duration-1000" style={{ width: `${Math.max(0, Math.min(100, (c.score / 10) * 100))}%` }} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-slate-200 bg-slate-50">
                <td colSpan={3} className="px-3 py-2.5 text-sm font-bold text-slate-900 text-right">Tổng Điểm Xếp Hạng</td>
                <td className="px-3 py-2.5 text-sm font-bold text-blue-800 font-mono text-center">{selectedRanking.totalScore?.toFixed(2)}</td>
                <td />
              </tr>
            </tfoot>
          </table>
        )}
      </div>
      
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
        <p className="text-xs text-slate-500 flex items-center gap-1.5">
          <Info className="w-3.5 h-3.5 flex-shrink-0" /> Dữ liệu xếp hạng và giải thưởng được chốt bởi Hệ thống SEAL. Điểm chi tiết được tổng hợp dựa trên đánh giá của ban giám khảo.
        </p>
      </div>
    </div>
  );
}