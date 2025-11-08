// src/context/AuthContext.tsx
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { RoleType } from '../types/models';

// 1. Define the Context's shape
interface AuthContextType {
  token: string | null;
  userRole: RoleType | null;
  userId: number | null;
  fullName: string | null;
  isLoggedIn: boolean;
  setAuth: (accessToken: string, role: RoleType, userId: number, fullName: string) => void;
  logout: () => void;
}

// 2. Create the Context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// 3. Create the Provider Component
interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [userRole, setUserRole] = useState<RoleType | null>(localStorage.getItem('userRole') as RoleType | null);
  const [userId, setUserId] = useState<number | null>(() => {
    const id = localStorage.getItem('userId');
    return id ? parseInt(id, 10) : null;
  });
  const [fullName, setFullName] = useState<string | null>(localStorage.getItem('fullName'));

  const isLoggedIn = !!token;

  useEffect(() => {
    // Sync state to localStorage for persistence
    if (token) {
      localStorage.setItem('token', token);
      localStorage.setItem('userRole', userRole || '');
      localStorage.setItem('userId', userId ? userId.toString() : '');
      localStorage.setItem('fullName', fullName || '');
    } else {
      localStorage.removeItem('token');
      localStorage.removeItem('userRole');
      localStorage.removeItem('userId');
      localStorage.removeItem('fullName');
    }
  }, [token, userRole, userId, fullName]);

  const setAuth = (accessToken: string, role: RoleType, id: number, name: string) => {
    setToken(accessToken);
    setUserRole(role);
    setUserId(id);
    setFullName(name);
  };

  const logout = () => {
    setToken(null);
    setUserRole(null);
    setUserId(null);
    setFullName(null);
    // localStorage cleanup handled by useEffect
  };

  const value = {
    token,
    userRole,
    userId,
    fullName,
    isLoggedIn,
    setAuth,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// 4. Custom Hook for consumption
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};