import React, { useState, useEffect } from 'react';
import { CheckSquare, XCircle, BookOpen, Target, BarChart3, Eye, ChevronDown, ChevronRight, AlertTriangle, TrendingUp, Calendar, Users, DollarSign, Filter, Download, RefreshCw, ArrowLeft, List } from 'lucide-react';
import { toast } from 'sonner';
import { KPICard } from '../components/shared/KPICard';
import { StatusBadge } from '../components/shared/Badge';
import { Modal } from '../components/shared/Modal';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area } from 'recharts';
import {
  getEvents,
  getEvent,
  getEventRounds,
  getEventCategories,
  getEventCriteriaSets,
  getBudget,
  approveEvent,
  rejectEvent,
  type EventSummary,
  type EventRound,
  type EventCategory,
  type CriteriaSet,
  type BudgetResponse,
} from '../../api/events';

const disciplines = [
  { id: 1, name: 'Software Engineering', code: 'SE', status: 'ACTIVE', activeEvents: 1, totalTeams: 24, completedEvents: 8 },
  { id: 2, name: 'Artificial Intelligence', code: 'AI', status: 'ACTIVE', activeEvents: 0, totalTeams: 0, completedEvents: 3 },
  { id: 3, name: 'IoT & Embedded Systems', code: 'IoT', status: 'ACTIVE', activeEvents: 0, totalTeams: 0, completedEvents: 2 },
  { id: 4, name: 'Cybersecurity', code: 'CS', status: 'INACTIVE', activeEvents: 0, totalTeams: 0, completedEvents: 1 },
];

const termQuotas = [
  { id: 1, term: 'Summer', year: 2026, discipline: 'Software Engineering', maxEvents: 2, usedEvents: 1, status: 'ok' },
  { id: 2, term: 'Summer', year: 2026, discipline: 'Artificial Intelligence', maxEvents: 1, usedEvents: 0, status: 'ok' },
  { id: 3, term: 'Summer', year: 2026, discipline: 'IoT & Embedded Systems', maxEvents: 1, usedEvents: 1, status: 'warn' },
  { id: 4, term: 'Fall', year: 2026, discipline: 'Software Engineering', maxEvents: 2, usedEvents: 0, status: 'ok' },
  { id: 5, term: 'Fall', year: 2026, discipline: 'Artificial Intelligence', maxEvents: 2, usedEvents: 1, status: 'ok' },
];

const registrationData = [
  { month: 'Jan', registered: 12, completed: 10 },
  { month: 'Feb', registered: 18, completed: 14 },
  { month: 'Mar', registered: 22, completed: 19 },
  { month: 'Apr', registered: 16, completed: 13 },
  { month: 'May', registered: 28, completed: 24 },
  { month: 'Jun', registered: 24, completed: 0 },
];

const scoreDistData = [
  { range: '0-20', count: 2 },
  { range: '21-40', count: 8 },
  { range: '41-60', count: 15 },
  { range: '61-70', count: 22 },
  { range: '71-80', count: 18 },
  { range: '81-90', count: 9 },
  { range: '91-100', count: 4 },
];

const eventTrendData = [
  { term: 'Fall 23', events: 2, teams: 18, avgScore: 68 },
  { term: 'Spring 24', events: 3, teams: 27, avgScore: 71 },
  { term: 'Summer 24', events: 2, teams: 20, avgScore: 69 },
  { term: 'Fall 24', events: 4, teams: 36, avgScore: 73 },
  { term: 'Spring 25', events: 3, teams: 31, avgScore: 74 },
  { term: 'Summer 25', events: 3, teams: 33, avgScore: 75 },
  { term: 'Fall 25', events: 4, teams: 40, avgScore: 76 },
  { term: 'Summer 26', events: 1, teams: 24, avgScore: 0 },
];

