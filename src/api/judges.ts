import { apiClient } from './client';
import type { ApiResponse } from './types';

export interface JudgeUser {
  id: number;
  fullName: string;
  email: string;
  accountType: 'STAFF' | 'GUEST_JUDGE' | string;
}

export interface RoundJudge {
  assignmentId: number;
  judgeId: number;
  fullName: string;
  email: string;
  accountType: string;
}

interface RawRoundJudge {
  assignmentId?: number;
  id?: number;
  judgeId?: number;
  fullName?: string;
  judgeName?: string;
  email?: string;
  judgeEmail?: string;
  accountType?: string;
  judgeType?: string;
}

export interface AssignJudgeRequest {
  judgeId: number;
  categoryId?: number;
}

export interface CreateGuestJudgeRequest {
  email: string;
  fullName: string;
  phone?: string;
}

export interface CreateGuestJudgeResponse {
  userId: number;
  email: string;
  fullName: string;
  temporaryPassword: string;
}

export async function getJudges(): Promise<JudgeUser[]> {
  const res = await apiClient.get<ApiResponse<JudgeUser[]>>('/api/judges');
  return res.data.data ?? [];
}

export async function getRoundJudges(eventId: number, roundId: number): Promise<RoundJudge[]> {
  const res = await apiClient.get<ApiResponse<RoundJudge[]>>(
    `/api/events/${eventId}/rounds/${roundId}/judges`,
  );
  return (res.data.data ?? []).map(normalizeRoundJudge);
}

export async function assignJudge(
  eventId: number,
  roundId: number,
  req: AssignJudgeRequest,
): Promise<RoundJudge> {
  const res = await apiClient.post<ApiResponse<RoundJudge>>(
    `/api/events/${eventId}/rounds/${roundId}/judges`,
    req,
  );
  const data = res.data.data;
  if (!data) throw new Error(res.data.message ?? 'Assign failed');
  return normalizeRoundJudge(data);
}

export async function revokeJudge(
  eventId: number,
  roundId: number,
  assignmentId: number,
): Promise<void> {
  await apiClient.delete(`/api/events/${eventId}/rounds/${roundId}/judges/${assignmentId}`);
}

export async function createGuestJudge(
  req: CreateGuestJudgeRequest,
): Promise<CreateGuestJudgeResponse> {
  const res = await apiClient.post<ApiResponse<CreateGuestJudgeResponse>>(
    '/api/auth/guest-judges',
    req,
  );
  const data = res.data.data;
  if (!data) throw new Error(res.data.message ?? 'Create guest judge failed');
  return data;
}

function normalizeRoundJudge(raw: RawRoundJudge): RoundJudge {
  const email = raw.email ?? raw.judgeEmail ?? '';
  return {
    assignmentId: raw.assignmentId ?? raw.id ?? 0,
    judgeId: raw.judgeId ?? 0,
    fullName: raw.fullName ?? raw.judgeName ?? 'Judge',
    email,
    accountType:
      raw.accountType ??
      raw.judgeType ??
      (email && !email.endsWith('@seal.local') ? 'GUEST_JUDGE' : 'STAFF'),
  };
}
