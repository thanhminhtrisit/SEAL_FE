import { apiClient } from './client';
import type { ApiResponse } from './types';

export interface SubmissionAttempt {
  submissionId: number;
  teamId: number;
  teamName?: string | null;
  roundId: number;
  roundName?: string | null;
  eventId?: number | null;
  eventName?: string | null;
  categoryId?: number | null;
  categoryName?: string | null;
  attemptNumber: number;
  repoUrl?: string | null;
  demoUrl?: string | null;
  slideUrl?: string | null;
  reportUrl?: string | null;
  changeNote?: string | null;
  submittedBy?: number | null;
  status: string;
  submittedAt?: string | null;
  lastUpdatedAt?: string | null;
}

export type SubmissionDetail = SubmissionAttempt;

export interface SubmissionMyOverviewSubmission {
  submissionId: number;
  attemptNumber: number;
  repoUrl?: string | null;
  demoUrl?: string | null;
  slideUrl?: string | null;
  reportUrl?: string | null;
  changeNote?: string | null;
  submittedBy?: number | null;
  status: string;
  submittedAt?: string | null;
  lastUpdatedAt?: string | null;
}

export interface SubmissionRequirements {
  requiresRepo: boolean;
  requiresDemo: boolean;
  requiresSlide: boolean;
  requiresReport: boolean;
}

export interface SubmissionMyOverviewRound {
  roundId: number;
  roundName: string;
  orderNumber: number;
  status: string;
  submissionDeadline?: string | null;
  submissionRequirements: SubmissionRequirements;
  submission?: SubmissionMyOverviewSubmission | null;
  isFinalRound?: boolean;
}

export interface SubmissionMyOverviewTeam {
  teamId: number;
  teamName: string;
  eventId: number;
  eventName: string;
  categoryId: number;
  categoryName: string;
  memberRole: string;
  rounds: SubmissionMyOverviewRound[];
}

export interface SubmissionMyOverview {
  teams: SubmissionMyOverviewTeam[];
}

export interface CreateSubmissionRequest {
  teamId: number;
  roundId: number;
  repoUrl?: string;
  demoUrl?: string;
  slideUrl?: string;
  reportUrl?: string;
  changeNote?: string;
}

// Coordinator "Submission Monitoring" — one row per team of an event with its latest state for a round.
// status = SubmissionStatus (SUBMITTED/LATE_REJECTED/LOCKED/DISQUALIFIED) hoặc "NOT_SUBMITTED" (sentinel).
export interface SubmissionMonitorRow {
  teamId: number;
  teamName: string;
  categoryId?: number | null;
  categoryName?: string | null;
  status: string;
  latestAttemptNumber?: number | null;
  submittedAt?: string | null;
  repoUrl?: string | null;
  demoUrl?: string | null;
  slideUrl?: string | null;
  reportUrl?: string | null;
}

export async function getRoundSubmissionMonitor(
  eventId: number,
  roundId: number,
): Promise<SubmissionMonitorRow[]> {
  const res = await apiClient.get<ApiResponse<SubmissionMonitorRow[]>>(
    `/api/events/${eventId}/rounds/${roundId}/submissions`,
  );
  return res.data.data ?? [];
}

function requireData<T>(res: ApiResponse<T>, fallback: string): T {
  if (!res.data) throw new Error(res.message || fallback);
  return res.data;
}

export async function getCurrentSubmission(
  teamId: number,
  roundId: number,
): Promise<SubmissionDetail> {
  const res = await apiClient.get<ApiResponse<SubmissionDetail>>(
    '/api/submissions/current',
    { params: { teamId, roundId } },
  );
  return requireData(res.data, 'Submission not found');
}

export async function submitSubmission(
  req: CreateSubmissionRequest,
): Promise<SubmissionDetail> {
  const res = await apiClient.post<ApiResponse<SubmissionDetail>>(
    '/api/submissions',
    req,
  );
  return requireData(res.data, 'Submit failed');
}

export async function getSubmissionDetail(
  submissionId: number,
): Promise<SubmissionDetail> {
  const res = await apiClient.get<ApiResponse<SubmissionDetail>>(
    `/api/submissions/${submissionId}`,
  );
  return requireData(res.data, 'Submission not found');
}

export async function getSubmissionHistory(
  teamId: number,
  roundId: number,
): Promise<SubmissionAttempt[]> {
  const res = await apiClient.get<ApiResponse<SubmissionAttempt[]>>(
    '/api/submissions/history',
    { params: { teamId, roundId } },
  );
  return res.data.data ?? [];
}

export async function getMySubmissionOverview(): Promise<SubmissionMyOverview> {
  const res = await apiClient.get<ApiResponse<SubmissionMyOverview>>(
    '/api/submissions/my-overview',
  );
  return res.data.data ?? { teams: [] };
}

export async function pingSubmissionModule(): Promise<string> {
  const res = await apiClient.get<ApiResponse<string>>('/api/submissions/ping');
  return res.data.data ?? 'Submission module is alive';
}
