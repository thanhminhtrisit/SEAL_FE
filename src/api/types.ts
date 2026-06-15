// Envelope that wraps every backend response
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T | null;
  timestamp: string;
}

// POST /api/auth/login
export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
}

// POST /api/auth/register
export interface RegisterRequest {
  email: string;
  password: string;
  fullName: string;
  phone?: string;
  fptStudent: boolean;
  studentId?: string;
  university?: string;
}

export interface RegisterResponse {
  userId: number;
  status: 'PENDING';
}

// JWT payload claims
export interface JwtPayload {
  sub: string;   // userId
  role: string;  // e.g. "ROLE_ADMIN"
  exp: number;
  iat: number;
}
