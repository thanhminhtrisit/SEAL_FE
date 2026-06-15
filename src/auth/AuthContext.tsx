import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { jwtDecode } from 'jwt-decode';
import { loginApi, logoutApi } from '../api/auth';
import { LS_ACCESS_TOKEN } from '../api/client';
import type { JwtPayload, LoginRequest } from '../api/types';
import type { Role } from '../app/types';

// localStorage key for refresh token
const LS_REFRESH_TOKEN = 'seal_refresh_token';

// Map JWT role claim → App Role key.
// NOTE: ROLE_JUDGE maps to INTERNAL_JUDGE; FE cannot distinguish internal vs
// guest from the JWT claim alone — BE should expose this via /api/auth/me.
const JWT_ROLE_MAP: Record<string, Role> = {
  ROLE_ADMIN: 'ADMIN',
  ROLE_SUPER_COORDINATOR: 'SUPER_COORDINATOR',
  ROLE_COORDINATOR: 'EVENT_COORDINATOR',
  ROLE_JUDGE: 'INTERNAL_JUDGE',
  ROLE_MENTOR: 'MENTOR',
  ROLE_TEAM_LEADER: 'TEAM_LEADER',
  ROLE_TEAM_MEMBER: 'TEAM_MEMBER',
};

function decodeRole(token: string): Role | null {
  try {
    const payload = jwtDecode<JwtPayload>(token);
    return JWT_ROLE_MAP[payload.role] ?? null;
  } catch {
    return null;
  }
}

function isTokenExpired(token: string): boolean {
  try {
    const { exp } = jwtDecode<JwtPayload>(token);
    return Date.now() >= exp * 1000;
  } catch {
    return true;
  }
}

// ── Context shape ────────────────────────────────────────────────────────────
interface AuthContextValue {
  isAuthenticated: boolean;
  role: Role | null;
  userId: string | null;
  /** Calls BE, stores tokens, returns the decoded FE Role. Throws on failure. */
  login: (req: LoginRequest) => Promise<Role>;
  /** Calls BE logout (best-effort), then clears tokens. */
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

// ── Provider ─────────────────────────────────────────────────────────────────
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [accessToken, setAccessToken] = useState<string | null>(() => {
    const t = localStorage.getItem(LS_ACCESS_TOKEN);
    // Discard expired tokens on startup
    return t && !isTokenExpired(t) ? t : null;
  });

  const role = useMemo(
    () => (accessToken ? decodeRole(accessToken) : null),
    [accessToken],
  );

  const userId = useMemo(() => {
    if (!accessToken) return null;
    try {
      return jwtDecode<JwtPayload>(accessToken).sub;
    } catch {
      return null;
    }
  }, [accessToken]);

  // Listen for 401 responses dispatched by the axios interceptor
  useEffect(() => {
    const handle = () => setAccessToken(null);
    window.addEventListener('seal:unauthorized', handle);
    return () => window.removeEventListener('seal:unauthorized', handle);
  }, []);

  const login = useCallback(async (req: LoginRequest): Promise<Role> => {
    const { accessToken: at, refreshToken: rt } = await loginApi(req);
    // localStorage is acceptable for a spike; httpOnly cookies would prevent
    // XSS token theft but require a server-side session endpoint.
    localStorage.setItem(LS_ACCESS_TOKEN, at);
    localStorage.setItem(LS_REFRESH_TOKEN, rt);
    setAccessToken(at);
    const decoded = decodeRole(at);
    if (!decoded) throw new Error('Unrecognised role in token');
    return decoded;
  }, []);

  const logout = useCallback(async () => {
    await logoutApi();
    localStorage.removeItem(LS_ACCESS_TOKEN);
    localStorage.removeItem(LS_REFRESH_TOKEN);
    setAccessToken(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ isAuthenticated: !!accessToken, role, userId, login, logout }),
    [accessToken, role, userId, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// ── Hook ─────────────────────────────────────────────────────────────────────
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
