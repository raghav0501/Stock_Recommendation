import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

interface User {
  email: string;
  name: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user is already logged in (from localStorage)
    const savedUser = localStorage.getItem('alumnus_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    // Dummy verification - accepts any email/password combination
    // In production, this would be a real API call
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Simple validation: Check if email ends with @alumnux.com and password is at least 8 characters
    if (!email.endsWith('@alumnux.com')) {
      return false;
    }
    if (password.length < 8) {
      return false;
    }
    
    // Dummy validation: just check if email and password are not empty
    if (email && password) {
      const user: User = {
        email,
        name: email.split('@')[0], // Use email prefix as name
      };
      
      setUser(user);
      localStorage.setItem('alumnus_user', JSON.stringify(user));
      return true;
    }
    
    return false;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('alumnus_user');
  };

  return (
    <AuthContext.Provider 
      value={{ 
        user, 
        isAuthenticated: !!user, 
        login, 
        logout,
        isLoading 
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