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
  return res.data.data ?? [];
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
  return data;
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
