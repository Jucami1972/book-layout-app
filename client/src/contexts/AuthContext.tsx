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

  const meQuery = trpc.auth.me.useQuery(undefined);

  // Load auth from localStorage and verify with server
  useEffect(() => {
    const storedToken = localStorage.getItem('accessToken');
    
    if (storedToken) {
      setToken(storedToken);
    }

    // Check if user is still authenticated
    if (meQuery.data?.user) {
      // Type assertion to ensure planType is correct type
      const user = meQuery.data.user as User;
      setUser(user);
      setIsLoading(false);
    } else if (!meQuery.isLoading) {
      setIsLoading(false);
    }
  }, [meQuery.data, meQuery.isLoading]);

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
