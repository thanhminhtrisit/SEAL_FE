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
import {
  getDisciplines, getTermPlans, createDiscipline, updateDiscipline, createTermPlan, updateTermPlan,
  type Discipline, type TermPlan,
} from '../../api/governance';

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
  const [disciplines, setDisciplines] = useState<Discipline[]>([]);
  const [termPlans, setTermPlans] = useState<TermPlan[]>([]);
  const [events, setEvents] = useState<{ status: string }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    Promise.all([getDisciplines(), getTermPlans(), getEvents()])
      .then(([d, t, e]) => { if (alive) { setDisciplines(d); setTermPlans(t); setEvents(e); } })
      .catch(err => toast.error(err instanceof Error ? err.message : 'Không tải được dữ liệu dashboard'))
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, []);

  const countByStatus = (s: string) => events.filter(e => e.status === s).length;
  const usedTotal = termPlans.reduce((sum, t) => sum + (t.usedEvents ?? 0), 0);
  const maxTotal = termPlans.reduce((sum, t) => sum + (t.maxEvents ?? 0), 0);
  const v = (n: number | string) => (loading ? '…' : String(n));

  return (
    <div className="p-7 space-y-7">
      <PageHeader title="Program Dashboard" subtitle="FPT University HCMC — Software Engineering Department" />
      <div className="grid grid-cols-5 gap-5">
        <KPICard title="Pending Approvals" value={v(countByStatus('PENDING_APPROVAL'))} subtitle="Requires review" icon={CheckSquare} accent="amber" />
        <KPICard title="Approved Events" value={v(countByStatus('APPROVED'))} subtitle="Ready to open" icon={Calendar} accent="green" />
        <KPICard title="Quota Usage" value={loading ? '…' : `${usedTotal}/${maxTotal}`} subtitle="Across all term plans" icon={Target} accent="blue" />
        <KPICard title="Active Disciplines" value={v(disciplines.length)} subtitle="Available for events" icon={BookOpen} accent="cyan" />
        <KPICard title="Completed Events" value={v(countByStatus('COMPLETED'))} subtitle="All terms" icon={TrendingUp} accent="purple" />
      </div>

      <div className="grid grid-cols-3 gap-5">
        <div className="col-span-2 bg-white rounded-xl shadow-sm border border-slate-200 p-5">
          <h3 className="font-semibold text-slate-900 mb-4" style={{ fontFamily: 'var(--font-display)' }}>Pending Event Approvals</h3>
          <div className="flex flex-col items-center justify-center py-8 text-slate-400 gap-2">
            <CheckSquare className="w-8 h-8 opacity-30" />
            <p className="text-sm">Truy cập <strong className="text-slate-600">Event Approvals</strong> để xem danh sách chờ duyệt ({v(countByStatus('PENDING_APPROVAL'))}).</p>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
          <h3 className="font-semibold text-slate-900 mb-4" style={{ fontFamily: 'var(--font-display)' }}>Disciplines</h3>
          <div className="space-y-3">
            {disciplines.length === 0 ? (
              <p className="text-sm text-slate-400">{loading ? 'Đang tải…' : 'Chưa có discipline nào.'}</p>
            ) : disciplines.map(d => (
              <div key={d.id} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-bold">{d.code}</span>
                  <span className="text-sm text-slate-900">{d.name}</span>
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
  const [items, setItems] = useState<Discipline[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing] = useState<Discipline | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ code: '', name: '', description: '', active: true });

  const load = () => {
    setLoading(true);
    getDisciplines(true)
      .then(setItems)
      .catch(err => toast.error(err instanceof Error ? err.message : 'Không tải được disciplines'))
      .finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const submitCreate = async () => {
    if (!form.code.trim() || !form.name.trim()) { toast.error('Code và Name là bắt buộc'); return; }
    setSaving(true);
    try {
      await createDiscipline({ code: form.code.trim(), name: form.name.trim(), description: form.description.trim() || undefined });
      toast.success('Đã tạo discipline');
      setShowCreate(false);
      load();
    } catch (err) { toast.error(err instanceof Error ? err.message : 'Tạo thất bại'); }
    finally { setSaving(false); }
  };

  const submitEdit = async () => {
    if (!editing) return;
    if (!form.name.trim()) { toast.error('Name là bắt buộc'); return; }
    setSaving(true);
    try {
      await updateDiscipline(editing.id, { name: form.name.trim(), description: form.description.trim(), active: form.active });
      toast.success('Đã cập nhật');
      setEditing(null);
      load();
    } catch (err) { toast.error(err instanceof Error ? err.message : 'Cập nhật thất bại'); }
    finally { setSaving(false); }
  };

  const toggleActive = async (d: Discipline) => {
    try { await updateDiscipline(d.id, { active: !d.active }); load(); }
    catch (err) { toast.error(err instanceof Error ? err.message : 'Không đổi được trạng thái'); }
  };

  return (
    <div className="p-7 space-y-5">
      <PageHeader
        title="Discipline Management"
        subtitle="Academic disciplines available for hackathon events"
        actions={
          <button onClick={() => { setForm({ code: '', name: '', description: '', active: true }); setShowCreate(true); }} className="bg-blue-800 hover:bg-blue-900 text-white text-sm font-semibold px-4 py-2 rounded-lg">
            + New Discipline
          </button>
        }
      />
      {loading ? (
        <div className="flex items-center gap-2 text-slate-400 text-sm"><RefreshCw className="w-4 h-4 animate-spin" /> Đang tải…</div>
      ) : items.length === 0 ? (
        <div className="text-sm text-slate-500">Chưa có discipline nào.</div>
      ) : (
        <div className="grid grid-cols-2 gap-5">
          {items.map(d => (
            <div key={d.id} className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                    <span className="text-blue-800 font-bold text-sm font-mono">{d.code}</span>
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900" style={{ fontFamily: 'var(--font-display)' }}>{d.name}</p>
                    <StatusBadge status={d.active ? 'ACTIVE' : 'INACTIVE'} />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => { setForm({ code: d.code, name: d.name, description: d.description ?? '', active: d.active }); setEditing(d); }} className="text-xs text-blue-700 hover:text-blue-800 font-medium border border-blue-200 px-2.5 py-1 rounded-lg">Edit</button>
                  <button onClick={() => toggleActive(d)} className="text-xs text-slate-600 hover:text-slate-800 border border-slate-200 px-2.5 py-1 rounded-lg">{d.active ? 'Deactivate' : 'Activate'}</button>
                </div>
              </div>
              {d.description && <p className="text-sm text-slate-600 mt-3 pt-3 border-t border-slate-100">{d.description}</p>}
            </div>
          ))}
        </div>
      )}

      {(showCreate || editing) && (
        <Modal
          title={editing ? 'Edit Discipline' : 'New Discipline'}
          size="sm"
          onClose={() => { setShowCreate(false); setEditing(null); }}
          footer={
            <>
              <button onClick={() => { setShowCreate(false); setEditing(null); }} className="px-4 py-2 text-sm rounded-lg border border-slate-300 text-slate-600">Hủy</button>
              <button disabled={saving} onClick={editing ? submitEdit : submitCreate} className="px-4 py-2 text-sm rounded-lg bg-blue-800 text-white font-semibold disabled:opacity-50">{saving ? 'Đang lưu…' : 'Lưu'}</button>
            </>
          }
        >
          <div className="space-y-3">
            {!editing && (
              <div>
                <label className="text-xs text-slate-500">Code</label>
                <input value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value }))} placeholder="VD: SE" className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
              </div>
            )}
            <div>
              <label className="text-xs text-slate-500">Name</label>
              <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Software Engineering" className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="text-xs text-slate-500">Description</label>
              <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={3} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
            </div>
            {editing && (
              <div className="flex items-center justify-between border-t border-slate-100 pt-3">
                <div>
                  <p className="text-xs font-semibold text-slate-700">Trạng thái</p>
                  <p className="text-[11px] text-slate-400">Inactive sẽ không dùng để tạo event mới.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setForm(f => ({ ...f, active: !f.active }))}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold ${form.active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'}`}
                >
                  {form.active ? '● ACTIVE — bấm để tắt' : '○ INACTIVE — bấm để bật'}
                </button>
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}

export function TermQuotas() {
  const [items, setItems] = useState<TermPlan[]>([]);
  const [disciplines, setDisciplines] = useState<Discipline[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing] = useState<TermPlan | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<{ term: 'SPRING' | 'SUMMER' | 'FALL'; year: number; disciplineId: number | ''; maxEvents: number }>(
    { term: 'SPRING', year: new Date().getFullYear(), disciplineId: '', maxEvents: 1 });
  const [editMax, setEditMax] = useState(1);

  const load = () => {
    setLoading(true);
    Promise.all([getTermPlans(), getDisciplines(true)])
      .then(([t, d]) => { setItems(t); setDisciplines(d); })
      .catch(err => toast.error(err instanceof Error ? err.message : 'Không tải được term plans'))
      .finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const submitCreate = async () => {
    if (form.disciplineId === '') { toast.error('Chọn discipline'); return; }
    if (form.maxEvents < 1) { toast.error('Max events ≥ 1'); return; }
    setSaving(true);
    try {
      await createTermPlan({ term: form.term, year: form.year, disciplineId: form.disciplineId as number, maxEvents: form.maxEvents });
      toast.success('Đã tạo quota');
      setShowCreate(false);
      load();
    } catch (err) { toast.error(err instanceof Error ? err.message : 'Tạo thất bại'); }
    finally { setSaving(false); }
  };

  const submitEdit = async () => {
    if (!editing) return;
    if (editMax < 1) { toast.error('Max events ≥ 1'); return; }
    setSaving(true);
    try {
      await updateTermPlan(editing.id, editMax);
      toast.success('Đã cập nhật quota');
      setEditing(null);
      load();
    } catch (err) { toast.error(err instanceof Error ? err.message : 'Cập nhật thất bại'); }
    finally { setSaving(false); }
  };

  return (
    <div className="p-7 space-y-5">
      <PageHeader
        title="Term Quota Management"
        subtitle="Maximum events per discipline per academic term"
        actions={
          <button onClick={() => { setForm({ term: 'SPRING', year: new Date().getFullYear(), disciplineId: '', maxEvents: 1 }); setShowCreate(true); }} className="bg-blue-800 hover:bg-blue-900 text-white text-sm font-semibold px-4 py-2 rounded-lg">
            + New Quota
          </button>
        }
      />
      <div className="bg-white rounded-xl shadow-sm border border-slate-200">
        <table className="w-full">
          <thead><tr className="border-b border-slate-100">{['Term', 'Year', 'Discipline', 'Max Events', 'Used', 'Remaining', 'Status', ''].map((c, i) => <th key={i} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">{c}</th>)}</tr></thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr><td colSpan={8} className="px-4 py-10 text-center text-sm text-slate-400">Đang tải…</td></tr>
            ) : items.length === 0 ? (
              <tr><td colSpan={8} className="px-4 py-10 text-center text-sm text-slate-500">Chưa có term plan nào.</td></tr>
            ) : items.map(q => {
              const full = q.remaining <= 0;
              const pct = q.maxEvents > 0 ? Math.min(100, Math.round((q.usedEvents / q.maxEvents) * 100)) : 0;
              return (
                <tr key={q.id} className={`hover:bg-slate-50 transition-colors ${full ? 'bg-amber-50/50' : ''}`}>
                  <td className="px-4 py-3 text-sm font-medium text-slate-900">{q.term}</td>
                  <td className="px-4 py-3 text-sm font-mono text-slate-700">{q.year}</td>
                  <td className="px-4 py-3 text-sm text-slate-700">{q.disciplineName}</td>
                  <td className="px-4 py-3 text-sm font-mono text-slate-700">{q.maxEvents}</td>
                  <td className="px-4 py-3 text-sm font-mono text-slate-700">{q.usedEvents}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-slate-100 rounded-full"><div className={`h-2 rounded-full ${full ? 'bg-amber-500' : 'bg-emerald-500'}`} style={{ width: `${pct}%` }} /></div>
                      <span className="text-sm font-mono text-slate-700">{q.remaining}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {full ? <span className="flex items-center gap-1 text-xs text-amber-700"><AlertTriangle className="w-3.5 h-3.5" /> Quota Full</span> : <span className="text-xs text-emerald-700 flex items-center gap-1">● Available</span>}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => { setEditing(q); setEditMax(q.maxEvents); }} className="text-xs text-blue-700 hover:text-blue-800 font-medium border border-blue-200 px-2.5 py-1 rounded-lg">Edit</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {showCreate && (
        <Modal
          title="New Quota"
          size="sm"
          onClose={() => setShowCreate(false)}
          footer={
            <>
              <button onClick={() => setShowCreate(false)} className="px-4 py-2 text-sm rounded-lg border border-slate-300 text-slate-600">Hủy</button>
              <button disabled={saving} onClick={submitCreate} className="px-4 py-2 text-sm rounded-lg bg-blue-800 text-white font-semibold disabled:opacity-50">{saving ? 'Đang lưu…' : 'Lưu'}</button>
            </>
          }
        >
          <div className="space-y-3">
            <div>
              <label className="text-xs text-slate-500">Term</label>
              <select value={form.term} onChange={e => setForm(f => ({ ...f, term: e.target.value as 'SPRING' | 'SUMMER' | 'FALL' }))} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm">
                <option value="SPRING">SPRING</option>
                <option value="SUMMER">SUMMER</option>
                <option value="FALL">FALL</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-500">Year</label>
              <input type="number" value={form.year} onChange={e => setForm(f => ({ ...f, year: Number(e.target.value) }))} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="text-xs text-slate-500">Discipline</label>
              <select value={form.disciplineId} onChange={e => setForm(f => ({ ...f, disciplineId: e.target.value === '' ? '' : Number(e.target.value) }))} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm">
                <option value="">-- Chọn discipline --</option>
                {disciplines.map(d => <option key={d.id} value={d.id}>{d.name} ({d.code}){d.active ? '' : ' — inactive'}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-500">Max Events</label>
              <input type="number" min={1} value={form.maxEvents} onChange={e => setForm(f => ({ ...f, maxEvents: Number(e.target.value) }))} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
            </div>
          </div>
        </Modal>
      )}

      {editing && (
        <Modal
          title={`Edit Quota — ${editing.term} ${editing.year} / ${editing.disciplineName}`}
          size="sm"
          onClose={() => setEditing(null)}
          footer={
            <>
              <button onClick={() => setEditing(null)} className="px-4 py-2 text-sm rounded-lg border border-slate-300 text-slate-600">Hủy</button>
              <button disabled={saving} onClick={submitEdit} className="px-4 py-2 text-sm rounded-lg bg-blue-800 text-white font-semibold disabled:opacity-50">{saving ? 'Đang lưu…' : 'Lưu'}</button>
            </>
          }
        >
          <div className="space-y-2">
            <label className="text-xs text-slate-500">Max Events (đang dùng: {editing.usedEvents})</label>
            <input type="number" min={1} value={editMax} onChange={e => setEditMax(Number(e.target.value))} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
          </div>
        </Modal>
      )}
    </div>
  );
}
