import { apiClient } from './client';
import type {
  ApiResponse,
  AuthResponse,
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

export async function logoutApi(): Promise<void> {
  // Best-effort — ignore errors (token may already be invalid)
  try {
    await apiClient.post('/api/auth/logout');
  } catch {
    // intentionally swallowed
  }
}
