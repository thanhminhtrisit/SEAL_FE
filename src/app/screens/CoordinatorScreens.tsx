import React, { useState, useEffect, useCallback } from 'react';
import { Calendar, Plus, ChevronRight, CheckCircle2, Clock, AlertTriangle, Users, Send, Lock, Unlock, Trophy, Globe, FileBarChart, Eye, Edit2, UserCheck, UserX, Search, Download, Check, BarChart2, GraduationCap, Building2, RefreshCw, ArrowLeft, Layers, Tag, List, XCircle, Gavel, Copy, Key, PlayCircle, Archive, Trash2, X, DollarSign, Save } from 'lucide-react';
import { toast } from 'sonner';
import { KPICard } from '../components/shared/KPICard';
import { StatusBadge } from '../components/shared/Badge';
import { Modal } from '../components/shared/Modal';
import {
  getPendingAccounts,
  approveAccount,
  rejectAccount,
  getAccountsByStatus,
  type PendingAccount,
} from '../../api/accounts';
import {
  getEvents,
  createEvent,
  createRound,
  createCategory,
  createCriteriaSet,
  createBudget,
  createBudgetItem,
  submitEvent,
  openEvent,
  startEvent,
  completeEvent,
  archiveEvent,
  getEvent,
  getEventRounds,
  getEventCategories,
  getEventCriteriaSets,
  patchCriteriaSet,
  replaceCriteria,
  deleteCriteriaSet,
  updateRound,
  deleteRound,
  openRoundSubmission,
  closeRoundSubmission,
  openRoundScoring,
  lockRoundScoring,
  unlockRoundScoring,
  completeRound,
  updateCategory,
  deleteCategory,
  getBudget,
  updateBudgetItem,
  deleteBudgetItem,
  updateEvent,
  type EventSummary,
  type UpdateEventRequest,
  type UpdateBudgetItemRequest,
  type EventRound,
  type EventCategory,
  type CriteriaSet,
  type BudgetResponse,
  type BudgetItem,
  type EventType,
} from '../../api/events';
import { getDisciplines, getTermPlans, getBudgetCategories, getMentors, type Discipline, type TermPlan, type BudgetCategory, type Mentor } from '../../api/governance';
import { getTeamsByEvent, reviewTeam, type TeamSummary } from '../../api/teams';
import {
  getJudges, getRoundJudges, assignJudge, revokeJudge, createGuestJudge,
  type JudgeUser, type RoundJudge, type CreateGuestJudgeResponse,
} from '../../api/judges';
import { getRoundSubmissionMonitor, type SubmissionMonitorRow } from '../../api/submissions';

function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between mb-7">
      <div><h1 className="text-xl font-bold text-slate-900" style={{ fontFamily: 'var(--font-display)' }}>{title}</h1>
        {subtitle && <p className="text-sm text-slate-500 mt-0.5">{subtitle}</p>}</div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}

function safeArray<T>(value: T[] | null | undefined): T[] {
  return Array.isArray(value) ? value : [];
}

function parseNumInput(e: React.ChangeEvent<HTMLInputElement>): number | '' {
  return isNaN(e.target.valueAsNumber) ? '' : e.target.valueAsNumber;
}

// Gợi ý sức chứa: dư ~15% cho người thay thế/đăng ký muộn.
const PARTICIPANT_BUFFER = 1.15;
// Chính sách cố định, không co giãn theo quy mô team.
const DEFAULT_TEAMS_PER_MENTOR = 3;

function suggestMaxParticipants(teamSize: number | '', teams: number | ''): number | '' {
  const size = Number(teamSize) || 0;
  const count = Number(teams) || 0;
  if (size <= 0 || count <= 0) return '';
  return Math.ceil(size * count * PARTICIPANT_BUFFER);
}

// Linear lifecycle, mirrors BE enum EventStatus (DRAFT→…→ARCHIVED).
// REJECTED sits outside this flow — no step is marked current when the event is REJECTED.
const LIFECYCLE_STEPS: { key: string; label: string }[] = [
  { key: 'DRAFT', label: 'Draft' },
  { key: 'PENDING_APPROVAL', label: 'Pending Approval' },
  { key: 'APPROVED', label: 'Approved' },
  { key: 'OPEN', label: 'Open' },
  { key: 'IN_PROGRESS', label: 'In Progress' },
  { key: 'COMPLETED', label: 'Completed' },
  { key: 'ARCHIVED', label: 'Archived' },
];

const pendingParticipants = [
  { id: 1, name: 'Nguyen Thanh Phong', email: 'phong.nt@student.fpt.edu.vn', type: 'FPT Student', studentId: 'SE171234', appliedDate: '2026-06-21' },
  { id: 2, name: 'Do Thi Quynh', email: 'quynh.dt@student.fpt.edu.vn', type: 'FPT Student', studentId: 'SE171390', appliedDate: '2026-06-21' },
  { id: 3, name: 'Tran Van Minh', email: 'minh.tv@student.fpt.edu.vn', type: 'FPT Student', studentId: 'SE171511', appliedDate: '2026-06-21' },
  { id: 4, name: 'Pham Anh Tuan', email: 'tuan.pa@hcmut.edu.vn', type: 'External', studentId: '2212345 (HCMUT)', appliedDate: '2026-06-22' },
  { id: 5, name: 'Le Hoang Nam', email: 'nam.lh@uit.edu.vn', type: 'External', studentId: '21521234 (UIT)', appliedDate: '2026-06-22' },
  { id: 6, name: 'Nguyen Bich Thao', email: 'thao.nb@student.fpt.edu.vn', type: 'FPT Student', studentId: 'SE171678', appliedDate: '2026-06-22' },
  { id: 7, name: 'Vo Thi Kim', email: 'kim.vt@ute.edu.vn', type: 'External', studentId: '19110234 (UTE)', appliedDate: '2026-06-23' },
];

const teams = [
  { id: 1, name: 'Code Seals', category: 'Web Application', leader: 'Nguyen Thanh Phong', members: 4, status: 'APPROVED', registered: '2026-06-22' },
  { id: 2, name: 'AlphaBot', category: 'AI/Automation Tool', leader: 'Le Hoang Nam', members: 3, status: 'APPROVED', registered: '2026-06-22' },
  { id: 3, name: 'MobileFirst', category: 'Mobile Application', leader: 'Tran Van Minh', members: 5, status: 'APPROVED', registered: '2026-06-23' },
  { id: 4, name: 'NexGen', category: 'Web Application', leader: 'Pham Anh Tuan', members: 4, status: 'PENDING', registered: '2026-06-23' },
  { id: 5, name: 'DataFlow', category: 'AI/Automation Tool', leader: 'Nguyen Bich Thao', members: 3, status: 'PENDING', registered: '2026-06-24' },
];

const judges = [
  { id: 1, name: 'Pham Duc Dat', email: 'dat.pd@fpt.edu.vn', type: 'INTERNAL', round: 'Preliminary Round', category: 'All', scored: 4, total: 7 },
  { id: 2, name: 'Vu Minh Phuong', email: 'phuong.vm@fpt.edu.vn', type: 'INTERNAL', round: 'Preliminary Round', category: 'All', scored: 3, total: 7 },
  { id: 3, name: 'Dr. Sarah Chen', email: 'schen@industry.com', type: 'GUEST', round: 'Final Round', category: 'All', scored: 0, total: 6 },
  { id: 4, name: 'Dr. James Park', email: 'jpark@techcorp.com', type: 'GUEST', round: 'Final Round', category: 'All', scored: 0, total: 6 },
];

