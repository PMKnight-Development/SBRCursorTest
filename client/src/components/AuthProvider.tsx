import React, { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { login as apiLogin, getCurrentUser } from '../api/auth';

interface User {
  id: string;
  username: string;
  role: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
  error: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const hasNavigated = useRef(false);
  const logoutTimer = useRef<NodeJS.Timeout | null>(null);

  // Restore token from localStorage on mount
  useEffect(() => {
    const storedToken = localStorage.getItem('authToken');
    if (storedToken) {
      try {
        const payload = JSON.parse(atob(storedToken.split('.')[1]));
        const exp = payload.exp;
        if (exp && exp * 1000 > Date.now()) {
          setToken(storedToken);
        } else {
          localStorage.removeItem('authToken');
        }
      } catch {
        localStorage.removeItem('authToken');
      }
    }
  }, []);

  useEffect(() => {
    if (token) {
      // Save token to localStorage
      localStorage.setItem('authToken', token);
      getCurrentUser(token)
        .then(setUser)
        .catch(() => {
          setUser(null);
          setToken(null);
          localStorage.removeItem('authToken');
        });
      // Decode JWT and set auto-logout timer
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const exp = payload.exp;
        if (exp) {
          const expiresIn = exp * 1000 - Date.now();
          if (logoutTimer.current) clearTimeout(logoutTimer.current);
          logoutTimer.current = setTimeout(() => {
            logout();
          }, expiresIn > 0 ? expiresIn : 0);
        }
      } catch {}
    } else {
      setUser(null);
      if (logoutTimer.current) clearTimeout(logoutTimer.current);
      localStorage.removeItem('authToken');
    }
  }, [token]);

  useEffect(() => {
    if (user && location.pathname === '/login' && !hasNavigated.current) {
      hasNavigated.current = true;
      navigate('/', { replace: true });
    }
    if (!user) {
      hasNavigated.current = false;
    }
  }, [user, navigate, location.pathname]);

  const login = async (username: string, password: string) => {
    setLoading(true);
    setError(null);
    hasNavigated.current = false;
    try {
      const data = await apiLogin(username, password);
      setToken(data.token);
      setUser(data.user);
      localStorage.setItem('authToken', data.token);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Login failed');
      setUser(null);
      setToken(null);
      localStorage.removeItem('authToken');
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    if (logoutTimer.current) clearTimeout(logoutTimer.current);
    hasNavigated.current = false;
    localStorage.removeItem('authToken');
    navigate('/login', { replace: true });
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, loading, error }}>
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
} 