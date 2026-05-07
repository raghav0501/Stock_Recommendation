import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

const OTP_API_BASE = 'http://localhost:3000';

interface User {
  email: string;
  name: string;
  id?: string;
  role?: string;
  theme?: string;
}

export interface Market {
  id: string;
  exchange: string; // same value as id, used throughout the app
  name: string;
  fullName: string;
  country: string;
  description: string;
}

export interface EntitledIndicator {
  id: string;
  name: string;
  description: string;
  category: string;
  scale: string;
}

interface AuthSession {
  accessToken: string;
  refreshToken: string;
  sessionId: string;
  markets: Market[];
  entitledIndicators: EntitledIndicator[];
}

interface AuthContextType {
  user: User | null;
  session: AuthSession | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  requestOtp: (email: string) => Promise<void>;
  loginWithOtp: (email: string, otp: string) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<AuthSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const savedUser = localStorage.getItem('alumnus_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    // TODO: On app load, validate stored tokens via GET /api/auth/me or a token-refresh endpoint
    const savedSession = localStorage.getItem('alumnus_session');
    if (savedSession) {
      setSession(JSON.parse(savedSession));
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    await new Promise(resolve => setTimeout(resolve, 1000));

    if (!email.endsWith('@alumnux.com')) return false;
    if (password.length < 8) return false;

    if (email && password) {
      const user: User = { email, name: email.split('@')[0] };
      setUser(user);
      localStorage.setItem('alumnus_user', JSON.stringify(user));
      return true;
    }
    return false;
  };

  const requestOtp = async (email: string): Promise<void> => {
    await fetch(`${OTP_API_BASE}/api/auth/otp/request`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    // Never reveal whether the email is registered — silently succeed either way
  };

  const loginWithOtp = async (email: string, otp: string): Promise<boolean> => {
    const res = await fetch(`${OTP_API_BASE}/api/auth/otp/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, otp }),
    });

    if (!res.ok) return false;

    const response = await res.json();
    if (response.status !== 'success') return false;

    const { user: userData, accessToken, refreshToken, sessionId, markets: rawMarkets, entitledIndicators } = response.data;

    const loggedInUser: User = {
      id: userData.id,
      name: userData.name,
      email: userData.email,
      role: userData.role,
      theme: userData.theme,
    };

    const markets: Market[] = rawMarkets.map((m: { id: string; name: string; fullName: string; country: string; description: string }) => ({
      id: m.id,
      exchange: m.id,
      name: m.name,
      fullName: m.fullName,
      country: m.country,
      description: m.description,
    }));

    const authSession: AuthSession = {
      accessToken,
      refreshToken,
      sessionId,
      markets,
      entitledIndicators,
    };

    setUser(loggedInUser);
    setSession(authSession);
    localStorage.setItem('alumnus_user', JSON.stringify(loggedInUser));
    localStorage.setItem('alumnus_session', JSON.stringify(authSession));

    return true;
  };

  const logout = () => {
    setUser(null);
    setSession(null);
    localStorage.removeItem('alumnus_user');
    // TODO: Call POST /api/auth/logout to invalidate tokens on the backend
    localStorage.removeItem('alumnus_session');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        isAuthenticated: !!user,
        login,
        requestOtp,
        loginWithOtp,
        logout,
        isLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
