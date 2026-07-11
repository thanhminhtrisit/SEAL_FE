import { apiClient } from './client';
import type {
  ApiResponse,
  AuthResponse,
  GoogleAuthResponse,
  LoginRequest,
  RegisterRequest,
  RegisterResponse,
} from './types';

export async function loginApi(req: LoginRequest): Promise<AuthResponse> {
  const res = await apiClient.post<ApiResponse<AuthResponse>>(
    '/api/auth/login',
    req,
  );
  const data = res.data.data;
  if (!data) throw new Error(res.data.message ?? 'Login failed');
  return data;
}

export async function registerApi(
  req: RegisterRequest,
): Promise<RegisterResponse> {
  const res = await apiClient.post<ApiResponse<RegisterResponse>>(
    '/api/auth/register',
    req,
  );
  const data = res.data.data;
  if (!data) throw new Error(res.data.message ?? 'Registration failed');
  return data;
}

/**
 * Google Sign-In (GIS ID-token flow). idToken = `credential` from the GIS callback.
 * New emails register as PENDING participants (unless auto-approve is on) —
 * check res.status before storing tokens.
 */
export async function googleLoginApi(idToken: string): Promise<GoogleAuthResponse> {
  const res = await apiClient.post<ApiResponse<GoogleAuthResponse>>(
    '/api/auth/google',
    { idToken },
  );
  const data = res.data.data;
  if (!data) throw new Error(res.data.message ?? 'Google sign-in failed');
  return data;
}

export interface MeResponse {
  id: number;
  email: string;
  fullName: string;
  phone?: string | null;
  roleCode: string;
  accountType: string;
  status: string;
  studentId?: string | null;
  university?: string | null;
  isFptStudent?: boolean | null;
  lastLoginAt?: string | null;
  createdAt?: string | null;
}

export async function getMe(): Promise<MeResponse> {
  const res = await apiClient.get<ApiResponse<MeResponse>>('/api/auth/me');
  const data = res.data.data;
  if (!data) throw new Error(res.data.message ?? 'Failed to fetch profile');
  return data;
}

export async function logoutApi(): Promise<void> {
  // Best-effort — ignore errors (token may already be invalid)
  try {
    await apiClient.post('/api/auth/logout');
  } catch {
    // intentionally swallowed
  }
}