export function CoordDashboard({ onNavigate }: { onNavigate: (s: string) => void }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [eventCount, setEventCount] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);
  const [event, setEvent] = useState<EventSummary | null>(null);
  const [rounds, setRounds] = useState<EventRound[]>([]);
  const [teamCount, setTeamCount] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // TODO(BE): filter events by owner — GET /api/events trả về TẤT CẢ event
      // (EventSummaryResponse không có trường owner/creator), nên đây là tổng toàn hệ thống.
      const evList = safeArray(await getEvents());
      setEventCount(evList.length);

      // PageResponse.totalElements = tổng thật; content chỉ là 1 trang (BE default size=20).
      const pending = await getPendingAccounts();
      setPendingCount(pending?.totalElements ?? 0);

      // Featured: ưu tiên IN_PROGRESS, nếu không có thì lấy event mới nhất.
      // EventSummaryResponse không có createdAt → dùng id lớn nhất làm "mới nhất".
      const featured =
        evList.find(e => e.status === 'IN_PROGRESS') ??
        [...evList].sort((a, b) => b.id - a.id)[0];

      if (!featured) {
        setEvent(null);
        setRounds([]);
        setTeamCount(0);
        return;
      }

      const [detail, roundList, teamList] = await Promise.all([
        getEvent(featured.id),
        getEventRounds(featured.id).then(safeArray),
        getTeamsByEvent(featured.id).then(safeArray),
      ]);
      setEvent(detail);
      setRounds(roundList);
      setTeamCount(teamList.length);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không tải được dashboard');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // TODO(BE): scoping — chỉ đếm trong featured event; đếm across all events sẽ tốn N request rounds.
  const scoringOpenCount = rounds.filter(r => r.status === 'SCORING_OPEN').length;

  const currentIdx = event ? LIFECYCLE_STEPS.findIndex(s => s.key === event.status) : -1;
  const dayOf = (s?: string | null) => (s ? s.slice(0, 10) : '—');
  // TODO(BE): expose submittedAt/approvedAt/archivedAt trong EventResponse (Event entity đã có các cột này)
  // → hiện chỉ Draft (createdAt) và Open (registrationStart) có mốc thật, các bước khác hiển thị "—".
  const stepDate = (key: string) => {
    if (key === 'DRAFT') return dayOf(event?.createdAt);
    if (key === 'OPEN') return dayOf(event?.registrationStart);
    return '—';
  };

  if (loading) {
    return (
      <div className="p-7">
        <PageHeader title="Coordinator Dashboard" subtitle="Manage your events, teams, scoring, and results" />
        <div className="flex items-center gap-2 text-slate-400 text-sm">
          <RefreshCw className="w-4 h-4 animate-spin" /> Đang tải dashboard…
        </div>
      </div>
    );
  }

  return (
    <div className="p-7 space-y-7">
      <PageHeader title="Coordinator Dashboard" subtitle="Manage your events, teams, scoring, and results" />

      {error && (
        <div className="p-3 text-sm text-red-700 bg-red-50 rounded-lg border border-red-200 flex items-center justify-between">
          <span>{error}</span>
          <button onClick={load} className="text-xs font-semibold text-red-700 hover:text-red-800">Thử lại</button>
        </div>
      )}

      <div className="grid grid-cols-4 gap-5">
        <KPICard title="My Events" value={eventCount} subtitle="Toàn hệ thống" icon={Calendar} accent="blue" />
        <KPICard title="Pending Participants" value={pendingCount} subtitle="Awaiting approval" icon={UserCheck} accent="amber" />
        <KPICard title="Scoring Open" value={scoringOpenCount} subtitle={event?.name ?? '—'} icon={Lock} accent="cyan" />
        {/* TODO(BE): results-to-publish source — ResultPublication chỉ có entity + repository,
            chưa có endpoint nào expose trạng thái đã/chưa công bố → không suy ra được ở client. */}
        <KPICard title="Results to Publish" value="—" subtitle="Chưa có API" icon={Globe} accent="purple" />
      </div>

      {/* Active Event Card */}
      {!event ? (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 text-center">
          <p className="text-sm text-slate-500">Chưa có event nào.</p>
          <button onClick={() => onNavigate('coord-create')} className="mt-3 text-sm text-blue-700 hover:text-blue-800 font-medium">Tạo event mới</button>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="flex items-center gap-2 mb-1"><StatusBadge status={event.status} /><span className="text-xs text-slate-400">{event.eventType}</span></div>
              <h2 className="text-lg font-bold text-slate-900" style={{ fontFamily: 'var(--font-display)' }}>{event.name}</h2>
            </div>
            <button onClick={() => onNavigate('coord-events')} className="text-sm text-blue-700 hover:text-blue-800 font-medium flex items-center gap-1">View All Events <ChevronRight className="w-3.5 h-3.5" /></button>
          </div>

          {/* Lifecycle Timeline */}
          <div className="flex items-center gap-0 mb-5">
            {LIFECYCLE_STEPS.map((step, i) => {
              const state = currentIdx < 0 || i > currentIdx ? 'future' : i < currentIdx ? 'done' : 'current';
              return (
                <React.Fragment key={step.key}>
                  <div className="flex flex-col items-center">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center border-2 flex-shrink-0 ${state === 'done' ? 'bg-emerald-500 border-emerald-500' : state === 'current' ? 'bg-blue-800 border-blue-800' : 'bg-white border-slate-300'}`}>
                      {state === 'done' ? <Check className="w-3.5 h-3.5 text-white" /> : state === 'current' ? <span className="w-2 h-2 bg-white rounded-full" /> : <span className="w-2 h-2 bg-slate-300 rounded-full" />}
                    </div>
                    <p className={`text-[10px] mt-1.5 text-center w-14 ${state === 'current' ? 'text-blue-800 font-semibold' : state === 'done' ? 'text-emerald-700' : 'text-slate-400'}`}>{step.label}</p>
                    <p className="text-[9px] text-slate-400 font-mono mt-0.5">{stepDate(step.key)}</p>
                  </div>
                  {i < LIFECYCLE_STEPS.length - 1 && <div className={`flex-1 h-0.5 mx-0.5 mb-5 ${state === 'done' ? 'bg-emerald-400' : 'bg-slate-200'}`} />}
                </React.Fragment>
              );
            })}
          </div>

          <div className="grid grid-cols-4 gap-4">
            {[
              { label: 'Teams Registered', value: `${teamCount} / ${event.maxTeams ?? '—'}`, action: () => onNavigate('coord-teams') },
              { label: 'Pending Participants', value: String(pendingCount), action: () => onNavigate('coord-account-approvals') },
              // TODO(BE): GET /api/events/{eventId}/rounds/{roundId}/submission-progress
              { label: 'Submissions (Prelim)', value: '—', action: () => onNavigate('coord-submissions') },
              // TODO(BE): GET /api/events/{eventId}/rounds/{roundId}/scoring-progress
              { label: 'Scores Completed', value: '—', action: () => onNavigate('coord-scoring') },
            ].map(item => (
              <button key={item.label} onClick={item.action} className="text-left p-3 rounded-lg border border-slate-100 hover:border-blue-200 hover:bg-blue-50/30 transition-colors">
                <p className="text-xs text-slate-500">{item.label}</p>
                <p className="text-lg font-bold text-slate-900 mt-0.5">{item.value}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-5">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
          <h3 className="font-semibold text-slate-900 mb-3" style={{ fontFamily: 'var(--font-display)' }}>Active Rounds</h3>
          {rounds.length === 0 ? (
            <p className="text-sm text-slate-400 italic py-2">Chưa có vòng thi nào.</p>
          ) : rounds.map(r => (
            <div key={r.id} className="flex items-center justify-between py-2.5 border-b border-slate-100 last:border-0">
              <div><p className="text-sm font-medium text-slate-900">{r.name}</p><p className="text-xs text-slate-500">Deadline: {dayOf(r.submissionDeadline)}</p></div>
              <StatusBadge status={r.status} />
            </div>
          ))}
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
          <h3 className="font-semibold text-slate-900 mb-3" style={{ fontFamily: 'var(--font-display)' }}>Quick Actions</h3>
          <div className="grid grid-cols-2 gap-2">
            {[
              // 'coord-participants' không nằm trong ROLE_ALLOWED_SCREENS của EVENT_COORDINATOR (App.tsx)
              // → điều hướng tới đó bị chặn thành Access Denied. Màn đúng là 'coord-account-approvals'.
              { label: 'Approve Participants', icon: UserCheck, color: 'text-emerald-600', bg: 'bg-emerald-50 hover:bg-emerald-100', screen: 'coord-account-approvals' },
              { label: 'Monitor Submissions', icon: Send, color: 'text-blue-600', bg: 'bg-blue-50 hover:bg-blue-100', screen: 'coord-submissions' },
              { label: 'Scoring Control', icon: Lock, color: 'text-amber-600', bg: 'bg-amber-50 hover:bg-amber-100', screen: 'coord-scoring' },
              { label: 'View Rankings', icon: Trophy, color: 'text-purple-600', bg: 'bg-purple-50 hover:bg-purple-100', screen: 'coord-ranking' },
            ].map(a => (
              <button key={a.label} onClick={() => onNavigate(a.screen)} className={`${a.bg} ${a.color} p-3 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors`}>
                <a.icon className="w-4 h-4" />{a.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Event List (real API) ─────────────────────────────────────────────────────
interface EventListProps {
  onNavigate: (s: string) => void;
  onSelectEvent?: (id: number) => void;
}

export function EventList({ onNavigate, onSelectEvent }: EventListProps) {
  const [events, setEvents] = useState<EventSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setEvents(safeArray(await getEvents()));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không tải được danh sách event');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const fmtDate = (s: string | null) =>
    s ? s.replace('T', ' ').slice(0, 16) : '—';

  return (
    <div className="p-7 space-y-5">
      <PageHeader
        title="My Events"
        subtitle="All events you coordinate"
        actions={
          <button
            onClick={() => onNavigate('coord-create')}
            className="flex items-center gap-2 bg-blue-800 hover:bg-blue-900 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" /> New Event
          </button>
        }
      />

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-16 text-slate-400">
          <RefreshCw className="w-5 h-5 animate-spin mr-2" />
          <span className="text-sm">Đang tải…</span>
        </div>
      )}

      {/* Error */}
      {!loading && error && (
        <div className="flex flex-col items-center py-14 gap-3">
          <AlertTriangle className="w-8 h-8 text-red-400" />
          <p className="text-sm text-red-600">{error}</p>
          <button onClick={load} className="text-sm text-blue-700 underline">Thử lại</button>
        </div>
      )}

      {/* Empty */}
      {!loading && !error && events.length === 0 && (
        <div className="flex flex-col items-center py-16 gap-3 text-slate-400">
          <Calendar className="w-10 h-10 text-slate-300" />
          <p className="text-sm font-medium text-slate-600">Chưa có event nào</p>
          <button
            onClick={() => onNavigate('coord-create')}
            className="text-sm text-blue-700 underline"
          >
            Tạo event đầu tiên
          </button>
        </div>
      )}

      {/* Table */}
      {!loading && !error && events.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100">
                {['Event Name', 'Type', 'Status', 'Reg. Start', 'Reg. End', 'Actions'].map(c => (
                  <th key={c} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">{c}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {events.map(ev => (
                <tr key={ev.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3">
                    <p className="text-sm font-semibold text-slate-900">{ev.name}</p>
                    <p className="text-xs font-mono text-slate-400">{ev.slug}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs font-mono bg-blue-50 text-blue-700 px-2 py-0.5 rounded">{ev.eventType}</span>
                  </td>
                  <td className="px-4 py-3"><StatusBadge status={ev.status} /></td>
                  <td className="px-4 py-3 text-xs font-mono text-slate-500">{fmtDate(ev.registrationStart)}</td>
                  <td className="px-4 py-3 text-xs font-mono text-slate-500">{fmtDate(ev.registrationEnd)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          if (onSelectEvent) {
                            onSelectEvent(ev.id);
                          } else {
                            onNavigate('coord-event-detail');
                          }
                        }}
                        className="p-1.5 text-slate-400 hover:text-blue-700 hover:bg-blue-50 rounded"
                        title="View detail"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

    </div>
  );
}

// Converts date/datetime-local string to ISO LocalDateTime expected by BE.
// date-only "YYYY-MM-DD"  → "YYYY-MM-DDTHH:mm:ss" (start or end of day)
// datetime-local "YYYY-MM-DDTHH:mm" → "YYYY-MM-DDTHH:mm:ss" (append :00)
// empty/undefined         → undefined (field omitted)
function toDateTime(val: string, endOfDay = false): string | undefined {
  if (!val) return undefined;
  if (val.includes('T')) return val.length === 16 ? `${val}:00` : val;
  return endOfDay ? `${val}T23:59:59` : `${val}T00:00:00`;
}

const WIZARD_STEPS = ['Basic Info', 'Rounds', 'Categories', 'Criteria', 'Budget', 'Review & Submit'];

interface RoundForm {
  name: string;
  submissionDeadline: string;
  scoringDeadline: string;
  promotionTopN: number | '';
  isFinalRound: boolean;
  requiresRepo: boolean;
  requiresDemo: boolean;
  requiresSlide: boolean;
  requiresReport: boolean;
}
interface CategoryForm { name: string; description: string; mentorId: number | ''; }
interface CriterionForm { name: string; description: string; maxScore: number | ''; weight: number | ''; active: boolean; }
interface BudgetItemForm { categoryId: number | ''; description: string; quantity: number | ''; unitCost: number | ''; }

export function CreateEventWizard({
  onNavigate,
  onSelectEvent,
}: {
  onNavigate: (s: string) => void;
  onSelectEvent?: (id: number) => void;
}) {
  const [step, setStep] = useState(0);
  const [maxReached, setMaxReached] = useState(0);
  const [saving, setSaving] = useState(false);

  // Meta (loaded on mount)
  const [disciplines, setDisciplines] = useState<Discipline[]>([]);
  const [allTermPlans, setAllTermPlans] = useState<TermPlan[]>([]);
  const [budgetCategories, setBudgetCategories] = useState<BudgetCategory[]>([]);
  const [mentors, setMentors] = useState<Mentor[]>([]);
  const [loadingMeta, setLoadingMeta] = useState(true);

  // Step 0 – Basic Info
  const [eventId, setEventId] = useState<number | null>(null);
  const [name, setName] = useState('');
  const [disciplineId, setDisciplineId] = useState<number | ''>('');
  const [termPlanId, setTermPlanId] = useState<number | ''>('');
  const [description, setDescription] = useState('');
  const [regStart, setRegStart] = useState('');
  const [regEnd, setRegEnd] = useState('');

  // Step 1 – Rounds
  const [rounds, setRounds] = useState<RoundForm[]>([
    { name: 'Preliminary Round', submissionDeadline: '2026-07-25', scoringDeadline: '', promotionTopN: 6, isFinalRound: false, requiresRepo: true, requiresDemo: false, requiresSlide: true, requiresReport: false },
    { name: 'Final Round', submissionDeadline: '2026-08-08', scoringDeadline: '', promotionTopN: 3, isFinalRound: true, requiresRepo: true, requiresDemo: true, requiresSlide: true, requiresReport: true },
  ]);
  const [roundIds, setRoundIds] = useState<number[]>([]);

  // Step 2 – Categories
  const [categories, setCategories] = useState<CategoryForm[]>([{ name: '', description: '', mentorId: '' }]);
  const [categoryIds, setCategoryIds] = useState<number[]>([]);

  // Step 3 – Criteria (multiple sets, each scoped to a round + optional category)
  interface WizardCsForm {
    name: string;
    roundId: number | '';
    applyToAllRounds: boolean;
    categoryId: number | null;
    promotionTopN: number | '';
    criteria: CriterionForm[];
  }
  const defaultWizardCsRow = (): WizardCsForm => ({
    name: 'Default Criteria Set',
    roundId: '',
    applyToAllRounds: false,
    categoryId: null,
    promotionTopN: '',
    criteria: [
      { name: 'Technical Quality', description: 'Code quality, architecture, performance, scalability', maxScore: 10, weight: 40, active: true },
      { name: 'Innovation', description: 'Originality, creative use of technology, novelty of approach', maxScore: 10, weight: 25, active: true },
      { name: 'UI/UX Design', description: 'Interface usability, visual design, user experience quality', maxScore: 10, weight: 20, active: true },
      { name: 'Presentation', description: 'Demo clarity, Q&A responses, communication', maxScore: 10, weight: 15, active: true },
    ],
  });
  const [wizardCsSets, setWizardCsSets] = useState<WizardCsForm[]>([defaultWizardCsRow()]);
  const [wizardCsIds, setWizardCsIds] = useState<(number | null)[]>([null]);

  // Step 4 – Budget
  const [budgetId, setBudgetId] = useState<number | null>(null);
  const [budgetItems, setBudgetItems] = useState<BudgetItemForm[]>([{ categoryId: '', description: '', quantity: 1, unitCost: 0 }]);

  // Derived
  const filteredTermPlans = allTermPlans.filter(tp => disciplineId !== '' && tp.disciplineId === (disciplineId as number));
  const selectedTermPlan = allTermPlans.find(tp => tp.id === termPlanId);
  const autoEventType = selectedTermPlan?.term as EventType | undefined;
  // Only count rows that have both a category and a description — these are the rows actually sent to BE
  const validBudgetItems = budgetItems.filter(i => i.categoryId !== '' && i.description.trim() !== '');
  const skippedBudgetCount = budgetItems.length - validBudgetItems.length;
  const totalBudget = validBudgetItems.reduce(
    (s, i) => s + (Number(i.quantity) || 0) * (Number(i.unitCost) || 0),
    0,
  );

  useEffect(() => {
    Promise.all([
      getDisciplines(),
      getTermPlans(),
      getBudgetCategories(),
      getMentors().catch(() => [] as Mentor[]),
    ])
      .then(([d, tp, bc, m]) => {
        setDisciplines(safeArray(d));
        setAllTermPlans(safeArray(tp));
        setBudgetCategories(safeArray(bc));
        setMentors(safeArray(m));
      })
      .catch(err => toast.error(err instanceof Error ? err.message : 'Không tải được dữ liệu'))
      .finally(() => setLoadingMeta(false));
  }, []);

  const advance = (next: number) => {
    setStep(next);
    setMaxReached(prev => Math.max(prev, next));
  };

  const handleNext = async () => {
    if (saving) return;
    setSaving(true);
    try {
      if (step === 0 && !eventId) {
        if (!name.trim()) { toast.error('Vui lòng nhập tên event'); return; }
        if (disciplineId === '') { toast.error('Vui lòng chọn discipline'); return; }
        if (termPlanId === '') { toast.error('Vui lòng chọn term plan'); return; }
        if (!autoEventType) { toast.error('Term plan không hợp lệ'); return; }
        const ev = await createEvent({
          name: name.trim(),
          disciplineId: disciplineId as number,
          termPlanId: termPlanId as number,
          eventType: autoEventType,
          description: description.trim() || undefined,
          registrationStart: toDateTime(regStart),
          registrationEnd: toDateTime(regEnd, true),
        });
        setEventId(ev.id);
        toast.success(`Event "${ev.name}" đã được tạo (DRAFT)`);
      } else if (step === 1 && roundIds.length === 0 && eventId) {
        const saved: EventRound[] = [];
        for (const [i, r] of rounds.entries()) {
          saved.push(await createRound(eventId, {
            name: r.name,
            orderNumber: i + 1,
            submissionDeadline: toDateTime(r.submissionDeadline, true),
            scoringDeadline: toDateTime(r.scoringDeadline, true),
            promotionTopN: r.promotionTopN !== '' ? Number(r.promotionTopN) : undefined,
            finalRound: r.isFinalRound,
            requiresRepo: r.requiresRepo,
            requiresDemo: r.requiresDemo,
            requiresSlide: r.requiresSlide,
            requiresReport: r.requiresReport,
          }));
        }
        setRoundIds(saved.map(r => r.id));
      } else if (step === 2 && categoryIds.length === 0 && eventId) {
        const saved: EventCategory[] = [];
        for (const cat of categories) {
          saved.push(await createCategory(eventId, {
            name: cat.name,
            description: cat.description || undefined,
            mentorId: cat.mentorId !== '' ? Number(cat.mentorId) : undefined,
          }));
        }
        setCategoryIds(saved.map(c => c.id));
      } else if (step === 3 && eventId) {
        // Validate each set before sending
        for (let i = 0; i < wizardCsSets.length; i++) {
          const cs = wizardCsSets[i];
          if (!cs.name.trim()) { toast.error(`Bộ ${i + 1}: tên không được trống`); return; }
          if (!cs.applyToAllRounds && cs.roundId === '') { toast.error(`Bộ ${i + 1}: vui lòng chọn vòng (hoặc tick "Áp cho tất cả")`); return; }
          if (cs.applyToAllRounds && roundIds.length === 0) { toast.error(`Bộ ${i + 1}: chưa có vòng nào được tạo ở bước 1`); return; }
          const active = cs.criteria.filter(c => c.active);
          if (active.length === 0) { toast.error(`Bộ ${i + 1} (${cs.name}): cần ít nhất 1 criterion active`); return; }
          const tw = active.reduce((s, c) => s + (Number(c.weight) || 0), 0);
          if (tw !== 100) { toast.error(`Bộ ${i + 1} (${cs.name}): tổng weight phải = 100%. Hiện tại: ${tw}%`); return; }
        }
        // Client-side duplicate warning (only for single-round sets)
        const singleRoundKeys = wizardCsSets.filter(cs => !cs.applyToAllRounds).map(cs => `${cs.roundId}|${String(cs.categoryId)}`);
        if (singleRoundKeys.some((k, i) => singleRoundKeys.indexOf(k) !== i)) {
          toast.warning('Cảnh báo: có 2+ bộ tiêu chí cùng (vòng, hạng mục)');
        }
        // Create only sets not yet saved
        const newIds = [...wizardCsIds];
        for (let i = 0; i < wizardCsSets.length; i++) {
          if (newIds[i] !== null) continue;
          const cs = wizardCsSets[i];
          const payload = {
            name: cs.name.trim(),
            categoryId: cs.categoryId ?? undefined,
            promotionTopN: cs.promotionTopN !== '' ? Number(cs.promotionTopN) : undefined,
            criteria: cs.criteria.filter(c => c.active).map((c, idx) => ({
              name: c.name, description: c.description || undefined,
              maxScore: Number(c.maxScore) || 10, weight: Number(c.weight) || 0, displayOrder: idx + 1,
            })),
          };
          if (cs.applyToAllRounds) {
            // Create one set per round; skip rounds that fail (BE duplicate) with warning
            let firstId: number | null = null;
            let skipped = 0;
            for (const rid of roundIds) {
              try {
                const created = await createCriteriaSet(eventId, { ...payload, roundId: rid });
                if (firstId === null) firstId = created.id;
              } catch {
                skipped++;
              }
            }
            if (skipped > 0) toast.warning(`${skipped} vòng đã có bộ trùng — bỏ qua`);
            toast.success(`Đã tạo bộ tiêu chí cho ${roundIds.length - skipped} vòng`);
            newIds[i] = firstId ?? -1;
          } else {
            const created = await createCriteriaSet(eventId, { ...payload, roundId: cs.roundId as number });
            newIds[i] = created.id;
          }
        }
        setWizardCsIds(newIds);
      } else if (step === 4 && budgetId === null && eventId) {
        const budget = await createBudget(eventId, { currency: 'VND' });
        const validItems = budgetItems.filter(i => i.categoryId !== '' && i.description.trim());
        for (const i of validItems) {
          await createBudgetItem(eventId, {
            categoryId: i.categoryId as number,
            description: i.description.trim(),
            quantity: Number(i.quantity) || 1,
            unitCost: Number(i.unitCost) || 0,
          });
        }
        setBudgetId(budget.id);
      }
      advance(step + 1);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Lỗi khi lưu bước này');
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async () => {
    if (!eventId || saving) return;
    setSaving(true);
    try {
      await submitEvent(eventId);
      toast.success('Event đã được gửi duyệt — chờ Super Coordinator phê duyệt');
      onNavigate('coord-events');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Submit thất bại');
    } finally {
      setSaving(false);
    }
  };

  const handleFinishConfiguration = () => {
    if (!eventId) return;
    toast.info('Hãy gán judge cho mỗi round ở Judge Assignment, rồi Submit tại Event Detail.');
    if (onSelectEvent) {
      onSelectEvent(eventId);
    } else {
      onNavigate('coord-event-detail');
    }
  };

  const savedBadge = (label: string) => (
    <span className="inline-flex items-center gap-1 text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-medium">
      <Check className="w-3 h-3" /> {label}
    </span>
  );

  return (
    <div className="p-7">
      <PageHeader title="Create New Event" subtitle="Step-by-step event configuration wizard" />

      {/* Step Indicator */}
      <div className="flex items-center gap-0 mb-8 bg-white rounded-xl shadow-sm border border-slate-200 p-4">
        {WIZARD_STEPS.map((label, i) => (
          <React.Fragment key={label}>
            <button
              onClick={() => i <= maxReached && setStep(i)}
              disabled={i > maxReached}
              className="flex flex-col items-center flex-1 group disabled:cursor-default"
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${i < step ? 'bg-emerald-500 text-white' : i === step ? 'bg-blue-800 text-white' : 'bg-slate-100 text-slate-400'}`}>
                {i < step ? <Check className="w-4 h-4" /> : i + 1}
              </div>
              <p className={`text-[11px] mt-1.5 font-medium transition-colors ${i === step ? 'text-blue-800' : i < step ? 'text-emerald-700' : 'text-slate-400'}`}>{label}</p>
            </button>
            {i < WIZARD_STEPS.length - 1 && <div className={`flex-1 h-0.5 mx-1 mt-0 mb-5 ${i < step ? 'bg-emerald-400' : 'bg-slate-200'}`} />}
          </React.Fragment>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200">
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
          <h2 className="font-bold text-slate-900" style={{ fontFamily: 'var(--font-display)' }}>Step {step + 1}: {WIZARD_STEPS[step]}</h2>
          {step === 0 && eventId && savedBadge(`Đã lưu ID ${eventId}`)}
          {step === 1 && roundIds.length > 0 && savedBadge(`${roundIds.length} rounds đã lưu`)}
          {step === 2 && categoryIds.length > 0 && savedBadge(`${categoryIds.length} categories đã lưu`)}
          {step === 3 && wizardCsIds.some(id => id !== null) && savedBadge(`${wizardCsIds.filter(id => id !== null).length}/${wizardCsSets.length} bộ tiêu chí đã lưu`)}
          {step === 4 && budgetId && savedBadge('Budget đã lưu')}
        </div>
        <div className="p-6">

          {/* ── Step 0: Basic Info ─────────────────────────────── */}
          {step === 0 && (
            <div className="max-w-xl space-y-4">
              {loadingMeta && (
                <div className="flex items-center gap-2 text-slate-400 text-sm">
                  <RefreshCw className="w-4 h-4 animate-spin" /> Đang tải disciplines…
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Discipline <span className="text-red-500">*</span></label>
                <select
                  value={disciplineId}
                  onChange={e => { setDisciplineId(e.target.value === '' ? '' : Number(e.target.value)); setTermPlanId(''); }}
                  disabled={loadingMeta || !!eventId}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-700 disabled:opacity-50 disabled:bg-slate-50"
                >
                  <option value="">— Chọn discipline —</option>
                  {disciplines.map(d => <option key={d.id} value={d.id}>{d.name} ({d.code})</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Term Plan <span className="text-red-500">*</span></label>
                <select
                  value={termPlanId}
                  onChange={e => setTermPlanId(e.target.value === '' ? '' : Number(e.target.value))}
                  disabled={disciplineId === '' || filteredTermPlans.length === 0 || !!eventId}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-700 disabled:opacity-50 disabled:bg-slate-50"
                >
                  <option value="">{disciplineId === '' ? '— Chọn discipline trước —' : filteredTermPlans.length === 0 ? 'Không có term plan' : '— Chọn term plan —'}</option>
                  {filteredTermPlans.map(tp => (
                    <option key={tp.id} value={tp.id} disabled={tp.remaining === 0}>
                      {tp.term} {tp.year} — còn {tp.remaining}/{tp.maxEvents} slot{tp.remaining === 0 ? ' (hết)' : ''}
                    </option>
                  ))}
                </select>
                {selectedTermPlan && (
                  <div className="mt-1.5 flex items-center gap-2">
                    <span className="text-xs text-slate-500">Event Type (auto):</span>
                    <span className="text-xs font-mono font-semibold bg-blue-100 text-blue-700 px-2 py-0.5 rounded">{selectedTermPlan.term}</span>
                    <span className="text-xs text-slate-400">· {selectedTermPlan.remaining} slot còn lại</span>
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Event Name <span className="text-red-500">*</span></label>
                <input
                  value={name}
                  onChange={e => setName(e.target.value)}
                  disabled={!!eventId}
                  placeholder="VD: SEAL Software Engineering Hackathon FALL 2026"
                  className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-700 disabled:opacity-50 disabled:bg-slate-50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                <textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  disabled={!!eventId}
                  rows={3}
                  placeholder="Mô tả ngắn về event…"
                  className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-700 disabled:opacity-50 disabled:bg-slate-50"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Registration Opens</label>
                  <input type="datetime-local" value={regStart} onChange={e => setRegStart(e.target.value)} disabled={!!eventId}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-700 disabled:opacity-50 disabled:bg-slate-50" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Registration Closes</label>
                  <input type="datetime-local" value={regEnd} onChange={e => setRegEnd(e.target.value)} disabled={!!eventId}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-700 disabled:opacity-50 disabled:bg-slate-50" />
                </div>
              </div>
            </div>
          )}

          {/* ── Step 1: Rounds ─────────────────────────────────── */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="flex justify-end">
                <button
                  onClick={() => roundIds.length === 0 && setRounds(prev => [...prev, { name: `Round ${prev.length + 1}`, submissionDeadline: '', scoringDeadline: '', promotionTopN: '', isFinalRound: false, requiresRepo: false, requiresDemo: false, requiresSlide: false, requiresReport: false }])}
                  disabled={roundIds.length > 0}
                  className="flex items-center gap-1.5 text-sm text-blue-700 font-medium hover:text-blue-800 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Plus className="w-4 h-4" /> Add Round
                </button>
              </div>
              {rounds.map((r, i) => (
                <div key={i} className="p-4 rounded-lg border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-semibold text-slate-900">Round {i + 1}</span>
                    <div className="flex items-center gap-2">
                      {r.isFinalRound && <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-medium">Final</span>}
                      {roundIds.length === 0 && rounds.length > 1 && (
                        <button onClick={() => setRounds(prev => prev.filter((_, idx) => idx !== i))} className="text-xs text-red-500 hover:text-red-700">Remove</button>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Round Name</label>
                      <input value={r.name} onChange={e => { const c = [...rounds]; c[i] = { ...c[i], name: e.target.value }; setRounds(c); }} disabled={roundIds.length > 0}
                        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-700 disabled:opacity-50 disabled:bg-slate-50" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Promote Top N Teams</label>
                      <input type="number" min={1} value={r.promotionTopN === '' ? '' : r.promotionTopN} onChange={e => { const c = [...rounds]; c[i] = { ...c[i], promotionTopN: parseNumInput(e) }; setRounds(c); }} disabled={roundIds.length > 0}
                        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-700 disabled:opacity-50 disabled:bg-slate-50" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Submission Deadline</label>
                      <input type="date" value={r.submissionDeadline} onChange={e => { const c = [...rounds]; c[i] = { ...c[i], submissionDeadline: e.target.value }; setRounds(c); }} disabled={roundIds.length > 0}
                        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-700 disabled:opacity-50 disabled:bg-slate-50" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Scoring Deadline</label>
                      <input type="date" value={r.scoringDeadline} onChange={e => { const c = [...rounds]; c[i] = { ...c[i], scoringDeadline: e.target.value }; setRounds(c); }} disabled={roundIds.length > 0}
                        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-700 disabled:opacity-50 disabled:bg-slate-50" />
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-4">
                    {([['isFinalRound', 'Final Round'], ['requiresRepo', 'Repo'], ['requiresDemo', 'Demo'], ['requiresSlide', 'Slide'], ['requiresReport', 'Report']] as [keyof RoundForm, string][]).map(([field, label]) => (
                      <label key={field} className="flex items-center gap-1.5 cursor-pointer select-none">
                        <input type="checkbox" checked={!!r[field]} disabled={roundIds.length > 0}
                          onChange={e => { const c = [...rounds]; c[i] = { ...c[i], [field]: e.target.checked }; setRounds(c); }}
                          className="rounded border-slate-300" />
                        <span className="text-xs text-slate-600">{label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ── Step 2: Categories ─────────────────────────────── */}
          {step === 2 && (
            <div className="space-y-3">
              <div className="flex justify-end">
                <button
                  onClick={() => categoryIds.length === 0 && setCategories(prev => [...prev, { name: '', description: '', mentorId: '' }])}
                  disabled={categoryIds.length > 0}
                  className="flex items-center gap-1.5 text-sm text-blue-700 font-medium hover:text-blue-800 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Plus className="w-4 h-4" /> Add Category
                </button>
              </div>
              {categories.length === 0 && (
                <p className="text-sm text-slate-400 text-center py-4 border border-dashed border-slate-200 rounded-lg">Chưa có hạng mục nào — bấm Add Category để thêm.</p>
              )}
              {categories.map((cat, i) => (
                <div key={i} className="p-4 rounded-lg border border-slate-200 grid grid-cols-3 gap-3 relative">
                  {categoryIds.length === 0 && (
                    <button onClick={() => setCategories(prev => prev.filter((_, idx) => idx !== i))}
                      className="absolute top-2 right-2 p-1 text-slate-300 hover:text-red-500 transition-colors" title="Xoá dòng này">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Category Name</label>
                    <input value={cat.name} onChange={e => { const c = [...categories]; c[i] = { ...c[i], name: e.target.value }; setCategories(c); }} disabled={categoryIds.length > 0}
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-700 disabled:opacity-50 disabled:bg-slate-50" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Description</label>
                    <input value={cat.description} onChange={e => { const c = [...categories]; c[i] = { ...c[i], description: e.target.value }; setCategories(c); }} disabled={categoryIds.length > 0}
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-700 disabled:opacity-50 disabled:bg-slate-50" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Mentor <span className="text-slate-400">(optional)</span></label>
                    <select value={cat.mentorId} onChange={e => { const c = [...categories]; c[i] = { ...c[i], mentorId: e.target.value === '' ? '' : Number(e.target.value) }; setCategories(c); }} disabled={categoryIds.length > 0}
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-700 disabled:opacity-50 disabled:bg-slate-50">
                      <option value="">— Không gán —</option>
                      {mentors.map(m => <option key={m.id} value={m.id}>{m.fullName}</option>)}
                    </select>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ── Step 3: Criteria (multi-set) ───────────────────── */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-xs text-slate-500 italic">Cùng một vòng, mỗi hạng mục có thể có bộ tiêu chí, trọng số và Top-N riêng.</p>
                {wizardCsIds.every(id => id === null) && (
                  <button onClick={() => { setWizardCsSets(p => [...p, defaultWizardCsRow()]); setWizardCsIds(p => [...p, null]); }}
                    className="flex items-center gap-1 text-sm text-blue-700 font-medium hover:text-blue-800 flex-shrink-0">
                    <Plus className="w-4 h-4" /> Thêm bộ tiêu chí
                  </button>
                )}
              </div>
              {wizardCsSets.map((cs, si) => {
                const saved = wizardCsIds[si] !== null;
                const tw = cs.criteria.filter(c => c.active).reduce((s, c) => s + (Number(c.weight) || 0), 0);
                const savedRounds = roundIds.map((id, i) => ({ id, name: rounds[i].name }));
                const savedCats = categoryIds.map((id, i) => ({ id, name: categories[i].name }));
                const updateCs = (patch: Partial<WizardCsForm>) => setWizardCsSets(prev => prev.map((x, xi) => xi === si ? { ...x, ...patch } : x));
                const updateCriterion = (ci: number, patch: Partial<CriterionForm>) => updateCs({ criteria: cs.criteria.map((c, cj) => cj === ci ? { ...c, ...patch } : c) });
                return (
                  <div key={si} className={`rounded-lg border p-4 space-y-3 ${saved ? 'border-emerald-300 bg-emerald-50/40' : 'border-slate-200'}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Bộ {si + 1}</span>
                        {saved && <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-medium">Đã lưu</span>}
                      </div>
                      {!saved && wizardCsSets.length > 1 && (
                        <button onClick={() => { setWizardCsSets(p => p.filter((_, xi) => xi !== si)); setWizardCsIds(p => p.filter((_, xi) => xi !== si)); }}
                          className="p-1 text-slate-400 hover:text-red-600 transition-colors"><X className="w-4 h-4" /></button>
                      )}
                    </div>
                    {/* Name + Round + Category + TopN row */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">Tên bộ tiêu chí <span className="text-red-500">*</span></label>
                        <input value={cs.name} onChange={e => updateCs({ name: e.target.value })} disabled={saved}
                          className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-700 disabled:opacity-50 disabled:bg-slate-50" />
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-xs font-semibold text-slate-600">Vòng áp dụng {!cs.applyToAllRounds && <span className="text-red-500">*</span>}</label>
                          <label className="flex items-center gap-1 cursor-pointer select-none">
                            <input type="checkbox" checked={cs.applyToAllRounds}
                              onChange={e => updateCs({ applyToAllRounds: e.target.checked, roundId: '' })}
                              disabled={saved} className="rounded border-slate-300" />
                            <span className="text-[10px] text-slate-600 font-medium">Áp cho tất cả các vòng</span>
                          </label>
                        </div>
                        {cs.applyToAllRounds ? (
                          <div className="w-full border border-emerald-200 bg-emerald-50 rounded-lg px-3 py-2 text-xs text-emerald-700 font-medium">
                            Sẽ tạo 1 bộ cho mỗi vòng ({savedRounds.length > 0 ? savedRounds.map(r => r.name).join(', ') : 'chưa có vòng'})
                          </div>
                        ) : (
                          <select value={cs.roundId} onChange={e => updateCs({ roundId: e.target.value === '' ? '' : Number(e.target.value) })} disabled={saved}
                            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-700 bg-white disabled:opacity-50 disabled:bg-slate-50">
                            <option value="">-- Chọn vòng --</option>
                            {savedRounds.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                            {savedRounds.length === 0 && <option disabled>Chưa tạo round (hoàn tất bước 1 trước)</option>}
                          </select>
                        )}
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">Hạng mục</label>
                        <select value={cs.categoryId ?? ''} onChange={e => updateCs({ categoryId: e.target.value === '' ? null : Number(e.target.value) })} disabled={saved}
                          className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-700 bg-white disabled:opacity-50 disabled:bg-slate-50">
                          <option value="">Dùng chung cả vòng</option>
                          {savedCats.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                        <p className="text-[10px] text-slate-400 mt-0.5">Để trống = áp dụng cho mọi hạng mục trong vòng</p>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">Top-N thăng hạng</label>
                        <input type="number" min={1} value={cs.promotionTopN === '' ? '' : cs.promotionTopN}
                          onChange={e => updateCs({ promotionTopN: parseNumInput(e) })} disabled={saved}
                          className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-700 disabled:opacity-50 disabled:bg-slate-50" />
                        <p className="text-[10px] text-slate-400 mt-0.5">Để trống = theo round.promotionTopN</p>
                      </div>
                    </div>
                    {/* Criteria table */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-xs font-semibold text-slate-600">Tiêu chí chấm điểm</label>
                        <div className={`flex items-center gap-1 text-xs font-mono font-bold px-2 py-0.5 rounded ${tw === 100 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                          {tw === 100 ? <Check className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
                          {tw}%
                        </div>
                      </div>
                      <table className="w-full border border-slate-200 rounded-lg overflow-hidden">
                        <thead><tr className="bg-slate-50 border-b border-slate-200">
                          {['Tên', 'Mô tả', 'Max', 'Weight%', 'Active', ''].map(h => (
                            <th key={h} className="text-left px-2 py-1.5 text-xs font-semibold text-slate-500">{h}</th>
                          ))}
                        </tr></thead>
                        <tbody className="divide-y divide-slate-100">
                          {cs.criteria.map((c, ci) => (
                            <tr key={ci} className={c.active ? 'hover:bg-slate-50' : 'bg-slate-50 opacity-60'}>
                              <td className="px-2 py-1.5">
                                <input value={c.name} onChange={e => updateCriterion(ci, { name: e.target.value })} disabled={saved}
                                  className="w-full border border-slate-200 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-700 disabled:opacity-50 disabled:bg-slate-50" />
                              </td>
                              <td className="px-2 py-1.5">
                                <input value={c.description} onChange={e => updateCriterion(ci, { description: e.target.value })} disabled={saved}
                                  className="w-full border border-slate-200 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-700 disabled:opacity-50 disabled:bg-slate-50" />
                              </td>
                              <td className="px-2 py-1.5">
                                <input type="number" min={1} value={c.maxScore === '' ? '' : c.maxScore} onChange={e => updateCriterion(ci, { maxScore: parseNumInput(e) })} disabled={saved}
                                  className="w-14 border border-slate-200 rounded px-2 py-1 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-blue-700 disabled:opacity-50 disabled:bg-slate-50" />
                              </td>
                              <td className="px-2 py-1.5">
                                <input type="number" min={0} max={100} value={c.weight === '' ? '' : c.weight} onChange={e => updateCriterion(ci, { weight: parseNumInput(e) })} disabled={saved}
                                  className="w-14 border border-slate-200 rounded px-2 py-1 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-blue-700 disabled:opacity-50 disabled:bg-slate-50" />
                              </td>
                              <td className="px-2 py-1.5">
                                <div className={`w-8 h-4 rounded-full transition-colors ${saved ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'} ${c.active ? 'bg-blue-700' : 'bg-slate-300'}`}
                                  onClick={() => { if (!saved) updateCriterion(ci, { active: !c.active }); }}>
                                  <div className={`w-3 h-3 bg-white rounded-full m-0.5 transition-transform shadow ${c.active ? 'translate-x-4' : 'translate-x-0'}`} />
                                </div>
                              </td>
                              <td className="px-2 py-1.5">
                                {!saved && cs.criteria.length > 1 && (
                                  <button onClick={() => updateCs({ criteria: cs.criteria.filter((_, cj) => cj !== ci) })}
                                    className="p-0.5 text-slate-300 hover:text-red-500 transition-colors"><X className="w-3.5 h-3.5" /></button>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {!saved && (
                        <button onClick={() => updateCs({ criteria: [...cs.criteria, { name: '', description: '', maxScore: '', weight: '', active: true }] })}
                          className="mt-1.5 flex items-center gap-1 text-xs text-blue-700 hover:text-blue-800 font-medium">
                          <Plus className="w-3.5 h-3.5" /> Thêm criterion
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* ── Step 4: Budget ─────────────────────────────────── */}
          {step === 4 && (
            <div>
              {budgetItems.length === 0 && (
                <p className="text-sm text-slate-400 text-center py-4 border border-dashed border-slate-200 rounded-lg mb-3">Chưa có mục ngân sách — bấm Add Budget Item để thêm.</p>
              )}
              {budgetItems.length > 0 && (
              <table className="w-full mb-3">
                <thead><tr className="border-b border-slate-200">{['Category', 'Description', 'Qty', 'Unit Cost (VND)', 'Amount (VND)', ''].map(c => <th key={c} className="text-left px-3 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">{c}</th>)}</tr></thead>
                <tbody className="divide-y divide-slate-100">
                  {budgetItems.map((item, i) => {
                    const isValid = item.categoryId !== '' && item.description.trim() !== '';
                    return (
                    <tr key={i} className={isValid ? 'hover:bg-slate-50' : 'bg-amber-50/60 hover:bg-amber-50'}>
                      <td className="px-3 py-2">
                        <select value={item.categoryId} onChange={e => { const c = [...budgetItems]; c[i] = { ...c[i], categoryId: e.target.value === '' ? '' : Number(e.target.value) }; setBudgetItems(c); }} disabled={!!budgetId}
                          className="border border-slate-200 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-700 disabled:opacity-50 disabled:bg-slate-50">
                          <option value="">— Chọn —</option>
                          {budgetCategories.map(bc => <option key={bc.id} value={bc.id}>{bc.name}</option>)}
                        </select>
                      </td>
                      <td className="px-3 py-2">
                        <input value={item.description} onChange={e => { const c = [...budgetItems]; c[i] = { ...c[i], description: e.target.value }; setBudgetItems(c); }} disabled={!!budgetId}
                          className="w-full border border-slate-200 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-700 disabled:opacity-50 disabled:bg-slate-50" />
                      </td>
                      <td className="px-3 py-2">
                        <input type="number" min={1} value={item.quantity === 0 || item.quantity === '' ? '' : item.quantity} onChange={e => { const c = [...budgetItems]; c[i] = { ...c[i], quantity: parseNumInput(e) }; setBudgetItems(c); }} disabled={!!budgetId}
                          className="w-14 border border-slate-200 rounded px-2 py-1 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-blue-700 disabled:opacity-50 disabled:bg-slate-50" />
                      </td>
                      <td className="px-3 py-2">
                        <input type="number" min={0} value={item.unitCost === 0 || item.unitCost === '' ? '' : item.unitCost} onChange={e => { const c = [...budgetItems]; c[i] = { ...c[i], unitCost: parseNumInput(e) }; setBudgetItems(c); }} disabled={!!budgetId}
                          className="w-28 border border-slate-200 rounded px-2 py-1 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-blue-700 disabled:opacity-50 disabled:bg-slate-50" />
                      </td>
                      <td className={`px-3 py-2 text-sm font-mono font-semibold text-right ${isValid ? 'text-slate-900' : 'text-slate-400 line-through'}`}>
                        {((Number(item.quantity) || 0) * (Number(item.unitCost) || 0)).toLocaleString()}
                      </td>
                      <td className="px-2 py-2">
                        {!budgetId && (
                          <button onClick={() => setBudgetItems(prev => prev.filter((_, idx) => idx !== i))}
                            className="p-1 text-slate-300 hover:text-red-500 transition-colors" title="Xoá dòng">
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </td>
                    </tr>
                    );
                  })}
                </tbody>
                <tfoot><tr className="border-t-2 border-slate-200 bg-slate-50"><td colSpan={4} className="px-3 py-2 text-sm font-bold">Total Estimated</td><td className="px-3 py-2 text-sm font-bold text-blue-800 font-mono text-right">{totalBudget.toLocaleString()}</td><td /></tr></tfoot>
              </table>
              )}
              {!budgetId && (
                <button onClick={() => setBudgetItems(prev => [...prev, { categoryId: '', description: '', quantity: 1, unitCost: 0 }])}
                  className="flex items-center gap-1.5 text-sm text-blue-700 font-medium hover:text-blue-800">
                  <Plus className="w-4 h-4" /> Add Budget Item
                </button>
              )}
              {skippedBudgetCount > 0 && !budgetId && (
                <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-lg px-4 py-2 mt-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                  <p className="text-sm text-amber-700">
                    {skippedBudgetCount} dòng bị bỏ qua khi gửi (thiếu category hoặc mô tả) — tổng chỉ tính {validBudgetItems.length} dòng hợp lệ.
                  </p>
                </div>
              )}
              {budgetCategories.length === 0 && !loadingMeta && (
                <p className="text-xs text-amber-600 mt-2">Không tải được danh sách budget categories — vui lòng thêm thủ công hoặc bỏ qua bước này.</p>
              )}
            </div>
          )}

          {/* ── Step 5: Review & Submit ─────────────────────────── */}
          {step === 5 && (
            <div className="space-y-5 max-w-2xl">
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <h3 className="font-semibold text-blue-900 mb-3" style={{ fontFamily: 'var(--font-display)' }}>Review Summary</h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  {[
                    ['Event Name', name || '—'],
                    ['Type', autoEventType ?? '—'],
                    ['Discipline', disciplines.find(d => d.id === disciplineId)?.name ?? '—'],
                    ['Term', selectedTermPlan ? `${selectedTermPlan.term} ${selectedTermPlan.year}` : '—'],
                    ['Rounds', `${rounds.length} (${rounds.map(r => r.name).join(', ')})`],
                    ['Categories', String(categories.length)],
                    ['Criteria', `${wizardCsSets.length} bộ tiêu chí`],
                    ['Total Budget', `${totalBudget.toLocaleString()} VND`],
                  ].map(([k, v]) => (
                    <div key={k}><span className="text-blue-600 font-medium">{k}:</span><span className="text-blue-900 ml-2">{v}</span></div>
                  ))}
                </div>
              </div>
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-emerald-800">Configuration Saved</p>
                  <p className="text-sm text-emerald-700 mt-1">Hãy gán judge cho mỗi round ở Judge Assignment, rồi Submit tại Event Detail.</p>
                </div>
              </div>
              <button
                onClick={handleFinishConfiguration}
                disabled={saving || !eventId}
                className="w-full bg-blue-800 hover:bg-blue-900 disabled:opacity-50 text-white font-semibold py-3 rounded-xl text-sm transition-colors flex items-center justify-center gap-2"
              >
                {saving ? <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                Finish Configuration
              </button>
            </div>
          )}

        </div>
        <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between">
          <button
            onClick={() => setStep(Math.max(0, step - 1))}
            disabled={step === 0 || saving}
            className="px-4 py-2 border border-slate-200 text-slate-600 text-sm rounded-lg hover:bg-slate-50 disabled:opacity-40 transition-colors"
          >
            ← Previous
          </button>
          <span className="text-xs text-slate-400">Step {step + 1} of {WIZARD_STEPS.length}</span>
          {step < WIZARD_STEPS.length - 1 ? (
            <button
              onClick={handleNext}
              disabled={saving || loadingMeta}
              className="px-4 py-2 bg-blue-800 text-white text-sm font-semibold rounded-lg hover:bg-blue-900 disabled:opacity-40 transition-colors flex items-center gap-2"
            >
              {saving && <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />}
              Next →
            </button>
          ) : (
            <div />
          )}
        </div>
      </div>
    </div>
  );
}

export function ParticipantApproval() {
  const [selected, setSelected] = useState<number[]>([]);
  const [showReject, setShowReject] = useState(false);
  return (
    <div className="p-7 space-y-5">
      <PageHeader title="Participant Approval" subtitle={`${pendingParticipants.length} accounts pending approval for SEAL Hackathon Summer 2026`}
        actions={<>
          {selected.length > 0 && <><button onClick={() => setSelected([])} className="text-sm border border-slate-200 text-slate-600 px-3 py-2 rounded-lg hover:bg-slate-50">Clear ({selected.length})</button>
            <button className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"><UserCheck className="w-4 h-4" /> Approve Selected</button>
            <button onClick={() => setShowReject(true)} className="flex items-center gap-1.5 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"><UserX className="w-4 h-4" /> Reject Selected</button></>}
        </>}
      />
      <div className="bg-white rounded-xl shadow-sm border border-slate-200">
        <div className="p-3 border-b border-slate-100 flex items-center gap-3">
          <div className="relative flex-1 max-w-sm"><Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" /><input placeholder="Search participants…" className="pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm w-full focus:outline-none focus:ring-2 focus:ring-blue-700" /></div>
          <select className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-700"><option>All Types</option><option>FPT Student</option><option>External</option></select>
        </div>
        <table className="w-full">
          <thead><tr className="border-b border-slate-100">
            <th className="px-4 py-3 w-10"><input type="checkbox" className="rounded border-slate-300" onChange={e => setSelected(e.target.checked ? pendingParticipants.map(p => p.id) : [])} /></th>
            {['Name & Email', 'Type', 'Student ID', 'Applied', 'Actions'].map(c => <th key={c} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">{c}</th>)}
          </tr></thead>
          <tbody className="divide-y divide-slate-100">
            {pendingParticipants.map(p => (
              <tr key={p.id} className={`hover:bg-slate-50 transition-colors ${selected.includes(p.id) ? 'bg-blue-50' : ''}`}>
                <td className="px-4 py-3"><input type="checkbox" className="rounded border-slate-300" checked={selected.includes(p.id)} onChange={e => setSelected(e.target.checked ? [...selected, p.id] : selected.filter(id => id !== p.id))} /></td>
                <td className="px-4 py-3"><p className="text-sm font-medium text-slate-900">{p.name}</p><p className="text-xs text-slate-400 font-mono">{p.email}</p></td>
                <td className="px-4 py-3"><span className={`text-xs px-2 py-0.5 rounded-full font-medium ${p.type === 'FPT Student' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'}`}>{p.type}</span></td>
                <td className="px-4 py-3 text-sm font-mono text-slate-700">{p.studentId}</td>
                <td className="px-4 py-3 text-sm font-mono text-slate-500">{p.appliedDate}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1.5">
                    <button className="text-xs bg-emerald-50 text-emerald-700 hover:bg-emerald-100 px-2.5 py-1 rounded-lg font-medium flex items-center gap-1"><UserCheck className="w-3 h-3" /> Approve</button>
                    <button onClick={() => setShowReject(true)} className="text-xs bg-red-50 text-red-700 hover:bg-red-100 px-2.5 py-1 rounded-lg font-medium flex items-center gap-1"><UserX className="w-3 h-3" /> Reject</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {showReject && (
        <Modal title="Reject Participant" onClose={() => setShowReject(false)} size="sm"
          footer={<><button onClick={() => setShowReject(false)} className="px-4 py-2 border border-slate-200 text-slate-600 text-sm rounded-lg hover:bg-slate-50">Cancel</button><button className="px-4 py-2 bg-red-600 text-white text-sm font-semibold rounded-lg hover:bg-red-700">Confirm Rejection</button></>}>
          <div className="space-y-3">
            <p className="text-sm text-slate-600">The participant will be notified of the rejection with your reason.</p>
            <div><label className="block text-sm font-medium text-slate-700 mb-1">Reason <span className="text-red-500">*</span></label>
              <textarea className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-red-500" rows={3} placeholder="E.g., Student ID not found in FPT enrollment records" /></div>
          </div>
        </Modal>
      )}
    </div>
  );
}

// Nhãn hiển thị thân thiện cho từng status của submission monitoring.
const SUBMISSION_STATUS_LABEL: Record<string, string> = {
  SUBMITTED: 'Submitted',
  NOT_SUBMITTED: 'Not Submitted',
  LATE_REJECTED: 'Late Rejected',
  LOCKED: 'Locked',
  DISQUALIFIED: 'Disqualified',
};

export function SubmissionMonitor() {
  const [events, setEvents] = useState<EventSummary[]>([]);
  const [loadingMeta, setLoadingMeta] = useState(true);

  const [selectedEventId, setSelectedEventId] = useState<number | ''>('');
  const [rounds, setRounds] = useState<EventRound[]>([]);
  const [loadingRounds, setLoadingRounds] = useState(false);
  const [selectedRoundId, setSelectedRoundId] = useState<number | ''>('');

  const [rows, setRows] = useState<SubmissionMonitorRow[]>([]);
  const [loadingRows, setLoadingRows] = useState(false);
  const [rowsError, setRowsError] = useState<string | null>(null);

  // Load events on mount, mặc định chọn event đầu tiên.
  useEffect(() => {
    getEvents()
      .then(evs => {
        const list = safeArray(evs);
        setEvents(list);
        if (list.length > 0) setSelectedEventId(list[0].id);
      })
      .catch(err => toast.error(err instanceof Error ? err.message : 'Không tải được danh sách event'))
      .finally(() => setLoadingMeta(false));
  }, []);

  // Load rounds khi đổi event, mặc định chọn round đầu tiên.
  useEffect(() => {
    if (selectedEventId === '') { setRounds([]); setSelectedRoundId(''); return; }
    setLoadingRounds(true);
    getEventRounds(selectedEventId as number)
      .then(roundList => {
        const list = safeArray(roundList).sort((a, b) => (a.orderNumber ?? 0) - (b.orderNumber ?? 0));
        setRounds(list);
        setSelectedRoundId(list.length > 0 ? list[0].id : '');
      })
      .catch(err => toast.error(err instanceof Error ? err.message : 'Không tải được rounds'))
      .finally(() => setLoadingRounds(false));
  }, [selectedEventId]);

  const loadRows = useCallback((eventId: number, roundId: number) => {
    setLoadingRows(true);
    setRowsError(null);
    getRoundSubmissionMonitor(eventId, roundId)
      .then(data => setRows(safeArray(data)))
      .catch(err => {
        const message = err instanceof Error ? err.message : 'Không tải được danh sách submission';
        setRowsError(message);
        setRows([]);
      })
      .finally(() => setLoadingRows(false));
  }, []);

  // Refetch submissions khi đổi event/round.
  useEffect(() => {
    if (selectedEventId === '' || selectedRoundId === '') { setRows([]); setRowsError(null); return; }
    loadRows(selectedEventId as number, selectedRoundId as number);
  }, [selectedEventId, selectedRoundId, loadRows]);

  const selectedRound = rounds.find(r => r.id === selectedRoundId) ?? null;
  const selectedEvent = events.find(e => e.id === selectedEventId) ?? null;

  // ── KPI dẫn xuất client-side ──
  const totalTeams = rows.length;
  const submittedCount = rows.filter(r => r.status === 'SUBMITTED').length;
  const notSubmittedCount = totalTeams - submittedCount;
  const pendingNames = rows.filter(r => r.status !== 'SUBMITTED').map(r => r.teamName);
  const pendingSubtitle = pendingNames.length === 0
    ? 'Tất cả đã nộp'
    : pendingNames.slice(0, 2).join(', ') + (pendingNames.length > 2 ? ` +${pendingNames.length - 2}` : '');

  const deadline = selectedRound?.submissionDeadline ?? null;
  const deadlineDate = deadline ? new Date(deadline) : null;
  const daysRemaining = deadlineDate && !Number.isNaN(deadlineDate.getTime())
    ? Math.ceil((deadlineDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null;
  const deadlineValue = deadline ? deadline.slice(0, 10) : '—';
  const deadlineSubtitle = daysRemaining === null
    ? 'Chưa đặt deadline'
    : daysRemaining < 0 ? `Quá hạn ${Math.abs(daysRemaining)} ngày`
    : daysRemaining === 0 ? 'Hết hạn hôm nay'
    : `Còn ${daysRemaining} ngày`;

  const fmtDateTime = (s?: string | null) => s ? s.replace('T', ' ').slice(0, 16) : '—';

  // Một ô artifact: có url → link; thiếu mà round yêu cầu → "Missing (required)"; còn lại → "—".
  const renderArtifact = (url: string | null | undefined, required: boolean, label: string, colorClass: string) => {
    if (url) {
      return (
        <a href={url} target="_blank" rel="noopener noreferrer" className={`text-xs ${colorClass} hover:underline font-mono break-all`}>
          {label}
        </a>
      );
    }
    return required
      ? <span className="text-xs text-red-500">Missing (required)</span>
      : <span className="text-xs text-slate-400">—</span>;
  };

  // ── Export CSV client-side từ rows đang hiển thị ──
  const handleExportCsv = () => {
    if (rows.length === 0) { toast.error('Không có dữ liệu để export'); return; }
    const headers = ['Team', 'Category', 'Repository URL', 'Demo URL', 'Slides', 'Submitted At', 'Attempt', 'Status'];
    const escape = (v: string) => `"${v.replace(/"/g, '""')}"`;
    const lines = rows.map(r => [
      r.teamName ?? '',
      r.categoryName ?? '',
      r.repoUrl ?? '',
      r.demoUrl ?? '',
      r.slideUrl ?? '',
      fmtDateTime(r.submittedAt),
      r.latestAttemptNumber ? `Attempt #${r.latestAttemptNumber}` : '',
      SUBMISSION_STATUS_LABEL[r.status] ?? r.status,
    ].map(cell => escape(String(cell))).join(','));
    const csv = [headers.map(escape).join(','), ...lines].join('\r\n');
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const namePart = `${selectedEvent?.name ?? 'event'}_${selectedRound?.name ?? 'round'}`.replace(/[^a-zA-Z0-9]+/g, '-');
    a.href = url;
    a.download = `submissions_${namePart}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const subtitle = selectedEvent && selectedRound
    ? `${selectedRound.name} — ${selectedEvent.name}`
    : 'Chọn event và round để theo dõi submission';

  return (
    <div className="p-7 space-y-5">
      <PageHeader
        title="Submission Monitoring"
        subtitle={subtitle}
        actions={
          <button
            onClick={handleExportCsv}
            disabled={rows.length === 0}
            className="flex items-center gap-1.5 border border-slate-200 text-slate-600 text-sm px-3 py-2 rounded-lg hover:bg-slate-50 disabled:opacity-50"
          >
            <Download className="w-4 h-4" /> Export
          </button>
        }
      />

      {/* Event + Round selectors */}
      <div className="flex gap-3 flex-wrap items-end">
        <div className="min-w-[260px]">
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Event</label>
          <select
            value={selectedEventId}
            onChange={e => setSelectedEventId(e.target.value === '' ? '' : Number(e.target.value))}
            disabled={loadingMeta}
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-700 disabled:opacity-50"
          >
            <option value="">{loadingMeta ? 'Đang tải…' : '— Chọn event —'}</option>
            {events.map(ev => <option key={ev.id} value={ev.id}>{ev.name}</option>)}
          </select>
        </div>
        <div className="min-w-[200px]">
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Round</label>
          <select
            value={selectedRoundId}
            onChange={e => setSelectedRoundId(e.target.value === '' ? '' : Number(e.target.value))}
            disabled={selectedEventId === '' || loadingRounds}
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-700 disabled:opacity-50 disabled:bg-slate-50"
          >
            <option value="">{selectedEventId === '' ? '— Chọn event trước —' : loadingRounds ? 'Đang tải…' : '— Chọn round —'}</option>
            {rounds.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
          </select>
        </div>
        {selectedRoundId !== '' && (
          <button
            onClick={() => loadRows(selectedEventId as number, selectedRoundId as number)}
            disabled={loadingRows}
            className="flex items-center gap-1.5 border border-slate-200 text-slate-600 text-sm px-3 py-2 rounded-lg hover:bg-slate-50 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loadingRows ? 'animate-spin' : ''}`} /> Refresh
          </button>
        )}
      </div>

      <div className="grid grid-cols-3 gap-4 mb-2">
        <KPICard title="Submitted" value={String(submittedCount)} subtitle={`of ${totalTeams} teams`} icon={Send} accent="green" />
        <KPICard title="Not Submitted" value={String(notSubmittedCount)} subtitle={pendingSubtitle} icon={AlertTriangle} accent="amber" />
        <KPICard title="Deadline" value={deadlineValue} subtitle={deadlineSubtitle} icon={Clock} accent="red" />
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-x-auto">
        <table className="w-full">
          <thead><tr className="border-b border-slate-100">{['Team', 'Category', 'Repository URL', 'Demo URL', 'Slides', 'Submitted At', 'Attempt', 'Status'].map(c => <th key={c} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">{c}</th>)}</tr></thead>
          <tbody className="divide-y divide-slate-100">
            {loadingRows ? (
              <tr><td colSpan={8} className="px-4 py-10 text-center text-sm text-slate-400"><RefreshCw className="w-4 h-4 animate-spin inline mr-2" />Đang tải submissions…</td></tr>
            ) : rowsError ? (
              <tr><td colSpan={8} className="px-4 py-10 text-center text-sm text-red-500">{rowsError}</td></tr>
            ) : selectedRoundId === '' ? (
              <tr><td colSpan={8} className="px-4 py-10 text-center text-sm text-slate-400">Chọn event và round để xem submission.</td></tr>
            ) : rows.length === 0 ? (
              <tr><td colSpan={8} className="px-4 py-10 text-center text-sm text-slate-400">Chưa có team nào trong round này.</td></tr>
            ) : rows.map(s => (
              <tr key={s.teamId} className={`hover:bg-slate-50 transition-colors ${s.status === 'NOT_SUBMITTED' ? 'bg-amber-50/40' : ''}`}>
                <td className="px-4 py-3 text-sm font-semibold text-slate-900">{s.teamName}</td>
                <td className="px-4 py-3 text-xs text-slate-600">{s.categoryName ?? '—'}</td>
                <td className="px-4 py-3">{renderArtifact(s.repoUrl, !!selectedRound?.requiresRepo, s.repoUrl ?? '', 'text-blue-600')}</td>
                <td className="px-4 py-3">{renderArtifact(s.demoUrl, !!selectedRound?.requiresDemo, s.demoUrl ?? '', 'text-cyan-600')}</td>
                <td className="px-4 py-3">{renderArtifact(s.slideUrl, !!selectedRound?.requiresSlide, 'View', 'text-purple-600')}</td>
                <td className="px-4 py-3 text-xs font-mono text-slate-500">{fmtDateTime(s.submittedAt)}</td>
                <td className="px-4 py-3 text-xs font-mono text-slate-600">{s.latestAttemptNumber ? `Attempt #${s.latestAttemptNumber}` : '—'}</td>
                <td className="px-4 py-3"><StatusBadge status={s.status} label={SUBMISSION_STATUS_LABEL[s.status] ?? s.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function JudgeAssignment() {
  // Meta
  const [events, setEvents] = useState<EventSummary[]>([]);
  const [judgePool, setJudgePool] = useState<JudgeUser[]>([]);
  const [loadingMeta, setLoadingMeta] = useState(true);

  // Selectors
  const [selectedEventId, setSelectedEventId] = useState<number | ''>('');
  const [selectedRoundId, setSelectedRoundId] = useState<number | ''>('');
  const [rounds, setRounds] = useState<EventRound[]>([]);
  const [loadingRounds, setLoadingRounds] = useState(false);

  // Assigned judges for selected round
  const [assigned, setAssigned] = useState<RoundJudge[]>([]);
  const [loadingAssigned, setLoadingAssigned] = useState(false);

  // Assign action
  const [selectedJudgeId, setSelectedJudgeId] = useState<number | ''>('');
  const [assigning, setAssigning] = useState(false);

  // Remove action
  const [removingId, setRemovingId] = useState<number | null>(null);

  // Create Guest Judge dialog
  const [showCreate, setShowCreate] = useState(false);
  const [guestName, setGuestName] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [creatingGuest, setCreatingGuest] = useState(false);
  const [tempResult, setTempResult] = useState<CreateGuestJudgeResponse | null>(null);
  const [copied, setCopied] = useState(false);

  // Load events + judge pool on mount
  useEffect(() => {
    Promise.all([getEvents(), getJudges()])
      .then(([evs, pool]) => { setEvents(safeArray(evs)); setJudgePool(safeArray(pool)); })
      .catch(err => toast.error(err instanceof Error ? err.message : 'Không tải được dữ liệu'))
      .finally(() => setLoadingMeta(false));
  }, []);

  // Load rounds when event changes
  useEffect(() => {
    if (selectedEventId === '') { setRounds([]); setSelectedRoundId(''); setAssigned([]); return; }
    setLoadingRounds(true);
    getEventRounds(selectedEventId as number)
      .then(roundList => setRounds(safeArray(roundList)))
      .catch(err => toast.error(err instanceof Error ? err.message : 'Không tải được rounds'))
      .finally(() => setLoadingRounds(false));
    setSelectedRoundId('');
    setAssigned([]);
  }, [selectedEventId]);

  const loadAssigned = useCallback(async (eventId: number, roundId: number) => {
    setLoadingAssigned(true);
    try {
      setAssigned(safeArray(await getRoundJudges(eventId, roundId)));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Không tải được danh sách judge');
    } finally {
      setLoadingAssigned(false);
    }
  }, []);

  // Load assigned judges when round changes
  useEffect(() => {
    if (selectedEventId === '' || selectedRoundId === '') { setAssigned([]); return; }
    loadAssigned(selectedEventId as number, selectedRoundId as number);
  }, [selectedEventId, selectedRoundId, loadAssigned]);

  const handleAssign = async () => {
    if (!selectedJudgeId || selectedEventId === '' || selectedRoundId === '') return;
    setAssigning(true);
    try {
      const newAssign = await assignJudge(
        selectedEventId as number,
        selectedRoundId as number,
        { judgeId: selectedJudgeId as number },
      );
      setAssigned(prev => [...prev, newAssign]);
      setSelectedJudgeId('');
      toast.success('Đã gán judge thành công');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Gán judge thất bại');
    } finally {
      setAssigning(false);
    }
  };

  const handleRemove = async (a: RoundJudge) => {
    if (selectedEventId === '' || selectedRoundId === '') return;
    setRemovingId(a.assignmentId);
    try {
      await revokeJudge(selectedEventId as number, selectedRoundId as number, a.assignmentId);
      setAssigned(prev => prev.filter(x => x.assignmentId !== a.assignmentId));
      toast.success(`Đã gỡ ${a.fullName} khỏi round`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Gỡ judge thất bại');
    } finally {
      setRemovingId(null);
    }
  };

  const handleCreateGuest = async () => {
    if (!guestEmail.trim() || !guestName.trim()) { toast.error('Email và Họ tên là bắt buộc'); return; }
    setCreatingGuest(true);
    try {
      const result = await createGuestJudge({
        email: guestEmail.trim(),
        fullName: guestName.trim(),
        phone: guestPhone.trim() || undefined,
      });
      setTempResult(result);
      setJudgePool(prev => [
        ...prev.filter(j => j.id !== result.userId),
        {
          id: result.userId,
          fullName: result.fullName,
          email: result.email,
          accountType: 'GUEST_JUDGE',
        },
      ]);
      // Refresh judge pool so new guest appears in dropdown
      getJudges()
        .then(pool => setJudgePool(safeArray(pool)))
        .catch(err => toast.error(err instanceof Error ? err.message : 'Không tải lại được danh sách judge'));
      toast.success(`Guest judge "${result.fullName}" đã được tạo`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Tạo guest judge thất bại');
    } finally {
      setCreatingGuest(false);
    }
  };

  const handleCloseCreate = () => {
    setShowCreate(false);
    setGuestName('');
    setGuestEmail('');
    setGuestPhone('');
    setTempResult(null);
    setCopied(false);
  };

  const availableJudges = judgePool.filter(j => !assigned.some(a => a.judgeId === j.id));
  const selectedRoundName = rounds.find(r => r.id === selectedRoundId)?.name ?? 'Round';

  return (
    <div className="p-7 space-y-5">
      <PageHeader
        title="Judge Assignment"
        subtitle="Assign internal and guest judges to rounds"
        actions={
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 bg-blue-800 hover:bg-blue-900 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" /> Create Guest Judge
          </button>
        }
      />

      {/* Event + Round selectors */}
      <div className="flex gap-3 flex-wrap items-end">
        <div className="min-w-[260px]">
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Event</label>
          <select
            value={selectedEventId}
            onChange={e => setSelectedEventId(e.target.value === '' ? '' : Number(e.target.value))}
            disabled={loadingMeta}
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-700 disabled:opacity-50"
          >
            <option value="">{loadingMeta ? 'Đang tải…' : '— Chọn event —'}</option>
            {events.map(ev => <option key={ev.id} value={ev.id}>{ev.name}</option>)}
          </select>
        </div>
        <div className="min-w-[200px]">
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Round</label>
          <select
            value={selectedRoundId}
            onChange={e => setSelectedRoundId(e.target.value === '' ? '' : Number(e.target.value))}
            disabled={selectedEventId === '' || loadingRounds}
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-700 disabled:opacity-50 disabled:bg-slate-50"
          >
            <option value="">{selectedEventId === '' ? '— Chọn event trước —' : loadingRounds ? 'Đang tải…' : '— Chọn round —'}</option>
            {rounds.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
          </select>
        </div>
        {selectedRoundId !== '' && (
          <button
            onClick={() => loadAssigned(selectedEventId as number, selectedRoundId as number)}
            disabled={loadingAssigned}
            className="flex items-center gap-1.5 border border-slate-200 text-slate-600 text-sm px-3 py-2 rounded-lg hover:bg-slate-50 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loadingAssigned ? 'animate-spin' : ''}`} /> Refresh
          </button>
        )}
      </div>

      {/* Placeholder when no round selected */}
      {selectedRoundId === '' && (
        <div className="flex flex-col items-center py-20 gap-3 text-slate-400">
          <Gavel className="w-10 h-10 text-slate-300" />
          <p className="text-sm font-medium text-slate-600">Chọn event và round để xem danh sách judge</p>
        </div>
      )}

      {/* Main content: assigned table + assign panel */}
      {selectedRoundId !== '' && (
        <div className="grid grid-cols-3 gap-5">
          {/* Assigned judges */}
          <div className="col-span-2">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200">
              <div className="px-5 py-4 border-b border-slate-100">
                <h3 className="font-semibold text-slate-900" style={{ fontFamily: 'var(--font-display)' }}>
                  Assigned Judges
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">{selectedRoundName} — {assigned.length} judge{assigned.length !== 1 ? 's' : ''}</p>
              </div>

              {loadingAssigned && (
                <div className="flex items-center justify-center py-16 text-slate-400">
                  <RefreshCw className="w-4 h-4 animate-spin mr-2" /><span className="text-sm">Đang tải…</span>
                </div>
              )}

              {!loadingAssigned && assigned.length === 0 && (
                <div className="flex flex-col items-center py-12 gap-2 text-slate-400">
                  <Gavel className="w-8 h-8 text-slate-300" />
                  <p className="text-sm text-slate-500">Chưa có judge nào được gán cho round này</p>
                </div>
              )}

              {!loadingAssigned && assigned.length > 0 && (
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-100">
                      {['Judge', 'Email', 'Type', ''].map(c => (
                        <th key={c} className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">{c}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {assigned.map(a => {
                      const isRemoving = removingId === a.assignmentId;
                      const isGuest = a.accountType === 'GUEST_JUDGE';
                      return (
                        <tr key={a.assignmentId} className="hover:bg-slate-50 transition-colors">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2.5">
                              <div className={`w-7 h-7 rounded-full text-white text-xs font-bold flex items-center justify-center ${isGuest ? 'bg-amber-600' : 'bg-blue-700'}`}>
                                {(a.fullName ?? 'Judge').split(' ').pop()?.[0] ?? '?'}
                              </div>
                              <span className="text-sm font-medium text-slate-900">{a.fullName ?? 'Judge'}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-xs font-mono text-slate-500">{a.email ?? '—'}</td>
                          <td className="px-4 py-3">
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${isGuest ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>
                              {isGuest ? 'Guest' : 'Internal'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <button
                              onClick={() => handleRemove(a)}
                              disabled={removingId !== null}
                              className="flex items-center gap-1 text-xs text-red-600 hover:text-red-700 hover:bg-red-50 disabled:opacity-50 px-2 py-1 rounded transition-colors ml-auto"
                            >
                              {isRemoving
                                ? <span className="w-3 h-3 border-2 border-red-300 border-t-red-600 rounded-full animate-spin" />
                                : <XCircle className="w-3.5 h-3.5" />}
                              Remove
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* Assign panel */}
          <div className="space-y-4">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
              <h4 className="text-sm font-semibold text-slate-900 mb-3">Assign Judge</h4>
              <div className="space-y-3">
                <select
                  value={selectedJudgeId}
                  onChange={e => setSelectedJudgeId(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-700"
                >
                  <option value="">
                    {availableJudges.length === 0 ? 'Tất cả đã được gán' : '— Chọn judge —'}
                  </option>
                  {availableJudges.map(j => (
                    <option key={j.id} value={j.id}>
                      {j.fullName} ({j.accountType === 'GUEST_JUDGE' ? 'Guest' : 'Internal'})
                    </option>
                  ))}
                </select>
                <button
                  onClick={handleAssign}
                  disabled={!selectedJudgeId || assigning}
                  className="w-full flex items-center justify-center gap-2 bg-blue-800 hover:bg-blue-900 disabled:opacity-50 text-white text-sm font-semibold py-2 rounded-lg transition-colors"
                >
                  {assigning
                    ? <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    : <Check className="w-3.5 h-3.5" />}
                  Assign to {selectedRoundName}
                </button>
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
              <p className="text-xs text-slate-500 leading-relaxed">
                <strong className="text-slate-700">Lưu ý:</strong> Dropdown chỉ hiện judge chưa được gán vào round này.
                Dùng nút <em>Create Guest Judge</em> để tạo tài khoản mới.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── Create Guest Judge dialog ── */}
      {showCreate && (
        <Modal
          title={tempResult ? 'Guest Judge Created' : 'Create Guest Judge Account'}
          onClose={handleCloseCreate}
          size="md"
          footer={
            tempResult ? (
              <button onClick={handleCloseCreate} className="px-4 py-2 bg-blue-800 hover:bg-blue-900 text-white text-sm font-semibold rounded-lg">Done</button>
            ) : (
              <>
                <button onClick={handleCloseCreate} disabled={creatingGuest} className="px-4 py-2 border border-slate-200 text-slate-600 text-sm rounded-lg hover:bg-slate-50">Cancel</button>
                <button
                  onClick={handleCreateGuest}
                  disabled={creatingGuest || !guestEmail.trim() || !guestName.trim()}
                  className="px-4 py-2 bg-blue-800 hover:bg-blue-900 disabled:opacity-50 text-white text-sm font-semibold rounded-lg flex items-center gap-2"
                >
                  {creatingGuest && <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />}
                  Create Account
                </button>
              </>
            )
          }
        >
          {tempResult ? (
            /* One-time temp password reveal */
            <div className="space-y-4">
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-emerald-800">Tài khoản đã tạo cho {tempResult.fullName}</p>
                  <p className="text-xs text-emerald-700 mt-0.5">{tempResult.email}</p>
                </div>
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-800 mb-1.5 flex items-center gap-1.5">
                  <Key className="w-4 h-4 text-amber-600" />
                  Mật khẩu tạm thời
                  <span className="text-xs font-normal text-red-600 ml-1">(hiện một lần duy nhất — copy ngay)</span>
                </p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 bg-slate-100 border border-slate-200 rounded-lg px-3 py-2.5 text-sm font-mono font-bold text-slate-900 select-all break-all">
                    {tempResult.temporaryPassword}
                  </code>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(tempResult.temporaryPassword);
                      setCopied(true);
                      setTimeout(() => setCopied(false), 2000);
                    }}
                    className={`flex items-center gap-1.5 text-sm px-3 py-2.5 rounded-lg border transition-colors flex-shrink-0 ${copied ? 'bg-emerald-100 border-emerald-300 text-emerald-700' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                  >
                    {copied ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    {copied ? 'Copied' : 'Copy'}
                  </button>
                </div>
                <p className="text-xs text-slate-500 mt-2">Judge sẽ cần đổi mật khẩu khi đăng nhập lần đầu. Copy trước khi đóng dialog.</p>
              </div>
            </div>
          ) : (
            /* Create form */
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Họ và tên <span className="text-red-500">*</span></label>
                  <input
                    value={guestName}
                    onChange={e => setGuestName(e.target.value)}
                    autoFocus
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-700"
                    placeholder="Dr. Jane Smith"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Email <span className="text-red-500">*</span></label>
                  <input
                    value={guestEmail}
                    onChange={e => setGuestEmail(e.target.value)}
                    type="email"
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-700"
                    placeholder="jane@company.com"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Số điện thoại <span className="text-slate-400 text-xs font-normal">(tùy chọn)</span>
                </label>
                <input
                  value={guestPhone}
                  onChange={e => setGuestPhone(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-700"
                  placeholder="+84 90 xxx xxxx"
                />
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-xs text-blue-700">Hệ thống sẽ tạo mật khẩu tạm thời và hiển thị một lần. Coordinator tự chia sẻ thông tin đăng nhập cho guest judge.</p>
              </div>
            </div>
          )}
        </Modal>
      )}
    </div>
  );
}

type TeamStatusFilter = 'all' | 'pending' | 'approved' | 'rejected';

const TEAM_PENDING_STATUSES = new Set(['ACTIVE', 'REGISTERED']);

export function TeamManagement() {
  const [events, setEvents] = useState<EventSummary[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<number | ''>('');
  const [teams, setTeams] = useState<TeamSummary[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [loadingTeams, setLoadingTeams] = useState(false);
  const [teamFilter, setTeamFilter] = useState<TeamStatusFilter>('all');

  // Reject dialog
  const [rejectTarget, setRejectTarget] = useState<TeamSummary | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [actionId, setActionId] = useState<number | null>(null);

  useEffect(() => {
    getEvents()
      .then(eventList => setEvents(safeArray(eventList)))
      .catch(() => toast.error('Không tải được danh sách event'))
      .finally(() => setLoadingEvents(false));
  }, []);

  const loadTeams = useCallback(async (eventId: number) => {
    setLoadingTeams(true);
    try {
      setTeams(safeArray(await getTeamsByEvent(eventId)));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Không tải được danh sách team');
    } finally {
      setLoadingTeams(false);
    }
  }, []);

  const handleEventChange = (id: number | '') => {
    setSelectedEventId(id);
    setTeams([]);
    if (id !== '') loadTeams(id as number);
  };

  const handleApprove = async (t: TeamSummary) => {
    setActionId(t.id);
    try {
      await reviewTeam(t.id, { approved: true });
      setTeams(prev => prev.map(x => x.id === t.id ? { ...x, status: 'APPROVED' } : x));
      toast.success(`Team "${t.name}" đã được duyệt`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Duyệt thất bại');
    } finally {
      setActionId(null);
    }
  };

  const handleRejectOpen = (t: TeamSummary) => { setRejectTarget(t); setRejectReason(''); };

  const handleRejectSubmit = async () => {
    if (!rejectTarget) return;
    if (!rejectReason.trim()) { toast.error('Vui lòng nhập lý do từ chối'); return; }
    setActionId(rejectTarget.id);
    try {
      await reviewTeam(rejectTarget.id, { approved: false, reason: rejectReason.trim() });
      setTeams(prev => prev.map(x => x.id === rejectTarget.id ? { ...x, status: 'REJECTED' } : x));
      toast.success(`Đã từ chối team "${rejectTarget.name}"`);
      setRejectTarget(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Từ chối thất bại');
    } finally {
      setActionId(null);
    }
  };

  const selectedEvent = events.find(e => e.id === selectedEventId);

  const filteredTeams = teamFilter === 'all' ? teams
    : teamFilter === 'pending' ? teams.filter(t => TEAM_PENDING_STATUSES.has(t.status))
    : teamFilter === 'approved' ? teams.filter(t => t.status === 'APPROVED')
    : teams.filter(t => t.status === 'REJECTED');

  return (
    <div className="p-7 space-y-5">
      <PageHeader
        title="Team Registration"
        subtitle={selectedEvent ? `${filteredTeams.length}/${teams.length} teams — ${selectedEvent.name}` : 'Chọn event để xem danh sách team'}
        actions={
          selectedEventId !== '' && (
            <button onClick={() => loadTeams(selectedEventId as number)} disabled={loadingTeams} className="flex items-center gap-1.5 border border-slate-200 text-slate-600 text-sm px-3 py-2 rounded-lg hover:bg-slate-50 disabled:opacity-50">
              <RefreshCw className={`w-4 h-4 ${loadingTeams ? 'animate-spin' : ''}`} /> Refresh
            </button>
          )
        }
      />

      {/* Event selector */}
      <div className="max-w-sm">
        <select
          value={selectedEventId}
          onChange={e => handleEventChange(e.target.value === '' ? '' : Number(e.target.value))}
          disabled={loadingEvents}
          className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-700 disabled:opacity-50"
        >
          <option value="">{loadingEvents ? 'Đang tải events…' : '— Chọn event —'}</option>
          {events.map(ev => <option key={ev.id} value={ev.id}>{ev.name}</option>)}
        </select>
      </div>

      {/* Status filter tabs (only show when teams loaded) */}
      {selectedEventId !== '' && !loadingTeams && (
        <div className="flex gap-1 border-b border-slate-200">
          {([['all', 'All'], ['pending', 'Pending'], ['approved', 'Approved'], ['rejected', 'Rejected']] as [TeamStatusFilter, string][]).map(([f, label]) => {
            const count = f === 'all' ? teams.length
              : f === 'pending' ? teams.filter(t => TEAM_PENDING_STATUSES.has(t.status)).length
              : f === 'approved' ? teams.filter(t => t.status === 'APPROVED').length
              : teams.filter(t => t.status === 'REJECTED').length;
            return (
              <button
                key={f}
                onClick={() => setTeamFilter(f)}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-px flex items-center gap-1.5 ${
                  teamFilter === f ? 'border-blue-700 text-blue-700' : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                {label}
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${teamFilter === f ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-500'}`}>{count}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Loading teams */}
      {loadingTeams && (
        <div className="flex items-center justify-center py-16 text-slate-400">
          <RefreshCw className="w-5 h-5 animate-spin mr-2" /><span className="text-sm">Đang tải team…</span>
        </div>
      )}

      {/* Empty state */}
      {!loadingTeams && selectedEventId !== '' && teams.length === 0 && (
        <div className="flex flex-col items-center py-16 gap-2 text-slate-400">
          <Users className="w-10 h-10 text-slate-300" />
          <p className="text-sm font-medium text-slate-600">Chưa có team nào đăng ký</p>
        </div>
      )}

      {/* Prompt to select */}
      {selectedEventId === '' && !loadingEvents && (
        <div className="flex flex-col items-center py-16 gap-2 text-slate-400">
          <Calendar className="w-10 h-10 text-slate-300" />
          <p className="text-sm font-medium text-slate-600">Chọn event để xem danh sách team</p>
        </div>
      )}

      {/* Team table */}
      {!loadingTeams && teams.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100">
                {['Team Name', 'Category', 'Leader', 'Members', 'Status', 'Điều kiện & Actions'].map(c => (
                  <th key={c} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">{c}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTeams.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-10 text-center text-sm text-slate-400">Không có team nào ở trạng thái này</td></tr>
              ) : filteredTeams.map(t => {
                const mc = t.memberCount ?? 0;
                const isActive = actionId === t.id;
                const canReview = TEAM_PENDING_STATUSES.has(t.status);

                // Checklist conditions (TASK 4)
                const memberValid = mc >= 3 && mc <= 5;
                const categoryValid = !!t.categoryName;
                const canApprove = memberValid && categoryValid;
                const denyReasons = [
                  !memberValid && `Sĩ số ${mc} (cần 3–5)`,
                  !categoryValid && 'Chưa chọn category',
                ].filter(Boolean).join(', ');

                return (
                  <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 text-sm font-semibold text-slate-900">{t.name}</td>
                    <td className="px-4 py-3 text-sm text-slate-600">{t.categoryName ?? '—'}</td>
                    <td className="px-4 py-3 text-sm text-slate-700">{t.leaderName ?? '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-mono px-2 py-0.5 rounded-full ${mc >= 3 && mc <= 5 ? 'bg-emerald-100 text-emerald-700' : mc === 0 ? 'bg-slate-100 text-slate-500' : 'bg-amber-100 text-amber-700'}`}>
                        {mc > 0 ? `${mc} / 5` : '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3"><StatusBadge status={t.status} /></td>
                    <td className="px-4 py-3">
                      {canReview && (
                        <div className="space-y-1.5">
                          {/* Approval checklist */}
                          <div className="flex flex-col gap-0.5">
                            <span className={`text-[11px] flex items-center gap-1 ${memberValid ? 'text-emerald-600' : 'text-red-600'}`}>
                              {memberValid ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                              Sĩ số 3–5 (hiện {mc})
                            </span>
                            <span className={`text-[11px] flex items-center gap-1 ${categoryValid ? 'text-emerald-600' : 'text-red-600'}`}>
                              {categoryValid ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                              Đã chọn category
                            </span>
                          </div>
                          {/* Action buttons */}
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => canApprove && handleApprove(t)}
                              disabled={isActive || !canApprove}
                              title={!canApprove ? `Không thể duyệt: ${denyReasons}` : 'Approve team'}
                              className={`flex items-center gap-1 text-xs px-2 py-1 rounded font-medium transition-colors ${
                                canApprove
                                  ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 disabled:opacity-50'
                                  : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                              }`}
                            >
                              {isActive ? <span className="w-3 h-3 border-2 border-emerald-400/40 border-t-emerald-600 rounded-full animate-spin" /> : <Check className="w-3 h-3" />}
                              Approve
                            </button>
                            <button
                              onClick={() => handleRejectOpen(t)}
                              disabled={isActive}
                              className="flex items-center gap-1 text-xs bg-red-50 text-red-700 hover:bg-red-100 disabled:opacity-50 px-2 py-1 rounded font-medium transition-colors"
                            >
                              <XCircle className="w-3 h-3" /> Reject
                            </button>
                          </div>
                        </div>
                      )}
                      {(t.status === 'APPROVED' || t.status === 'REJECTED') && (
                        <span className="text-xs text-slate-400 italic">
                          {t.status === 'APPROVED' ? 'Approved' : 'Rejected'}
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Reject dialog */}
      {rejectTarget && (
        <Modal
          title="Reject Team"
          subtitle={`${rejectTarget.name}${rejectTarget.categoryName ? ` — ${rejectTarget.categoryName}` : ''}`}
          onClose={() => setRejectTarget(null)}
          size="sm"
          footer={
            <>
              <button onClick={() => setRejectTarget(null)} disabled={actionId !== null} className="px-4 py-2 border border-slate-200 text-slate-600 text-sm rounded-lg hover:bg-slate-50">Cancel</button>
              <button onClick={handleRejectSubmit} disabled={actionId !== null || !rejectReason.trim()} className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-sm font-semibold rounded-lg flex items-center gap-2">
                {actionId !== null && <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />}
                Reject Team
              </button>
            </>
          }
        >
          <div className="space-y-3">
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">Team sẽ nhận được thông báo từ chối kèm lý do.</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Lý do từ chối <span className="text-red-500">*</span></label>
              <textarea
                value={rejectReason}
                onChange={e => setRejectReason(e.target.value)}
                autoFocus
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-red-500"
                rows={3}
                placeholder="VD: Số lượng thành viên không đủ điều kiện tham gia"
              />
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ── Account Approvals ─────────────────────────────────────────────────────────
type AccountTab = 'pending' | 'approved' | 'rejected';

export function AccountApprovalsPage() {
  const [accountTab, setAccountTab] = useState<AccountTab>('pending');
  const [accounts, setAccounts] = useState<PendingAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Approved / rejected tabs state
  const [statusAccounts, setStatusAccounts] = useState<PendingAccount[]>([]);
  const [statusLoading, setStatusLoading] = useState(false);
  const [statusError, setStatusError] = useState<string | null>(null);

  // Reject dialog state
  const [rejectTarget, setRejectTarget] = useState<PendingAccount | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getPendingAccounts(0, 50);
      setAccounts(safeArray(data.content));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Không tải được danh sách';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadByStatus = useCallback(async (status: 'APPROVED' | 'REJECTED') => {
    setStatusLoading(true);
    setStatusError(null);
    try {
      const data = await getAccountsByStatus(status, 0, 50);
      setStatusAccounts(safeArray(data.content));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Không tải được danh sách';
      setStatusError(message);
      toast.error(message);
    } finally {
      setStatusLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (accountTab === 'approved') loadByStatus('APPROVED');
    else if (accountTab === 'rejected') loadByStatus('REJECTED');
  }, [accountTab, loadByStatus]);

  const handleApprove = async (account: PendingAccount) => {
    setActionLoading(true);
    try {
      await approveAccount(account.id);
      setAccounts(prev => prev.filter(a => a.id !== account.id));
      toast.success(`Đã duyệt tài khoản ${account.fullName}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Duyệt thất bại');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectSubmit = async () => {
    if (!rejectTarget) return;
    if (!rejectReason.trim()) {
      toast.error('Vui lòng nhập lý do từ chối');
      return;
    }
    setActionLoading(true);
    try {
      await rejectAccount(rejectTarget.id, rejectReason.trim());
      setAccounts(prev => prev.filter(a => a.id !== rejectTarget.id));
      toast.success(`Đã từ chối tài khoản ${rejectTarget.fullName}`);
      setRejectTarget(null);
      setRejectReason('');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Từ chối thất bại');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="p-7 space-y-5">
      <PageHeader
        title="Account Approvals"
        subtitle="Duyệt tài khoản đăng ký theo trạng thái"
        actions={
          accountTab === 'pending' && (
            <button
              onClick={load}
              disabled={loading}
              className="flex items-center gap-1.5 border border-slate-200 text-slate-600 text-sm px-3 py-2 rounded-lg hover:bg-slate-50 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          )
        }
      />

      {/* Status tabs */}
      <div className="flex gap-1 border-b border-slate-200">
        {([['pending', 'Pending'], ['approved', 'Approved'], ['rejected', 'Rejected']] as [AccountTab, string][]).map(([tab, label]) => (
          <button
            key={tab}
            onClick={() => setAccountTab(tab)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-px ${
              accountTab === tab
                ? 'border-blue-700 text-blue-700'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Approved / Rejected tabs */}
      {(accountTab === 'approved' || accountTab === 'rejected') && (
        <>
          <div className="flex justify-end">
            <button
              onClick={() => loadByStatus(accountTab === 'approved' ? 'APPROVED' : 'REJECTED')}
              disabled={statusLoading}
              className="flex items-center gap-1.5 border border-slate-200 text-slate-600 text-sm px-3 py-2 rounded-lg hover:bg-slate-50 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${statusLoading ? 'animate-spin' : ''}`} /> Refresh
            </button>
          </div>
          {statusLoading && (
            <div className="flex items-center justify-center py-20 text-slate-400">
              <RefreshCw className="w-5 h-5 animate-spin mr-2" />
              <span className="text-sm">Đang tải…</span>
            </div>
          )}
          {!statusLoading && statusError && (
            <div className="flex flex-col items-center py-16 gap-3">
              <AlertTriangle className="w-8 h-8 text-red-400" />
              <p className="text-sm text-red-600">{statusError}</p>
              <button onClick={() => loadByStatus(accountTab === 'approved' ? 'APPROVED' : 'REJECTED')} className="text-sm text-blue-700 underline">Thử lại</button>
            </div>
          )}
          {!statusLoading && !statusError && statusAccounts.length === 0 && (
            <div className="flex flex-col items-center py-20 gap-3 text-slate-400">
              <CheckCircle2 className="w-10 h-10 text-slate-300" />
              <p className="text-sm font-medium text-slate-600">Không có tài khoản nào</p>
            </div>
          )}
          {!statusLoading && !statusError && statusAccounts.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200">
              <div className="px-5 py-3 border-b border-slate-100">
                <span className="text-sm font-semibold text-slate-700">
                  {statusAccounts.length} tài khoản {accountTab === 'approved' ? 'đã duyệt' : 'đã từ chối'}
                </span>
              </div>
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-100">
                    {['Họ tên', 'Email', 'Loại SV', 'Mã SV / Trường', 'Ngày đăng ký'].map(c => (
                      <th key={c} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">{c}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {statusAccounts.map(acc => (
                    <tr key={acc.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3">
                        <p className="text-sm font-semibold text-slate-900">{acc.fullName}</p>
                        <p className="text-xs text-slate-400 font-mono">#{acc.id}</p>
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600">{acc.email}</td>
                      <td className="px-4 py-3">
                        {acc.fptStudent ? (
                          <span className="inline-flex items-center gap-1 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">
                            <GraduationCap className="w-3 h-3" /> FPT
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-medium">
                            <Building2 className="w-3 h-3" /> External
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {acc.studentId && <span className="text-xs font-mono text-slate-700">{acc.studentId}</span>}
                        {acc.university && <p className="text-xs text-slate-500 mt-0.5">{acc.university}</p>}
                        {!acc.studentId && !acc.university && <span className="text-xs text-slate-400">—</span>}
                      </td>
                      <td className="px-4 py-3 text-xs font-mono text-slate-500">
                        {acc.createdAt ? acc.createdAt.replace('T', ' ').slice(0, 16) : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* Pending tab content */}
      {accountTab === 'pending' && <>
      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-20 text-slate-400">
          <RefreshCw className="w-5 h-5 animate-spin mr-2" />
          <span className="text-sm">Đang tải…</span>
        </div>
      )}

      {/* Error */}
      {!loading && error && (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <AlertTriangle className="w-8 h-8 text-red-400" />
          <p className="text-sm text-red-600">{error}</p>
          <button onClick={load} className="text-sm text-blue-700 underline">Thử lại</button>
        </div>
      )}

      {/* Empty */}
      {!loading && !error && accounts.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-400">
          <CheckCircle2 className="w-10 h-10 text-emerald-400" />
          <p className="text-sm font-medium text-slate-600">Không có tài khoản chờ duyệt</p>
          <p className="text-xs">Tất cả đăng ký đã được xử lý.</p>
        </div>
      )}

      {/* Table */}
      {!loading && !error && accounts.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200">
          <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
            <span className="text-sm font-semibold text-slate-700">
              {accounts.length} tài khoản đang chờ
            </span>
          </div>
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100">
                {['Họ tên', 'Email', 'Loại SV', 'Mã SV / Trường', 'Ngày đăng ký', 'Thao tác'].map(c => (
                  <th key={c} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {accounts.map(acc => (
                <tr key={acc.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3">
                    <p className="text-sm font-semibold text-slate-900">{acc.fullName}</p>
                    <p className="text-xs text-slate-400 font-mono">#{acc.id}</p>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-600">{acc.email}</td>
                  <td className="px-4 py-3">
                    {acc.fptStudent ? (
                      <span className="inline-flex items-center gap-1 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">
                        <GraduationCap className="w-3 h-3" /> FPT
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-medium">
                        <Building2 className="w-3 h-3" /> External
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {acc.studentId && (
                      <span className="text-xs font-mono text-slate-700">{acc.studentId}</span>
                    )}
                    {acc.university && (
                      <p className="text-xs text-slate-500 mt-0.5">{acc.university}</p>
                    )}
                    {!acc.studentId && !acc.university && (
                      <span className="text-xs text-slate-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs font-mono text-slate-500">
                    {acc.createdAt ? acc.createdAt.replace('T', ' ').slice(0, 16) : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleApprove(acc)}
                        disabled={actionLoading}
                        className="flex items-center gap-1 text-xs bg-emerald-50 text-emerald-700 hover:bg-emerald-100 disabled:opacity-50 px-2.5 py-1.5 rounded-lg font-semibold transition-colors"
                      >
                        <UserCheck className="w-3.5 h-3.5" /> Approve
                      </button>
                      <button
                        onClick={() => { setRejectTarget(acc); setRejectReason(''); }}
                        disabled={actionLoading}
                        className="flex items-center gap-1 text-xs bg-red-50 text-red-700 hover:bg-red-100 disabled:opacity-50 px-2.5 py-1.5 rounded-lg font-semibold transition-colors"
                      >
                        <UserX className="w-3.5 h-3.5" /> Reject
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      </>}

      {/* Reject Dialog */}
      {rejectTarget && (
        <Modal
          title="Từ chối tài khoản"
          subtitle={`${rejectTarget.fullName} — ${rejectTarget.email}`}
          onClose={() => { setRejectTarget(null); setRejectReason(''); }}
          size="sm"
          footer={
            <>
              <button
                onClick={() => { setRejectTarget(null); setRejectReason(''); }}
                disabled={actionLoading}
                className="px-4 py-2 border border-slate-200 text-slate-600 text-sm rounded-lg hover:bg-slate-50"
              >
                Huỷ
              </button>
              <button
                onClick={handleRejectSubmit}
                disabled={actionLoading || !rejectReason.trim()}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition-colors flex items-center gap-2"
              >
                {actionLoading && <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />}
                Xác nhận từ chối
              </button>
            </>
          }
        >
          <div className="space-y-3">
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">
                Tài khoản sẽ bị từ chối và người dùng sẽ không thể đăng nhập. Lý do sẽ được lưu lại.
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Lý do từ chối <span className="text-red-500">*</span>
              </label>
              <textarea
                value={rejectReason}
                onChange={e => setRejectReason(e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-red-400"
                rows={3}
                placeholder="VD: Mã sinh viên không tồn tại trong hệ thống FPT University."
                autoFocus
              />
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ── Lifecycle action config per status ───────────────────────────────────────
type LifecycleAction = {
  label: string;
  Icon: React.ElementType;
  btnClass: string;
  requireConfirm?: boolean;
  confirmTitle?: string;
  confirmBody?: string;
};

const LIFECYCLE: Partial<Record<string, LifecycleAction>> = {
  DRAFT: {
    label: 'Submit for Approval',
    Icon: Send,
    btnClass: 'bg-blue-800 hover:bg-blue-900 text-white',
    requireConfirm: true,
    confirmTitle: 'Submit for Approval?',
    confirmBody: 'Event sẽ chuyển sang PENDING_APPROVAL và bị khoá chỉnh sửa cho đến khi Super Coordinator duyệt. Bạn chắc chắn?',
  },
  APPROVED: {
    label: 'Open Registration',
    Icon: Globe,
    btnClass: 'bg-emerald-700 hover:bg-emerald-800 text-white',
  },
  OPEN: {
    label: 'Start Event',
    Icon: PlayCircle,
    btnClass: 'bg-blue-700 hover:bg-blue-800 text-white',
  },
  IN_PROGRESS: {
    label: 'Mark as Completed',
    Icon: Trophy,
    btnClass: 'bg-purple-700 hover:bg-purple-800 text-white',
  },
  COMPLETED: {
    label: 'Archive',
    Icon: Archive,
    btnClass: 'bg-slate-600 hover:bg-slate-700 text-white',
  },
};

async function callLifecycleApi(eventId: number, status: string): Promise<void> {
  switch (status) {
    case 'DRAFT':       return submitEvent(eventId);
    case 'APPROVED':    return openEvent(eventId);
    case 'OPEN':        return startEvent(eventId);
    case 'IN_PROGRESS': return completeEvent(eventId);
    case 'COMPLETED':   return archiveEvent(eventId);
    default: throw new Error('No action for this status');
  }
}

// ── Event Detail ──────────────────────────────────────────────────────────────
export function EventDetailPage({
  eventId,
  onNavigate,
}: {
  eventId: number;
  onNavigate: (s: string) => void;
}) {
  const [event, setEvent] = useState<EventSummary | null>(null);
  const [rounds, setRounds] = useState<EventRound[]>([]);
  const [categories, setCategories] = useState<EventCategory[]>([]);
  const [criteriaSets, setCriteriaSets] = useState<CriteriaSet[]>([]);
  const [budget, setBudget] = useState<BudgetResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Lifecycle action state
  const [actionLoading, setActionLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Edit/Delete state for rounds (full fields)
  const [editingRound, setEditingRound] = useState<EventRound | null>(null);
  type RoundEdit = {
    name: string; submissionDeadline: string; scoringDeadline: string;
    promotionTopN: number | ''; finalRound: boolean;
    requiresRepo: boolean; requiresDemo: boolean; requiresSlide: boolean; requiresReport: boolean;
    // Vị trí chèn (order) — chỉ dùng cho modal "Thêm Round"; edit round không đổi order.
    orderNumber?: number | '';
  };
  const EMPTY_ROUND: RoundEdit = {
    name: '', submissionDeadline: '', scoringDeadline: '', promotionTopN: '', finalRound: false,
    requiresRepo: false, requiresDemo: false, requiresSlide: false, requiresReport: false,
    orderNumber: '',
  };
  const [editRoundFields, setEditRoundFields] = useState<RoundEdit>(EMPTY_ROUND);
  const [newRoundFields, setNewRoundFields] = useState<RoundEdit>(EMPTY_ROUND);
  const [deletingRoundId, setDeletingRoundId] = useState<number | null>(null);

  // Round lifecycle (FR-EVT-02): transition state + unlock-with-reason modal
  const [transitioningRoundId, setTransitioningRoundId] = useState<number | null>(null);
  const [unlockingRound, setUnlockingRound] = useState<EventRound | null>(null);
  const [unlockReason, setUnlockReason] = useState('');

  // Edit/Delete state for categories
  const [editingCategory, setEditingCategory] = useState<EventCategory | null>(null);
  const [editCategoryName, setEditCategoryName] = useState('');
  const [editCategoryMentorId, setEditCategoryMentorId] = useState<number | ''>('');
  const [deletingCategoryId, setDeletingCategoryId] = useState<number | null>(null);

  // Budget item editing
  const [budgetCategories, setBudgetCategories] = useState<BudgetCategory[]>([]);
  const [mentors, setMentors] = useState<Mentor[]>([]);
  type BudgetItemEdit = { categoryId: number | ''; description: string; quantity: number | ''; unitCost: number | ''; notes: string };
  const [editingBudgetItem, setEditingBudgetItem] = useState<BudgetItem | null>(null);
  const [editBiFields, setEditBiFields] = useState<BudgetItemEdit>({ categoryId: '', description: '', quantity: '', unitCost: '', notes: '' });
  const [savingBudgetItem, setSavingBudgetItem] = useState(false);

  // Capacity editing (via PATCH event — not set at create time)
  type CapacityEdit = { maxTeamSize: number | ''; maxTeams: number | ''; maxParticipants: number | ''; maxTeamsPerMentor: number | '' };
  const [capacityEdit, setCapacityEdit] = useState<CapacityEdit>({ maxTeamSize: '', maxTeams: '', maxParticipants: '', maxTeamsPerMentor: '' });
  const [savingCapacity, setSavingCapacity] = useState(false);
  // Field nào coordinator đã tự sửa → ngừng autofill field đó (link ↻ để xin gợi ý lại).
  type CapacitySuggested = 'maxParticipants' | 'maxTeamsPerMentor';
  const [capacityTouched, setCapacityTouched] = useState<Record<CapacitySuggested, boolean>>({ maxParticipants: false, maxTeamsPerMentor: false });
  // Fallback nhãn term plan khi EventResponse không kèm label (map termPlanId qua GET /api/term-plans).
  const [termPlanLabelFallback, setTermPlanLabelFallback] = useState<string | null>(null);

  // Basic info editing (PATCH /api/events/{id} — name/description/registration window)
  type BasicEdit = { name: string; description: string; registrationStart: string; registrationEnd: string };
  const [basicEdit, setBasicEdit] = useState<BasicEdit>({ name: '', description: '', registrationStart: '', registrationEnd: '' });
  const [savingBasic, setSavingBasic] = useState(false);

  // Add round (POST /api/events/{eventId}/rounds)
  const [addingRound, setAddingRound] = useState(false);
  const [savingNewRound, setSavingNewRound] = useState(false);

  // Add category (POST /api/events/{eventId}/categories)
  type CategoryForm = { name: string; description: string; mentorId: number | '' };
  const [addingCategory, setAddingCategory] = useState(false);
  const [newCategory, setNewCategory] = useState<CategoryForm>({ name: '', description: '', mentorId: '' });
  const [savingNewCategory, setSavingNewCategory] = useState(false);
  const [editCategoryDescription, setEditCategoryDescription] = useState('');

  // Criteria set editing state
  type CriterionEdit = { id: number; name: string; maxScore: number; weight: number; description?: string };
  const [editingCs, setEditingCs] = useState<CriteriaSet | null>(null);
  const [editCsName, setEditCsName] = useState('');
  const [editCsCriteria, setEditCsCriteria] = useState<CriterionEdit[]>([]);
  const [csActionLoading, setCsActionLoading] = useState(false);
  const [deletingCsId, setDeletingCsId] = useState<number | null>(null);

  // Add criteria set modal state
  type NewCsForm = { name: string; roundId: number | ''; applyToAllRounds: boolean; categoryId: number | null; promotionTopN: number | '' };
  const [addingCs, setAddingCs] = useState(false);
  const [newCsForm, setNewCsForm] = useState<NewCsForm>({ name: '', roundId: '', applyToAllRounds: false, categoryId: null, promotionTopN: '' });
  const [newCsCriteria, setNewCsCriteria] = useState<CriterionForm[]>([
    { name: '', description: '', maxScore: 10, weight: 100, active: true },
  ]);
  const [savingCs, setSavingCs] = useState(false);

  // Budget item editing
  const [deletingBudgetItemId, setDeletingBudgetItemId] = useState<number | null>(null);

  useEffect(() => {
    if (!eventId) return;
    setLoading(true);
    setError(null);

    Promise.all([
      getEvent(eventId),
      getEventRounds(eventId).catch(() => [] as EventRound[]),
      getEventCategories(eventId).catch(() => [] as EventCategory[]),
      getEventCriteriaSets(eventId).catch(() => [] as CriteriaSet[]),
      getBudget(eventId).catch(() => null as BudgetResponse | null),
      getBudgetCategories().catch(() => [] as BudgetCategory[]),
      getMentors().catch(() => [] as Mentor[]),
    ])
      .then(([ev, r, c, cs, bg, bc, m]) => {
        setEvent(ev);
        setRounds(safeArray(r));
        setCategories(safeArray(c));
        setCriteriaSets(safeArray(cs).map(set => ({ ...set, criteria: safeArray(set.criteria) })));
        setBudget(bg);
        setBudgetCategories(safeArray(bc));
        setMentors(safeArray(m));
        setCapacityEdit({
          maxTeamSize: ev.maxTeamSize ?? '',
          maxTeams: ev.maxTeams ?? '',
          maxParticipants: ev.maxParticipants ?? '',
          maxTeamsPerMentor: ev.maxTeamsPerMentor ?? '',
        });
        // Giá trị đã lưu trên BE = lựa chọn có chủ đích trước đó → không autofill đè.
        setCapacityTouched({
          maxParticipants: ev.maxParticipants != null,
          maxTeamsPerMentor: ev.maxTeamsPerMentor != null,
        });
        setBasicEdit({
          name: ev.name ?? '',
          description: ev.description ?? '',
          // BE trả LocalDateTime "YYYY-MM-DDTHH:mm:ss" — input datetime-local cần "YYYY-MM-DDTHH:mm"
          registrationStart: ev.registrationStart?.slice(0, 16) ?? '',
          registrationEnd: ev.registrationEnd?.slice(0, 16) ?? '',
        });
      })
      .catch(err => {
        const message = err instanceof Error ? err.message : 'Không tải được event';
        setError(message);
        toast.error(message);
      })
      .finally(() => setLoading(false));
  }, [eventId]);

  // Fallback: chỉ fetch term plans khi EventResponse thiếu label/term để map termPlanId → nhãn.
  useEffect(() => {
    if (!event) return;
    if (event.termPlanLabel || event.termPlanTerm) { setTermPlanLabelFallback(null); return; }
    if (event.termPlanId == null) return;
    let cancelled = false;
    getTermPlans()
      .then(list => {
        if (cancelled) return;
        const tp = safeArray(list).find(t => t.id === event.termPlanId);
        if (tp) setTermPlanLabelFallback(`${tp.term} ${tp.year}`);
      })
      .catch(() => { /* giữ fallback #id */ });
    return () => { cancelled = true; };
  }, [event]);

  const fmtDate = (s: string | null | undefined) =>
    s ? s.replace('T', ' ').slice(0, 16) : '—';

  // Round transitions chỉ có nghĩa khi event đang chạy (OPEN/IN_PROGRESS)
  const canTransitionRounds =
    !!event && (event.status === 'OPEN' || event.status === 'IN_PROGRESS');

  const runRoundTransition = async (
    round: EventRound,
    action: () => Promise<EventRound>,
    successLabel: string,
  ) => {
    setTransitioningRoundId(round.id);
    try {
      const updated = await action();
      setRounds(prev => prev.map(r => (r.id === updated.id ? updated : r)));
      toast.success(`${round.name}: ${successLabel}`);
    } catch (err) {
      // BE trả message nghiệp vụ rõ ràng (BR-EVT-02, sai thứ tự, không phải owner…) — hiện nguyên văn
      toast.error(err instanceof Error ? err.message : 'Chuyển trạng thái thất bại');
    } finally {
      setTransitioningRoundId(null);
    }
  };

  const handleUnlockRound = async () => {
    if (!unlockingRound || !unlockReason.trim()) return;
    const round = unlockingRound;
    setUnlockingRound(null);
    await runRoundTransition(
      round,
      () => unlockRoundScoring(eventId, round.id, unlockReason.trim()),
      'đã mở khóa chấm điểm (có audit)',
    );
    setUnlockReason('');
  };

  const handleAction = async () => {
    if (!event) return;
    setShowConfirm(false);
    setActionLoading(true);
    try {
      await callLifecycleApi(eventId, event.status);
      const updated = await getEvent(eventId);
      setEvent(updated);
      toast.success(`Event chuyển sang ${updated.status}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Action thất bại');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteRound = async (roundId: number) => {
    setDeletingRoundId(roundId);
    try {
      await deleteRound(eventId, roundId);
      setRounds(prev => prev.filter(r => r.id !== roundId));
      toast.success('Đã xóa round');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Xóa round thất bại');
    } finally {
      setDeletingRoundId(null);
    }
  };

  const handleSaveRound = async () => {
    if (!editingRound || !editRoundFields.name.trim()) return;
    try {
      const updated = await updateRound(eventId, editingRound.id, {
        name: editRoundFields.name.trim(),
        submissionDeadline: editRoundFields.submissionDeadline ? toDateTime(editRoundFields.submissionDeadline, true) : null,
        scoringDeadline: editRoundFields.scoringDeadline ? toDateTime(editRoundFields.scoringDeadline, true) : null,
        promotionTopN: editRoundFields.promotionTopN !== '' ? Number(editRoundFields.promotionTopN) : null,
        finalRound: editRoundFields.finalRound,
        requiresRepo: editRoundFields.requiresRepo,
        requiresDemo: editRoundFields.requiresDemo,
        requiresSlide: editRoundFields.requiresSlide,
        requiresReport: editRoundFields.requiresReport,
      });
      setRounds(prev => prev.map(r => r.id === editingRound.id ? updated : r));
      setEditingRound(null);
      toast.success('Đã cập nhật round');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Cập nhật round thất bại');
    }
  };

  const handleDeleteCategory = async (categoryId: number) => {
    setDeletingCategoryId(categoryId);
    try {
      await deleteCategory(eventId, categoryId);
      setCategories(prev => prev.filter(c => c.id !== categoryId));
      toast.success('Đã xóa category');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Xóa category thất bại');
    } finally {
      setDeletingCategoryId(null);
    }
  };

  const handleSaveCategory = async () => {
    if (!editingCategory || !editCategoryName.trim()) return;
    try {
      const updated = await updateCategory(eventId, editingCategory.id, {
        name: editCategoryName.trim(),
        description: editCategoryDescription.trim(),
        mentorId: editCategoryMentorId !== '' ? Number(editCategoryMentorId) : null,
      });
      setCategories(prev => prev.map(c => c.id === editingCategory.id ? updated : c));
      setEditingCategory(null);
      toast.success('Đã cập nhật category');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Cập nhật category thất bại');
    }
  };

  const handleCreateCs = async () => {
    if (!newCsForm.name.trim()) { toast.error('Tên không được trống'); return; }
    if (!newCsForm.applyToAllRounds && newCsForm.roundId === '') { toast.error('Vui lòng chọn vòng (hoặc tick "Áp cho tất cả")'); return; }
    if (newCsForm.applyToAllRounds && rounds.length === 0) { toast.error('Event chưa có vòng nào'); return; }
    const activeCriteria = newCsCriteria.filter(c => c.active);
    if (activeCriteria.length === 0) { toast.error('Cần ít nhất 1 criterion'); return; }
    const totalW = activeCriteria.reduce((s, c) => s + (Number(c.weight) || 0), 0);
    if (totalW !== 100) { toast.error(`Tổng weight phải = 100%. Hiện tại: ${totalW}%`); return; }
    setSavingCs(true);
    try {
      const payload = {
        name: newCsForm.name.trim(),
        categoryId: newCsForm.categoryId ?? undefined,
        promotionTopN: newCsForm.promotionTopN !== '' ? Number(newCsForm.promotionTopN) : undefined,
        criteria: activeCriteria.map((c, idx) => ({
          name: c.name, description: c.description || undefined,
          maxScore: Number(c.maxScore) || 10, weight: Number(c.weight) || 0, displayOrder: idx + 1,
        })),
      };
      if (newCsForm.applyToAllRounds) {
        const results: CriteriaSet[] = [];
        let skipped = 0;
        for (const r of rounds) {
          try {
            const created = await createCriteriaSet(eventId, { ...payload, roundId: r.id });
            results.push(created);
          } catch {
            skipped++;
          }
        }
        setCriteriaSets(prev => [...prev, ...results]);
        if (skipped > 0) toast.warning(`${skipped} vòng đã có bộ trùng — bỏ qua`);
        toast.success(`Đã tạo bộ tiêu chí cho ${results.length} vòng`);
      } else {
        const created = await createCriteriaSet(eventId, { ...payload, roundId: newCsForm.roundId as number });
        setCriteriaSets(prev => [...prev, created]);
        toast.success('Đã tạo criteria set');
      }
      setAddingCs(false);
      setNewCsForm({ name: '', roundId: '', applyToAllRounds: false, categoryId: null, promotionTopN: '' });
      setNewCsCriteria([{ name: '', description: '', maxScore: 10, weight: 100, active: true }]);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Tạo thất bại');
    } finally {
      setSavingCs(false);
    }
  };

  const openEditCs = (cs: CriteriaSet) => {
    setEditingCs(cs);
    setEditCsName(cs.name);
    setEditCsCriteria((cs.criteria ?? []).map(cr => ({
      id: cr.id, name: cr.name, maxScore: cr.maxScore, weight: cr.weight, description: cr.description ?? '',
    })));
  };

  const handleSaveCs = async () => {
    if (!editingCs) return;
    const totalW = editCsCriteria.reduce((s, c) => s + (Number(c.weight) || 0), 0);
    if (totalW !== 100) { toast.error(`Tổng weight phải bằng 100%. Hiện tại: ${totalW}%`); return; }
    if (!editCsName.trim()) { toast.error('Tên criteria set không được trống'); return; }
    setCsActionLoading(true);
    try {
      // PATCH name first, then PUT criteria list
      const patched = await patchCriteriaSet(eventId, editingCs.id, { name: editCsName.trim() });
      const withCriteria = await replaceCriteria(eventId, editingCs.id, {
        criteria: editCsCriteria.map((c, idx) => ({
          name: c.name, description: c.description || undefined,
          maxScore: c.maxScore, weight: c.weight, displayOrder: idx + 1,
        })),
      });
      const merged = { ...patched, criteria: safeArray(withCriteria.criteria) };
      setCriteriaSets(prev => prev.map(cs => cs.id === editingCs.id ? merged : cs));
      setEditingCs(null);
      toast.success('Đã cập nhật criteria set');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Cập nhật thất bại');
    } finally {
      setCsActionLoading(false);
    }
  };

  const handleDeleteCs = async (csId: number) => {
    setDeletingCsId(csId);
    try {
      await deleteCriteriaSet(eventId, csId);
      setCriteriaSets(prev => prev.filter(cs => cs.id !== csId));
      toast.success('Đã xóa criteria set');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Xóa criteria set thất bại');
    } finally {
      setDeletingCsId(null);
    }
  };

  const handleDeleteBudgetItem = async (itemId: number) => {
    setDeletingBudgetItemId(itemId);
    try {
      const updatedBudget = await deleteBudgetItem(eventId, itemId);
      setBudget(updatedBudget);
      toast.success('Đã xóa mục ngân sách');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Xóa ngân sách thất bại');
    } finally {
      setDeletingBudgetItemId(null);
    }
  };

  const openEditBudgetItem = (item: BudgetItem) => {
    setEditingBudgetItem(item);
    setEditBiFields({
      categoryId: item.categoryId,
      description: item.description,
      quantity: item.quantity,
      unitCost: item.unitCost,
      notes: item.notes ?? '',
    });
  };

  const handleSaveBudgetItem = async () => {
    if (!editingBudgetItem) return;
    if (!editBiFields.description.trim()) { toast.error('Mô tả không được trống'); return; }
    if (editBiFields.categoryId === '') { toast.error('Vui lòng chọn danh mục'); return; }
    setSavingBudgetItem(true);
    try {
      const req: UpdateBudgetItemRequest = {
        categoryId: Number(editBiFields.categoryId),
        description: editBiFields.description.trim(),
        quantity: Number(editBiFields.quantity) || 1,
        unitCost: Number(editBiFields.unitCost) || 0,
        notes: editBiFields.notes.trim() || undefined,
      };
      const updatedBudget = await updateBudgetItem(eventId, editingBudgetItem.id, req);
      setBudget(updatedBudget);
      setEditingBudgetItem(null);
      toast.success('Đã cập nhật mục ngân sách');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Cập nhật ngân sách thất bại');
    } finally {
      setSavingBudgetItem(false);
    }
  };

  const handleCapacityChange = (field: keyof CapacityEdit, value: number | '') => {
    setCapacityEdit(prev => {
      const next: CapacityEdit = { ...prev, [field]: value };
      if (field === 'maxTeamSize' || field === 'maxTeams') {
        if (!capacityTouched.maxParticipants) {
          next.maxParticipants = suggestMaxParticipants(next.maxTeamSize, next.maxTeams);
        }
        if (!capacityTouched.maxTeamsPerMentor && (next.maxTeamSize !== '' || next.maxTeams !== '')) {
          next.maxTeamsPerMentor = DEFAULT_TEAMS_PER_MENTOR;
        }
      }
      return next;
    });
    if (field === 'maxParticipants' || field === 'maxTeamsPerMentor') {
      setCapacityTouched(prev => ({ ...prev, [field]: true }));
    }
  };

  const recalcCapacity = (field: CapacitySuggested) => {
    setCapacityEdit(prev => ({
      ...prev,
      [field]: field === 'maxParticipants'
        ? suggestMaxParticipants(prev.maxTeamSize, prev.maxTeams)
        : DEFAULT_TEAMS_PER_MENTOR,
    }));
    setCapacityTouched(prev => ({ ...prev, [field]: false }));
  };

  // Sức chứa tối thiểu = mọi team đều đầy chỗ.
  const capacityFloor = (Number(capacityEdit.maxTeamSize) || 0) * (Number(capacityEdit.maxTeams) || 0);
  const capacityErrors: Partial<Record<keyof CapacityEdit, string>> = {};
  if (capacityFloor > 0 && capacityEdit.maxParticipants !== '' && Number(capacityEdit.maxParticipants) < capacityFloor) {
    capacityErrors.maxParticipants = `Phải ≥ ${capacityFloor} (${capacityEdit.maxTeamSize} × ${capacityEdit.maxTeams})`;
  }
  if (capacityEdit.maxTeamsPerMentor !== '' && Number(capacityEdit.maxTeamsPerMentor) < 1) {
    capacityErrors.maxTeamsPerMentor = 'Phải ≥ 1';
  }
  const hasCapacityErrors = Object.keys(capacityErrors).length > 0;
  // Chỉ hiển thị — BE không có field này.
  const mentorsNeeded = (Number(capacityEdit.maxTeams) || 0) > 0 && (Number(capacityEdit.maxTeamsPerMentor) || 0) >= 1
    ? Math.ceil(Number(capacityEdit.maxTeams) / Number(capacityEdit.maxTeamsPerMentor))
    : null;

  const handleSaveCapacity = async () => {
    if (!event) return;
    if (hasCapacityErrors) {
      toast.error('Thông số sức chứa chưa hợp lệ');
      return;
    }
    setSavingCapacity(true);
    try {
      const req: UpdateEventRequest = {
        maxTeamSize: capacityEdit.maxTeamSize !== '' ? Number(capacityEdit.maxTeamSize) : null,
        maxTeams: capacityEdit.maxTeams !== '' ? Number(capacityEdit.maxTeams) : null,
        maxParticipants: capacityEdit.maxParticipants !== '' ? Number(capacityEdit.maxParticipants) : null,
        maxTeamsPerMentor: capacityEdit.maxTeamsPerMentor !== '' ? Number(capacityEdit.maxTeamsPerMentor) : null,
      };
      const updated = await updateEvent(eventId, req);
      setEvent(updated);
      setCapacityEdit({
        maxTeamSize: updated.maxTeamSize ?? '',
        maxTeams: updated.maxTeams ?? '',
        maxParticipants: updated.maxParticipants ?? '',
        maxTeamsPerMentor: updated.maxTeamsPerMentor ?? '',
      });
      setCapacityTouched({
        maxParticipants: updated.maxParticipants != null,
        maxTeamsPerMentor: updated.maxTeamsPerMentor != null,
      });
      toast.success('Đã lưu thông số sức chứa');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Lưu sức chứa thất bại');
    } finally {
      setSavingCapacity(false);
    }
  };

  // PATCH /api/events/{id} — chỉ gửi name/description/registration*, KHÔNG đụng capacity.
  // EventServiceImpl.update() bỏ qua field null nên 2 form (Basic Info & Sức chứa) không ghi đè nhau.
  const handleSaveBasic = async () => {
    if (!event) return;
    if (!basicEdit.name.trim()) { toast.error('Tên event không được trống'); return; }
    const regStart = toDateTime(basicEdit.registrationStart);
    const regEnd = toDateTime(basicEdit.registrationEnd);
    // BR-EVT-01 — BE cũng chặn, check sớm ở client để báo lỗi ngay
    if (regStart && regEnd && regStart >= regEnd) {
      toast.error('Registration start phải trước registration end (BR-EVT-01)');
      return;
    }
    setSavingBasic(true);
    try {
      const req: UpdateEventRequest = {
        name: basicEdit.name.trim(),
        // gửi '' (không phải undefined) để xoá được description — BE bỏ qua null/undefined
        description: basicEdit.description.trim(),
        registrationStart: regStart,
        registrationEnd: regEnd,
      };
      const updated = await updateEvent(eventId, req);
      setEvent(updated);
      setBasicEdit({
        name: updated.name ?? '',
        description: updated.description ?? '',
        registrationStart: updated.registrationStart?.slice(0, 16) ?? '',
        registrationEnd: updated.registrationEnd?.slice(0, 16) ?? '',
      });
      toast.success('Đã lưu thông tin cơ bản');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Lưu thông tin cơ bản thất bại');
    } finally {
      setSavingBasic(false);
    }
  };

  const handleCreateRound = async () => {
    if (!newRoundFields.name.trim()) { toast.error('Tên round không được trống'); return; }
    setSavingNewRound(true);
    try {
      const isFinal = newRoundFields.finalRound;
      // final luôn ở cuối; non-final kẹp trong [1, upperBound] (BE cũng clamp lại y hệt).
      const orderNumber = isFinal ? roundCount + 1 : clampInsertPos(newRoundFields.orderNumber);
      await createRound(eventId, {
        name: newRoundFields.name.trim(),
        orderNumber,
        submissionDeadline: toDateTime(newRoundFields.submissionDeadline, true),
        scoringDeadline: toDateTime(newRoundFields.scoringDeadline, true),
        promotionTopN: newRoundFields.promotionTopN !== '' ? Number(newRoundFields.promotionTopN) : undefined,
        finalRound: isFinal,
        requiresRepo: newRoundFields.requiresRepo,
        requiresDemo: newRoundFields.requiresDemo,
        requiresSlide: newRoundFields.requiresSlide,
        requiresReport: newRoundFields.requiresReport,
      });
      // BE shift order các round khác → refetch để lấy order mới, không tự suy đoán.
      const fresh = await getEventRounds(eventId).then(safeArray).catch(() => rounds);
      setRounds([...fresh].sort((a, b) => (a.orderNumber ?? 0) - (b.orderNumber ?? 0)));
      setAddingRound(false);
      setNewRoundFields(EMPTY_ROUND);
      toast.success(`Đã thêm round ở vị trí #${orderNumber}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Thêm round thất bại');
    } finally {
      setSavingNewRound(false);
    }
  };

  const handleCreateCategory = async () => {
    const name = newCategory.name.trim();
    if (!name) { toast.error('Tên category không được trống'); return; }
    // BR-EVT-04: tên category phải unique trong event — BE cũng chặn, check sớm cho UX
    if (categories.some(c => c.name.trim().toLowerCase() === name.toLowerCase())) {
      toast.error(`Category "${name}" đã tồn tại trong event này`);
      return;
    }
    setSavingNewCategory(true);
    try {
      const created = await createCategory(eventId, {
        name,
        description: newCategory.description.trim() || undefined,
        mentorId: newCategory.mentorId !== '' ? Number(newCategory.mentorId) : undefined,
      });
      setCategories(prev => [...prev, created]);
      setAddingCategory(false);
      setNewCategory({ name: '', description: '', mentorId: '' });
      toast.success('Đã thêm category');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Thêm category thất bại');
    } finally {
      setSavingNewCategory(false);
    }
  };

  // DRAFT/REJECTED — khớp với validateConfigEditable() của BE (round/category/criteria edits).
  const canEdit = event?.status === 'DRAFT' || event?.status === 'REJECTED';

  // Ưu tiên nhãn dễ đọc từ BE, rồi tự ghép từ term+year, rồi fallback map qua term-plans, cuối cùng mới #id.
  const termPlanDisplay = event
    ? (event.termPlanLabel
        ?? (event.termPlanTerm ? `${event.termPlanTerm}${event.termPlanYear != null ? ` ${event.termPlanYear}` : ''}` : null)
        ?? termPlanLabelFallback
        ?? (event.termPlanId != null ? `#${event.termPlanId}` : '—'))
    : '—';

  // ── Vị trí chèn round mới (khớp invariant BE: tối đa 1 final và final luôn ở cuối) ──
  const existingFinalRound = rounds.find(r => r.finalRound);
  const hasFinalRound = !!existingFinalRound;
  const roundCount = rounds.length;
  // Non-final chỉ được đặt TRƯỚC final: trần = order của final (nếu có) hoặc slot kế tiếp.
  const nonFinalUpperBound = hasFinalRound ? (existingFinalRound!.orderNumber ?? roundCount) : roundCount + 1;
  const insertPosOptions = Array.from({ length: Math.max(1, nonFinalUpperBound) }, (_, i) => i + 1);
  const clampInsertPos = (v: number | '' | undefined) => {
    const requested = v === '' || v == null ? nonFinalUpperBound : Number(v);
    return Math.max(1, Math.min(requested, nonFinalUpperBound));
  };
  // Vị trí sẽ hiển thị ở preview: final → cuối; non-final → order đã kẹp.
  const previewInsertPos = newRoundFields.finalRound ? roundCount + 1 : clampInsertPos(newRoundFields.orderNumber);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-slate-400">
        <RefreshCw className="w-5 h-5 animate-spin mr-2" />
        <span className="text-sm">Đang tải chi tiết event…</span>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="flex flex-col items-center py-20 gap-3">
        <AlertTriangle className="w-8 h-8 text-red-400" />
        <p className="text-sm text-red-600">{error ?? 'Event not found'}</p>
        <button onClick={() => onNavigate('coord-events')} className="text-sm text-blue-700 underline flex items-center gap-1">
          <ArrowLeft className="w-3.5 h-3.5" /> Về danh sách
        </button>
      </div>
    );
  }

  const lifecycleAction = LIFECYCLE[event.status];

  return (
    <div className="p-7 space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <button
          onClick={() => onNavigate('coord-events')}
          className="mt-0.5 p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors flex-shrink-0"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-1 flex-wrap">
            <h1 className="text-xl font-bold text-slate-900" style={{ fontFamily: 'var(--font-display)' }}>
              {event.name}
            </h1>
            <StatusBadge status={event.status} />
          </div>
          <div className="flex items-center gap-4 text-xs text-slate-500 font-mono flex-wrap">
            <span>/{event.slug}</span>
            <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded font-semibold">{event.eventType}</span>
            <span>Reg: {fmtDate(event.registrationStart)} → {fmtDate(event.registrationEnd)}</span>
          </div>
        </div>

        {/* Lifecycle action button */}
        {lifecycleAction && (
          <button
            onClick={() => lifecycleAction.requireConfirm ? setShowConfirm(true) : handleAction()}
            disabled={actionLoading}
            className={`flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-lg transition-colors disabled:opacity-50 flex-shrink-0 ${lifecycleAction.btnClass}`}
          >
            {actionLoading
              ? <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              : <lifecycleAction.Icon className="w-4 h-4" />}
            {lifecycleAction.label}
          </button>
        )}
      </div>

      {/* Basic Info */}
      <section className="bg-white rounded-xl shadow-sm border border-slate-200">
        <div className="px-5 py-3 border-b border-slate-100 flex items-center gap-2">
          <FileBarChart className="w-4 h-4 text-slate-400" />
          <h2 className="text-sm font-semibold text-slate-700">Thông tin cơ bản</h2>
        </div>
        <div className="px-5 py-4 space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Tên event <span className="text-red-500">*</span></label>
            <input
              value={basicEdit.name}
              onChange={e => setBasicEdit(prev => ({ ...prev, name: e.target.value }))}
              disabled={!canEdit || savingBasic}
              maxLength={200}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-700 disabled:opacity-50 disabled:bg-slate-50"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Mô tả</label>
            <textarea
              value={basicEdit.description}
              onChange={e => setBasicEdit(prev => ({ ...prev, description: e.target.value }))}
              disabled={!canEdit || savingBasic}
              rows={3}
              placeholder="Mô tả ngắn về event…"
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-700 disabled:opacity-50 disabled:bg-slate-50"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Registration Opens</label>
              <input
                type="datetime-local"
                value={basicEdit.registrationStart}
                onChange={e => setBasicEdit(prev => ({ ...prev, registrationStart: e.target.value }))}
                disabled={!canEdit || savingBasic}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-700 disabled:opacity-50 disabled:bg-slate-50"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Registration Closes</label>
              <input
                type="datetime-local"
                value={basicEdit.registrationEnd}
                onChange={e => setBasicEdit(prev => ({ ...prev, registrationEnd: e.target.value }))}
                disabled={!canEdit || savingBasic}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-700 disabled:opacity-50 disabled:bg-slate-50"
              />
            </div>
          </div>

          {/* Read-only — UpdateEventRequest không nhận discipline/termPlan/eventType (giữ toàn vẹn hạn mức term-plan) */}
          <div className="grid grid-cols-3 gap-4 pt-1">
            {([
              ['Discipline', event.disciplineName ?? '—'],
              ['Term Plan', termPlanDisplay],
              ['Event Type', event.eventType ?? '—'],
            ] as [string, string][]).map(([label, value]) => (
              <div key={label}>
                <label className="block text-xs font-medium text-slate-600 mb-1">{label}</label>
                <div className="w-full border border-slate-200 bg-slate-50 rounded-lg px-3 py-2 text-sm text-slate-500 font-mono flex items-center gap-1.5">
                  <Lock className="w-3 h-3 text-slate-400 flex-shrink-0" />
                  <span className="truncate">{value}</span>
                </div>
              </div>
            ))}
          </div>
          <p className="text-xs text-slate-400">
            Discipline / Term Plan / Event Type cố định từ lúc tạo để đảm bảo toàn vẹn hạn mức term-plan.
            Muốn đổi thì phải xóa draft và tạo lại.
          </p>

          {canEdit ? (
            <div className="flex justify-end">
              <button
                onClick={handleSaveBasic}
                disabled={savingBasic}
                className="flex items-center gap-1.5 bg-blue-800 hover:bg-blue-900 disabled:opacity-50 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
              >
                {savingBasic ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                Lưu thông tin
              </button>
            </div>
          ) : (
            <p className="text-xs text-slate-400">Chỉ sửa được khi event ở trạng thái DRAFT hoặc REJECTED.</p>
          )}
        </div>
      </section>

      {/* Capacity Settings */}
      <section className="bg-white rounded-xl shadow-sm border border-slate-200">
        <div className="px-5 py-3 border-b border-slate-100 flex items-center gap-2">
          <Users className="w-4 h-4 text-slate-400" />
          <h2 className="text-sm font-semibold text-slate-700">Sức chứa & Giới hạn</h2>
        </div>
        <div className="px-5 py-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {([
              ['maxTeamSize', 'Số thành viên tối đa/team', null],
              ['maxTeams', 'Số team tối đa', null],
              ['maxParticipants', 'Số người tham gia tối đa', 'maxParticipants'],
              ['maxTeamsPerMentor', 'Số team tối đa/mentor', 'maxTeamsPerMentor'],
            ] as [keyof CapacityEdit, string, CapacitySuggested | null][]).map(([field, label, suggested]) => (
              <div key={field}>
                <div className="flex items-baseline justify-between gap-1 mb-1">
                  <label className="block text-xs font-medium text-slate-600">{label}</label>
                  {suggested && canEdit && (
                    <button
                      type="button"
                      onClick={() => recalcCapacity(suggested)}
                      disabled={savingCapacity}
                      title="Tính lại theo gợi ý"
                      className="text-[10px] text-blue-700 hover:text-blue-900 hover:underline disabled:opacity-50 shrink-0"
                    >
                      ↻ tính lại
                    </button>
                  )}
                </div>
                <input
                  type="number" min={1}
                  value={capacityEdit[field] === 0 || capacityEdit[field] === '' ? '' : capacityEdit[field]}
                  onChange={e => handleCapacityChange(field, parseNumInput(e))}
                  disabled={!canEdit || savingCapacity}
                  placeholder="—"
                  className={`w-full border rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 disabled:opacity-50 disabled:bg-slate-50 ${
                    capacityErrors[field]
                      ? 'border-red-300 focus:ring-red-500'
                      : 'border-slate-200 focus:ring-blue-700'
                  }`}
                />
                {capacityErrors[field] && (
                  <p className="mt-1 text-[10px] text-red-600">{capacityErrors[field]}</p>
                )}
                {!capacityErrors[field] && suggested && !capacityTouched[suggested] && capacityEdit[field] !== '' && (
                  <p className="mt-1 text-[10px] text-slate-400">Gợi ý tự động</p>
                )}
              </div>
            ))}
          </div>
          {mentorsNeeded !== null && (
            <p className="mt-3 text-xs text-slate-500">
              Cần ~<span className="font-semibold text-slate-700">{mentorsNeeded}</span> mentor
              <span className="text-slate-400"> ({capacityEdit.maxTeams} team ÷ {capacityEdit.maxTeamsPerMentor} team/mentor)</span>
            </p>
          )}
          {canEdit && (
            <div className="mt-3 flex justify-end">
              <button
                onClick={handleSaveCapacity}
                disabled={savingCapacity || hasCapacityErrors}
                className="flex items-center gap-1.5 bg-blue-800 hover:bg-blue-900 disabled:opacity-50 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
              >
                {savingCapacity
                  ? <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  : <Save className="w-3.5 h-3.5" />}
                Lưu sức chứa
              </button>
            </div>
          )}
          {!canEdit && (
            <p className="mt-2 text-xs text-slate-400">Chỉ sửa được khi event ở trạng thái DRAFT hoặc REJECTED.</p>
          )}
        </div>
      </section>

      {/* Rounds */}
      <section className="bg-white rounded-xl shadow-sm border border-slate-200">
        <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-slate-400" />
            <h2 className="text-sm font-semibold text-slate-700">Rounds ({rounds.length})</h2>
          </div>
          {canEdit && (
            <button onClick={() => { setNewRoundFields({ ...EMPTY_ROUND, orderNumber: nonFinalUpperBound }); setAddingRound(true); }}
              className="flex items-center gap-1 text-xs text-blue-700 font-medium hover:text-blue-800 px-2.5 py-1.5 rounded-lg hover:bg-blue-50 transition-colors border border-blue-200">
              <Plus className="w-3.5 h-3.5" /> Thêm round
            </button>
          )}
        </div>
        {rounds.length === 0 ? (
          <p className="px-5 py-6 text-sm text-slate-400 text-center">Chưa có round nào được cấu hình.</p>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100">
                {['#', 'Tên round', 'Status', 'Deadline', 'Top N promote', ...(canTransitionRounds ? ['Điều khiển'] : []), ...(canEdit ? [''] : [])].map(h => (
                  <th key={h} className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rounds.map(r => (
                <tr key={r.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 text-xs font-mono text-slate-400">{r.orderNumber}</td>
                  <td className="px-4 py-3 text-sm font-medium text-slate-900">{r.name}</td>
                  <td className="px-4 py-3"><StatusBadge status={r.status} /></td>
                  <td className="px-4 py-3 text-xs font-mono text-slate-500">{fmtDate(r.submissionDeadline)}</td>
                  <td className="px-4 py-3 text-xs font-mono text-slate-600">{r.promotionTopN ?? '—'}</td>
                  {canTransitionRounds && (
                    <td className="px-4 py-3">
                      {transitioningRoundId === r.id ? (
                        <RefreshCw className="w-4 h-4 animate-spin text-slate-400" />
                      ) : r.status === 'DRAFT' ? (
                        <button
                          onClick={() => runRoundTransition(r, () => openRoundSubmission(eventId, r.id), 'đã mở nộp bài')}
                          className="flex items-center gap-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1.5 rounded-lg transition-colors"
                          title="DRAFT → OPEN_FOR_SUBMISSION (BR-EVT-02: round trước phải đã khóa)">
                          <PlayCircle className="w-3.5 h-3.5" /> Mở nộp bài
                        </button>
                      ) : r.status === 'OPEN_FOR_SUBMISSION' ? (
                        <button
                          onClick={() => runRoundTransition(r, () => closeRoundSubmission(eventId, r.id), 'đã đóng nộp bài')}
                          className="flex items-center gap-1.5 text-xs font-medium text-amber-700 bg-amber-50 hover:bg-amber-100 px-2.5 py-1.5 rounded-lg transition-colors"
                          title="OPEN_FOR_SUBMISSION → SUBMISSION_CLOSED">
                          <XCircle className="w-3.5 h-3.5" /> Đóng nộp bài
                        </button>
                      ) : r.status === 'SUBMISSION_CLOSED' ? (
                        <button
                          onClick={() => runRoundTransition(r, () => openRoundScoring(eventId, r.id), 'đã mở chấm điểm')}
                          className="flex items-center gap-1.5 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 px-2.5 py-1.5 rounded-lg transition-colors"
                          title="SUBMISSION_CLOSED → SCORING_OPEN (judge chỉ chấm sau khi đóng nộp bài)">
                          <PlayCircle className="w-3.5 h-3.5" /> Mở chấm điểm
                        </button>
                      ) : r.status === 'SCORING_OPEN' ? (
                        <button
                          onClick={() => runRoundTransition(r, () => lockRoundScoring(eventId, r.id), 'đã khóa chấm điểm')}
                          className="flex items-center gap-1.5 text-xs font-medium text-red-700 bg-red-50 hover:bg-red-100 px-2.5 py-1.5 rounded-lg transition-colors"
                          title="SCORING_OPEN → SCORING_LOCKED (BR-SCR-05: điểm bất biến sau khóa)">
                          <Lock className="w-3.5 h-3.5" /> Khóa chấm điểm
                        </button>
                      ) : r.status === 'SCORING_LOCKED' ? (
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => { setUnlockingRound(r); setUnlockReason(''); }}
                            className="flex items-center gap-1 text-xs font-medium text-amber-700 bg-amber-50 hover:bg-amber-100 px-2 py-1.5 rounded-lg transition-colors"
                            title="Mở khóa (bắt buộc lý do, có audit)">
                            <Unlock className="w-3.5 h-3.5" /> Unlock
                          </button>
                          <button
                            onClick={() => runRoundTransition(r, () => completeRound(eventId, r.id), 'đã hoàn tất')}
                            className="flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-2 py-1.5 rounded-lg transition-colors"
                            title="SCORING_LOCKED → COMPLETED">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Hoàn tất
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400">—</span>
                      )}
                    </td>
                  )}
                  {canEdit && (
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => {
                            setEditingRound(r);
                            setEditRoundFields({
                              name: r.name,
                              submissionDeadline: r.submissionDeadline?.slice(0, 10) ?? '',
                              scoringDeadline: r.scoringDeadline?.slice(0, 10) ?? '',
                              promotionTopN: r.promotionTopN ?? '',
                              finalRound: r.finalRound ?? false,
                              requiresRepo: r.requiresRepo ?? false,
                              requiresDemo: r.requiresDemo ?? false,
                              requiresSlide: r.requiresSlide ?? false,
                              requiresReport: r.requiresReport ?? false,
                            });
                          }}
                          className="p-1.5 rounded text-slate-400 hover:text-blue-700 hover:bg-blue-50 transition-colors"
                          title="Sửa round"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteRound(r.id)}
                          disabled={deletingRoundId === r.id}
                          className="p-1.5 rounded text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
                          title="Xóa round"
                        >
                          {deletingRoundId === r.id
                            ? <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            : <Trash2 className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {/* Unlock round modal — BR-SCR-05: reason bắt buộc, được ghi audit */}
      {unlockingRound && (
        <Modal title={`Mở khóa chấm điểm — ${unlockingRound.name}`} onClose={() => setUnlockingRound(null)} size="sm"
          footer={
            <>
              <button onClick={() => setUnlockingRound(null)}
                className="px-4 py-2 border border-slate-200 text-slate-600 text-sm rounded-lg hover:bg-slate-50">Hủy</button>
              <button onClick={handleUnlockRound} disabled={!unlockReason.trim()}
                className="px-4 py-2 bg-amber-600 text-white text-sm font-semibold rounded-lg hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed">
                Mở khóa
              </button>
            </>
          }>
          <div className="space-y-3">
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-amber-800">
                Sau khi khóa, điểm số là bất biến (BR-SCR-05). Mở khóa là thao tác ngoại lệ —
                lý do sẽ được ghi vào audit log kèm tên bạn.
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Lý do mở khóa <span className="text-red-500">*</span></label>
              <textarea value={unlockReason} onChange={e => setUnlockReason(e.target.value)}
                rows={3} placeholder="VD: Judge nhập nhầm điểm đội X — mở lại để sửa theo biên bản"
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" />
            </div>
          </div>
        </Modal>
      )}

      {/* Categories */}
      <section className="bg-white rounded-xl shadow-sm border border-slate-200">
        <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Tag className="w-4 h-4 text-slate-400" />
            <h2 className="text-sm font-semibold text-slate-700">Categories ({categories.length})</h2>
          </div>
          {canEdit && (
            <button onClick={() => { setNewCategory({ name: '', description: '', mentorId: '' }); setAddingCategory(true); }}
              className="flex items-center gap-1 text-xs text-blue-700 font-medium hover:text-blue-800 px-2.5 py-1.5 rounded-lg hover:bg-blue-50 transition-colors border border-blue-200">
              <Plus className="w-3.5 h-3.5" /> Thêm category
            </button>
          )}
        </div>
        {categories.length === 0 ? (
          <p className="px-5 py-6 text-sm text-slate-400 text-center">Chưa có category nào.</p>
        ) : (
          <div className="divide-y divide-slate-100">
            {categories.map(cat => (
              <div key={cat.id} className="px-5 py-3 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-900">{cat.name}</p>
                  {cat.description && <p className="text-xs text-slate-500 mt-0.5">{cat.description}</p>}
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {cat.mentorName && (
                    <span className="text-xs font-mono bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                      mentor: {cat.mentorName}
                    </span>
                  )}
                  {canEdit && (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => { setEditingCategory(cat); setEditCategoryName(cat.name); setEditCategoryDescription(cat.description ?? ''); setEditCategoryMentorId(cat.mentorId ?? ''); }}
                        className="p-1.5 rounded text-slate-400 hover:text-blue-700 hover:bg-blue-50 transition-colors"
                        title="Sửa category"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteCategory(cat.id)}
                        disabled={deletingCategoryId === cat.id}
                        className="p-1.5 rounded text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
                        title="Xóa category"
                      >
                        {deletingCategoryId === cat.id
                          ? <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          : <Trash2 className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Criteria Sets */}
      <section className="bg-white rounded-xl shadow-sm border border-slate-200">
        <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <List className="w-4 h-4 text-slate-400" />
            <h2 className="text-sm font-semibold text-slate-700">Criteria Sets ({criteriaSets.length})</h2>
          </div>
          {canEdit && (
            <button onClick={() => setAddingCs(true)}
              className="flex items-center gap-1 text-xs text-blue-700 font-medium hover:text-blue-800 px-2.5 py-1.5 rounded-lg hover:bg-blue-50 transition-colors border border-blue-200">
              <Plus className="w-3.5 h-3.5" /> Thêm bộ tiêu chí
            </button>
          )}
        </div>
        <div className="px-5 py-2 bg-blue-50/50 border-b border-blue-100">
          <p className="text-xs text-blue-700 italic">Cùng một vòng, mỗi hạng mục có thể có bộ tiêu chí, trọng số và Top-N riêng.</p>
        </div>
        {criteriaSets.length === 0 ? (
          <p className="px-5 py-6 text-sm text-slate-400 text-center">Chưa có criteria set nào.</p>
        ) : (() => {
          // Group by roundId for display
          const roundOrder = rounds.map(r => r.id);
          const byRound = new Map<number | null | undefined, CriteriaSet[]>();
          for (const cs of criteriaSets) {
            const key = cs.roundId ?? null;
            if (!byRound.has(key)) byRound.set(key, []);
            byRound.get(key)!.push(cs);
          }
          const sortedRoundKeys = [...byRound.keys()].sort((a, b) => {
            if (a == null) return 1;
            if (b == null) return -1;
            return (roundOrder.indexOf(a ?? -1)) - (roundOrder.indexOf(b ?? -1));
          });
          return (
            <div className="divide-y divide-slate-100">
              {sortedRoundKeys.map(roundKey => {
                const roundName = rounds.find(r => r.id === roundKey)?.name ?? (roundKey == null ? 'Chưa gán vòng' : `Round #${roundKey}`);
                const setsInRound = byRound.get(roundKey)!;
                return (
                  <div key={String(roundKey)} className="px-5 py-3">
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Vòng: {roundName}</p>
                    <div className="space-y-3">
                      {setsInRound.map(cs => (
                        <div key={cs.id} className="rounded-lg border border-slate-100 bg-slate-50 p-3">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <p className="text-sm font-semibold text-slate-900">{cs.name}</p>
                              <div className="flex flex-wrap items-center gap-1.5 mt-1">
                                <span className="text-[10px] bg-violet-100 text-violet-700 px-2 py-0.5 rounded-full font-medium">
                                  {cs.categoryName ? cs.categoryName : 'Chung cả vòng'}
                                </span>
                                {cs.promotionTopN != null && (
                                  <span className="text-[10px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">
                                    Top-{cs.promotionTopN}
                                  </span>
                                )}
                              </div>
                            </div>
                            {canEdit && (
                              <div className="flex items-center gap-1 flex-shrink-0">
                                <button onClick={() => openEditCs(cs)}
                                  className="p-1.5 rounded text-slate-400 hover:text-blue-700 hover:bg-blue-50 transition-colors" title="Sửa">
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button onClick={() => handleDeleteCs(cs.id)} disabled={deletingCsId === cs.id}
                                  className="p-1.5 rounded text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50" title="Xóa">
                                  {deletingCsId === cs.id ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                                </button>
                              </div>
                            )}
                          </div>
                          {cs.criteria && cs.criteria.length > 0 && (
                            <table className="w-full bg-white rounded border border-slate-100">
                              <thead><tr className="border-b border-slate-100">
                                {['Criterion', 'Max Score', 'Weight %'].map(h => (
                                  <th key={h} className="text-left px-3 py-1.5 text-[10px] font-semibold text-slate-500 uppercase">{h}</th>
                                ))}
                              </tr></thead>
                              <tbody className="divide-y divide-slate-50">
                                {cs.criteria.map(cr => (
                                  <tr key={cr.id}>
                                    <td className="px-3 py-1.5 text-xs text-slate-800 font-medium">{cr.name}</td>
                                    <td className="px-3 py-1.5 text-xs font-mono text-slate-600">{cr.maxScore}</td>
                                    <td className="px-3 py-1.5 text-xs font-mono text-slate-600">{cr.weight}%</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })()}
      </section>

      {/* Budget Items */}
      {budget && safeArray(budget.items).length > 0 && (
        <section className="bg-white rounded-xl shadow-sm border border-slate-200">
          <div className="px-5 py-3 border-b border-slate-100 flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-slate-400" />
            <h2 className="text-sm font-semibold text-slate-700">
              Budget Items ({safeArray(budget.items).length})
              {budget.totalEstimatedCost != null && (
                <span className="ml-2 text-xs font-mono text-slate-500">
                  — {budget.totalEstimatedCost.toLocaleString()} {budget.currency}
                </span>
              )}
            </h2>
          </div>
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100">
                {['Mô tả', 'SL', 'Đơn giá', 'Thành tiền', ...(canEdit ? [''] : [])].map(h => (
                  <th key={h} className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {safeArray(budget.items).map((item: BudgetItem) => (
                <tr key={item.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 text-sm text-slate-900">{item.description}</td>
                  <td className="px-4 py-3 text-xs font-mono text-slate-600">{item.quantity}</td>
                  <td className="px-4 py-3 text-xs font-mono text-slate-600">{item.unitCost.toLocaleString()}</td>
                  <td className="px-4 py-3 text-xs font-mono text-slate-700 font-semibold">
                    {(item.quantity * item.unitCost).toLocaleString()}
                  </td>
                  {canEdit && (
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => openEditBudgetItem(item)}
                          className="p-1.5 rounded text-slate-400 hover:text-blue-700 hover:bg-blue-50 transition-colors"
                          title="Sửa mục ngân sách"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteBudgetItem(item.id)}
                          disabled={deletingBudgetItemId === item.id}
                          className="p-1.5 rounded text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
                          title="Xóa mục ngân sách"
                        >
                          {deletingBudgetItemId === item.id
                            ? <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            : <Trash2 className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {/* Submit-for-approval confirmation dialog */}
      {showConfirm && lifecycleAction?.requireConfirm && (
        <Modal
          title={lifecycleAction.confirmTitle ?? 'Xác nhận'}
          onClose={() => setShowConfirm(false)}
          size="sm"
          footer={
            <>
              <button
                onClick={() => setShowConfirm(false)}
                className="px-4 py-2 border border-slate-200 text-slate-600 text-sm rounded-lg hover:bg-slate-50"
              >
                Huỷ
              </button>
              <button
                onClick={handleAction}
                className="px-4 py-2 bg-blue-800 hover:bg-blue-900 text-white text-sm font-semibold rounded-lg flex items-center gap-2"
              >
                <Send className="w-4 h-4" /> Xác nhận Submit
              </button>
            </>
          }
        >
          <div className="space-y-3">
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-amber-800">{lifecycleAction.confirmBody}</p>
            </div>
          </div>
        </Modal>
      )}

      {/* Edit Round modal */}
      {editingRound && (
        <Modal title={`Sửa Round: ${editingRound.name}`} onClose={() => setEditingRound(null)} size="md"
          footer={
            <>
              <button onClick={() => setEditingRound(null)} className="px-4 py-2 border border-slate-200 text-slate-600 text-sm rounded-lg hover:bg-slate-50">Huỷ</button>
              <button onClick={handleSaveRound} className="px-4 py-2 bg-blue-800 hover:bg-blue-900 text-white text-sm font-semibold rounded-lg flex items-center gap-2">
                <Save className="w-4 h-4" /> Lưu
              </button>
            </>
          }
        >
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Tên round <span className="text-red-500">*</span></label>
              <input value={editRoundFields.name} onChange={e => setEditRoundFields(p => ({ ...p, name: e.target.value }))}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-700" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Submission Deadline</label>
                <input type="date" value={editRoundFields.submissionDeadline} onChange={e => setEditRoundFields(p => ({ ...p, submissionDeadline: e.target.value }))}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-700" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Scoring Deadline</label>
                <input type="date" value={editRoundFields.scoringDeadline} onChange={e => setEditRoundFields(p => ({ ...p, scoringDeadline: e.target.value }))}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-700" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Promote Top N Teams</label>
              <input type="number" min={1} value={editRoundFields.promotionTopN === '' ? '' : editRoundFields.promotionTopN}
                onChange={e => setEditRoundFields(p => ({ ...p, promotionTopN: parseNumInput(e) }))}
                className="w-32 border border-slate-200 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-700" />
            </div>
            <div className="flex flex-wrap gap-4">
              {([
                ['finalRound', 'Final Round'],
                ['requiresRepo', 'Repo URL'],
                ['requiresDemo', 'Demo URL'],
                ['requiresSlide', 'Slide'],
                ['requiresReport', 'Report'],
              ] as [keyof RoundEdit, string][]).map(([field, label]) => (
                <label key={field} className="flex items-center gap-1.5 cursor-pointer">
                  <input type="checkbox" checked={!!editRoundFields[field]}
                    onChange={e => setEditRoundFields(p => ({ ...p, [field]: e.target.checked }))}
                    className="rounded border-slate-300" />
                  <span className="text-xs text-slate-700">{label}</span>
                </label>
              ))}
            </div>
          </div>
        </Modal>
      )}

      {/* Edit Category modal */}
      {editingCategory && (
        <Modal title="Sửa Category" onClose={() => setEditingCategory(null)} size="sm"
          footer={
            <>
              <button onClick={() => setEditingCategory(null)} className="px-4 py-2 border border-slate-200 text-slate-600 text-sm rounded-lg hover:bg-slate-50">Huỷ</button>
              <button onClick={handleSaveCategory} className="px-4 py-2 bg-blue-800 hover:bg-blue-900 text-white text-sm font-semibold rounded-lg flex items-center gap-2">
                <Save className="w-4 h-4" /> Lưu
              </button>
            </>
          }
        >
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Tên category <span className="text-red-500">*</span></label>
              <input
                value={editCategoryName}
                onChange={e => setEditCategoryName(e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-700"
                placeholder="Tên category…"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Mô tả</label>
              <textarea
                value={editCategoryDescription}
                onChange={e => setEditCategoryDescription(e.target.value)}
                rows={2}
                placeholder="Mô tả ngắn…"
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-700"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Mentor (tùy chọn)</label>
              <select value={editCategoryMentorId} onChange={e => setEditCategoryMentorId(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-700 bg-white">
                <option value="">-- Chưa gán mentor --</option>
                {mentors.map(m => <option key={m.id} value={m.id}>{m.fullName} ({m.email})</option>)}
              </select>
            </div>
          </div>
        </Modal>
      )}

      {/* Add Round modal — POST /api/events/{eventId}/rounds */}
      {addingRound && (
        <Modal title="Thêm Round" subtitle="Round mới sẽ có trạng thái DRAFT"
          onClose={() => setAddingRound(false)} size="md"
          footer={
            <>
              <button onClick={() => setAddingRound(false)} disabled={savingNewRound} className="px-4 py-2 border border-slate-200 text-slate-600 text-sm rounded-lg hover:bg-slate-50 disabled:opacity-50">Huỷ</button>
              <button onClick={handleCreateRound} disabled={savingNewRound || !newRoundFields.name.trim()}
                className="px-4 py-2 bg-blue-800 hover:bg-blue-900 text-white text-sm font-semibold rounded-lg flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                {savingNewRound ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} Thêm round
              </button>
            </>
          }
        >
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Tên round <span className="text-red-500">*</span></label>
              <input value={newRoundFields.name} onChange={e => setNewRoundFields(p => ({ ...p, name: e.target.value }))}
                maxLength={150} placeholder="VD: Preliminary Round"
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-700" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Submission Deadline</label>
                <input type="date" value={newRoundFields.submissionDeadline} onChange={e => setNewRoundFields(p => ({ ...p, submissionDeadline: e.target.value }))}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-700" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Scoring Deadline</label>
                <input type="date" value={newRoundFields.scoringDeadline} onChange={e => setNewRoundFields(p => ({ ...p, scoringDeadline: e.target.value }))}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-700" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Promote Top N Teams</label>
                <input type="number" min={1} value={newRoundFields.promotionTopN === '' ? '' : newRoundFields.promotionTopN}
                  onChange={e => setNewRoundFields(p => ({ ...p, promotionTopN: parseNumInput(e) }))}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-700" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Vị trí chèn (order)</label>
                <select
                  value={newRoundFields.finalRound ? roundCount + 1 : clampInsertPos(newRoundFields.orderNumber)}
                  onChange={e => setNewRoundFields(p => ({ ...p, orderNumber: Number(e.target.value) }))}
                  disabled={newRoundFields.finalRound}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm font-mono bg-white focus:outline-none focus:ring-2 focus:ring-blue-700 disabled:opacity-50 disabled:bg-slate-50">
                  {newRoundFields.finalRound
                    ? <option value={roundCount + 1}>#{roundCount + 1} (cuối)</option>
                    : insertPosOptions.map(pos => (
                        <option key={pos} value={pos}>#{pos}{pos === roundCount + 1 ? ' (cuối)' : ''}</option>
                      ))}
                </select>
              </div>
            </div>

            {/* Live preview vị trí thực tế sau khi BE shift các round khác */}
            <div className="rounded-lg bg-slate-50 border border-slate-100 px-3 py-2 text-xs text-slate-600">
              Round sẽ ở vị trí <span className="font-semibold text-blue-700">#{previewInsertPos}</span>
              {newRoundFields.finalRound
                ? ' — final round luôn nằm cuối cùng.'
                : hasFinalRound && previewInsertPos >= (existingFinalRound!.orderNumber ?? 0)
                  ? ' — các round từ vị trí này (kể cả final) sẽ dời xuống 1 bậc.'
                  : rounds.some(r => (r.orderNumber ?? 0) >= previewInsertPos)
                    ? ' — các round từ vị trí này sẽ dời xuống 1 bậc.'
                    : ''}
            </div>

            <div className="flex flex-wrap gap-4">
              <label className={`flex items-center gap-1.5 ${hasFinalRound ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                title={hasFinalRound ? 'Đã có final round — event chỉ có 1 final' : undefined}>
                <input type="checkbox" checked={!!newRoundFields.finalRound} disabled={hasFinalRound}
                  onChange={e => setNewRoundFields(p => ({ ...p, finalRound: e.target.checked }))}
                  className="rounded border-slate-300 disabled:opacity-50" />
                <span className={`text-xs ${hasFinalRound ? 'text-slate-400' : 'text-slate-700'}`}>Final Round</span>
              </label>
              {([
                ['requiresRepo', 'Repo URL'],
                ['requiresDemo', 'Demo URL'],
                ['requiresSlide', 'Slide'],
                ['requiresReport', 'Report'],
              ] as [keyof RoundEdit, string][]).map(([field, label]) => (
                <label key={field} className="flex items-center gap-1.5 cursor-pointer">
                  <input type="checkbox" checked={!!newRoundFields[field]}
                    onChange={e => setNewRoundFields(p => ({ ...p, [field]: e.target.checked }))}
                    className="rounded border-slate-300" />
                  <span className="text-xs text-slate-700">{label}</span>
                </label>
              ))}
            </div>
            {hasFinalRound && (
              <p className="text-[11px] text-amber-600">Đã có final round — event chỉ có 1 final.</p>
            )}
          </div>
        </Modal>
      )}

      {/* Add Category modal — POST /api/events/{eventId}/categories */}
      {addingCategory && (
        <Modal title="Thêm Category" onClose={() => setAddingCategory(false)} size="sm"
          footer={
            <>
              <button onClick={() => setAddingCategory(false)} disabled={savingNewCategory} className="px-4 py-2 border border-slate-200 text-slate-600 text-sm rounded-lg hover:bg-slate-50 disabled:opacity-50">Huỷ</button>
              <button onClick={handleCreateCategory} disabled={savingNewCategory || !newCategory.name.trim()}
                className="px-4 py-2 bg-blue-800 hover:bg-blue-900 text-white text-sm font-semibold rounded-lg flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                {savingNewCategory ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} Thêm category
              </button>
            </>
          }
        >
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Tên category <span className="text-red-500">*</span></label>
              <input value={newCategory.name} onChange={e => setNewCategory(p => ({ ...p, name: e.target.value }))}
                maxLength={150} placeholder="VD: Web Application"
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-700" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Mô tả</label>
              <textarea value={newCategory.description} onChange={e => setNewCategory(p => ({ ...p, description: e.target.value }))}
                rows={2} placeholder="Mô tả ngắn…"
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-700" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Mentor (tùy chọn)</label>
              <select value={newCategory.mentorId} onChange={e => setNewCategory(p => ({ ...p, mentorId: e.target.value === '' ? '' : Number(e.target.value) }))}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-700 bg-white">
                <option value="">-- Chưa gán mentor --</option>
                {mentors.map(m => <option key={m.id} value={m.id}>{m.fullName} ({m.email})</option>)}
              </select>
            </div>
          </div>
        </Modal>
      )}

      {/* Edit Budget Item modal */}
      {editingBudgetItem && (
        <Modal title="Sửa mục ngân sách" onClose={() => setEditingBudgetItem(null)} size="md"
          footer={
            <>
              <button onClick={() => setEditingBudgetItem(null)} disabled={savingBudgetItem} className="px-4 py-2 border border-slate-200 text-slate-600 text-sm rounded-lg hover:bg-slate-50 disabled:opacity-50">Huỷ</button>
              <button onClick={handleSaveBudgetItem} disabled={savingBudgetItem} className="px-4 py-2 bg-blue-800 hover:bg-blue-900 text-white text-sm font-semibold rounded-lg flex items-center gap-2 disabled:opacity-50">
                {savingBudgetItem ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Lưu
              </button>
            </>
          }
        >
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Danh mục <span className="text-red-500">*</span></label>
              <select value={editBiFields.categoryId} onChange={e => setEditBiFields(p => ({ ...p, categoryId: e.target.value === '' ? '' : Number(e.target.value) }))}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-700 bg-white">
                <option value="">-- Chọn danh mục --</option>
                {budgetCategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Mô tả <span className="text-red-500">*</span></label>
              <input value={editBiFields.description} onChange={e => setEditBiFields(p => ({ ...p, description: e.target.value }))}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-700"
                placeholder="Mô tả mục ngân sách…" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Số lượng</label>
                <input type="number" min={1} value={editBiFields.quantity === '' ? '' : editBiFields.quantity}
                  onChange={e => setEditBiFields(p => ({ ...p, quantity: parseNumInput(e) }))}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-700" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Đơn giá (VND)</label>
                <input type="number" min={0} value={editBiFields.unitCost === '' ? '' : editBiFields.unitCost}
                  onChange={e => setEditBiFields(p => ({ ...p, unitCost: parseNumInput(e) }))}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-700" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Ghi chú</label>
              <input value={editBiFields.notes} onChange={e => setEditBiFields(p => ({ ...p, notes: e.target.value }))}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-700"
                placeholder="Ghi chú thêm (tùy chọn)…" />
            </div>
          </div>
        </Modal>
      )}

      {/* Add Criteria Set modal */}
      {addingCs && (
        <Modal title="Thêm bộ tiêu chí" onClose={() => setAddingCs(false)} size="lg"
          footer={
            <>
              <button onClick={() => setAddingCs(false)} disabled={savingCs} className="px-4 py-2 border border-slate-200 text-slate-600 text-sm rounded-lg hover:bg-slate-50 disabled:opacity-50">Huỷ</button>
              <button onClick={handleCreateCs} disabled={savingCs} className="px-4 py-2 bg-blue-800 hover:bg-blue-900 text-white text-sm font-semibold rounded-lg flex items-center gap-2 disabled:opacity-50">
                {savingCs ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Tạo bộ tiêu chí
              </button>
            </>
          }
        >
          <div className="space-y-4">
            <p className="text-xs text-slate-500 italic">Cùng một vòng, mỗi hạng mục có thể có bộ tiêu chí, trọng số và Top-N riêng.</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Tên bộ tiêu chí <span className="text-red-500">*</span></label>
                <input value={newCsForm.name} onChange={e => setNewCsForm(p => ({ ...p, name: e.target.value }))}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-700" />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-600">Vòng áp dụng {!newCsForm.applyToAllRounds && <span className="text-red-500">*</span>}</label>
                  <label className="flex items-center gap-1 cursor-pointer select-none">
                    <input type="checkbox" checked={newCsForm.applyToAllRounds}
                      onChange={e => setNewCsForm(p => ({ ...p, applyToAllRounds: e.target.checked, roundId: '' }))}
                      className="rounded border-slate-300" />
                    <span className="text-[10px] text-slate-600 font-medium">Áp cho tất cả các vòng</span>
                  </label>
                </div>
                {newCsForm.applyToAllRounds ? (
                  <div className="w-full border border-emerald-200 bg-emerald-50 rounded-lg px-3 py-2 text-xs text-emerald-700 font-medium">
                    Sẽ tạo 1 bộ cho mỗi vòng ({rounds.length > 0 ? rounds.map(r => r.name).join(', ') : 'chưa có vòng'})
                  </div>
                ) : (
                  <select value={newCsForm.roundId} onChange={e => setNewCsForm(p => ({ ...p, roundId: e.target.value === '' ? '' : Number(e.target.value) }))}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-700 bg-white">
                    <option value="">-- Chọn vòng --</option>
                    {rounds.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                  </select>
                )}
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Hạng mục</label>
                <select value={newCsForm.categoryId ?? ''} onChange={e => setNewCsForm(p => ({ ...p, categoryId: e.target.value === '' ? null : Number(e.target.value) }))}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-700 bg-white">
                  <option value="">Dùng chung cả vòng (categoryId = null)</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
            </div>
            {/* Criteria table */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-600">Tiêu chí chấm điểm</label>
                <div className={`flex items-center gap-1 text-xs font-mono font-bold px-2 py-0.5 rounded ${
                  newCsCriteria.filter(c => c.active).reduce((s, c) => s + (Number(c.weight) || 0), 0) === 100
                    ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                }`}>
                  Total: {newCsCriteria.filter(c => c.active).reduce((s, c) => s + (Number(c.weight) || 0), 0)}%
                </div>
              </div>
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead><tr className="bg-slate-50 border-b border-slate-200">
                    {['Tên criterion', 'Max Score', 'Weight %', ''].map(h => (
                      <th key={h} className="text-left px-3 py-2 text-xs font-semibold text-slate-500">{h}</th>
                    ))}
                  </tr></thead>
                  <tbody className="divide-y divide-slate-100">
                    {newCsCriteria.map((c, idx) => (
                      <tr key={idx}>
                        <td className="px-2 py-1.5">
                          <input value={c.name} onChange={e => { const copy = [...newCsCriteria]; copy[idx] = { ...copy[idx], name: e.target.value }; setNewCsCriteria(copy); }}
                            className="w-full border border-slate-200 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-700" />
                        </td>
                        <td className="px-2 py-1.5">
                          <input type="number" min={1} value={c.maxScore === '' ? '' : c.maxScore}
                            onChange={e => { const copy = [...newCsCriteria]; copy[idx] = { ...copy[idx], maxScore: parseNumInput(e) }; setNewCsCriteria(copy); }}
                            className="w-16 border border-slate-200 rounded px-2 py-1 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-blue-700" />
                        </td>
                        <td className="px-2 py-1.5">
                          <input type="number" min={0} max={100} value={c.weight === '' ? '' : c.weight}
                            onChange={e => { const copy = [...newCsCriteria]; copy[idx] = { ...copy[idx], weight: parseNumInput(e) }; setNewCsCriteria(copy); }}
                            className="w-16 border border-slate-200 rounded px-2 py-1 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-blue-700" />
                        </td>
                        <td className="px-2 py-1.5">
                          {newCsCriteria.length > 1 && (
                            <button onClick={() => setNewCsCriteria(prev => prev.filter((_, j) => j !== idx))}
                              className="p-0.5 text-slate-300 hover:text-red-500 transition-colors"><X className="w-3.5 h-3.5" /></button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <button onClick={() => setNewCsCriteria(prev => [...prev, { name: '', description: '', maxScore: 10, weight: 0, active: true }])}
                className="mt-1.5 flex items-center gap-1 text-xs text-blue-700 hover:text-blue-800 font-medium">
                <Plus className="w-3.5 h-3.5" /> Thêm criterion
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Edit Criteria Set modal */}
      {editingCs && (
        <Modal title={`Sửa Criteria Set: ${editingCs.name}`} onClose={() => setEditingCs(null)} size="lg"
          footer={
            <>
              <button onClick={() => setEditingCs(null)} disabled={csActionLoading} className="px-4 py-2 border border-slate-200 text-slate-600 text-sm rounded-lg hover:bg-slate-50 disabled:opacity-50">Huỷ</button>
              <button onClick={handleSaveCs} disabled={csActionLoading} className="px-4 py-2 bg-blue-800 hover:bg-blue-900 text-white text-sm font-semibold rounded-lg flex items-center gap-2 disabled:opacity-50">
                {csActionLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Lưu
              </button>
            </>
          }
        >
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Tên criteria set</label>
              <input
                value={editCsName}
                onChange={e => setEditCsName(e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-700"
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-semibold text-slate-600">Criteria</label>
                <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${
                  editCsCriteria.reduce((s, c) => s + (Number(c.weight) || 0), 0) === 100
                    ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                }`}>
                  Total: {editCsCriteria.reduce((s, c) => s + (Number(c.weight) || 0), 0)}%
                </span>
              </div>
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200">
                      {['Tên criterion', 'Max Score', 'Weight %', ''].map(h => (
                        <th key={h} className="text-left px-3 py-2 text-xs font-semibold text-slate-500">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {editCsCriteria.map((cr, idx) => (
                      <tr key={cr.id}>
                        <td className="px-2 py-1.5">
                          <input
                            value={cr.name}
                            onChange={e => { const copy = [...editCsCriteria]; copy[idx] = { ...copy[idx], name: e.target.value }; setEditCsCriteria(copy); }}
                            className="w-full border border-slate-200 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-700"
                          />
                        </td>
                        <td className="px-2 py-1.5">
                          <input
                            type="number" min={1} max={100}
                            value={cr.maxScore}
                            onChange={e => { const copy = [...editCsCriteria]; copy[idx] = { ...copy[idx], maxScore: Number(e.target.value) }; setEditCsCriteria(copy); }}
                            className="w-16 border border-slate-200 rounded px-2 py-1 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-blue-700"
                          />
                        </td>
                        <td className="px-2 py-1.5">
                          <input
                            type="number" min={0} max={100}
                            value={cr.weight}
                            onChange={e => { const copy = [...editCsCriteria]; copy[idx] = { ...copy[idx], weight: Number(e.target.value) }; setEditCsCriteria(copy); }}
                            className="w-16 border border-slate-200 rounded px-2 py-1 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-blue-700"
                          />
                        </td>
                        <td className="px-2 py-1.5">
                          <button
                            onClick={() => setEditCsCriteria(prev => prev.filter((_, i) => i !== idx))}
                            className="p-1 rounded text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <button
                onClick={() => setEditCsCriteria(prev => [...prev, { id: Date.now(), name: '', maxScore: 10, weight: 0 }])}
                className="mt-2 flex items-center gap-1 text-xs text-blue-700 hover:text-blue-800"
              >
                <Plus className="w-3.5 h-3.5" /> Thêm criterion
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
