/**
 * useAuth Hook
 * Manages authentication state and operations
 */

import { useContext, useCallback } from 'react';
import { AuthContext as AuthContextType } from '@/contexts/AuthContext';
import type { User } from '@shared/types/auth';

export function useAuth() {
  const context = useContext(AuthContextType);
  
  if (!context) {
    throw new Error('useAuth debe ser usado dentro de <AuthProvider>');
  }

  const {
    user,
    isLoading,
    isAuthenticated,
    token,
    setUser,
    setToken,
    setIsLoading,
  } = context;

  const login = useCallback(
    (userData: User, accessToken: string, refreshToken: string) => {
      // Store tokens in localStorage (in production, use secure storage)
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      
      setUser(userData);
      setToken(accessToken);
    },
    [setUser, setToken]
  );

  const logout = useCallback(() => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    
    setUser(null);
    setToken(null);
  }, [setUser, setToken]);

  return {
    user,
    isLoading,
    isAuthenticated,
    token,
    login,
    logout,
    setIsLoading,
  };
}
