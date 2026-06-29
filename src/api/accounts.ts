import { apiClient } from './client';
import type { ApiResponse } from './types';

export interface PendingAccount {
  id: number;
  fullName: string;
  email: string;
  studentId: string | null;
  university: string | null;
  fptStudent: boolean;
  createdAt: string;
}

interface PagedData {
  content: PendingAccount[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
}

export interface AccountStatusResult {
  userId: number;
  status: 'ACTIVE' | 'REJECTED';
}

export async function getPendingAccounts(
  page = 0,
  size = 20,
): Promise<PagedData> {
  const res = await apiClient.get<ApiResponse<PagedData>>(
    '/api/auth/accounts/pending',
    { params: { page, size } },
  );
  const data = res.data.data;
  if (!data) throw new Error(res.data.message ?? 'Failed to fetch accounts');
  return data;
}

export async function approveAccount(
  userId: number,
): Promise<AccountStatusResult> {
  const res = await apiClient.post<ApiResponse<AccountStatusResult>>(
    `/api/auth/accounts/${userId}/approve`,
  );
  const data = res.data.data;
  if (!data) throw new Error(res.data.message ?? 'Approve failed');
  return data;
}

export async function rejectAccount(
  userId: number,
  reason: string,
): Promise<AccountStatusResult> {
  const res = await apiClient.post<ApiResponse<AccountStatusResult>>(
    `/api/auth/accounts/${userId}/reject`,
    { reason },
  );
  const data = res.data.data;
  if (!data) throw new Error(res.data.message ?? 'Reject failed');
  return data;
}

export async function getAccountsByStatus(
  status: 'APPROVED' | 'REJECTED' | 'PENDING',
  page = 0,
  size = 50,
): Promise<PagedData> {
  const res = await apiClient.get<ApiResponse<PagedData>>(
    '/api/auth/accounts',
    { params: { status, page, size } },
  );
  const data = res.data.data;
  if (!data) throw new Error(res.data.message ?? 'Failed to fetch accounts');
  return data;
}
