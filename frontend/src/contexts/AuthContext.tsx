import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User } from '../types';
import { authAPI } from '../services/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (token: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  login: async () => {},
  logout: () => {},
  refreshUser: async () => {},
  isLoading: true,
});

const getSavedUser = (): User | null => {
  try {
    const raw = localStorage.getItem('user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('token'));
  const [user, setUser] = useState<User | null>(() => (localStorage.getItem('token') ? getSavedUser() : null));
  const [isLoading, setIsLoading] = useState<boolean>(Boolean(localStorage.getItem('token') && !getSavedUser()));

  const refreshUser = useCallback(async () => {
    const currentToken = localStorage.getItem('token');
    if (!currentToken) {
      setToken(null);
      setUser(null);
      localStorage.removeItem('user');
      setIsLoading(false);
      return;
    }
    try {
      const userData = await authAPI.getMe();
      setUser(userData);
      localStorage.setItem('user', JSON.stringify(userData));
    } catch (err: any) {
      // Chỉ đăng xuất nếu token thực sự hết hạn hoặc không hợp lệ (HTTP 401)
      if (err?.response?.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setToken(null);
        setUser(null);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [token, refreshUser]);

  // Đồng bộ trạng thái đăng nhập giữa các tab trình duyệt và khi quay lại tab
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'token') {
        const newTok = localStorage.getItem('token');
        setToken(newTok);
        if (!newTok) {
          setUser(null);
        } else {
          refreshUser();
        }
      } else if (e.key === 'user') {
        setUser(getSavedUser());
      }
    };

    const handleWindowFocus = () => {
      const storedToken = localStorage.getItem('token');
      if (storedToken !== token) {
        setToken(storedToken);
      }
      if (storedToken) {
        refreshUser();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('focus', handleWindowFocus);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('focus', handleWindowFocus);
    };
  }, [token, refreshUser]);

  const login = async (newToken: string) => {
    localStorage.setItem('token', newToken);
    setToken(newToken);
    try {
      const userData = await authAPI.getMe();
      setUser(userData);
      localStorage.setItem('user', JSON.stringify(userData));
    } catch (e) {
      console.error(e);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, refreshUser, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
