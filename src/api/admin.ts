import { apiClient } from './client';
import type { ApiResponse } from './types';

// FR-ADM-02 — auto-approve accounts toggle (Admin only).
export async function getAutoApprove(): Promise<boolean> {
  const res = await apiClient.get<ApiResponse<{ enabled: boolean }>>('/api/admin/settings/auto-approve');
  return res.data.data?.enabled ?? false;
}

export async function setAutoApprove(enabled: boolean): Promise<boolean> {
  const res = await apiClient.put<ApiResponse<{ enabled: boolean }>>('/api/admin/settings/auto-approve', { enabled });
  return res.data.data?.enabled ?? enabled;
}
