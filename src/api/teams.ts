import { apiClient } from './client';
import type { ApiResponse } from './types';

export interface TeamMember {
  userId: number;
  fullName: string;
  email: string;
  role: 'LEADER' | 'MEMBER';
  status?: string;
  joinedAt?: string;
}

export interface TeamDetail {
  id: number;
  name: string;
  description?: string | null;
  status: string;
  categoryId?: number | null;
  categoryName?: string | null;
  eventId?: number | null;
  eventName?: string | null;
  leaderId?: number | null;
  leaderName?: string | null;
  rejectionReason?: string | null;
  createdAt?: string;
  updatedAt?: string;
  members: TeamMember[];
}

export interface TeamSummary {
  id: number;
  eventId: number;
  categoryId: number;
  categoryName?: string | null;
  name: string;
  status: string;
  leaderName?: string | null;
  memberCount?: number | null;
}

export interface Invitation {
  invitationId: number;
  teamId: number;
  teamName: string;
  eventId: number;
  eventName: string;
  invitedByName: string;
  expiresAt: string;
}

export interface CreateTeamRequest {
  eventId: number;
  categoryId: number;
  name: string;
  description?: string;
}

export interface ReviewTeamRequest {
  approved: boolean;
  reason?: string;
}

export async function createTeam(req: CreateTeamRequest): Promise<TeamDetail> {
  const res = await apiClient.post<ApiResponse<TeamDetail>>('/api/teams', req);
  const data = res.data.data;
  if (!data) throw new Error(res.data.message ?? 'Create team failed');
  return data;
}

export async function getTeam(teamId: number): Promise<TeamDetail> {
  const res = await apiClient.get<ApiResponse<TeamDetail>>(`/api/teams/${teamId}`);
  const data = res.data.data;
  if (!data) throw new Error(res.data.message ?? 'Team not found');
  return data;
}

export async function sendInvitation(teamId: number, email: string): Promise<void> {
  await apiClient.post(`/api/teams/${teamId}/invitations`, { email });
}

export async function getMyInvitations(): Promise<Invitation[]> {
  const res = await apiClient.get<ApiResponse<Invitation[]>>('/api/teams/invitations/mine');
  return res.data.data ?? [];
}

export async function acceptInvitation(invitationId: number): Promise<void> {
  await apiClient.post(`/api/teams/invitations/${invitationId}/accept`);
}

export async function declineInvitation(invitationId: number): Promise<void> {
  await apiClient.post(`/api/teams/invitations/${invitationId}/decline`);
}

export async function getTeamsByEvent(eventId: number): Promise<TeamSummary[]> {
  const res = await apiClient.get<ApiResponse<TeamSummary[]>>(`/api/teams/by-event/${eventId}`);
  return res.data.data ?? [];
}

export async function reviewTeam(teamId: number, req: ReviewTeamRequest): Promise<void> {
  await apiClient.post(`/api/teams/${teamId}/review`, req);
}
