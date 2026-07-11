import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { jwtDecode } from 'jwt-decode';
import { googleLoginApi, loginApi, logoutApi } from '../api/auth';
import { LS_ACCESS_TOKEN } from '../api/client';
import type { JwtPayload, LoginRequest } from '../api/types';
import type { Role } from '../app/types';

// localStorage key for refresh token
const LS_REFRESH_TOKEN = 'seal_refresh_token';
const LS_TEAM_ID = 'seal_my_team_id';

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
  /**
   * Google Sign-In (GIS ID token). Returns the Role when AUTHENTICATED,
   * or 'PENDING_APPROVAL' when the account was just created / awaits approval
   * (no tokens issued — caller should show an info message, not navigate).
   */
  googleLogin: (idToken: string) => Promise<Role | 'PENDING_APPROVAL'>;
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
    localStorage.removeItem(LS_TEAM_ID);
    setAccessToken(at);
    const decoded = decodeRole(at);
    if (!decoded) throw new Error('Unrecognised role in token');
    return decoded;
  }, []);

  const googleLogin = useCallback(
    async (idToken: string): Promise<Role | 'PENDING_APPROVAL'> => {
      const res = await googleLoginApi(idToken);
      if (res.status === 'PENDING_APPROVAL' || !res.accessToken || !res.refreshToken) {
        return 'PENDING_APPROVAL';
      }
      localStorage.setItem(LS_ACCESS_TOKEN, res.accessToken);
      localStorage.setItem(LS_REFRESH_TOKEN, res.refreshToken);
      localStorage.removeItem(LS_TEAM_ID);
      setAccessToken(res.accessToken);
      const decoded = decodeRole(res.accessToken);
      if (!decoded) throw new Error('Unrecognised role in token');
      return decoded;
    },
    [],
  );

  const logout = useCallback(async () => {
    await logoutApi();
    localStorage.removeItem(LS_ACCESS_TOKEN);
    localStorage.removeItem(LS_REFRESH_TOKEN);
    localStorage.removeItem(LS_TEAM_ID);
    setAccessToken(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ isAuthenticated: !!accessToken, role, userId, login, googleLogin, logout }),
    [accessToken, role, userId, login, googleLogin, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// ── Hook ─────────────────────────────────────────────────────────────────────
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