function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between mb-7">
      <div><h1 className="text-xl font-bold text-slate-900" style={{ fontFamily: 'var(--font-display)' }}>{title}</h1>
        {subtitle && <p className="text-sm text-slate-500 mt-0.5">{subtitle}</p>}</div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}

export function SCDashboard() {
  return (
    <div className="p-7 space-y-7">
      <PageHeader title="Program Dashboard" subtitle="FPT University HCMC — Software Engineering Department" />
      <div className="grid grid-cols-5 gap-5">
        <KPICard title="Pending Approvals" value="3" subtitle="Requires review" icon={CheckSquare} accent="amber" />
        <KPICard title="Approved This Term" value="1" subtitle="Summer 2026" icon={Calendar} accent="green" />
        <KPICard title="Quota Usage" value="3/6" subtitle="Across all disciplines" icon={Target} accent="blue" />
        <KPICard title="Total Budget Approved" value="45M VND" subtitle="Current term" icon={DollarSign} accent="cyan" />
        <KPICard title="Completed Events" value="18" subtitle="All terms" icon={TrendingUp} accent="purple" />
      </div>

      <div className="grid grid-cols-3 gap-5">
        <div className="col-span-2 bg-white rounded-xl shadow-sm border border-slate-200 p-5">
          <h3 className="font-semibold text-slate-900 mb-4" style={{ fontFamily: 'var(--font-display)' }}>Pending Event Approvals</h3>
          <div className="flex flex-col items-center justify-center py-8 text-slate-400 gap-2">
            <CheckSquare className="w-8 h-8 opacity-30" />
            <p className="text-sm">Truy cập <strong className="text-slate-600">Event Approvals</strong> để xem danh sách chờ duyệt.</p>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
          <h3 className="font-semibold text-slate-900 mb-4" style={{ fontFamily: 'var(--font-display)' }}>Discipline Status</h3>
          <div className="space-y-3">
            {disciplines.filter(d => d.status === 'ACTIVE').map(d => (
              <div key={d.id} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-bold">{d.code}</span>
                  <span className="text-sm text-slate-900">{d.name}</span>
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-500">{d.activeEvents} active · {d.completedEvents} completed</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function EventApprovals({ onNavigate }: { onNavigate: (s: string) => void }) {
  // Queue state
  const [queue, setQueue] = useState<EventSummary[]>([]);
  const [loadingQueue, setLoadingQueue] = useState(true);

  // Detail panel state
  const [selectedEvent, setSelectedEvent] = useState<EventSummary | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailRounds, setDetailRounds] = useState<EventRound[]>([]);
  const [detailCategories, setDetailCategories] = useState<EventCategory[]>([]);
  const [detailCriteriaSets, setDetailCriteriaSets] = useState<CriteriaSet[]>([]);
  const [detailBudget, setDetailBudget] = useState<BudgetResponse | null>(null);
  const [detailEvent, setDetailEvent] = useState<EventSummary | null>(null);
  const [activeTab, setActiveTab] = useState('overview');

  // Action state
  const [showApprove, setShowApprove] = useState(false);
  const [showReject, setShowReject] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [actioning, setActioning] = useState(false);

  const loadQueue = async () => {
    setLoadingQueue(true);
    try {
      const list = await getEvents('PENDING_APPROVAL');
      setQueue(list);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Tải danh sách thất bại');
    } finally {
      setLoadingQueue(false);
    }
  };

  useEffect(() => { loadQueue(); }, []);

  const openDetail = async (ev: EventSummary) => {
    setSelectedEvent(ev);
    setActiveTab('overview');
    setDetailLoading(true);
    setDetailRounds([]);
    setDetailCategories([]);
    setDetailCriteriaSets([]);
    setDetailBudget(null);
    setDetailEvent(null);
    try {
      const [full, rounds, cats, csSets, budget] = await Promise.allSettled([
        getEvent(ev.id),
        getEventRounds(ev.id),
        getEventCategories(ev.id),
        getEventCriteriaSets(ev.id),
        getBudget(ev.id),
      ]);
      if (full.status === 'fulfilled') setDetailEvent(full.value);
      if (rounds.status === 'fulfilled') setDetailRounds(rounds.value);
      if (cats.status === 'fulfilled') setDetailCategories(cats.value);
      if (csSets.status === 'fulfilled') setDetailCriteriaSets(csSets.value);
      if (budget.status === 'fulfilled') setDetailBudget(budget.value);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!selectedEvent) return;
    setActioning(true);
    try {
      await approveEvent(selectedEvent.id);
      toast.success(`Đã duyệt: ${selectedEvent.name}`);
      setShowApprove(false);
      setSelectedEvent(null);
      await loadQueue();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Duyệt thất bại');
    } finally {
      setActioning(false);
    }
  };

  const handleReject = async () => {
    if (!selectedEvent || !rejectReason.trim()) return;
    setActioning(true);
    try {
      await rejectEvent(selectedEvent.id, rejectReason.trim());
      toast.success(`Đã từ chối: ${selectedEvent.name}`);
      setShowReject(false);
      setRejectReason('');
      setSelectedEvent(null);
      await loadQueue();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Từ chối thất bại');
    } finally {
      setActioning(false);
    }
  };

  const ev = detailEvent ?? selectedEvent;

  return (
    <div className="p-7 space-y-5">
      <PageHeader
        title="Event Approval Queue"
        subtitle={loadingQueue ? 'Đang tải…' : `${queue.length} event${queue.length !== 1 ? 's' : ''} chờ duyệt`}
        actions={
          <button onClick={loadQueue} disabled={loadingQueue}
            className="flex items-center gap-1.5 border border-slate-200 text-slate-600 text-sm px-3 py-2 rounded-lg hover:bg-slate-50 disabled:opacity-50">
            <RefreshCw className={`w-4 h-4 ${loadingQueue ? 'animate-spin' : ''}`} /> Tải lại
          </button>
        }
      />

      {!selectedEvent ? (
        /* ── Queue list ─────────────────────────────────────────── */
        <div className="bg-white rounded-xl shadow-sm border border-slate-200">
          {loadingQueue ? (
            <div className="flex items-center justify-center py-16 gap-3 text-slate-400">
              <RefreshCw className="w-5 h-5 animate-spin" />
              <span className="text-sm">Đang tải danh sách…</span>
            </div>
          ) : queue.length === 0 ? (
            <div className="text-center py-16 text-slate-400">
              <CheckSquare className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm font-medium">Không có event nào chờ duyệt</p>
              <p className="text-xs mt-1">Mọi event đã được xử lý.</p>
            </div>
          ) : (
            <table className="w-full">
              <thead><tr className="border-b border-slate-100">
                {['Event', 'Ngành', 'Đăng ký', 'Status', 'Thao tác'].map(c => (
                  <th key={c} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">{c}</th>
                ))}
              </tr></thead>
              <tbody className="divide-y divide-slate-100">
                {queue.map(ev => (
                  <tr key={ev.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3">
                      <p className="text-sm font-semibold text-slate-900">{ev.name}</p>
                      <p className="text-xs text-slate-400 font-mono mt-0.5">{ev.eventType} · #{ev.id}</p>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">{ev.disciplineName ?? '—'}</td>
                    <td className="px-4 py-3 text-xs font-mono text-slate-500">
                      {ev.registrationStart ? ev.registrationStart.slice(0, 10) : '—'} → {ev.registrationEnd ? ev.registrationEnd.slice(0, 10) : '—'}
                    </td>
                    <td className="px-4 py-3"><StatusBadge status={ev.status} /></td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <button onClick={() => openDetail(ev)}
                          className="text-xs bg-blue-50 text-blue-700 hover:bg-blue-100 px-3 py-1.5 rounded-lg font-medium transition-colors flex items-center gap-1">
                          <Eye className="w-3 h-3" /> Xem chi tiết
                        </button>
                        <button onClick={() => { setSelectedEvent(ev); setShowApprove(true); }}
                          className="text-xs bg-emerald-50 text-emerald-700 hover:bg-emerald-100 px-3 py-1.5 rounded-lg font-medium transition-colors">
                          Duyệt
                        </button>
                        <button onClick={() => { setSelectedEvent(ev); setShowReject(true); }}
                          className="text-xs bg-red-50 text-red-700 hover:bg-red-100 px-3 py-1.5 rounded-lg font-medium transition-colors">
                          Từ chối
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      ) : (
        /* ── Detail view ────────────────────────────────────────── */
        <div className="space-y-5">
          <button onClick={() => setSelectedEvent(null)}
            className="text-sm text-slate-500 hover:text-slate-700 flex items-center gap-1.5 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Quay lại danh sách
          </button>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200">
            <div className="px-6 py-5 border-b border-slate-100">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-lg font-bold text-slate-900" style={{ fontFamily: 'var(--font-display)' }}>
                    {ev?.name ?? selectedEvent.name}
                  </h2>
                  <p className="text-sm text-slate-500 mt-1">
                    {ev?.disciplineName && <span>{ev.disciplineName} · </span>}
                    <span className="font-mono text-xs">{ev?.eventType}</span>
                    {ev?.registrationStart && <span> · Đăng ký: {ev.registrationStart.slice(0, 10)}</span>}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => setShowReject(true)}
                    className="px-4 py-2 border border-red-200 text-red-600 text-sm font-medium rounded-lg hover:bg-red-50 transition-colors flex items-center gap-1.5">
                    <XCircle className="w-4 h-4" /> Từ chối
                  </button>
                  <button onClick={() => setShowApprove(true)}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-lg transition-colors flex items-center gap-1.5">
                    <CheckSquare className="w-4 h-4" /> Duyệt Event
                  </button>
                </div>
              </div>
              <div className="flex gap-1 mt-4">
                {['overview', 'rounds', 'categories', 'criteria', 'budget'].map(tab => (
                  <button key={tab} onClick={() => setActiveTab(tab)}
                    className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors capitalize ${activeTab === tab ? 'bg-blue-800 text-white' : 'text-slate-600 hover:bg-slate-100'}`}>
                    {tab === 'overview' ? 'Tổng quan' : tab === 'rounds' ? `Rounds (${detailRounds.length})` : tab === 'categories' ? `Categories (${detailCategories.length})` : tab === 'criteria' ? `Criteria (${detailCriteriaSets.length})` : `Budget`}
                  </button>
                ))}
              </div>
            </div>

            <div className="p-6">
              {detailLoading ? (
                <div className="flex items-center justify-center py-12 gap-3 text-slate-400">
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  <span className="text-sm">Đang tải chi tiết…</span>
                </div>
              ) : (
                <>
                  {activeTab === 'overview' && ev && (
                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-0 divide-y divide-slate-100">
                        {([
                          ['Tên event', ev.name],
                          ['Loại', ev.eventType],
                          ['Ngành', ev.disciplineName ?? '—'],
                          ['Đăng ký mở', ev.registrationStart?.slice(0, 10) ?? '—'],
                          ['Đăng ký đóng', ev.registrationEnd?.slice(0, 10) ?? '—'],
                          ['Max team size', ev.maxTeamSize != null ? String(ev.maxTeamSize) : '—'],
                          ['Max teams', ev.maxTeams != null ? String(ev.maxTeams) : '—'],
                          ['Max participants', ev.maxParticipants != null ? String(ev.maxParticipants) : '—'],
                        ] as [string, string][]).map(([k, v]) => (
                          <div key={k} className="flex justify-between py-2">
                            <span className="text-sm text-slate-500">{k}</span>
                            <span className="text-sm font-medium text-slate-900">{v}</span>
                          </div>
                        ))}
                      </div>
                      <div>
                        <div className="grid grid-cols-3 gap-3 mb-4">
                          <div className="bg-blue-50 rounded-lg p-3 text-center">
                            <p className="text-xl font-bold text-blue-800">{detailRounds.length}</p>
                            <p className="text-xs text-blue-600 mt-0.5">Rounds</p>
                          </div>
                          <div className="bg-violet-50 rounded-lg p-3 text-center">
                            <p className="text-xl font-bold text-violet-800">{detailCategories.length}</p>
                            <p className="text-xs text-violet-600 mt-0.5">Categories</p>
                          </div>
                          <div className="bg-emerald-50 rounded-lg p-3 text-center">
                            <p className="text-xl font-bold text-emerald-800">{detailCriteriaSets.length}</p>
                            <p className="text-xs text-emerald-600 mt-0.5">Criteria Sets</p>
                          </div>
                        </div>
                        {detailBudget && (
                          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                            <p className="text-xs font-semibold text-amber-700 mb-1">Tổng ngân sách ước tính</p>
                            <p className="text-lg font-bold text-amber-900 font-mono">
                              {detailBudget.totalEstimatedCost?.toLocaleString() ?? '—'} {detailBudget.currency}
                            </p>
                          </div>
                        )}
                        {ev.description && (
                          <div className="mt-3 bg-slate-50 rounded-lg p-3">
                            <p className="text-xs font-semibold text-slate-600 mb-1">Mô tả</p>
                            <p className="text-sm text-slate-700 leading-relaxed">{ev.description}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {activeTab === 'rounds' && (
                    <div className="space-y-3">
                      {detailRounds.length === 0 && <p className="text-sm text-slate-400 text-center py-6">Chưa có round nào.</p>}
                      {detailRounds.map(r => (
                        <div key={r.id} className="p-4 rounded-lg border border-slate-200">
                          <div className="flex items-center justify-between mb-1">
                            <p className="text-sm font-semibold text-slate-900">Round {r.orderNumber}: {r.name}</p>
                            <div className="flex gap-1.5">
                              {r.finalRound && <span className="text-[10px] bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-medium">Final</span>}
                              {r.requiresRepo && <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">Repo</span>}
                              {r.requiresDemo && <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">Demo</span>}
                              {r.requiresSlide && <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">Slide</span>}
                              {r.requiresReport && <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">Report</span>}
                            </div>
                          </div>
                          <p className="text-xs text-slate-500">
                            {r.submissionDeadline && <>Submission: {r.submissionDeadline.slice(0, 10)} · </>}
                            {r.scoringDeadline && <>Scoring: {r.scoringDeadline.slice(0, 10)} · </>}
                            {r.promotionTopN != null && <>Top-{r.promotionTopN} promoted</>}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}

                  {activeTab === 'categories' && (
                    <div className="space-y-2">
                      {detailCategories.length === 0 && <p className="text-sm text-slate-400 text-center py-6">Chưa có category nào.</p>}
                      {detailCategories.map(cat => (
                        <div key={cat.id} className="flex items-center justify-between px-4 py-3 rounded-lg border border-slate-200">
                          <div>
                            <p className="text-sm font-semibold text-slate-900">{cat.name}</p>
                            {cat.description && <p className="text-xs text-slate-500 mt-0.5">{cat.description}</p>}
                          </div>
                          {cat.mentorName && (
                            <span className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-lg">{cat.mentorName}</span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {activeTab === 'criteria' && (
                    <div className="space-y-4">
                      {detailCriteriaSets.length === 0 && <p className="text-sm text-slate-400 text-center py-6">Chưa có criteria set nào.</p>}
                      {detailCriteriaSets.map(cs => {
                        const roundName = detailRounds.find(r => r.id === cs.roundId)?.name;
                        return (
                          <div key={cs.id} className="rounded-lg border border-slate-200 overflow-hidden">
                            <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-100 flex items-center gap-2 flex-wrap">
                              <p className="text-sm font-semibold text-slate-800">{cs.name}</p>
                              {roundName && <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">{roundName}</span>}
                              <span className="text-[10px] bg-violet-100 text-violet-700 px-2 py-0.5 rounded-full font-medium">
                                {cs.categoryName ?? 'Chung cả vòng'}
                              </span>
                              {cs.promotionTopN != null && (
                                <span className="text-[10px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">Top-{cs.promotionTopN}</span>
                              )}
                            </div>
                            {cs.criteria && cs.criteria.length > 0 && (
                              <table className="w-full">
                                <thead><tr className="border-b border-slate-100">
                                  {['Criterion', 'Max Score', 'Weight %'].map(h => (
                                    <th key={h} className="text-left px-4 py-2 text-xs font-semibold text-slate-500">{h}</th>
                                  ))}
                                </tr></thead>
                                <tbody className="divide-y divide-slate-50">
                                  {cs.criteria.map(cr => (
                                    <tr key={cr.id}>
                                      <td className="px-4 py-2 text-xs text-slate-800 font-medium">{cr.name}</td>
                                      <td className="px-4 py-2 text-xs font-mono text-slate-600">{cr.maxScore}</td>
                                      <td className="px-4 py-2 text-xs font-mono text-slate-600">{cr.weight}%</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {activeTab === 'budget' && (
                    <div>
                      {!detailBudget ? (
                        <p className="text-sm text-slate-400 text-center py-6">Chưa có budget.</p>
                      ) : (
                        <>
                          <table className="w-full mb-4">
                            <thead><tr className="border-b border-slate-200">
                              {['Mô tả', 'SL', 'Đơn giá (VND)', 'Thành tiền (VND)'].map(c => (
                                <th key={c} className="text-left px-3 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">{c}</th>
                              ))}
                            </tr></thead>
                            <tbody className="divide-y divide-slate-100">
                              {(detailBudget.items ?? []).map(item => (
                                <tr key={item.id} className="hover:bg-slate-50">
                                  <td className="px-3 py-2.5 text-sm text-slate-900">{item.description}</td>
                                  <td className="px-3 py-2.5 text-sm font-mono text-slate-600">{item.quantity}</td>
                                  <td className="px-3 py-2.5 text-sm font-mono text-slate-700 text-right">{item.unitCost.toLocaleString()}</td>
                                  <td className="px-3 py-2.5 text-sm font-mono font-semibold text-slate-900 text-right">
                                    {(item.quantity * item.unitCost).toLocaleString()}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                            <tfoot><tr className="border-t-2 border-slate-200 bg-slate-50">
                              <td colSpan={3} className="px-3 py-2.5 text-sm font-bold text-slate-900">Tổng ước tính</td>
                              <td className="px-3 py-2.5 text-sm font-bold text-blue-800 font-mono text-right">
                                {detailBudget.totalEstimatedCost?.toLocaleString() ?? '—'} {detailBudget.currency}
                              </td>
                            </tr></tfoot>
                          </table>
                        </>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Approve confirm modal */}
      {showApprove && selectedEvent && (
        <Modal title="Duyệt Event" subtitle={selectedEvent.name} onClose={() => setShowApprove(false)} size="sm"
          footer={
            <>
              <button onClick={() => setShowApprove(false)} disabled={actioning}
                className="px-4 py-2 border border-slate-200 text-slate-600 text-sm rounded-lg hover:bg-slate-50 disabled:opacity-50">Huỷ</button>
              <button onClick={handleApprove} disabled={actioning}
                className="px-4 py-2 bg-emerald-600 text-white text-sm font-semibold rounded-lg hover:bg-emerald-700 disabled:opacity-50 flex items-center gap-2">
                {actioning ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckSquare className="w-4 h-4" />} Xác nhận duyệt
              </button>
            </>
          }>
          <div className="space-y-3">
            <p className="text-sm text-slate-600">Bạn sắp <strong>duyệt</strong> event này. Coordinator sẽ được thông báo và có thể mở đăng ký.</p>
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 text-sm text-emerald-700">
              {detailRounds.length > 0 && <p>{detailRounds.length} round · {detailCategories.length} category · {detailCriteriaSets.length} criteria set</p>}
              {detailBudget?.totalEstimatedCost != null && <p className="font-semibold mt-1">Ngân sách: {detailBudget.totalEstimatedCost.toLocaleString()} {detailBudget.currency}</p>}
            </div>
          </div>
        </Modal>
      )}

      {/* Reject modal */}
      {showReject && selectedEvent && (
        <Modal title="Từ chối Event" subtitle={selectedEvent.name} onClose={() => { setShowReject(false); setRejectReason(''); }} size="sm"
          footer={
            <>
              <button onClick={() => { setShowReject(false); setRejectReason(''); }} disabled={actioning}
                className="px-4 py-2 border border-slate-200 text-slate-600 text-sm rounded-lg hover:bg-slate-50 disabled:opacity-50">Huỷ</button>
              <button disabled={!rejectReason.trim() || actioning} onClick={handleReject}
                className="px-4 py-2 bg-red-600 text-white text-sm font-semibold rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2">
                {actioning ? <RefreshCw className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />} Từ chối Event
              </button>
            </>
          }>
          <div className="space-y-3">
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">Coordinator sẽ nhận lý do từ chối và có thể chỉnh sửa rồi nộp lại.</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Lý do từ chối <span className="text-red-500">*</span></label>
              <textarea value={rejectReason} onChange={e => setRejectReason(e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-red-500"
                rows={4} placeholder="Nêu rõ lý do để coordinator có thể chỉnh sửa và nộp lại…" />
            </div>
            {!rejectReason.trim() && <p className="text-xs text-red-500">Lý do từ chối là bắt buộc.</p>}
          </div>
        </Modal>
      )}
    </div>
  );
}

export function SCAnalytics() {
  return (
    <div className="p-7 space-y-6">
      <div className="flex items-start justify-between mb-4">
        <div><h1 className="text-xl font-bold text-slate-900" style={{ fontFamily: 'var(--font-display)' }}>Cross-Event Analytics</h1>
          <p className="text-sm text-slate-500 mt-0.5">Program-level trends and performance across all terms</p></div>
        <div className="flex items-center gap-2">
          <select className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-700"><option>All Disciplines</option><option>Software Engineering</option><option>Artificial Intelligence</option></select>
          <select className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-700"><option>2023–2026</option><option>2025–2026</option></select>
          <button className="flex items-center gap-1.5 border border-slate-200 text-slate-600 text-sm px-3 py-2 rounded-lg hover:bg-slate-50"><Download className="w-4 h-4" /> Export</button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-5">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
          <h3 className="font-semibold text-slate-900 mb-4" style={{ fontFamily: 'var(--font-display)' }}>Registration vs Completion by Month</h3>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={registrationData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748b' }} />
              <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0' }} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Area type="monotone" dataKey="registered" stroke="#1e3a8a" fill="#dbeafe" name="Registered" strokeWidth={2} />
              <Area type="monotone" dataKey="completed" stroke="#0891b2" fill="#cffafe" name="Completed" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
          <h3 className="font-semibold text-slate-900 mb-4" style={{ fontFamily: 'var(--font-display)' }}>Score Distribution</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={scoreDistData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="range" tick={{ fontSize: 11, fill: '#64748b' }} />
              <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0' }} />
              <Bar dataKey="count" fill="#1e3a8a" name="Teams" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
        <h3 className="font-semibold text-slate-900 mb-4" style={{ fontFamily: 'var(--font-display)' }}>Event & Participation Trend by Term</h3>
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={eventTrendData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="term" tick={{ fontSize: 11, fill: '#64748b' }} />
            <YAxis yAxisId="left" tick={{ fontSize: 11, fill: '#64748b' }} />
            <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11, fill: '#64748b' }} />
            <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0' }} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Line yAxisId="left" type="monotone" dataKey="events" stroke="#1e3a8a" strokeWidth={2} name="Events" dot={{ fill: '#1e3a8a', r: 4 }} />
            <Line yAxisId="left" type="monotone" dataKey="teams" stroke="#0891b2" strokeWidth={2} name="Teams" dot={{ fill: '#0891b2', r: 4 }} />
            <Line yAxisId="right" type="monotone" dataKey="avgScore" stroke="#059669" strokeWidth={2} strokeDasharray="5 5" name="Avg Score" dot={{ fill: '#059669', r: 4 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export function Disciplines() {
  return (
    <div className="p-7 space-y-5">
      <PageHeader title="Discipline Management" subtitle="Academic disciplines available for hackathon events" />
      <div className="grid grid-cols-2 gap-5">
        {disciplines.map(d => (
          <div key={d.id} className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                  <span className="text-blue-800 font-bold text-sm font-mono">{d.code}</span>
                </div>
                <div><p className="font-semibold text-slate-900" style={{ fontFamily: 'var(--font-display)' }}>{d.name}</p><StatusBadge status={d.status} /></div>
              </div>
              <button className="text-xs text-blue-700 hover:text-blue-800 font-medium border border-blue-200 px-2.5 py-1 rounded-lg">Edit</button>
            </div>
            <div className="grid grid-cols-3 gap-3 mt-4 pt-3 border-t border-slate-100">
              <div className="text-center"><p className="text-lg font-bold text-slate-900">{d.activeEvents}</p><p className="text-xs text-slate-500">Active Events</p></div>
              <div className="text-center"><p className="text-lg font-bold text-slate-900">{d.completedEvents}</p><p className="text-xs text-slate-500">Completed</p></div>
              <div className="text-center"><p className="text-lg font-bold text-slate-900">{d.totalTeams}</p><p className="text-xs text-slate-500">Total Teams</p></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function TermQuotas() {
  return (
    <div className="p-7 space-y-5">
      <PageHeader title="Term Quota Management" subtitle="Maximum events per discipline per academic term" />
      <div className="bg-white rounded-xl shadow-sm border border-slate-200">
        <table className="w-full">
          <thead><tr className="border-b border-slate-100">{['Term', 'Year', 'Discipline', 'Max Events', 'Used', 'Remaining', 'Status'].map(c => <th key={c} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">{c}</th>)}</tr></thead>
          <tbody className="divide-y divide-slate-100">
            {termQuotas.map(q => (
              <tr key={q.id} className={`hover:bg-slate-50 transition-colors ${q.status === 'warn' ? 'bg-amber-50/50' : ''}`}>
                <td className="px-4 py-3 text-sm font-medium text-slate-900">{q.term}</td>
                <td className="px-4 py-3 text-sm font-mono text-slate-700">{q.year}</td>
                <td className="px-4 py-3 text-sm text-slate-700">{q.discipline}</td>
                <td className="px-4 py-3 text-sm font-mono text-slate-700">{q.maxEvents}</td>
                <td className="px-4 py-3 text-sm font-mono text-slate-700">{q.usedEvents}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 bg-slate-100 rounded-full"><div className={`h-2 rounded-full ${q.usedEvents >= q.maxEvents ? 'bg-amber-500' : 'bg-emerald-500'}`} style={{ width: `${(q.usedEvents / q.maxEvents) * 100}%` }} /></div>
                    <span className="text-sm font-mono text-slate-700">{q.maxEvents - q.usedEvents}</span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  {q.status === 'warn' ? <span className="flex items-center gap-1 text-xs text-amber-700"><AlertTriangle className="w-3.5 h-3.5" /> Quota Full</span> : <span className="text-xs text-emerald-700 flex items-center gap-1">● Available</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
