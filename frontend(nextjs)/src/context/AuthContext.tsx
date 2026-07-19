'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl: string;
  username?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  error: string | null;
  login: (email: string, name: string, username: string) => Promise<void>;
  logout: () => void;
  setOAuthToken: (token: string) => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const clearError = () => setError(null);

  const login = async (email: string, name: string, username: string) => {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/auth/dev-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name, username }),
      });

      if (res.status === 0 || !res.ok && res.status >= 500) {
        const text = await res.text().catch(() => '');
        throw new Error(`Server error (${res.status}): Could not connect to backend. Make sure DATABASE_URL is set in your .env file and Neon DB is reachable.`);
      }

      if (!res.ok) {
        const body = await res.json().catch(() => ({ message: 'Unknown error' }));
        throw new Error(body.message || `Request failed with status ${res.status}`);
      }

      const data = await res.json();
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      setToken(data.token);
      setUser(data.user);
      router.push('/chat');
    } catch (e: any) {
      // Network-level failure (fetch itself throws)
      if (e instanceof TypeError && e.message.includes('fetch')) {
        setError('Cannot reach backend server. Is it running on http://localhost:5000?');
      } else {
        setError(e.message || 'Login failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const setOAuthToken = async (jwtToken: string) => {
    try {
      localStorage.setItem('token', jwtToken);
      setToken(jwtToken);

      const base64Url = jwtToken.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const payload = JSON.parse(window.atob(base64));

      const matchedUser = {
        id: payload.sub,
        email: payload.email || 'oauth-user@example.com',
        name: 'OAuth User',
        avatarUrl: `https://api.dicebear.com/7.x/adventurer/svg?seed=oauth`,
      };

      localStorage.setItem('user', JSON.stringify(matchedUser));
      setUser(matchedUser);
      router.push('/chat');
    } catch (e) {
      setError('OAuth authentication failed. Please try again.');
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
    router.push('/');
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, error, login, logout, setOAuthToken, clearError }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
