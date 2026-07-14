import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  FileText,
  RefreshCw,
  Save,
  Send,
  Star,
} from 'lucide-react';
import { toast } from 'sonner';
import { KPICard } from '../components/shared/KPICard';
import { StatusBadge } from '../components/shared/Badge';
import { Modal } from '../components/shared/Modal';
import {
  getAssignedSubmissions,
  getEvaluation,
  getEvaluationHistory,
  saveDraftScores,
  startEvaluation,
  submitEvaluation,
  type EvaluationDetail,
  type EvaluationHistoryItem,
  type EvaluationScore,
  type JudgeAssignedSubmission,
} from '../../api/evaluations';

function PageHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-7">
      <h1 className="text-xl font-bold text-slate-900" style={{ fontFamily: 'var(--font-display)' }}>{title}</h1>
      {subtitle && <p className="text-sm text-slate-500 mt-0.5">{subtitle}</p>}
    </div>
  );
}

const LS_SELECTED_SUBMISSION = 'seal_judge_selected_submission_id';

function readPersistedSelection(): number | null {
  try {
    const raw = sessionStorage.getItem(LS_SELECTED_SUBMISSION);
    return raw ? Number(raw) : null;
  } catch {
    return null;
  }
}

function persistSelection(submissionId: number | null) {
  try {
    if (submissionId == null) {
      sessionStorage.removeItem(LS_SELECTED_SUBMISSION);
    } else {
      sessionStorage.setItem(LS_SELECTED_SUBMISSION, String(submissionId));
    }
  } catch {
    // ignore session storage issues
  }
}

function fmtDate(value?: string | null) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString('vi-VN', { hour12: false });
}

function fmtNumber(value?: number | string | null, digits = 2) {
  if (value == null || value === '') return '—';
  const num = typeof value === 'number' ? value : Number(value);
  if (Number.isNaN(num)) return String(value);
  return num.toFixed(digits);
}

function statusLabel(status?: string | null) {
  return (status ?? 'NOT_STARTED').replace(/_/g, ' ');
}

function assignmentActionLabel(item: JudgeAssignedSubmission) {
  if (item.evaluationStatus === 'LOCKED') return 'View Locked Evaluation';
  if (item.evaluationStatus === 'SUBMITTED') return 'Edit Submitted Evaluation';
  if (item.evaluationStatus === 'DRAFT') return 'Continue Evaluation';
  return 'Start Evaluation';
}

function buildScoreMap(scores: EvaluationScore[]) {
  return scores.reduce<Record<number, { scoreValue: string; comment: string }>>((acc, score) => {
    acc[score.criterionId] = {
      scoreValue: score.scoreValue == null ? '' : String(score.scoreValue),
      comment: score.comment ?? '',
    };
    return acc;
  }, {});
}

function normalizeScoreValue(raw?: string | null) {
  const value = typeof raw === 'string' ? raw.trim() : '';
  if (!value) return null;
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return null;
  return parsed;
}

type ScoreDraftState = Record<number, { scoreValue: string; comment: string }>;

type AssignmentSortOption =
  | 'status'
  | 'submitted_desc'
  | 'submitted_asc'
  | 'team_asc'
  | 'team_desc'
  | 'event_asc'
  | 'event_desc'
  | 'round_asc'
  | 'round_desc'
  | 'attempt_desc'
  | 'attempt_asc';

type AssignmentFilters = {
  query: string;
  eventName: string;
  roundName: string;
  categoryName: string;
  status: string;
  dateFrom: string;
  dateTo: string;
  sort: AssignmentSortOption;
};

const defaultAssignmentFilters: AssignmentFilters = {
  query: '',
  eventName: 'ALL',
  roundName: 'ALL',
  categoryName: 'ALL',
  status: 'ALL',
  dateFrom: '',
  dateTo: '',
  sort: 'status',
};

const evaluationStatusPriority: Record<string, number> = {
  DRAFT: 0,
  NOT_STARTED: 1,
  SUBMITTED: 2,
  LOCKED: 3,
};

function uniqueSorted(values: Array<string | null | undefined>) {
  return Array.from(new Set(values.filter(Boolean).map(String))).sort((a, b) => a.localeCompare(b));
}

function toDateMs(value?: string | null) {
  if (!value) return 0;
  const time = new Date(value).getTime();
  return Number.isNaN(time) ? 0 : time;
}

function filterAndSortAssignments(items: JudgeAssignedSubmission[], filters: AssignmentFilters) {
  const query = filters.query.trim().toLowerCase();
  const from = filters.dateFrom ? new Date(`${filters.dateFrom}T00:00:00`).getTime() : null;
  const to = filters.dateTo ? new Date(`${filters.dateTo}T23:59:59`).getTime() : null;

  return items
    .filter(item => {
      const status = item.evaluationStatus ?? 'NOT_STARTED';
      const submittedAt = toDateMs(item.submittedAt);
      const matchesQuery = !query || [item.teamName, item.eventName, item.roundName, item.categoryName, status]
        .filter(Boolean)
        .some(text => String(text).toLowerCase().includes(query));
      return matchesQuery
        && (filters.eventName === 'ALL' || item.eventName === filters.eventName)
        && (filters.roundName === 'ALL' || item.roundName === filters.roundName)
        && (filters.categoryName === 'ALL' || item.categoryName === filters.categoryName)
        && (filters.status === 'ALL' || status === filters.status)
        && (from == null || submittedAt >= from)
        && (to == null || submittedAt <= to);
    })
    .sort((a, b) => {
      switch (filters.sort) {
        case 'submitted_desc':
          return toDateMs(b.submittedAt) - toDateMs(a.submittedAt);
        case 'submitted_asc':
          return toDateMs(a.submittedAt) - toDateMs(b.submittedAt);
        case 'team_asc':
          return a.teamName.localeCompare(b.teamName);
        case 'team_desc':
          return b.teamName.localeCompare(a.teamName);
        case 'event_asc':
          return a.eventName.localeCompare(b.eventName);
        case 'event_desc':
          return b.eventName.localeCompare(a.eventName);
        case 'round_asc':
          return a.roundName.localeCompare(b.roundName);
        case 'round_desc':
          return b.roundName.localeCompare(a.roundName);
        case 'attempt_desc':
          return (b.attemptNumber ?? 0) - (a.attemptNumber ?? 0);
        case 'attempt_asc':
          return (a.attemptNumber ?? 0) - (b.attemptNumber ?? 0);
        case 'status':
        default:
          return (evaluationStatusPriority[a.evaluationStatus ?? 'NOT_STARTED'] ?? 99)
            - (evaluationStatusPriority[b.evaluationStatus ?? 'NOT_STARTED'] ?? 99)
            || toDateMs(b.submittedAt) - toDateMs(a.submittedAt);
      }
    });
}

