import React, { useState, useEffect, useCallback } from 'react';
import { Calendar, Plus, ChevronRight, CheckCircle2, Clock, AlertTriangle, Users, Send, Lock, Trophy, Globe, FileBarChart, Eye, Edit2, UserCheck, UserX, Search, Download, Check, BarChart2, GraduationCap, Building2, RefreshCw, ArrowLeft, Layers, Tag, List, XCircle, Gavel, Copy, Key, PlayCircle, Archive } from 'lucide-react';
import { toast } from 'sonner';
import { KPICard } from '../components/shared/KPICard';
import { StatusBadge } from '../components/shared/Badge';
import { Modal } from '../components/shared/Modal';
import {
  getPendingAccounts,
  approveAccount,
  rejectAccount,
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
  type EventSummary,
  type EventRound,
  type EventCategory,
  type CriteriaSet,
  type EventType,
} from '../../api/events';
import { getDisciplines, getTermPlans, getBudgetCategories, type Discipline, type TermPlan, type BudgetCategory } from '../../api/governance';
import { getTeamsByEvent, reviewTeam, type TeamSummary } from '../../api/teams';
import {
  getJudges, getRoundJudges, assignJudge, revokeJudge, createGuestJudge,
  type JudgeUser, type RoundJudge, type CreateGuestJudgeResponse,
} from '../../api/judges';

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

const sampleEvent = {
  id: 1, name: 'SEAL Software Engineering Hackathon Summer 2026', type: 'SUMMER',
  discipline: 'Software Engineering', term: 'Summer 2026', status: 'IN_PROGRESS',
  registrationOpen: '2026-06-20', registrationClose: '2026-06-30',
  eventStart: '2026-07-15', eventEnd: '2026-08-10',
  teamsRegistered: 24, maxTeams: 40,
  rounds: [
    { id: 1, name: 'Preliminary Round', status: 'SCORING_OPEN', deadline: '2026-07-25', promotionTopN: 6 },
    { id: 2, name: 'Final Round', status: 'DRAFT', deadline: '2026-08-08', promotionTopN: 3 },
  ],
  categories: ['Web Application', 'Mobile Application', 'AI/Automation Tool'],
};

