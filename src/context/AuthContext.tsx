import React, { createContext, useCallback, useEffect, useState } from 'react';
import { AuthContextValue, AuthResult, LoginCredentials } from '../types/auth.types';
import { User } from '../types/user.types';
import {
  authLogin,
  authLogout,
  authGetCurrentUser,
} from '../services/auth.service';

export const AuthContext = createContext<AuthContextValue | null>(null);

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // On mount, restore session (SessionStorage → Supabase later)
  useEffect(() => {
    const currentUser = authGetCurrentUser();
    setUser(currentUser);
    setIsLoading(false);
  }, []);

  const login = useCallback(
    async (credentials: LoginCredentials): Promise<AuthResult> => {
      setIsLoading(true);
      const result = await authLogin(credentials);
      if (result.success && result.user) {
        setUser(result.user);
      }
      setIsLoading(false);
      return result;
    },
    []
  );

  const logout = useCallback(() => {
    authLogout();
    setUser(null);
  }, []);

  const value: AuthContextValue = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