function AssignmentFilterBar({
  items,
  filters,
  onChange,
}: {
  items: JudgeAssignedSubmission[];
  filters: AssignmentFilters;
  onChange: (patch: Partial<AssignmentFilters>) => void;
}) {
  const eventOptions = uniqueSorted(items.map(item => item.eventName));
  const roundOptions = uniqueSorted(items.map(item => item.roundName));
  const categoryOptions = uniqueSorted(items.map(item => item.categoryName));

  return (
    <div className="grid grid-cols-4 gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
      <input
        value={filters.query}
        onChange={e => onChange({ query: e.target.value })}
        placeholder="Search team, event, round..."
        className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-700"
      />
      <select value={filters.eventName} onChange={e => onChange({ eventName: e.target.value })} className="border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white">
        <option value="ALL">All events</option>
        {eventOptions.map(option => <option key={option} value={option}>{option}</option>)}
      </select>
      <select value={filters.roundName} onChange={e => onChange({ roundName: e.target.value })} className="border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white">
        <option value="ALL">All rounds</option>
        {roundOptions.map(option => <option key={option} value={option}>{option}</option>)}
      </select>
      <select value={filters.categoryName} onChange={e => onChange({ categoryName: e.target.value })} className="border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white">
        <option value="ALL">All categories</option>
        {categoryOptions.map(option => <option key={option} value={option}>{option}</option>)}
      </select>
      <select value={filters.status} onChange={e => onChange({ status: e.target.value })} className="border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white">
        <option value="ALL">All statuses</option>
        <option value="NOT_STARTED">Not started</option>
        <option value="DRAFT">Draft</option>
        <option value="SUBMITTED">Submitted</option>
        <option value="LOCKED">Locked</option>
      </select>
      <input type="date" value={filters.dateFrom} onChange={e => onChange({ dateFrom: e.target.value })} className="border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white" />
      <input type="date" value={filters.dateTo} onChange={e => onChange({ dateTo: e.target.value })} className="border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white" />
      <select value={filters.sort} onChange={e => onChange({ sort: e.target.value as AssignmentSortOption })} className="border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white">
        <option value="status">Status priority, newest</option>
        <option value="submitted_desc">Submitted newest</option>
        <option value="submitted_asc">Submitted oldest</option>
        <option value="team_asc">Team A-Z</option>
        <option value="team_desc">Team Z-A</option>
        <option value="event_asc">Event A-Z</option>
        <option value="event_desc">Event Z-A</option>
        <option value="round_asc">Round A-Z</option>
        <option value="round_desc">Round Z-A</option>
        <option value="attempt_desc">Attempt highest</option>
        <option value="attempt_asc">Attempt lowest</option>
      </select>
    </div>
  );
}

type AuditFilterState = {
  action: 'ALL' | 'SCORE' | 'EVALUATION' | 'COMMENT';
  dateFrom: string;
  dateTo: string;
  sort: 'newest' | 'oldest';
};

const defaultAuditFilters: AuditFilterState = {
  action: 'ALL',
  dateFrom: '',
  dateTo: '',
  sort: 'newest',
};

function auditMatchesAction(entry: EvaluationHistoryItem, action: AuditFilterState['action']) {
  if (action === 'ALL') return true;
  if (action === 'SCORE') return entry.actionType.startsWith('SCORE_');
  if (action === 'EVALUATION') return entry.actionType === 'EVALUATION_SUBMITTED' || entry.actionType === 'EVALUATION_STARTED' || entry.actionType === 'EVALUATION_LOCKED';
  if (action === 'COMMENT') {
    return entry.actionType === 'EVALUATION_UPDATED'
      || entry.oldComment != null
      || entry.newComment != null;
  }
  return true;
}

function filterAndSortAudit(entries: EvaluationHistoryItem[], filters: AuditFilterState) {
  const from = filters.dateFrom ? new Date(`${filters.dateFrom}T00:00:00`).getTime() : null;
  const to = filters.dateTo ? new Date(`${filters.dateTo}T23:59:59`).getTime() : null;

  return entries
    .filter(entry => {
      const createdAt = toDateMs(entry.occurredAt);
      return auditMatchesAction(entry, filters.action)
        && (from == null || createdAt >= from)
        && (to == null || createdAt <= to);
    })
    .sort((a, b) => filters.sort === 'newest'
      ? toDateMs(b.createdAt) - toDateMs(a.createdAt)
      : toDateMs(a.createdAt) - toDateMs(b.createdAt));
}

