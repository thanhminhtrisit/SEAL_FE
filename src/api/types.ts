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
  // ACTIVE when system config AUTO_APPROVE_ACCOUNTS=true (valid registrations activate instantly)
  status: 'PENDING' | 'ACTIVE';
}

// POST /api/auth/google (GIS ID-token flow)
export interface GoogleAuthResponse {
  // PENDING_APPROVAL: account created/awaiting approval — no tokens yet
  // AUTHENTICATED: same JWT pair as /api/auth/login
  status: 'PENDING_APPROVAL' | 'AUTHENTICATED';
  userId: number;
  accessToken: string | null;
  refreshToken: string | null;
}

// JWT payload claims
export interface JwtPayload {
  sub: string;   // userId
  role: string;  // e.g. "ROLE_ADMIN"
  exp: number;
  iat: number;
}
