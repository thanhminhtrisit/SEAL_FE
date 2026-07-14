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

// ─── Team lifecycle (BR-TEAM-05/08 — roster frozen once APPROVED/ACTIVE) ────
// UI rules: khi team.status === 'APPROVED' | 'ACTIVE' → ẩn/disable các nút mời,
// rời nhóm, đổi tên, đổi category (BE sẽ trả 4xx BR-TEAM-08 nếu vẫn gọi).
// Khi status === 'REJECTED' → hiện rejectionReason + nút "Nộp lại" (resubmit).

/** FR-TEAM-06: leader đổi tên/mô tả — chỉ khi REGISTERED/REJECTED. */
export async function updateTeam(
  teamId: number,
  req: { name?: string; description?: string },
): Promise<TeamDetail> {
  const res = await apiClient.patch<ApiResponse<TeamDetail>>(`/api/teams/${teamId}`, req);
  const data = res.data.data;
  if (!data) throw new Error(res.data.message ?? 'Update team failed');
  return data;
}

/** REJECTED → REGISTERED (leader, trong registration window). Xóa rejectionReason. */
export async function resubmitTeam(teamId: number): Promise<TeamDetail> {
  const res = await apiClient.post<ApiResponse<TeamDetail>>(`/api/teams/${teamId}/resubmit`);
  const data = res.data.data;
  if (!data) throw new Error(res.data.message ?? 'Resubmit failed');
  return data;
}

/** BR-TEAM-05: leader hiện tại chuyển quyền cho một member ACTIVE của team. */
export async function transferLeadership(
  teamId: number,
  newLeaderId: number,
): Promise<TeamDetail> {
  const res = await apiClient.put<ApiResponse<TeamDetail>>(
    `/api/teams/${teamId}/leader`,
    { newLeaderId },
  );
  const data = res.data.data;
  if (!data) throw new Error(res.data.message ?? 'Transfer leadership failed');
  return data;
}

/** Rút khỏi event (leader, trước khi event start) → WITHDRAWN; members được giải phóng. */
export async function withdrawTeam(teamId: number): Promise<TeamDetail> {
  const res = await apiClient.post<ApiResponse<TeamDetail>>(`/api/teams/${teamId}/withdraw`);
  const data = res.data.data;
  if (!data) throw new Error(res.data.message ?? 'Withdraw failed');
  return data;
}

/** Leader thu hồi lời mời PENDING → CANCELLED. */
export async function revokeInvitation(teamId: number, invitationId: number): Promise<void> {
  await apiClient.delete(`/api/teams/${teamId}/invitations/${invitationId}`);
}

// PUT /api/teams/{teamId}/category — set/change the team's category (BR-TEAM-04: within the
// registration window; a change after registration needs coordinator approval).
export async function changeTeamCategory(teamId: number, categoryId: number): Promise<TeamDetail> {
  const res = await apiClient.put<ApiResponse<TeamDetail>>(
    `/api/teams/${teamId}/category`,
    { categoryId },
  );
  const data = res.data.data;
  if (!data) throw new Error(res.data.message ?? 'Change category failed');
  return data;
}

/** Leader hoặc chính member đó — chỉ khi team chưa APPROVED (BR-TEAM-08). */
export async function removeMember(teamId: number, userId: number): Promise<TeamDetail> {
  const res = await apiClient.delete<ApiResponse<TeamDetail>>(
    `/api/teams/${teamId}/members/${userId}`,
  );
  const data = res.data.data;
  if (!data) throw new Error(res.data.message ?? 'Remove member failed');
  return data;
}
