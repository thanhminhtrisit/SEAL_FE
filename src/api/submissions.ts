import { apiClient } from './client';
import type { ApiResponse } from './types';

export interface SubmissionVersion {
  versionId: number;
  versionNumber: number;
  repoUrl: string;
  demoUrl?: string | null;
  slideUrl?: string | null;
  reportUrl?: string | null;
  changeNote?: string | null;
  submittedBy: number;
  submittedAt: string;
}

export interface SubmissionDetail {
  submissionId: number;
  teamId: number;
  teamName?: string | null;
  roundId: number;
  roundName?: string | null;
  eventId?: number | null;
  eventName?: string | null;
  categoryId?: number | null;
  categoryName?: string | null;
  currentVersionId?: number | null;
  currentVersion?: SubmissionVersion | null;
  status: string;
  submittedAt?: string | null;
  lastUpdatedAt?: string | null;
}

export interface SubmissionMyOverviewVersion {
  versionId: number;
  versionNumber: number;
  repoUrl: string;
  demoUrl?: string | null;
  slideUrl?: string | null;
  reportUrl?: string | null;
  changeNote?: string | null;
  submittedBy: number;
  submittedAt: string;
}

export interface SubmissionMyOverviewSubmission {
  submissionId: number;
  status: string;
  submittedAt?: string | null;
  lastUpdatedAt?: string | null;
  currentVersionId?: number | null;
  currentVersion?: SubmissionMyOverviewVersion | null;
}

export interface SubmissionMyOverviewRound {
  roundId: number;
  roundName: string;
  orderNumber: number;
  status: string;
  submissionDeadline?: string | null;
  submission?: SubmissionMyOverviewSubmission | null;
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

export interface CreateDraftSubmissionRequest {
  teamId: number;
  roundId: number;
  repoUrl?: string;
  demoUrl?: string;
  slideUrl?: string;
  reportUrl?: string;
  changeNote?: string;
}

export interface UpdateDraftSubmissionRequest {
  repoUrl?: string;
  demoUrl?: string;
  slideUrl?: string;
  reportUrl?: string;
  changeNote?: string;
}

export type SubmitSubmissionRequest = UpdateDraftSubmissionRequest;

export interface SelectSubmissionVersionRequest {
  versionId: number;
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

export async function createDraftSubmission(
  req: CreateDraftSubmissionRequest,
): Promise<SubmissionDetail> {
  const res = await apiClient.post<ApiResponse<SubmissionDetail>>(
    '/api/submissions/drafts',
    req,
  );
  return requireData(res.data, 'Create draft failed');
}

export async function updateDraftSubmission(
  submissionId: number,
  req: UpdateDraftSubmissionRequest,
): Promise<SubmissionDetail> {
  const res = await apiClient.put<ApiResponse<SubmissionDetail>>(
    `/api/submissions/${submissionId}/draft`,
    req,
  );
  return requireData(res.data, 'Update draft failed');
}

export async function submitSubmission(
  submissionId: number,
  req: SubmitSubmissionRequest,
): Promise<SubmissionDetail> {
  const res = await apiClient.post<ApiResponse<SubmissionDetail>>(
    `/api/submissions/${submissionId}/submit`,
    req,
  );
  return requireData(res.data, 'Final submit failed');
}

export async function resubmitSubmission(
  submissionId: number,
  req: SubmitSubmissionRequest,
): Promise<SubmissionDetail> {
  const res = await apiClient.post<ApiResponse<SubmissionDetail>>(
    `/api/submissions/${submissionId}/resubmit`,
    req,
  );
  return requireData(res.data, 'Resubmit failed');
}

export async function getSubmissionDetail(
  submissionId: number,
): Promise<SubmissionDetail> {
  const res = await apiClient.get<ApiResponse<SubmissionDetail>>(
    `/api/submissions/${submissionId}`,
  );
  return requireData(res.data, 'Submission not found');
}

export async function getSubmissionVersions(
  submissionId: number,
): Promise<SubmissionVersion[]> {
  const res = await apiClient.get<ApiResponse<SubmissionVersion[]>>(
    `/api/submissions/${submissionId}/versions`,
  );
  return res.data.data ?? [];
}

export async function selectSubmissionVersion(
  submissionId: number,
  versionId: number,
): Promise<void> {
  await apiClient.patch(
    `/api/submissions/${submissionId}/select-version`,
    { versionId },
  );
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