function AssignedSubmissionCard({
  item,
  selected,
  onSelect,
  onOpen,
}: {
  item: JudgeAssignedSubmission;
  selected: boolean;
  onSelect: () => void;
  onOpen: () => void;
}) {
  const statusTone =
    item.evaluationStatus === 'LOCKED'
      ? 'locked'
      : item.evaluationStatus === 'SUBMITTED'
      ? 'success'
      : item.evaluationStatus === 'DRAFT'
        ? 'info'
        : 'warning';
  const safeEvaluationStatus = item.evaluationStatus ?? 'NOT_STARTED';

  return (
    <button
      onClick={onSelect}
      className={`w-full text-left rounded-xl border p-4 transition-colors ${selected ? 'border-blue-300 bg-blue-50/40' : 'border-slate-200 bg-white hover:bg-slate-50'}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="font-semibold text-slate-900">{item.teamName}</h4>
          </div>
          <p className="text-sm text-slate-500 mt-0.5">
            {item.eventName} · {item.roundName} · {item.categoryName}
          </p>
          <p className="text-xs text-slate-400 mt-1">
            Attempt #{item.attemptNumber} · Submitted {fmtDate(item.submittedAt)}
          </p>
        </div>

        <div className="flex flex-col items-end gap-2 flex-shrink-0">
          <StatusBadge status={safeEvaluationStatus === 'NOT_STARTED' ? 'DRAFT' : safeEvaluationStatus} label={statusLabel(safeEvaluationStatus)} />
          <span className="text-[11px] text-slate-500">
            {item.scoredCriteriaCount ?? 0}/{item.totalCriteriaCount ?? 0} scored
          </span>
        </div>
      </div>

      <div className="flex items-center justify-between mt-4 gap-3">
        <div className="flex items-center gap-2">
          <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${
            statusTone === 'success'
              ? 'bg-emerald-50 text-emerald-700'
              : statusTone === 'locked'
                ? 'bg-slate-100 text-slate-600'
                : statusTone === 'info'
                ? 'bg-cyan-50 text-cyan-700'
                : 'bg-amber-50 text-amber-700'
          }`}>
            {item.evaluationStatus}
          </span>
        </div>
        <span
          onClick={(e) => {
            e.stopPropagation();
            onOpen();
          }}
          className="text-xs bg-blue-800 hover:bg-blue-900 text-white px-3 py-1.5 rounded-lg font-medium transition-colors"
        >
          {assignmentActionLabel(item)}
        </span>
      </div>
    </button>
  );
}

function MetricPill({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="p-3 bg-slate-50 rounded-lg">
      <p className="text-[11px] uppercase tracking-wide text-slate-500">{label}</p>
      <p className="text-sm font-semibold text-slate-900 mt-0.5">{value}</p>
    </div>
  );
}

async function loadEvaluationForSubmission(submission: JudgeAssignedSubmission) {
  if (submission.evaluationId) {
    return getEvaluation(submission.evaluationId);
  }
  return startEvaluation({ submissionId: submission.submissionId });
}

