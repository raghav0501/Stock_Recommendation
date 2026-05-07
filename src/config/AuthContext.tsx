import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
// TODO: Remove static import and replace with API call POST /api/auth/verify-otp when backend is ready
import mockLoginResponse from '../data/response.json';

interface User {
  email: string;
  name: string;
  id?: string;
  role?: string;
  theme?: string;
}

interface Market {
  id: string;
  name: string;
  exchange: string;
}

interface EntitledIndicator {
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
    // TODO: Replace with POST /api/auth/login when backend is ready
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

  const loginWithOtp = async (email: string, otp: string): Promise<boolean> => {
    // TODO: Replace with POST /api/auth/verify-otp when backend is ready
    await new Promise(resolve => setTimeout(resolve, 1000));

    // TODO: Remove hardcoded credentials — validate against backend API response
    const VALID_EMAIL = 'admin@alumnux.com';
    const VALID_OTP = '1234';

    if (email !== VALID_EMAIL || otp !== VALID_OTP) return false;

    // TODO: Use real API response instead of mock — mockLoginResponse will be removed
    const response = mockLoginResponse;
    if (response.status !== 'success') return false;

    const { user: userData, accessToken, refreshToken, sessionId, markets, entitledIndicators } = response.data;

    const loggedInUser: User = {
      id: userData.id,
      name: userData.name,
      email: userData.email,
      role: userData.role,
      theme: userData.theme,
    };

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
    // TODO: Store tokens in httpOnly cookies via backend instead of localStorage for security
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
