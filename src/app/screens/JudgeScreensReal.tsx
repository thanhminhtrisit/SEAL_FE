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
import {
  getAssignedSubmissions,
  getEvaluation,
  getEvaluationAudit,
  saveDraftScores,
  startEvaluation,
  submitEvaluation,
  type EvaluationAuditEntry,
  type EvaluationDetail,
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

function submissionKey(submissionId: number) {
  return `#${submissionId}`;
}

type ScoreDraftState = Record<number, { scoreValue: string; comment: string }>;

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
    item.evaluationStatus === 'SUBMITTED'
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
            <span className="text-[11px] text-slate-500">{submissionKey(item.submissionId)}</span>
          </div>
          <p className="text-sm text-slate-500 mt-0.5">
            {item.eventName} · {item.roundName} · {item.categoryName}
          </p>
          <p className="text-xs text-slate-400 mt-1">
            Attempt #{item.attemptNumber} · Submitted {fmtDate(item.submittedAt)}
          </p>
        </div>

        <div className="flex flex-col items-end gap-2 flex-shrink-0">
          <StatusBadge status={safeEvaluationStatus === 'NOT_STARTED' ? 'DRAFT' : safeEvaluationStatus} label={safeEvaluationStatus.replace(/_/g, ' ')} />
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
              : statusTone === 'info'
                ? 'bg-cyan-50 text-cyan-700'
                : 'bg-amber-50 text-amber-700'
          }`}>
            {item.evaluationStatus}
          </span>
          {item.evaluationId ? <span className="text-[11px] text-slate-400">Evaluation #{item.evaluationId}</span> : null}
        </div>
        <span
          onClick={(e) => {
            e.stopPropagation();
            onOpen();
          }}
          className="text-xs bg-blue-800 hover:bg-blue-900 text-white px-3 py-1.5 rounded-lg font-medium transition-colors"
        >
          {item.evaluationId ? 'Open scorecard' : 'Start scoring'}
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

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setAssigned(await getAssignedSubmissions());
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Không tải được danh sách submissions');
      setAssigned([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const scoredCount = assigned.filter(item => item.evaluationStatus === 'SUBMITTED').length;
  const inProgressCount = assigned.filter(item => item.evaluationStatus === 'DRAFT').length;
  const pendingCount = assigned.filter(item => item.evaluationStatus === 'NOT_STARTED').length;
  const completion = assigned.length ? Math.round((scoredCount / assigned.length) * 100) : 0;

  return (
    <div className="p-7 space-y-7">
      <PageHeader title="Judge Dashboard" subtitle="Real scoring data from backend" />

      <div className="grid grid-cols-4 gap-5">
        <KPICard title="Assigned" value={assigned.length} icon={Star} accent="blue" />
        <KPICard title="Submitted" value={scoredCount} subtitle="Locked scorecards" icon={CheckCircle2} accent="green" />
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

          {loading ? (
            <p className="text-sm text-slate-500">Loading assignments...</p>
          ) : assigned.length === 0 ? (
            <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
              No active assignments found for your account.
            </div>
          ) : (
            <div className="space-y-3">
              {assigned.map(item => (
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
            {assigned.slice(0, 5).map(item => (
              <div key={item.submissionId} className="flex items-center gap-2 text-xs">
                {item.evaluationStatus === 'SUBMITTED' ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> : <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />}
                <span className={item.evaluationStatus === 'SUBMITTED' ? 'text-slate-500 line-through' : 'text-slate-700'}>{item.teamName}</span>
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
  const [query, setQuery] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setAssigned(await getAssignedSubmissions());
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Không tải được danh sách submissions');
      setAssigned([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return assigned;
    return assigned.filter(item =>
      [item.teamName, item.categoryName, item.roundName, item.eventName, item.evaluationStatus]
        .filter(Boolean)
        .some(text => String(text).toLowerCase().includes(q)),
    );
  }, [assigned, query]);

  return (
    <div className="p-7 space-y-5">
      <PageHeader title="Assigned Submissions" subtitle="Backend-powered assignment list" />

      <div className="flex items-center justify-between gap-3">
        <div className="relative w-full max-w-sm">
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search team, category, round..."
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-700"
          />
        </div>
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
                    <StatusBadge status={(item.evaluationStatus ?? 'NOT_STARTED') === 'NOT_STARTED' ? 'DRAFT' : item.evaluationStatus ?? 'NOT_STARTED'} label={(item.evaluationStatus ?? 'NOT_STARTED').replace(/_/g, ' ')} />
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => {
                        persistSelection(item.submissionId);
                        onNavigate('judge-scoring');
                      }}
                      className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${item.evaluationStatus === 'SUBMITTED' ? 'bg-slate-50 text-slate-600 hover:bg-slate-100' : 'bg-blue-800 text-white hover:bg-blue-900'}`}
                    >
                      {item.evaluationStatus === 'SUBMITTED' ? 'Review' : item.evaluationId ? 'Edit score' : 'Start score'}
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
  const [audit, setAudit] = useState<EvaluationAuditEntry[]>([]);
  const [loadingAssignments, setLoadingAssignments] = useState(true);
  const [loadingEvaluation, setLoadingEvaluation] = useState(false);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState('Select an assigned submission to start scoring');
  const [draftComment, setDraftComment] = useState('');
  const [draftScores, setDraftScores] = useState<ScoreDraftState>({});

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
      toast.error(err instanceof Error ? err.message : 'Không tải được danh sách assignments');
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
      setAudit(await getEvaluationAudit(detail.id));
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
            ? 'Submitted scorecard loaded. You can still edit until it is locked.'
            : 'Draft scorecard loaded',
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Không mở được scorecard');
    } finally {
      setLoadingEvaluation(false);
    }
  }, []);

  useEffect(() => {
    if (!selectedSubmissionId) {
      setEvaluation(null);
      setAudit([]);
      setStatusMessage('Select an assigned submission to start scoring');
      return;
    }

    if (selectedSubmission?.evaluationId) {
      void openScorecard(selectedSubmission);
    } else {
      setEvaluation(null);
      setAudit([]);
      setStatusMessage('This submission has not been started yet. Open the scorecard to begin.');
    }
  }, [openScorecard, selectedSubmission?.evaluationId, selectedSubmissionId]);

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

  const canEdit = !!evaluation && evaluation.status !== 'LOCKED' && !evaluation.lockedAt;
  const canSubmit = canEdit;
  const primarySaveLabel = evaluation?.status === 'SUBMITTED' ? 'Save Changes' : 'Save Draft';
  const submitLabel = evaluation?.status === 'SUBMITTED' ? 'Resubmit Scorecard' : 'Submit Scorecard';

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
      setAudit(await getEvaluationAudit(updated.id));
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

    setSubmitting(true);
    try {
      const payloadScores = currentCriteria.map(criterion => {
        const draft = draftScores[criterion.criterionId];
        const scoreValue = normalizeScoreValue(draft?.scoreValue ?? '');
        if (scoreValue == null) {
          throw new Error(`Please enter a score for ${criterion.criterionName}`);
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
      setAudit(await getEvaluationAudit(submitted.id));
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
      setStatusMessage('Scorecard submitted. You can still edit until it is locked.');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Submit failed');
    } finally {
      setSubmitting(false);
    }
  }, [canEdit, currentCriteria, draftComment, draftScores, evaluation]);

  return (
    <div className="p-7 space-y-5">
      <PageHeader title="Score Entry" subtitle="Chọn đúng bài nộp để biết rõ Event, Round, Category và Team đang được chấm" />

      <div className="grid grid-cols-3 gap-5">
        <div className="col-span-2 space-y-5">
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

            {loadingAssignments ? (
              <p className="text-sm text-slate-500">Loading assignments...</p>
            ) : assigned.length === 0 ? (
              <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
                No assigned submissions found for this judge.
              </div>
            ) : (
              <div className="space-y-3">
                {assigned.map(item => (
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

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold text-slate-900" style={{ fontFamily: 'var(--font-display)' }}>Scorecard</h3>
                <p className="text-sm text-slate-500">
                  {selectedSubmission
                    ? `${selectedSubmission.eventName} • ${selectedSubmission.roundName} • ${selectedSubmission.categoryName} • ${selectedSubmission.teamName}`
                    : 'Chọn một assignment để bắt đầu'}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-slate-500">Raw {fmtNumber(totalRawScore, 1)}</span>
                <span className="text-xs font-mono text-blue-800 bg-blue-50 px-2 py-1 rounded-full">Weighted {fmtNumber(totalWeightedScore, 2)}</span>
              </div>
            </div>

            {!selectedSubmission ? (
              <p className="text-sm text-slate-500">Hãy chọn một assignment ở cột bên trái để biết bạn đang chấm bài nào.</p>
            ) : !evaluation ? (
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm text-slate-600">
                  Bài nộp này chưa được bắt đầu chấm. Bấm nút bên dưới để tạo scorecard cho đúng bài đang chọn.
                </p>
                <button
                  onClick={() => void openScorecard(selectedSubmission)}
                  disabled={loadingEvaluation}
                  className="mt-3 inline-flex items-center gap-2 bg-blue-800 hover:bg-blue-900 disabled:opacity-50 text-white text-sm font-semibold px-4 py-2 rounded-lg"
                >
                  {loadingEvaluation ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  Start scoring
                </button>
              </div>
            ) : (
              <div className="space-y-5">
                <div className="grid grid-cols-3 gap-4">
                  <MetricPill label="Event" value={evaluation.eventName ?? selectedSubmission.eventName} />
                  <MetricPill label="Round" value={selectedSubmission.roundName} />
                  <MetricPill label="Category" value={evaluation.categoryName ?? selectedSubmission.categoryName} />
                  <MetricPill label="Team" value={evaluation.teamName ?? selectedSubmission.teamName} />
                  <MetricPill label="Submission" value={`#${evaluation.submissionId}`} />
                  <MetricPill label="Attempt" value={`v${evaluation.attemptNumber ?? selectedSubmission.attemptNumber}`} />
                  <MetricPill label="Evaluation" value={`#${evaluation.id}`} />
                  <MetricPill label="Judge" value={`#${evaluation.judgeId}`} />
                  <MetricPill label="Status" value={evaluation.status} />
                </div>

                <div className="rounded-xl border border-slate-200 p-4 bg-slate-50">
                  <div className="mb-4 space-y-1">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Bạn đang chấm bài</p>
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
                <div className="space-y-4">
                  {currentCriteria.map(criterion => {
                    const draft = draftScores[criterion.criterionId] ?? { scoreValue: '', comment: '' };
                    return (
                      <div key={criterion.criterionId} className="p-4 rounded-xl border border-slate-200">
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-slate-900 text-sm">{criterion.criterionName}</span>
                              <span className="text-xs text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded font-mono">#{criterion.displayOrder ?? criterion.criterionId}</span>
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
                            <label className="block text-xs font-medium text-slate-600 mb-1">Weighted contribution</label>
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

                {!canEdit && (
                  <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-lg px-4 py-2.5">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    <p className="text-sm text-amber-700">Locked evaluations are immutable.</p>
                  </div>
                )}

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => void saveDraft()}
                    disabled={!canEdit || saving || loadingEvaluation}
                    className="flex items-center gap-2 border border-slate-200 text-slate-600 text-sm font-medium px-5 py-2.5 rounded-xl hover:bg-slate-50 transition-colors disabled:opacity-50"
                  >
                    <Save className="w-4 h-4" /> {saving ? 'Saving...' : primarySaveLabel}
                  </button>
                  <button
                    onClick={() => void submit()}
                    disabled={!canSubmit || submitting || loadingEvaluation}
                    className="flex items-center gap-2 bg-blue-800 hover:bg-blue-900 text-white text-sm font-semibold px-6 py-2.5 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Send className="w-4 h-4" /> {submitting ? 'Submitting...' : submitLabel}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
            <h4 className="text-sm font-semibold text-slate-900 mb-3">Audit log</h4>
            {evaluation ? (
              audit.length === 0 ? (
                <p className="text-xs text-slate-500">No audit entries yet.</p>
              ) : (
                <div className="space-y-3">
                  {audit.map(entry => (
                    <div key={entry.id} className="rounded-lg border border-slate-100 bg-slate-50 p-3">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-xs font-semibold text-slate-800">{entry.actionType}</p>
                        <span className="text-[10px] text-slate-400">{fmtDate(entry.createdAt)}</span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {entry.targetType} #{entry.targetId} · {entry.actorName ?? entry.actorEmail ?? 'System'}
                      </p>
                      <details className="mt-2">
                        <summary className="cursor-pointer text-[11px] text-blue-700">Show payload</summary>
                        <pre className="mt-2 text-[11px] text-slate-600 whitespace-pre-wrap break-words">
{`old: ${entry.oldValue ?? 'null'}
new: ${entry.newValue ?? 'null'}`}
                        </pre>
                      </details>
                    </div>
                  ))}
                </div>
              )
            ) : (
              <p className="text-xs text-slate-500">Open a scorecard to see audit history.</p>
            )}
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
            <h4 className="text-sm font-semibold text-slate-900 mb-3">Score summary</h4>
            <div className="space-y-2.5 text-xs">
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
                <span className="text-slate-500">Selected submission</span>
                <span className="text-slate-900 font-medium">{selectedSubmission?.submissionId ?? '—'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