export function JudgeDashboard({ onNavigate }: { onNavigate: (s: string) => void }) {
  const [assigned, setAssigned] = useState<JudgeAssignedSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<AssignmentFilters>(defaultAssignmentFilters);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setAssigned(await getAssignedSubmissions());
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not load assigned submissions');
      setAssigned([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const scoredCount = assigned.filter(item => item.evaluationStatus === 'SUBMITTED').length;
  const lockedCount = assigned.filter(item => item.evaluationStatus === 'LOCKED').length;
  const inProgressCount = assigned.filter(item => item.evaluationStatus === 'DRAFT').length;
  const pendingCount = assigned.filter(item => item.evaluationStatus === 'NOT_STARTED').length;
  const completion = assigned.length ? Math.round(((scoredCount + lockedCount) / assigned.length) * 100) : 0;
  const visibleAssigned = useMemo(() => filterAndSortAssignments(assigned, filters), [assigned, filters]);

  return (
    <div className="p-7 space-y-7">
      <PageHeader title="Judge Dashboard" subtitle="Real scoring data from backend" />

      <div className="grid grid-cols-4 gap-5">
        <KPICard title="Assigned" value={assigned.length} icon={Star} accent="blue" />
        <KPICard title="Submitted" value={scoredCount} subtitle="Editable until locked" icon={CheckCircle2} accent="green" />
        <KPICard title="Drafts" value={inProgressCount} subtitle="In progress" icon={FileText} accent="cyan" />
        <KPICard title="Pending" value={pendingCount} subtitle="Not started yet" icon={AlertTriangle} accent="amber" />
      </div>

      <div className="grid grid-cols-3 gap-5">
        <div className="col-span-2 bg-white rounded-xl shadow-sm border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-slate-900" style={{ fontFamily: 'var(--font-display)' }}>Assigned submissions</h3>
              <p className="text-sm text-slate-500">Open a scorecard to start or continue scoring</p>
            </div>
            <button onClick={load} disabled={loading} className="flex items-center gap-1.5 border border-slate-200 text-slate-600 text-sm px-3 py-2 rounded-lg hover:bg-slate-50 disabled:opacity-50">
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
            </button>
          </div>

          <div className="mb-4">
            <AssignmentFilterBar
              items={assigned}
              filters={filters}
              onChange={patch => setFilters(prev => ({ ...prev, ...patch }))}
            />
          </div>

          {loading ? (
            <p className="text-sm text-slate-500">Loading assignments...</p>
          ) : assigned.length === 0 ? (
            <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
              No submissions are currently assigned to you for scoring.
            </div>
          ) : visibleAssigned.length === 0 ? (
            <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
              No submissions match the current filters.
            </div>
          ) : (
            <div className="space-y-3">
              {visibleAssigned.map(item => (
                <AssignedSubmissionCard
                  key={item.submissionId}
                  item={item}
                  selected={false}
                  onSelect={() => {}}
                  onOpen={() => {
                    persistSelection(item.submissionId);
                    onNavigate('judge-scoring');
                  }}
                />
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
          <h3 className="font-semibold text-slate-900 mb-3" style={{ fontFamily: 'var(--font-display)' }}>Progress</h3>
          <div className="flex items-center justify-center my-4">
            <div className="relative w-28 h-28">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                <circle cx="18" cy="18" r="14" fill="none" stroke="#e2e8f0" strokeWidth="3.5" />
                <circle
                  cx="18"
                  cy="18"
                  r="14"
                  fill="none"
                  stroke="#1e3a8a"
                  strokeWidth="3.5"
                  strokeDasharray={`${(completion / 100) * 87.96} 87.96`}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-bold text-slate-900">{completion}%</span>
                <span className="text-xs text-slate-500">complete</span>
              </div>
            </div>
          </div>
          <div className="space-y-1.5">
            {visibleAssigned.slice(0, 5).map(item => (
              <div key={item.submissionId} className="flex items-center gap-2 text-xs">
                {item.evaluationStatus === 'SUBMITTED' || item.evaluationStatus === 'LOCKED' ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> : <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />}
                <span className={item.evaluationStatus === 'LOCKED' ? 'text-slate-500 line-through' : 'text-slate-700'}>{item.teamName}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function JudgeSubmissions({ onNavigate }: { onNavigate: (s: string) => void }) {
  const [assigned, setAssigned] = useState<JudgeAssignedSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<AssignmentFilters>(defaultAssignmentFilters);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setAssigned(await getAssignedSubmissions());
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not load assigned submissions');
      setAssigned([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(() => filterAndSortAssignments(assigned, filters), [assigned, filters]);

  return (
    <div className="p-7 space-y-5">
      <PageHeader title="Assigned Submissions" subtitle="Backend-powered assignment list" />

      <div className="space-y-3">
        <AssignmentFilterBar
          items={assigned}
          filters={filters}
          onChange={patch => setFilters(prev => ({ ...prev, ...patch }))}
        />
        <button onClick={load} disabled={loading} className="flex items-center gap-1.5 border border-slate-200 text-slate-600 text-sm px-3 py-2 rounded-lg hover:bg-slate-50 disabled:opacity-50">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-100">
              {['Team', 'Category', 'Round', 'Submission', 'Status', 'Action'].map(col => (
                <th key={col} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">{col}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-sm text-slate-500">Loading...</td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-sm text-slate-500">No submissions match the current filter.</td>
              </tr>
            ) : (
              filtered.map(item => (
                <tr key={item.submissionId} className={`hover:bg-slate-50 ${item.evaluationStatus === 'NOT_STARTED' ? 'bg-amber-50/30' : ''}`}>
                  <td className="px-4 py-3 text-sm font-semibold text-slate-900">{item.teamName}</td>
                  <td className="px-4 py-3 text-xs text-slate-600">{item.categoryName}</td>
                  <td className="px-4 py-3 text-xs text-slate-600">{item.roundName}</td>
                  <td className="px-4 py-3 text-xs text-slate-500">
                    Attempt #{item.attemptNumber} · {fmtDate(item.submittedAt)}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={(item.evaluationStatus ?? 'NOT_STARTED') === 'NOT_STARTED' ? 'DRAFT' : item.evaluationStatus ?? 'NOT_STARTED'} label={statusLabel(item.evaluationStatus)} />
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => {
                        persistSelection(item.submissionId);
                        onNavigate('judge-scoring');
                      }}
                      className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${item.evaluationStatus === 'LOCKED' ? 'bg-slate-50 text-slate-600 hover:bg-slate-100' : 'bg-blue-800 text-white hover:bg-blue-900'}`}
                    >
                      {assignmentActionLabel(item)}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function JudgeScoringPage() {
  const [assigned, setAssigned] = useState<JudgeAssignedSubmission[]>([]);
  const [selectedSubmissionId, setSelectedSubmissionId] = useState<number | null>(() => readPersistedSelection());
  const [evaluation, setEvaluation] = useState<EvaluationDetail | null>(null);
  const [history, setHistory] = useState<EvaluationHistoryItem[]>([]);
  const [loadingAssignments, setLoadingAssignments] = useState(true);
  const [loadingEvaluation, setLoadingEvaluation] = useState(false);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [confirmSubmitOpen, setConfirmSubmitOpen] = useState(false);
  const [statusMessage, setStatusMessage] = useState('Select an assigned submission to start evaluating');
  const [draftComment, setDraftComment] = useState('');
  const [draftScores, setDraftScores] = useState<ScoreDraftState>({});
  const [assignmentFilters, setAssignmentFilters] = useState<AssignmentFilters>(defaultAssignmentFilters);
  const [auditFilters, setAuditFilters] = useState<AuditFilterState>(defaultAuditFilters);

  const loadAssignments = useCallback(async () => {
    setLoadingAssignments(true);
    try {
      const data = await getAssignedSubmissions();
      setAssigned(data);
      setSelectedSubmissionId(prev => {
        if (prev != null && data.some(item => item.submissionId === prev)) {
          return prev;
        }
        const stored = readPersistedSelection();
        const initial = stored && data.some(item => item.submissionId === stored)
          ? stored
          : data[0]?.submissionId ?? null;
        persistSelection(initial);
        return initial;
      });
    } catch (err) {
      setAssigned([]);
      toast.error(err instanceof Error ? err.message : 'Could not load assignments');
    } finally {
      setLoadingAssignments(false);
    }
  }, []);

  useEffect(() => {
    void loadAssignments();
  }, [loadAssignments]);

  const selectedSubmission = useMemo(
    () => assigned.find(item => item.submissionId === selectedSubmissionId) ?? null,
    [assigned, selectedSubmissionId],
  );
  const visibleAssigned = useMemo(
    () => filterAndSortAssignments(assigned, assignmentFilters),
    [assigned, assignmentFilters],
  );
  const visibleHistory = useMemo(
    () => filterAndSortAudit(history, auditFilters),
    [history, auditFilters],
  );

  const currentCriteria = useMemo(
    () => (evaluation ? (evaluation.criteria ?? evaluation.scores ?? []) : []),
    [evaluation],
  );
  useEffect(() => {
    if (!evaluation) {
      setDraftComment('');
      setDraftScores({});
      return;
    }

    setDraftComment(evaluation.generalComment ?? '');
    setDraftScores(buildScoreMap(currentCriteria));
  }, [evaluation, currentCriteria]);

  const openScorecard = useCallback(async (submission: JudgeAssignedSubmission | null | undefined) => {
    if (!submission) {
      toast.error('Please select an assignment first');
      return;
    }

    setLoadingEvaluation(true);
    setStatusMessage('Opening scorecard...');
    try {
      const detail = await loadEvaluationForSubmission(submission);
      setEvaluation(detail);
      const historyResponse = await getEvaluationHistory(detail.id);
      setHistory(historyResponse.items ?? []);
      persistSelection(submission.submissionId);
      setAssigned(prev =>
        prev.map(item =>
          item.submissionId === submission.submissionId
            ? {
                ...item,
                evaluationId: detail.id,
                evaluationStatus: detail.status,
              }
            : item,
        ),
      );
      const isLocked = detail.status === 'LOCKED' || !!detail.lockedAt;
      setStatusMessage(
        isLocked
          ? 'Locked scorecard loaded'
          : detail.status === 'SUBMITTED'
            ? 'Submitted evaluation loaded. It remains editable until locked.'
            : 'Draft scorecard loaded',
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not open the scorecard');
    } finally {
      setLoadingEvaluation(false);
    }
  }, []);

  useEffect(() => {
    if (!selectedSubmissionId) {
      setEvaluation(null);
      setHistory([]);
      setStatusMessage('Select an assigned submission to start evaluating');
      return;
    }

    const currentSubmission = assigned.find(item => item.submissionId === selectedSubmissionId);

    if (currentSubmission?.evaluationId) {
       const fetchExisting = async () => {
         setLoadingEvaluation(true);
         try {
            const detail = await getEvaluation(currentSubmission.evaluationId!);
            setEvaluation(detail);
            const historyResponse = await getEvaluationHistory(detail.id);
            setHistory(historyResponse.items ?? []);
            const isLocked = detail.status === 'LOCKED' || !!detail.lockedAt;
            setStatusMessage(isLocked ? 'Locked scorecard loaded' : detail.status === 'SUBMITTED' ? 'Submitted evaluation loaded.' : 'Draft scorecard loaded');
         } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Could not open scorecard');
         } finally {
            setLoadingEvaluation(false);
         }
       };
       void fetchExisting();
    } else {
      setEvaluation(null);
      setHistory([]);
      setStatusMessage('This submission has not been started yet. Open the scorecard to begin.');
    }
  }, [selectedSubmissionId]); 

  const totalRawScore = useMemo(() => {
    return currentCriteria.reduce((sum, criterion) => {
      const raw = normalizeScoreValue(draftScores[criterion.criterionId]?.scoreValue);
      return sum + (raw ?? 0);
    }, 0);
  }, [currentCriteria, draftScores]);

  const totalWeightedScore = useMemo(() => {
    return currentCriteria.reduce((sum, criterion) => {
      const raw = normalizeScoreValue(draftScores[criterion.criterionId]?.scoreValue);
      if (raw == null || !criterion.maxScore || !criterion.weight) return sum;
      return sum + (raw / Number(criterion.maxScore)) * Number(criterion.weight);
    }, 0);
  }, [currentCriteria, draftScores]);

  const isLockedReadOnly = !!evaluation && (evaluation.status === 'LOCKED' || !!evaluation.lockedAt);
  const canEdit = !!evaluation && !isLockedReadOnly && (evaluation.status === 'DRAFT' || evaluation.status === 'SUBMITTED');
  const canSubmit = !!evaluation && evaluation.status === 'DRAFT' && canEdit;
  const primarySaveLabel = evaluation?.status === 'SUBMITTED' ? 'Save Changes' : 'Save Draft';
  const submitLabel = 'Submit Final Evaluation';

  const saveDraft = useCallback(async () => {
    if (!evaluation) return;
    if (!canEdit) {
      toast.error('Locked evaluations cannot be edited');
      return;
    }

    setSaving(true);
    try {
      const payloadScores = currentCriteria.map(criterion => {
        const draft = draftScores[criterion.criterionId];
        const scoreValue = normalizeScoreValue(draft?.scoreValue ?? '');
        if (scoreValue == null) {
          throw new Error(`Please enter a score for ${criterion.criterionName}`);
        }
        if (scoreValue < 0) {
          throw new Error(`${criterion.criterionName} score cannot be negative`);
        }
        if (criterion.maxScore != null && scoreValue > Number(criterion.maxScore)) {
          throw new Error(`${criterion.criterionName} score cannot exceed ${criterion.maxScore}`);
        }
        return {
          criterionId: criterion.criterionId,
          scoreValue,
          comment: draft?.comment?.trim() || undefined,
        };
      });

      const updated = await saveDraftScores(evaluation.id, {
        generalComment: draftComment.trim() || undefined,
        scores: payloadScores,
      });
      setEvaluation(updated);
      const historyResponse = await getEvaluationHistory(updated.id);
      setHistory(historyResponse.items ?? []);
      setAssigned(prev =>
        prev.map(item =>
          item.submissionId === updated.submissionId
            ? {
                ...item,
                evaluationId: updated.id,
                evaluationStatus: updated.status,
                scoredCriteriaCount: updated.criteria?.filter(score => score.scoreValue != null).length ?? item.scoredCriteriaCount,
              }
            : item,
        ),
      );
      toast.success(evaluation.status === 'SUBMITTED' ? 'Changes saved' : 'Draft saved');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Save draft failed');
    } finally {
      setSaving(false);
    }
  }, [canEdit, currentCriteria, draftComment, draftScores, evaluation]);

  const submit = useCallback(async () => {
    if (!evaluation) return;
    if (!canEdit) {
      toast.error('Locked evaluations cannot be changed');
      return;
    }
    if (evaluation.status !== 'DRAFT') {
      toast.error('This evaluation has already been submitted. Use Save Changes to record updates in history.');
      return;
    }

    setSubmitting(true);
    try {
      const payloadScores = currentCriteria.map(criterion => {
        const draft = draftScores[criterion.criterionId];
        const scoreValue = normalizeScoreValue(draft?.scoreValue ?? '');
        if (scoreValue == null) {
          throw new Error(`Please enter a score for ${criterion.criterionName}`);
        }
        if (scoreValue < 0) {
          throw new Error(`${criterion.criterionName} score cannot be negative`);
        }
        if (criterion.maxScore != null && scoreValue > Number(criterion.maxScore)) {
          throw new Error(`${criterion.criterionName} score cannot exceed ${criterion.maxScore}`);
        }
        return {
          criterionId: criterion.criterionId,
          scoreValue,
          comment: draft?.comment?.trim() || undefined,
        };
      });

      const updated = await saveDraftScores(evaluation.id, {
        generalComment: draftComment.trim() || undefined,
        scores: payloadScores,
      });
      const submitted = await submitEvaluation(updated.id, {
        generalComment: draftComment.trim() || undefined,
      });
      setEvaluation(submitted);
      const historyResponse = await getEvaluationHistory(submitted.id);
      setHistory(historyResponse.items ?? []);
      setAssigned(prev =>
        prev.map(item =>
          item.submissionId === submitted.submissionId
            ? {
                ...item,
                evaluationId: submitted.id,
                evaluationStatus: submitted.status,
                scoredCriteriaCount: currentCriteria.length,
              }
            : item,
        ),
      );
      toast.success('Evaluation submitted');
      setStatusMessage('Evaluation submitted. It remains editable until locked; future changes will be recorded in history.');
      setConfirmSubmitOpen(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Submit failed');
    } finally {
      setSubmitting(false);
    }
  }, [canEdit, currentCriteria, draftComment, draftScores, evaluation]);

  return (
    <div className="h-[calc(100vh-64px)] p-7 overflow-hidden flex flex-col">
      <PageHeader
        title="Evaluation"
        subtitle={
          selectedSubmission
            ? `${selectedSubmission.eventName} / ${selectedSubmission.roundName} / ${selectedSubmission.teamName} / Attempt #${selectedSubmission.attemptNumber}`
            : 'Choose an assigned submission to start or continue scoring'
        }
      />

      {/* --- MASTER-DETAIL LAYOUT --- */}
      <div className="flex gap-5 flex-1 min-h-0">
        
        {/* CỘT TRÁI: DANH SÁCH BÀI THI */}
        <div className="w-1/3 flex flex-col min-h-0 overflow-y-auto pr-1">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold text-slate-900" style={{ fontFamily: 'var(--font-display)' }}>Your assignments</h3>
                <p className="text-sm text-slate-500">{statusMessage}</p>
              </div>
              <button onClick={loadAssignments} disabled={loadingAssignments} className="flex items-center gap-1.5 border border-slate-200 text-slate-600 text-sm px-3 py-2 rounded-lg hover:bg-slate-50 disabled:opacity-50">
                <RefreshCw className={`w-4 h-4 ${loadingAssignments ? 'animate-spin' : ''}`} /> Refresh
              </button>
            </div>

            <div className="mb-4">
              <AssignmentFilterBar
                items={assigned}
                filters={assignmentFilters}
                onChange={patch => setAssignmentFilters(prev => ({ ...prev, ...patch }))}
              />
            </div>

            {loadingAssignments ? (
              <p className="text-sm text-slate-500">Loading assignments...</p>
            ) : assigned.length === 0 ? (
              <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
                No submissions are currently assigned to you for scoring.
              </div>
            ) : visibleAssigned.length === 0 ? (
              <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
                No submissions match the current filters.
              </div>
            ) : (
              <div className="space-y-3">
                {visibleAssigned.map(item => (
                  <AssignedSubmissionCard
                    key={item.submissionId}
                    item={item}
                    selected={item.submissionId === selectedSubmissionId}
                    onSelect={() => setSelectedSubmissionId(item.submissionId)}
                    onOpen={() => {
                      setSelectedSubmissionId(item.submissionId);
                      void openScorecard(item);
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* CỘT PHẢI: FORM CHẤM ĐIỂM */}
        <div className="w-2/3 flex flex-col min-h-0 overflow-y-auto bg-white rounded-xl shadow-sm border border-slate-200 p-5 relative">
          {!selectedSubmission ? (
            <div className="flex items-center justify-center h-full text-slate-400">
              Select an assignment on the left to see the event, round, team, and attempt you are evaluating.
            </div>
          ) : !evaluation ? (
            <div className="flex flex-col items-center justify-center h-full">
              <div className="w-full max-w-md rounded-lg border border-slate-200 bg-slate-50 p-8 text-center">
                <p className="text-sm text-slate-600 mb-4">
                  This submission has not been evaluated yet. Start an evaluation for the selected attempt.
                </p>
                <button
                  onClick={() => void openScorecard(selectedSubmission)}
                  disabled={loadingEvaluation}
                  className="inline-flex items-center gap-2 bg-blue-800 hover:bg-blue-900 disabled:opacity-50 text-white text-sm font-semibold px-6 py-2.5 rounded-lg"
                >
                  {loadingEvaluation ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  Start Evaluation
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              
              {/* Context Metrics */}
              <div className="grid grid-cols-3 gap-4">
                <MetricPill label="Event" value={evaluation.eventName ?? selectedSubmission.eventName} />
                <MetricPill label="Round" value={selectedSubmission.roundName} />
                <MetricPill label="Team" value={evaluation.teamName ?? selectedSubmission.teamName} />
                <MetricPill label="Category" value={evaluation.categoryName ?? selectedSubmission.categoryName} />
                <MetricPill label="Attempt" value={`Attempt #${evaluation.attemptNumber ?? selectedSubmission.attemptNumber}`} />
                <MetricPill label="Submitted At" value={fmtDate(selectedSubmission.submittedAt)} />
                <MetricPill label="Evaluation Status" value={statusLabel(evaluation.status)} />
                <MetricPill label="Round Status" value={evaluation.roundStatus ?? selectedSubmission.roundStatus ?? 'Unknown'} />
                <MetricPill label="Rubric" value={`${currentCriteria.length} criteria`} />
              </div>

              {/* Repos & Links */}
              <div className="rounded-xl border border-slate-200 p-4 bg-slate-50">
                <div className="mb-4 space-y-1">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Evaluation context</p>
                  <p className="text-sm text-slate-700">Event: <span className="font-semibold text-slate-900">{evaluation.eventName ?? selectedSubmission.eventName}</span></p>
                  <p className="text-sm text-slate-700">Round: <span className="font-semibold text-slate-900">{selectedSubmission.roundName}</span></p>
                  <p className="text-sm text-slate-700">Category: <span className="font-semibold text-slate-900">{evaluation.categoryName ?? selectedSubmission.categoryName}</span></p>
                  <p className="text-sm text-slate-700">Team: <span className="font-semibold text-slate-900">{evaluation.teamName ?? selectedSubmission.teamName}</span></p>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-xs text-slate-500">Repository</p>
                    <a href={evaluation.repoUrl ?? selectedSubmission.repoUrl ?? '#'} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-blue-700 hover:underline break-all">
                      <ExternalLink className="w-3.5 h-3.5" /> {evaluation.repoUrl ?? selectedSubmission.repoUrl ?? '?'}
                    </a>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Demo / Slides</p>
                    {evaluation.demoUrl ?? selectedSubmission.demoUrl ? (
                      <a
                        href={evaluation.demoUrl ?? selectedSubmission.demoUrl ?? '#'}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-cyan-700 hover:underline break-all"
                      >
                        <ExternalLink className="w-3.5 h-3.5" /> {evaluation.demoUrl ?? selectedSubmission.demoUrl}
                      </a>
                    ) : (
                      <p className="text-slate-700 break-all">?</p>
                    )}
                    {evaluation.slideUrl ?? selectedSubmission.slideUrl ? (
                      <a
                        href={evaluation.slideUrl ?? selectedSubmission.slideUrl ?? '#'}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-purple-700 hover:underline break-all mt-1"
                      >
                        <ExternalLink className="w-3.5 h-3.5" /> {evaluation.slideUrl ?? selectedSubmission.slideUrl}
                      </a>
                    ) : (
                      <p className="text-slate-700 break-all mt-1">?</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Criteria Inputs */}
              <div className="space-y-4">
                {currentCriteria.map(criterion => {
                  const draft = draftScores[criterion.criterionId] ?? { scoreValue: '', comment: '' };
                  return (
                    <div key={criterion.criterionId} className="p-4 rounded-xl border border-slate-200">
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-slate-900 text-sm">{criterion.criterionName}</span>
                            <span className="text-xs text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">Criterion {criterion.displayOrder ?? ''}</span>
                          </div>
                          <p className="text-xs text-slate-500 mt-0.5">{criterion.criterionDescription}</p>
                        </div>
                        <div className="text-right">
                          <span className="text-2xl font-bold font-mono text-blue-800">{draft.scoreValue || '—'}</span>
                          <span className="text-slate-400 font-mono">/{criterion.maxScore}</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-slate-600 mb-1">Score value</label>
                          <input
                            type="number"
                            min="0"
                            max={criterion.maxScore ?? undefined}
                            step="0.5"
                            disabled={!canEdit}
                            value={draft.scoreValue}
                            onChange={e =>
                              setDraftScores(prev => ({
                                ...prev,
                                [criterion.criterionId]: { ...draft, scoreValue: e.target.value },
                              }))
                            }
                            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-700 disabled:bg-slate-50"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-600 mb-1">
                            Weighted score <span className="font-normal text-slate-400">(Weight: {criterion.weight})</span>
                          </label>
                          <div className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-slate-50 text-slate-700">
                            {draft.scoreValue && criterion.maxScore && criterion.weight
                              ? fmtNumber((Number(draft.scoreValue) / Number(criterion.maxScore)) * Number(criterion.weight), 2)
                              : '—'}
                          </div>
                        </div>
                      </div>

                      <div className="mt-3">
                        <label className="block text-xs font-medium text-slate-600 mb-1">Comment</label>
                        <textarea
                          disabled={!canEdit}
                          value={draft.comment}
                          onChange={e =>
                            setDraftScores(prev => ({
                              ...prev,
                              [criterion.criterionId]: { ...draft, comment: e.target.value },
                            }))
                          }
                          rows={2}
                          className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-700 disabled:bg-slate-50"
                          placeholder="Scoring note for this criterion"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* General Comment */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">General comment</label>
                <textarea
                  disabled={!canEdit}
                  value={draftComment}
                  onChange={e => setDraftComment(e.target.value)}
                  rows={3}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-700 disabled:bg-slate-50"
                  placeholder="Overall notes for the submission"
                />
              </div>

              {/* Alert Messages */}
              {evaluation.status === 'SUBMITTED' && canEdit && (
                <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-lg px-4 py-2.5">
                  <CheckCircle2 className="w-4 h-4 text-blue-600" />
                  <p className="text-sm text-blue-700">
                    This evaluation has been submitted but is still editable until it is locked. All changes are saved to history.
                  </p>
                </div>
              )}
              {!canEdit && (
                <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-lg px-4 py-2.5">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  <p className="text-sm text-amber-700">
                    This evaluation is locked and can no longer be edited.
                  </p>
                </div>
              )}

              {/* Sticky Action Buttons */}
              {canEdit && (
                <div className="sticky bottom-0 bg-white pt-4 pb-2 border-t border-slate-100 z-10 flex items-center gap-3">
                  <button
                    onClick={() => void saveDraft()}
                    disabled={saving || loadingEvaluation}
                    className="flex items-center gap-2 border border-slate-200 text-slate-600 text-sm font-medium px-5 py-2.5 rounded-xl hover:bg-slate-50 transition-colors disabled:opacity-50"
                  >
                    <Save className="w-4 h-4" /> {saving ? 'Saving...' : primarySaveLabel}
                  </button>
                  <button
                    onClick={() => setConfirmSubmitOpen(true)}
                    disabled={!canSubmit || submitting || loadingEvaluation}
                    className={`${canSubmit ? 'flex' : 'hidden'} items-center gap-2 bg-blue-800 hover:bg-blue-900 text-white text-sm font-semibold px-6 py-2.5 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    <Send className="w-4 h-4" /> {submitting ? 'Submitting...' : submitLabel}
                  </button>
                </div>
              )}

              {/* History & Summary (Gom xuống dưới cùng Form) */}
              <div className="grid grid-cols-2 gap-6 pt-6 border-t border-slate-200">
                {/* Scoring History */}
                <div>
                  <h4 className="text-sm font-semibold text-slate-900 mb-3">Scoring History</h4>
                  {history.length === 0 ? (
                    <p className="text-xs text-slate-500">No history entries yet.</p>
                  ) : (
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-2">
                        <select
                          value={auditFilters.action}
                          onChange={e => setAuditFilters(prev => ({ ...prev, action: e.target.value as AuditFilterState['action'] }))}
                          className="border border-slate-200 rounded-lg px-2 py-1.5 text-xs bg-white"
                        >
                          <option value="ALL">All actions</option>
                          <option value="SCORE">Score changes</option>
                          <option value="EVALUATION">Evaluation status</option>
                          <option value="COMMENT">Comment changes</option>
                        </select>
                        <select
                          value={auditFilters.sort}
                          onChange={e => setAuditFilters(prev => ({ ...prev, sort: e.target.value as AuditFilterState['sort'] }))}
                          className="border border-slate-200 rounded-lg px-2 py-1.5 text-xs bg-white"
                        >
                          <option value="newest">Newest first</option>
                          <option value="oldest">Oldest first</option>
                        </select>
                        <input
                          type="date"
                          value={auditFilters.dateFrom}
                          onChange={e => setAuditFilters(prev => ({ ...prev, dateFrom: e.target.value }))}
                          className="border border-slate-200 rounded-lg px-2 py-1.5 text-xs bg-white"
                        />
                        <input
                          type="date"
                          value={auditFilters.dateTo}
                          onChange={e => setAuditFilters(prev => ({ ...prev, dateTo: e.target.value }))}
                          className="border border-slate-200 rounded-lg px-2 py-1.5 text-xs bg-white"
                        />
                      </div>

                      {visibleHistory.length === 0 ? (
                        <p className="text-xs text-slate-500">No history entries match the current filters.</p>
                      ) : visibleHistory.map((entry, index) => (
                          <div key={`${entry.occurredAt ?? 'history'}-${entry.actionType}-${index}`} className="rounded-lg border border-slate-100 bg-slate-50 p-3">
                            <div className="flex items-center justify-between gap-2">
                              <p className="text-xs font-semibold text-slate-800">{entry.actionLabel}</p>
                              <span className="text-[10px] text-slate-400">{fmtDate(entry.occurredAt)}</span>
                            </div>
                            <p className="mt-2 text-[11px] text-slate-700">{entry.description ?? 'History event recorded'}</p>
                            {(entry.oldScoreValue != null || entry.newScoreValue != null) && (
                              <p className="mt-1 text-[11px] text-slate-600">
                                Score: {entry.oldScoreValue ?? 'empty'} → {entry.newScoreValue ?? 'empty'}
                              </p>
                            )}
                            {(entry.oldComment != null || entry.newComment != null) && (
                              <p className="mt-1 text-[11px] text-slate-600">
                                Comment: {entry.oldComment ?? 'empty'} → {entry.newComment ?? 'empty'}
                              </p>
                            )}
                            {(entry.oldStatus != null || entry.newStatus != null) && (
                              <p className="mt-1 text-[11px] text-slate-600">
                                Status: {entry.oldStatus ?? 'empty'} → {entry.newStatus ?? 'empty'}
                              </p>
                            )}
                            <p className="mt-1 text-[11px] text-slate-500">
                              {[entry.criterionName, entry.actorName ?? 'System'].filter(Boolean).join(' · ')}
                            </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Score Summary */}
                <div>
                  <h4 className="text-sm font-semibold text-slate-900 mb-3">Score summary</h4>
                  <div className="space-y-2.5 text-xs p-4 rounded-xl border border-slate-200 bg-slate-50">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Raw total</span>
                      <span className="text-slate-900 font-medium">{fmtNumber(totalRawScore, 1)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Weighted total</span>
                      <span className="text-slate-900 font-medium">{fmtNumber(totalWeightedScore, 2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Criteria</span>
                      <span className="text-slate-900 font-medium">{currentCriteria.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Selected attempt</span>
                      <span className="text-slate-900 font-medium">{selectedSubmission ? `Attempt #${selectedSubmission.attemptNumber}` : '—'}</span>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          )}
        </div>
      </div>

      {/* Modal Submit Final */}
      {confirmSubmitOpen && evaluation && (
        <Modal
          title="Submit final evaluation"
          subtitle="This marks the evaluation as submitted. It can still be edited until locked, and every change is saved to history."
          onClose={() => setConfirmSubmitOpen(false)}
          size="sm"
          footer={
            <>
              <button
                onClick={() => setConfirmSubmitOpen(false)}
                disabled={submitting}
                className="px-4 py-2 border border-slate-200 text-slate-600 text-sm rounded-lg hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={() => void submit()}
                disabled={submitting}
                className="px-4 py-2 bg-blue-800 hover:bg-blue-900 disabled:opacity-50 text-white text-sm font-semibold rounded-lg"
              >
                {submitting ? 'Submitting...' : 'Submit Final'}
              </button>
            </>
          }
        >
          <p className="text-sm text-slate-600">
            You are submitting the scorecard for {evaluation.teamName ?? selectedSubmission?.teamName ?? 'this team'}.
            Scores and comments can still be edited until the evaluation is locked.
          </p>
        </Modal>
      )}
    </div>
  );
}

