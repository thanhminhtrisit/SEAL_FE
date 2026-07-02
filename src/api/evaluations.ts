import { apiClient } from './client';

export type EvaluationStatus = 'DRAFT' | 'SUBMITTED' | 'LOCKED' | 'NOT_STARTED' | string;

export interface JudgeAssignedSubmission {
  submissionId: number;
  teamId: number;
  teamName: string;
  categoryId: number;
  categoryName: string;
  roundId: number;
  roundName: string;
  eventId: number;
  eventName: string;
  attemptNumber: number;
  submittedAt?: string | null;
  repoUrl?: string | null;
  demoUrl?: string | null;
  slideUrl?: string | null;
  reportUrl?: string | null;
  evaluationId?: number | null;
  evaluationStatus: EvaluationStatus;
  scoredCriteriaCount?: number | null;
  totalCriteriaCount?: number | null;
}

export interface EvaluationScore {
  id?: number | null;
  criterionId: number;
  displayOrder?: number | null;
  criterionName: string;
  criterionDescription?: string | null;
  maxScore?: number | null;
  weight?: number | null;
  scoreValue?: number | string | null;
  weightedScore?: number | string | null;
  comment?: string | null;
  scoredAt?: string | null;
  updatedAt?: string | null;
}

export interface EvaluationDetail {
  id: number;
  judgeAssignmentId?: number | null;
  judgeId: number;
  submissionId: number;
  roundId: number;
  eventId?: number | null;
  eventName?: string | null;
  teamId?: number | null;
  teamName?: string | null;
  categoryId?: number | null;
  categoryName?: string | null;
  attemptNumber?: number | null;
  repoUrl?: string | null;
  demoUrl?: string | null;
  slideUrl?: string | null;
  reportUrl?: string | null;
  submittedById?: number | null;
  status: EvaluationStatus;
  generalComment?: string | null;
  totalRawScore?: number | string | null;
  totalWeightedScore?: number | string | null;
  startedAt?: string | null;
  submittedAt?: string | null;
  lockedAt?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  scores: EvaluationScore[];
  criteria?: EvaluationScore[];
}

export interface EvaluationAuditEntry {
  id: number;
  actionType: string;
  targetType: string;
  targetId: number;
  oldValue?: string | null;
  newValue?: string | null;
  actorId?: number | null;
  actorName?: string | null;
  actorEmail?: string | null;
  createdAt?: string | null;
}

export interface StartEvaluationRequest {
  submissionId: number;
}

export interface ScoreItemRequest {
  criterionId: number;
  scoreValue: number;
  comment?: string;
}

export interface SaveScoresRequest {
  generalComment?: string;
  scores: ScoreItemRequest[];
}

export interface SubmitEvaluationRequest {
  generalComment?: string;
}

function unwrap<T>(payload: unknown): T {
  if (payload && typeof payload === 'object' && 'data' in payload) {
    const maybe = payload as { data?: T; message?: string };
    if (maybe.data !== undefined) {
      return maybe.data;
    }
  }
  return payload as T;
}

export async function getAssignedSubmissions(): Promise<JudgeAssignedSubmission[]> {
  const res = await apiClient.get('/api/evaluations/assigned-submissions');
  return unwrap<JudgeAssignedSubmission[]>(res.data) ?? [];
}

export async function startEvaluation(req: StartEvaluationRequest): Promise<EvaluationDetail> {
  const res = await apiClient.post('/api/evaluations/start', req);
  return unwrap<EvaluationDetail>(res.data);
}

export async function getEvaluation(evaluationId: number): Promise<EvaluationDetail> {
  const res = await apiClient.get(`/api/evaluations/${evaluationId}`);
  return unwrap<EvaluationDetail>(res.data);
}

export async function getEvaluationAudit(evaluationId: number): Promise<EvaluationAuditEntry[]> {
  const res = await apiClient.get(`/api/evaluations/${evaluationId}/audit`);
  return unwrap<EvaluationAuditEntry[]>(res.data) ?? [];
}

export async function saveDraftScores(
  evaluationId: number,
  req: SaveScoresRequest,
): Promise<EvaluationDetail> {
  const res = await apiClient.put(`/api/evaluations/${evaluationId}/draft`, req);
  return unwrap<EvaluationDetail>(res.data);
}

export async function submitEvaluation(
  evaluationId: number,
  req: SubmitEvaluationRequest,
): Promise<EvaluationDetail> {
  const res = await apiClient.post(`/api/evaluations/${evaluationId}/submit`, req);
  return unwrap<EvaluationDetail>(res.data);
}
