/**
 * Auth Context
 * Provides authentication state to entire app
 */

import { createContext, useState, useEffect, ReactNode, Dispatch, SetStateAction } from 'react';
import type { User } from '@shared/types/auth';
import { trpc } from '@/lib/trpc';

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  token: string | null;
  setUser: Dispatch<SetStateAction<User | null>>;
  setToken: Dispatch<SetStateAction<string | null>>;
  setIsLoading: Dispatch<SetStateAction<boolean>>;
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [shouldRefreshUser, setShouldRefreshUser] = useState(false);

  const meQuery = trpc.auth.me.useQuery(undefined, {
    enabled: shouldRefreshUser || !!token,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  // Load auth from localStorage on mount
  useEffect(() => {
    const storedToken = localStorage.getItem('accessToken');
    
    if (storedToken) {
      setToken(storedToken);
      setShouldRefreshUser(true);
    } else {
      setIsLoading(false);
    }
  }, []);

  // When token is set directly (e.g., after login), refresh user data
  useEffect(() => {
    if (token && shouldRefreshUser) {
      meQuery.refetch();
      setShouldRefreshUser(false);
    }
  }, [token, shouldRefreshUser]);

  // Check if user is still authenticated
  useEffect(() => {
    if (meQuery.data?.user) {
      const user = meQuery.data.user as User;
      setUser(user);
      setIsLoading(false);
    } else if (!meQuery.isLoading && token) {
      setIsLoading(false);
    } else if (!token && !meQuery.isLoading) {
      setIsLoading(false);
    }
  }, [meQuery.data, meQuery.isLoading, token]);

  const value: AuthContextValue = {
    user,
    isLoading,
    isAuthenticated: !!user && !!token,
    token,
    setUser,
    setToken,
    setIsLoading,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