const lifecycleSteps = [
  { label: 'Draft', status: 'done', date: '2026-06-05' },
  { label: 'Pending Approval', status: 'done', date: '2026-06-10' },
  { label: 'Approved', status: 'done', date: '2026-06-12' },
  { label: 'Open', status: 'done', date: '2026-06-20' },
  { label: 'In Progress', status: 'current', date: '2026-07-15' },
  { label: 'Completed', status: 'future', date: '—' },
  { label: 'Archived', status: 'future', date: '—' },
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

const submissions = [
  { id: 1, team: 'Code Seals', round: 'Preliminary', category: 'Web Application', repoUrl: 'github.com/codeseals/seal-webapp', demoUrl: 'seal-demo.vercel.app', slideUrl: 'drive.google.com/...', submittedAt: '2026-07-22 14:30', status: 'SUBMITTED', version: 3 },
  { id: 2, team: 'AlphaBot', round: 'Preliminary', category: 'AI/Automation Tool', repoUrl: 'github.com/alphabot/ai-tool', demoUrl: 'alphabot-demo.netlify.app', slideUrl: null, submittedAt: '2026-07-23 10:15', status: 'SUBMITTED', version: 1 },
  { id: 3, team: 'MobileFirst', round: 'Preliminary', category: 'Mobile Application', repoUrl: 'github.com/mobilefirst/app', demoUrl: null, slideUrl: 'drive.google.com/...', submittedAt: '2026-07-24 16:45', status: 'SUBMITTED', version: 2 },
  { id: 4, team: 'NexGen', round: 'Preliminary', category: 'Web Application', repoUrl: 'github.com/nexgen/webapp', demoUrl: 'nexgen-webapp.vercel.app', slideUrl: null, submittedAt: '2026-07-24 20:10', status: 'SUBMITTED', version: 1 },
  { id: 5, team: 'DataFlow', round: 'Preliminary', category: 'AI/Automation Tool', repoUrl: '', demoUrl: '', slideUrl: '', submittedAt: '—', status: 'NOT_SUBMITTED', version: 0 },
];

export function CoordDashboard({ onNavigate }: { onNavigate: (s: string) => void }) {
  return (
    <div className="p-7 space-y-7">
      <PageHeader title="Coordinator Dashboard" subtitle="Manage your events, teams, scoring, and results" />
      <div className="grid grid-cols-4 gap-5">
        <KPICard title="My Events" value="3" subtitle="Summer 2026" icon={Calendar} accent="blue" />
        <KPICard title="Pending Participants" value="7" subtitle="Awaiting approval" icon={UserCheck} accent="amber" />
        <KPICard title="Scoring Open" value="1" subtitle="Preliminary Round" icon={Lock} accent="cyan" />
        <KPICard title="Results to Publish" value="0" subtitle="Final Round pending" icon={Globe} accent="purple" />
      </div>

      {/* Active Event Card */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1"><StatusBadge status="IN_PROGRESS" /><span className="text-xs text-slate-400">SUMMER 2026</span></div>
            <h2 className="text-lg font-bold text-slate-900" style={{ fontFamily: 'var(--font-display)' }}>{sampleEvent.name}</h2>
          </div>
          <button onClick={() => onNavigate('coord-events')} className="text-sm text-blue-700 hover:text-blue-800 font-medium flex items-center gap-1">View All Events <ChevronRight className="w-3.5 h-3.5" /></button>
        </div>

        {/* Lifecycle Timeline */}
        <div className="flex items-center gap-0 mb-5">
          {lifecycleSteps.map((step, i) => (
            <React.Fragment key={step.label}>
              <div className="flex flex-col items-center">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center border-2 flex-shrink-0 ${step.status === 'done' ? 'bg-emerald-500 border-emerald-500' : step.status === 'current' ? 'bg-blue-800 border-blue-800' : 'bg-white border-slate-300'}`}>
                  {step.status === 'done' ? <Check className="w-3.5 h-3.5 text-white" /> : step.status === 'current' ? <span className="w-2 h-2 bg-white rounded-full" /> : <span className="w-2 h-2 bg-slate-300 rounded-full" />}
                </div>
                <p className={`text-[10px] mt-1.5 text-center w-14 ${step.status === 'current' ? 'text-blue-800 font-semibold' : step.status === 'done' ? 'text-emerald-700' : 'text-slate-400'}`}>{step.label}</p>
                <p className="text-[9px] text-slate-400 font-mono mt-0.5">{step.date}</p>
              </div>
              {i < lifecycleSteps.length - 1 && <div className={`flex-1 h-0.5 mx-0.5 mb-5 ${step.status === 'done' ? 'bg-emerald-400' : 'bg-slate-200'}`} />}
            </React.Fragment>
          ))}
        </div>

        <div className="grid grid-cols-4 gap-4">
          {[
            { label: 'Teams Registered', value: '24 / 40', action: () => onNavigate('coord-teams') },
            { label: 'Pending Participants', value: '7', action: () => onNavigate('coord-participants') },
            { label: 'Submissions (Prelim)', value: '4 / 5 teams', action: () => onNavigate('coord-submissions') },
            { label: 'Scores Completed', value: '7 / 14', action: () => onNavigate('coord-scoring') },
          ].map(item => (
            <button key={item.label} onClick={item.action} className="text-left p-3 rounded-lg border border-slate-100 hover:border-blue-200 hover:bg-blue-50/30 transition-colors">
              <p className="text-xs text-slate-500">{item.label}</p>
              <p className="text-lg font-bold text-slate-900 mt-0.5">{item.value}</p>
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-5">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
          <h3 className="font-semibold text-slate-900 mb-3" style={{ fontFamily: 'var(--font-display)' }}>Active Rounds</h3>
          {sampleEvent.rounds.map(r => (
            <div key={r.id} className="flex items-center justify-between py-2.5 border-b border-slate-100 last:border-0">
              <div><p className="text-sm font-medium text-slate-900">{r.name}</p><p className="text-xs text-slate-500">Deadline: {r.deadline}</p></div>
              <StatusBadge status={r.status} />
            </div>
          ))}
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
          <h3 className="font-semibold text-slate-900 mb-3" style={{ fontFamily: 'var(--font-display)' }}>Quick Actions</h3>
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: 'Approve Participants', icon: UserCheck, color: 'text-emerald-600', bg: 'bg-emerald-50 hover:bg-emerald-100', screen: 'coord-participants' },
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

interface RoundForm { name: string; submissionDeadline: string; promotionTopN: number | ''; isFinalRound: boolean; }
interface CategoryForm { name: string; description: string; }
interface CriterionForm { name: string; description: string; maxScore: number; weight: number; active: boolean; }
interface BudgetItemForm { categoryId: number | ''; description: string; quantity: number; unitCost: number; }

export function CreateEventWizard({ onNavigate }: { onNavigate: (s: string) => void }) {
  const [step, setStep] = useState(0);
  const [maxReached, setMaxReached] = useState(0);
  const [saving, setSaving] = useState(false);

  // Meta (loaded on mount)
  const [disciplines, setDisciplines] = useState<Discipline[]>([]);
  const [allTermPlans, setAllTermPlans] = useState<TermPlan[]>([]);
  const [budgetCategories, setBudgetCategories] = useState<BudgetCategory[]>([]);
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
    { name: 'Preliminary Round', submissionDeadline: '2026-07-25', promotionTopN: 6, isFinalRound: false },
    { name: 'Final Round', submissionDeadline: '2026-08-08', promotionTopN: 3, isFinalRound: true },
  ]);
  const [roundIds, setRoundIds] = useState<number[]>([]);

  // Step 2 – Categories
  const [categories, setCategories] = useState<CategoryForm[]>([
    { name: 'Web Application', description: 'Full-stack web apps' },
    { name: 'Mobile Application', description: 'iOS/Android mobile apps' },
    { name: 'AI/Automation Tool', description: 'ML, AI-powered tools' },
  ]);
  const [categoryIds, setCategoryIds] = useState<number[]>([]);

  // Step 3 – Criteria
  const [criteria, setCriteria] = useState<CriterionForm[]>([
    { name: 'Technical Quality', description: 'Code quality, architecture, performance, scalability', maxScore: 10, weight: 40, active: true },
    { name: 'Innovation', description: 'Originality, creative use of technology, novelty of approach', maxScore: 10, weight: 25, active: true },
    { name: 'UI/UX Design', description: 'Interface usability, visual design, user experience quality', maxScore: 10, weight: 20, active: true },
    { name: 'Presentation', description: 'Demo clarity, Q&A responses, communication', maxScore: 10, weight: 15, active: true },
  ]);
  const [criteriaSetId, setCriteriaSetId] = useState<number | null>(null);

  // Step 4 – Budget
  const [budgetId, setBudgetId] = useState<number | null>(null);
  const [budgetItems, setBudgetItems] = useState<BudgetItemForm[]>([
    { categoryId: '', description: 'First Place Prize', quantity: 1, unitCost: 15000000 },
    { categoryId: '', description: 'Second Place Prize', quantity: 1, unitCost: 10000000 },
    { categoryId: '', description: 'Third Place Prize', quantity: 1, unitCost: 5000000 },
    { categoryId: '', description: 'Event Day Meals & Drinks', quantity: 1, unitCost: 8000000 },
    { categoryId: '', description: 'Guest Judge Honorarium', quantity: 2, unitCost: 2000000 },
    { categoryId: '', description: 'Posters & Online Promotion', quantity: 1, unitCost: 3000000 },
  ]);

  // Derived
  const filteredTermPlans = allTermPlans.filter(tp => disciplineId !== '' && tp.disciplineId === (disciplineId as number));
  const selectedTermPlan = allTermPlans.find(tp => tp.id === termPlanId);
  const autoEventType = selectedTermPlan?.term as EventType | undefined;
  const totalWeight = criteria.filter(c => c.active).reduce((s, c) => s + c.weight, 0);
  const totalBudget = budgetItems.reduce((s, i) => s + i.quantity * i.unitCost, 0);

  useEffect(() => {
    Promise.all([getDisciplines(), getTermPlans(), getBudgetCategories()])
      .then(([d, tp, bc]) => { setDisciplines(safeArray(d)); setAllTermPlans(safeArray(tp)); setBudgetCategories(safeArray(bc)); })
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
            promotionTopN: typeof r.promotionTopN === 'number' ? r.promotionTopN : undefined,
            isFinalRound: r.isFinalRound,
          }));
        }
        setRoundIds(saved.map(r => r.id));
      } else if (step === 2 && categoryIds.length === 0 && eventId) {
        const saved: EventCategory[] = [];
        for (const cat of categories) {
          saved.push(await createCategory(eventId, {
            name: cat.name,
            description: cat.description || undefined,
          }));
        }
        setCategoryIds(saved.map(c => c.id));
      } else if (step === 3 && criteriaSetId === null && eventId) {
        if (totalWeight !== 100) { toast.error(`Tổng weight phải bằng 100%. Hiện tại: ${totalWeight}%`); return; }
        const active = criteria.filter(c => c.active);
        if (active.length === 0) { toast.error('Cần ít nhất 1 criterion active'); return; }
        const cs = await createCriteriaSet(eventId, {
          name: 'Default Criteria Set',
          criteria: active.map((c, idx) => ({
            name: c.name,
            description: c.description || undefined,
            maxScore: c.maxScore,
            weight: c.weight,
            displayOrder: idx + 1,
          })),
        });
        setCriteriaSetId(cs.id);
      } else if (step === 4 && budgetId === null && eventId) {
        const budget = await createBudget(eventId, { currency: 'VND' });
        const validItems = budgetItems.filter(i => i.categoryId !== '' && i.description.trim());
        for (const i of validItems) {
          await createBudgetItem(eventId, {
            categoryId: i.categoryId as number,
            description: i.description.trim(),
            quantity: i.quantity,
            unitCost: i.unitCost,
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
          {step === 3 && criteriaSetId && savedBadge('Criteria set đã lưu')}
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
                  onClick={() => roundIds.length === 0 && setRounds(prev => [...prev, { name: `Round ${prev.length + 1}`, submissionDeadline: '', promotionTopN: '', isFinalRound: false }])}
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
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Round Name</label>
                      <input value={r.name} onChange={e => { const c = [...rounds]; c[i] = { ...c[i], name: e.target.value }; setRounds(c); }} disabled={roundIds.length > 0}
                        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-700 disabled:opacity-50 disabled:bg-slate-50" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Submission Deadline</label>
                      <input type="date" value={r.submissionDeadline} onChange={e => { const c = [...rounds]; c[i] = { ...c[i], submissionDeadline: e.target.value }; setRounds(c); }} disabled={roundIds.length > 0}
                        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-700 disabled:opacity-50 disabled:bg-slate-50" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Promote Top N Teams</label>
                      <input type="number" value={r.promotionTopN} onChange={e => { const c = [...rounds]; c[i] = { ...c[i], promotionTopN: e.target.value === '' ? '' : Number(e.target.value) }; setRounds(c); }} disabled={roundIds.length > 0}
                        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-700 disabled:opacity-50 disabled:bg-slate-50" />
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <input type="checkbox" id={`final-${i}`} checked={r.isFinalRound}
                      onChange={e => { const c = [...rounds]; c[i] = { ...c[i], isFinalRound: e.target.checked }; setRounds(c); }}
                      disabled={roundIds.length > 0} className="rounded border-slate-300" />
                    <label htmlFor={`final-${i}`} className="text-xs text-slate-600">This is the final round</label>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ── Step 2: Categories ─────────────────────────────── */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="flex justify-end">
                <button
                  onClick={() => categoryIds.length === 0 && setCategories(prev => [...prev, { name: '', description: '' }])}
                  disabled={categoryIds.length > 0}
                  className="flex items-center gap-1.5 text-sm text-blue-700 font-medium hover:text-blue-800 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Plus className="w-4 h-4" /> Add Category
                </button>
              </div>
              {categories.map((cat, i) => (
                <div key={i} className="p-4 rounded-lg border border-slate-200 grid grid-cols-2 gap-3">
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
                </div>
              ))}
            </div>
          )}

          {/* ── Step 3: Criteria ───────────────────────────────── */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-slate-600">Scoring criteria and weights for all judging. Total weight must equal 100%.</p>
                <div className={`flex items-center gap-1.5 text-sm font-mono font-bold px-3 py-1 rounded-lg ${totalWeight === 100 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                  {totalWeight === 100 ? <Check className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                  Total: {totalWeight}%
                </div>
              </div>
              <table className="w-full">
                <thead><tr className="border-b border-slate-200">{['Criterion', 'Description', 'Max Score', 'Weight (%)', 'Active'].map(c => <th key={c} className="text-left px-3 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">{c}</th>)}</tr></thead>
                <tbody className="divide-y divide-slate-100">
                  {criteria.map((c, i) => (
                    <tr key={i} className="hover:bg-slate-50">
                      <td className="px-3 py-2.5">
                        <input value={c.name} onChange={e => { const copy = [...criteria]; copy[i] = { ...copy[i], name: e.target.value }; setCriteria(copy); }} disabled={!!criteriaSetId}
                          className="w-full border border-slate-200 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-700 disabled:opacity-50 disabled:bg-slate-50" />
                      </td>
                      <td className="px-3 py-2.5">
                        <input value={c.description} onChange={e => { const copy = [...criteria]; copy[i] = { ...copy[i], description: e.target.value }; setCriteria(copy); }} disabled={!!criteriaSetId}
                          className="w-full border border-slate-200 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-700 disabled:opacity-50 disabled:bg-slate-50" />
                      </td>
                      <td className="px-3 py-2.5">
                        <input type="number" min={1} max={100} value={c.maxScore} onChange={e => { const copy = [...criteria]; copy[i] = { ...copy[i], maxScore: Number(e.target.value) }; setCriteria(copy); }} disabled={!!criteriaSetId}
                          className="w-16 border border-slate-200 rounded px-2 py-1 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-blue-700 disabled:opacity-50 disabled:bg-slate-50" />
                      </td>
                      <td className="px-3 py-2.5">
                        <input type="number" min={0} max={100} value={c.weight} onChange={e => { const copy = [...criteria]; copy[i] = { ...copy[i], weight: Number(e.target.value) }; setCriteria(copy); }} disabled={!!criteriaSetId}
                          className="w-16 border border-slate-200 rounded px-2 py-1 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-blue-700 disabled:opacity-50 disabled:bg-slate-50" />
                      </td>
                      <td className="px-3 py-2.5">
                        <div className={`w-10 h-5 rounded-full transition-colors ${criteriaSetId ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'} ${c.active ? 'bg-blue-700' : 'bg-slate-300'}`}
                          onClick={() => { if (!criteriaSetId) { const copy = [...criteria]; copy[i] = { ...copy[i], active: !copy[i].active }; setCriteria(copy); } }}>
                          <div className={`w-4 h-4 bg-white rounded-full m-0.5 transition-transform shadow ${c.active ? 'translate-x-5' : 'translate-x-0'}`} />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {totalWeight !== 100 && <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-4 py-2"><AlertTriangle className="w-4 h-4 text-red-600" /><p className="text-sm text-red-700">Total weight is {totalWeight}%. Must equal exactly 100%.</p></div>}
            </div>
          )}

          {/* ── Step 4: Budget ─────────────────────────────────── */}
          {step === 4 && (
            <div>
              <table className="w-full mb-3">
                <thead><tr className="border-b border-slate-200">{['Category', 'Description', 'Qty', 'Unit Cost (VND)', 'Amount (VND)'].map(c => <th key={c} className="text-left px-3 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">{c}</th>)}</tr></thead>
                <tbody className="divide-y divide-slate-100">
                  {budgetItems.map((item, i) => (
                    <tr key={i} className="hover:bg-slate-50">
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
                        <input type="number" min={1} value={item.quantity} onChange={e => { const c = [...budgetItems]; c[i] = { ...c[i], quantity: Number(e.target.value) }; setBudgetItems(c); }} disabled={!!budgetId}
                          className="w-14 border border-slate-200 rounded px-2 py-1 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-blue-700 disabled:opacity-50 disabled:bg-slate-50" />
                      </td>
                      <td className="px-3 py-2">
                        <input type="number" min={0} value={item.unitCost} onChange={e => { const c = [...budgetItems]; c[i] = { ...c[i], unitCost: Number(e.target.value) }; setBudgetItems(c); }} disabled={!!budgetId}
                          className="w-28 border border-slate-200 rounded px-2 py-1 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-blue-700 disabled:opacity-50 disabled:bg-slate-50" />
                      </td>
                      <td className="px-3 py-2 text-sm font-mono font-semibold text-slate-900 text-right">{(item.quantity * item.unitCost).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot><tr className="border-t-2 border-slate-200 bg-slate-50"><td colSpan={4} className="px-3 py-2 text-sm font-bold">Total Estimated</td><td className="px-3 py-2 text-sm font-bold text-blue-800 font-mono text-right">{totalBudget.toLocaleString()}</td></tr></tfoot>
              </table>
              {!budgetId && (
                <button onClick={() => setBudgetItems(prev => [...prev, { categoryId: '', description: '', quantity: 1, unitCost: 0 }])}
                  className="flex items-center gap-1.5 text-sm text-blue-700 font-medium hover:text-blue-800">
                  <Plus className="w-4 h-4" /> Add Budget Item
                </button>
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
                    ['Criteria', `${criteria.filter(c => c.active).length} criteria (total weight ${totalWeight}%)`],
                    ['Total Budget', `${totalBudget.toLocaleString()} VND`],
                  ].map(([k, v]) => (
                    <div key={k}><span className="text-blue-600 font-medium">{k}:</span><span className="text-blue-900 ml-2">{v}</span></div>
                  ))}
                </div>
              </div>
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-amber-800">Submitting for Approval</p>
                  <p className="text-sm text-amber-700 mt-1">This event will be sent to the Super Coordinator for review. You cannot edit the event while it is under review.</p>
                </div>
              </div>
              <button
                onClick={handleSubmit}
                disabled={saving || !eventId}
                className="w-full bg-blue-800 hover:bg-blue-900 disabled:opacity-50 text-white font-semibold py-3 rounded-xl text-sm transition-colors flex items-center justify-center gap-2"
              >
                {saving ? <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : <Send className="w-4 h-4" />}
                Submit Event for Approval
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

export function SubmissionMonitor() {
  return (
    <div className="p-7 space-y-5">
      <PageHeader title="Submission Monitoring" subtitle="Preliminary Round — SEAL Hackathon Summer 2026" actions={<button className="flex items-center gap-1.5 border border-slate-200 text-slate-600 text-sm px-3 py-2 rounded-lg hover:bg-slate-50"><Download className="w-4 h-4" /> Export</button>} />
      <div className="grid grid-cols-3 gap-4 mb-2">
        <KPICard title="Submitted" value="4" subtitle="of 5 teams" icon={Send} accent="green" />
        <KPICard title="Not Submitted" value="1" subtitle="DataFlow pending" icon={AlertTriangle} accent="amber" />
        <KPICard title="Deadline" value="2026-07-25" subtitle="1 day remaining" icon={Clock} accent="red" />
      </div>
      <div className="bg-white rounded-xl shadow-sm border border-slate-200">
        <table className="w-full">
          <thead><tr className="border-b border-slate-100">{['Team', 'Category', 'Repository URL', 'Demo URL', 'Slides', 'Submitted At', 'Version', 'Status'].map(c => <th key={c} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">{c}</th>)}</tr></thead>
          <tbody className="divide-y divide-slate-100">
            {submissions.map(s => (
              <tr key={s.id} className={`hover:bg-slate-50 transition-colors ${s.status === 'NOT_SUBMITTED' ? 'bg-amber-50/40' : ''}`}>
                <td className="px-4 py-3 text-sm font-semibold text-slate-900">{s.team}</td>
                <td className="px-4 py-3 text-xs text-slate-600">{s.category}</td>
                <td className="px-4 py-3">
                  {s.repoUrl ? <a href="#" className="text-xs text-blue-600 hover:underline font-mono">{s.repoUrl}</a> : <span className="text-xs text-red-500">Missing (required)</span>}
                </td>
                <td className="px-4 py-3">
                  {s.demoUrl ? <a href="#" className="text-xs text-cyan-600 hover:underline font-mono">{s.demoUrl}</a> : <span className="text-xs text-slate-400">—</span>}
                </td>
                <td className="px-4 py-3">
                  {s.slideUrl ? <a href="#" className="text-xs text-purple-600 hover:underline">View</a> : <span className="text-xs text-slate-400">—</span>}
                </td>
                <td className="px-4 py-3 text-xs font-mono text-slate-500">{s.submittedAt}</td>
                <td className="px-4 py-3 text-xs font-mono text-slate-600">v{s.version || '—'}</td>
                <td className="px-4 py-3"><StatusBadge status={s.status === 'SUBMITTED' ? 'SUBMITTED' : 'PENDING'} label={s.status === 'SUBMITTED' ? 'Submitted' : 'Not Submitted'} /></td>
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
      // Refresh judge pool so new guest appears in dropdown
      getJudges().then(pool => setJudgePool(safeArray(pool))).catch(() => {});
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

export function TeamManagement() {
  const [events, setEvents] = useState<EventSummary[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<number | ''>('');
  const [teams, setTeams] = useState<TeamSummary[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [loadingTeams, setLoadingTeams] = useState(false);

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

  return (
    <div className="p-7 space-y-5">
      <PageHeader
        title="Team Registration"
        subtitle={selectedEvent ? `${teams.length} teams — ${selectedEvent.name}` : 'Chọn event để xem danh sách team'}
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
                {['Team Name', 'Category', 'Leader', 'Members', 'Status', 'Actions'].map(c => (
                  <th key={c} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">{c}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {teams.map(t => {
                const mc = t.memberCount ?? 0;
                const isActive = actionId === t.id;
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
                      <div className="flex items-center gap-1">
                        {t.status === 'ACTIVE' && (
                          <>
                            <button
                              onClick={() => handleApprove(t)}
                              disabled={isActive || mc < 3}
                              title={mc < 3 ? 'Cần ít nhất 3 thành viên' : 'Approve team'}
                              className="flex items-center gap-1 text-xs bg-emerald-50 text-emerald-700 hover:bg-emerald-100 disabled:opacity-50 disabled:cursor-not-allowed px-2 py-1 rounded font-medium transition-colors"
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
                          </>
                        )}
                        {(t.status === 'APPROVED' || t.status === 'REJECTED') && (
                          <span className="text-xs text-slate-400 italic">
                            {t.status === 'APPROVED' ? 'Approved' : 'Rejected'}
                          </span>
                        )}
                      </div>
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
export function AccountApprovalsPage() {
  const [accounts, setAccounts] = useState<PendingAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
      setError(err instanceof Error ? err.message : 'Không tải được danh sách');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

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
        subtitle="Duyệt tài khoản đăng ký đang chờ xét duyệt"
        actions={
          <button
            onClick={load}
            disabled={loading}
            className="flex items-center gap-1.5 border border-slate-200 text-slate-600 text-sm px-3 py-2 rounded-lg hover:bg-slate-50 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        }
      />

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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Action state
  const [actionLoading, setActionLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    if (!eventId) return;
    setLoading(true);
    setError(null);

    Promise.all([
      getEvent(eventId),
      getEventRounds(eventId).catch(() => [] as EventRound[]),
      getEventCategories(eventId).catch(() => [] as EventCategory[]),
      getEventCriteriaSets(eventId).catch(() => [] as CriteriaSet[]),
    ])
      .then(([ev, r, c, cs]) => {
        setEvent(ev);
        setRounds(safeArray(r));
        setCategories(safeArray(c));
        setCriteriaSets(safeArray(cs).map(set => ({ ...set, criteria: safeArray(set.criteria) })));
      })
      .catch(err => setError(err instanceof Error ? err.message : 'Không tải được event'))
      .finally(() => setLoading(false));
  }, [eventId]);

  const fmtDate = (s: string | null | undefined) =>
    s ? s.replace('T', ' ').slice(0, 16) : '—';

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

      {/* Rounds */}
      <section className="bg-white rounded-xl shadow-sm border border-slate-200">
        <div className="px-5 py-3 border-b border-slate-100 flex items-center gap-2">
          <Layers className="w-4 h-4 text-slate-400" />
          <h2 className="text-sm font-semibold text-slate-700">Rounds ({rounds.length})</h2>
        </div>
        {rounds.length === 0 ? (
          <p className="px-5 py-6 text-sm text-slate-400 text-center">Chưa có round nào được cấu hình.</p>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100">
                {['#', 'Tên round', 'Status', 'Deadline', 'Top N promote'].map(h => (
                  <th key={h} className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rounds.map(r => (
                <tr key={r.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 text-xs font-mono text-slate-400">{r.roundNumber}</td>
                  <td className="px-4 py-3 text-sm font-medium text-slate-900">{r.name}</td>
                  <td className="px-4 py-3"><StatusBadge status={r.status} /></td>
                  <td className="px-4 py-3 text-xs font-mono text-slate-500">{fmtDate(r.submissionDeadline)}</td>
                  <td className="px-4 py-3 text-xs font-mono text-slate-600">{r.promotionTopN ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {/* Categories */}
      <section className="bg-white rounded-xl shadow-sm border border-slate-200">
        <div className="px-5 py-3 border-b border-slate-100 flex items-center gap-2">
          <Tag className="w-4 h-4 text-slate-400" />
          <h2 className="text-sm font-semibold text-slate-700">Categories ({categories.length})</h2>
        </div>
        {categories.length === 0 ? (
          <p className="px-5 py-6 text-sm text-slate-400 text-center">Chưa có category nào.</p>
        ) : (
          <div className="divide-y divide-slate-100">
            {categories.map(cat => (
              <div key={cat.id} className="px-5 py-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-900">{cat.name}</p>
                  {cat.description && <p className="text-xs text-slate-500 mt-0.5">{cat.description}</p>}
                </div>
                {cat.maxTeams != null && (
                  <span className="text-xs font-mono bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                    max {cat.maxTeams} teams
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Criteria Sets */}
      <section className="bg-white rounded-xl shadow-sm border border-slate-200">
        <div className="px-5 py-3 border-b border-slate-100 flex items-center gap-2">
          <List className="w-4 h-4 text-slate-400" />
          <h2 className="text-sm font-semibold text-slate-700">Criteria Sets ({criteriaSets.length})</h2>
        </div>
        {criteriaSets.length === 0 ? (
          <p className="px-5 py-6 text-sm text-slate-400 text-center">Chưa có criteria set nào.</p>
        ) : (
          <div className="divide-y divide-slate-100">
            {criteriaSets.map(cs => (
              <div key={cs.id} className="px-5 py-4">
                <p className="text-sm font-semibold text-slate-900 mb-1">{cs.name}</p>
                {cs.description && <p className="text-xs text-slate-500 mb-3">{cs.description}</p>}
                {cs.criteria && cs.criteria.length > 0 && (
                  <div className="bg-slate-50 rounded-lg overflow-hidden border border-slate-100">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-slate-200">
                          {['Criterion', 'Max Score', 'Weight %'].map(h => (
                            <th key={h} className="text-left px-3 py-2 text-xs font-semibold text-slate-500">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {cs.criteria.map(cr => (
                          <tr key={cr.id}>
                            <td className="px-3 py-2 text-xs text-slate-800 font-medium">{cr.name}</td>
                            <td className="px-3 py-2 text-xs font-mono text-slate-600">{cr.maxScore}</td>
                            <td className="px-3 py-2 text-xs font-mono text-slate-600">{cr.weight}%</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

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
    </div>
  );
}
