import {
  createContext,
  useContext,
  useState,
  useRef,
  useCallback,
  type ReactNode,
} from 'react';
import { configureClient, apiFetch } from '../api/client';
import { useAuthSocket, type AuthSocketEvent } from '../hooks/useAuthSocket';
import type { User } from '../api/types';

interface AuthContextType {
  user: User | null;
  token: string | null;
  sessionId: string;
  isAuthenticated: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
  updateUser: (updates: Partial<User>) => void;
  lastAuthEvent: AuthSocketEvent | null;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const stored = localStorage.getItem('sa_user');
    return stored ? JSON.parse(stored) : null;
  });
  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem('sa_token');
  });
  const [lastAuthEvent, setLastAuthEvent] = useState<AuthSocketEvent | null>(null);

  const login = useCallback((newToken: string, newUser: User) => {
    setToken(newToken);
    setUser(newUser);
    localStorage.setItem('sa_token', newToken);
    localStorage.setItem('sa_user', JSON.stringify(newUser));
  }, []);

  const logout = useCallback(() => {
    try {
      sessionStorage.setItem('sa_logging_out', '1');
    } catch {}
    setToken(null);
    setUser(null);
    localStorage.removeItem('sa_token');
    localStorage.removeItem('sa_user');
    apiFetch('/auth/logout', { method: 'POST' }).catch(() => {});
    if (typeof window !== 'undefined' && window.location.pathname !== '/' && window.location.pathname !== '/landing') {
      window.location.replace('/');
    }
  }, []);

  const handleAuthEvent = useCallback(
    (event: AuthSocketEvent) => {
      setLastAuthEvent(event);

      switch (event.type) {
        case 'otp_verified':
        case 'login_success': {
          const data = event.data;
          if (data.token) {
            const u: User = {
              id: (data.id as string) || '',
              email: (data.email as string) || '',
              full_name: (data.full_name as string) || '',
              is_verified: true,
              is_admin: Boolean(data.is_admin),
              profile_pic_url: (data.profile_pic_url as string) || null,
              has_onboarded: Boolean(data.has_onboarded),
            };
            setToken(data.token as string);
            setUser(u);
            localStorage.setItem('sa_token', data.token as string);
            localStorage.setItem('sa_user', JSON.stringify(u));
          }
          break;
        }
        case 'session_expired':
          logout();
          break;
      }
    },
    [logout]
  );

  const { sessionId } = useAuthSocket({ onEvent: handleAuthEvent });

  // Stable refs so configureClient's getters always read the latest state
  // without needing to be re-registered on every render.
  const tokenRef = useRef(token);
  const sessionIdRef = useRef(sessionId);
  const logoutRef = useRef(logout);
  tokenRef.current = token;
  sessionIdRef.current = sessionId;
  logoutRef.current = logout;

  // Wired up synchronously during render — see the note in api/client.ts
  // for why this can't move into a useEffect.
  configureClient({
    getToken: () => tokenRef.current,
    getSessionId: () => sessionIdRef.current,
    onUnauthorized: () => logoutRef.current(),
  });

  const updateUser = useCallback((updates: Partial<User>) => {
    setUser((prev) => {
      if (!prev) return prev;
      const updated = { ...prev, ...updates };
      localStorage.setItem('sa_user', JSON.stringify(updated));
      return updated;
    });
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        sessionId,
        isAuthenticated: Boolean(user),
        login,
        logout,
        updateUser,
        lastAuthEvent,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
