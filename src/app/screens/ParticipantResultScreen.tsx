import React, { useEffect, useState } from 'react';
import { Trophy, Award, CheckCircle2, AlertTriangle, RefreshCw, Info, XCircle } from 'lucide-react';
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

function ordinalLabel(rank: number): string {
  if (rank % 100 >= 11 && rank % 100 <= 13) return `${rank}th Place`;
  switch (rank % 10) {
    case 1: return `${rank}st Place`;
    case 2: return `${rank}nd Place`;
    case 3: return `${rank}rd Place`;
    default: return `${rank}th Place`;
  }
}

const formatAwardType = (type: string | null | undefined) => {
  if (!type) return null;
  const map: Record<string, string> = {
    'FIRST_PLACE': '1st Prize',
    'SECOND_PLACE': '2nd Prize',
    'THIRD_PLACE': '3rd Prize',
    'BEST_TECHNICAL': 'Technical Award',
    'BEST_PRESENTATION': 'Presentation Award',
    'SPECIAL': 'Consolation Prize'
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
  // --- STATES ---
  const [events, setEvents] = useState<EventSummary[]>([]);
  const [overviewTeams, setOverviewTeams] = useState<SubmissionMyOverviewTeam[]>([]);
  
  const [selectedEventId, setSelectedEventId] = useState<number | ''>('');
  const [selectedRoundId, setSelectedRoundId] = useState<number | ''>('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [selectedTeam, setSelectedTeam] = useState<SubmissionMyOverviewTeam | null>(null);
  const [selectedRound, setSelectedRound] = useState<SubmissionMyOverviewRound | null>(null);
  const [selectedRanking, setSelectedRanking] = useState<(RankingResponse & { awardType?: string | null }) | null>(null);
  const [breakdown, setBreakdown] = useState<ResultBreakdownRow[]>([]);

  // 1. Fetch Events & Overview Data on Mount
  useEffect(() => {
    Promise.all([
      getEvents().catch(() => []),
      getMySubmissionOverview().catch(() => ({ teams: [] }))
    ]).then(([eventList, overviewData]) => {
      const evs = safeArray<EventSummary>(eventList);
      const teams = safeArray<SubmissionMyOverviewTeam>((overviewData as any)?.teams);
      
      setEvents(evs);
      setOverviewTeams(teams);
      
      if (evs.length > 0) {
        setSelectedEventId(evs[0].id);
      }
    });
  }, []);

  // 2. Derive available rounds when Event changes
  const availableRounds = React.useMemo(() => {
    if (!selectedEventId) return [];
    const team = overviewTeams.find(t => (t as any).eventId === selectedEventId || t.eventName === events.find(e => e.id === selectedEventId)?.name);
    if (!team) return [];
    
    // Sort rounds by order
    return safeArray<SubmissionMyOverviewRound>(team.rounds).sort(
      (a, b) => (a.orderNumber || 0) - (b.orderNumber || 0)
    );
  }, [selectedEventId, overviewTeams, events]);

  // Auto-select latest round when available rounds change
  useEffect(() => {
    if (availableRounds.length > 0) {
      // Prioritize the last completed round, or just the last round
      const completedRounds = availableRounds.filter(r => r.status === 'COMPLETED');
      if (completedRounds.length > 0) {
        setSelectedRoundId(completedRounds[completedRounds.length - 1].roundId);
      } else {
        setSelectedRoundId(availableRounds[availableRounds.length - 1].roundId);
      }
    } else {
      setSelectedRoundId('');
    }
  }, [availableRounds]);

  // 3. Fetch specific round results
  useEffect(() => {
    if (!selectedEventId || !selectedRoundId) return;
    
    let isMounted = true;
    setLoading(true);
    setError(null);
    setSelectedRanking(null);
    setBreakdown([]);

    (async () => {
      try {
        const team = overviewTeams.find(t => (t as any).eventId === selectedEventId || t.eventName === events.find(e => e.id === selectedEventId)?.name);
        const round = availableRounds.find(r => r.roundId === selectedRoundId);
        
        if (!team || !round) throw new Error("Could not find team or round data.");
        
        setSelectedTeam(team);
        setSelectedRound(round);

        // Fetch Ranking for this specific round
        const rankingsList = await ranking.getRankings(selectedRoundId).catch(() => []);
        const myRank = safeArray<RankingResponse>(rankingsList).find(r => r.teamId === team.teamId);

        if (!myRank) {
          throw new Error('Results for this round have not been published yet or you did not participate.');
        }

        // Fetch Score Breakdown
        const breakdownRows = await ranking.getScoreBreakdown(team.teamId, selectedRoundId).catch(() => []);

        // Optional: Fetch Award if this is a Final Round
        let awardType = null;
        const isFinalRound = round.isFinalRound === true;
        if (isFinalRound) {
          try {
            const awardData = await award.getMyResult(Number(selectedEventId));
            awardType = awardData?.awardType || null;
          } catch (e) {
            // Ignore award fetch error if not assigned yet
          }
        }

        if (isMounted) {
          setSelectedRanking({
            ...myRank,
            awardType
          });
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
  }, [selectedEventId, selectedRoundId, overviewTeams, availableRounds, events]);

  // UI RENDERING
  const Selectors = (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 mb-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">Event</label>
          <select 
            className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50"
            value={selectedEventId}
            onChange={(e) => setSelectedEventId(Number(e.target.value))}
          >
            <option value="" disabled>-- Select Event --</option>
            {events.map((ev) => (
              <option key={ev.id} value={ev.id}>{ev.name}</option>
            ))}
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">Round</label>
          <select 
            className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50 disabled:opacity-50"
            value={selectedRoundId}
            onChange={(e) => setSelectedRoundId(Number(e.target.value))}
            disabled={availableRounds.length === 0}
          >
            {availableRounds.length === 0 ? (
              <option value="">No rounds available</option>
            ) : (
              availableRounds.map((r) => (
                <option key={r.roundId} value={r.roundId}>
                  {r.roundName}
                </option>
              ))
            )}
          </select>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="p-7 space-y-5">
        <PageHeader title="My Results" subtitle="Loading ranking data..." />
        {Selectors}
        <div className="flex flex-col items-center justify-center py-20 text-slate-400">
          <RefreshCw className="w-8 h-8 animate-spin mb-3 text-blue-600" />
          <p className="text-sm font-medium">Loading round results...</p>
        </div>
      </div>
    );
  }

  if (error || !selectedTeam || !selectedRound || !selectedRanking) {
    return (
      <div className="p-7 space-y-5">
        <PageHeader title="My Results" subtitle="View scores, rankings, and awards" />
        {Selectors}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-8 flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 bg-white shadow-sm border border-slate-100 rounded-full flex items-center justify-center mb-4">
            <Info className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="text-lg font-bold text-slate-700 mb-2">Results Not Available</h3>
          <p className="text-sm text-slate-500 max-w-md">{error || 'Please select an event and a published round.'}</p>
        </div>
      </div>
    );
  }

  // Chốt chặn 3 lớp: Check cờ 'isFinalRound', check cờ 'finalRound' (do Spring Boot tự đổi tên), và fallback bằng tên vòng.
  const roundNameLowerUI = (selectedRound.roundName || '').toLowerCase();
  const isFinalRound = 
    selectedRound.isFinalRound === true || 
    (selectedRound as any).finalRound === true || 
    (roundNameLowerUI.includes('final') && !roundNameLowerUI.includes('semi'));

  return (
    <div className="p-7 space-y-5 animate-in fade-in duration-300">
      <PageHeader title="My Results" subtitle={`${selectedRound.roundName} — ${selectedTeam.eventName || 'Hackathon'}`} />

      {Selectors}

      {/* DYNAMIC HERO CARD */}
      <div className={`rounded-2xl p-7 text-white shadow-lg relative overflow-hidden ${isFinalRound ? 'bg-gradient-to-br from-blue-900 to-blue-700' : 'bg-gradient-to-br from-slate-800 to-slate-700'}`}>
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-white opacity-5 blur-3xl"></div>
        
        <div className="flex flex-col md:flex-row items-start justify-between gap-6 relative z-10">
          <div>
            <p className="text-white/70 text-sm mb-1 uppercase tracking-wider font-semibold">
              {selectedTeam.categoryName}
            </p>
            <h2 className="text-3xl font-bold mb-6">{selectedTeam.teamName}</h2>
            
            <div className="flex items-center gap-4 mb-2">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center shadow-inner
                ${selectedRanking.rankPosition === 1 ? 'bg-yellow-400' : selectedRanking.rankPosition === 2 ? 'bg-slate-300' : selectedRanking.rankPosition === 3 ? 'bg-amber-600' : 'bg-white/20'}`}>
                <span className={`font-bold text-2xl ${selectedRanking.rankPosition === 1 ? 'text-yellow-900' : selectedRanking.rankPosition === 2 ? 'text-slate-800' : 'text-white'}`}>
                  {selectedRanking.rankPosition}
                </span>
              </div>
              <div>
                <p className="text-4xl font-bold" style={{ fontFamily: 'var(--font-display)' }}>
                  {ordinalLabel(selectedRanking.rankPosition)}
                </p>
                <p className="text-white/70 text-sm mt-1">{selectedRound.roundName} Ranking</p>
              </div>
            </div>
          </div>

          <div className="text-left md:text-right w-full md:w-auto p-5 bg-black/20 rounded-xl border border-white/10 backdrop-blur-sm">
            <p className="text-white/70 text-sm mb-1 uppercase tracking-wider font-semibold">Round Score</p>
            <div className="flex items-baseline justify-start md:justify-end gap-1">
              <p className="text-5xl font-bold font-mono text-yellow-400">
                {selectedRanking.totalScore?.toFixed(2)}
              </p>
              <p className="text-white/50 text-lg font-medium">/ 10.00</p>
            </div>
          </div>
        </div>
        
        <div className="flex flex-wrap items-center gap-3 mt-8 pt-6 border-t border-white/20 relative z-10">
          
          {/* Trạng thái đi tiếp (Chỉ hiển thị nếu KHÔNG PHẢI là vòng Chung kết) */}
          {!isFinalRound && (
            selectedRanking.isPromoted ? (
              <span className="flex items-center gap-1.5 bg-emerald-500 text-white text-xs font-semibold px-4 py-2 rounded-full shadow-sm">
                <CheckCircle2 className="w-4 h-4" /> Promoted to next round
              </span>
            ) : (
              <span className="flex items-center gap-1.5 bg-red-500 text-white text-xs font-semibold px-4 py-2 rounded-full shadow-sm">
                <XCircle className="w-4 h-4" /> Eliminated
              </span>
            )
          )}
          
          <span className="flex items-center gap-1.5 bg-white/15 text-white text-xs font-semibold px-4 py-2 rounded-full backdrop-blur-md">
            <Info className="w-4 h-4" /> Results Published
          </span>

          {/* Cúp Giải thưởng (Chỉ hiển thị ở Vòng Chung kết) */}
          {isFinalRound && selectedRanking.awardType && (
            <span className="flex items-center gap-1.5 bg-yellow-400 text-yellow-900 text-sm font-bold px-5 py-2 rounded-full shadow-[0_0_15px_rgba(250,204,21,0.4)] animate-in zoom-in duration-500 delay-300">
              <Trophy className="w-5 h-5" /> {formatAwardType(selectedRanking.awardType)}
            </span>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
        <h3 className="font-semibold text-slate-900 mb-4" style={{ fontFamily: 'var(--font-display)' }}>Score Breakdown</h3>
        {breakdown.length === 0 ? (
          <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
            Score breakdown data is not available for this round.
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-left px-3 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Criterion</th>
                <th className="text-center px-3 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Weight</th>
                <th className="text-center px-3 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Average Score / 10</th>
                <th className="text-center px-3 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Weighted Contribution</th>
                <th className="text-left px-3 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Bar</th>
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
                <td colSpan={3} className="px-3 py-2.5 text-sm font-bold text-slate-900 text-right">Total Weighted Score</td>
                <td className="px-3 py-2.5 text-sm font-bold text-blue-800 font-mono text-center">{selectedRanking.totalScore?.toFixed(2)}</td>
                <td />
              </tr>
            </tfoot>
          </table>
        )}
      </div>
      
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
        <p className="text-xs text-slate-500 flex items-center gap-1.5">
          <Info className="w-3.5 h-3.5 flex-shrink-0" /> Ranking data is finalized by the SEAL Platform.
        </p>
      </div>
    </div>
  );
}