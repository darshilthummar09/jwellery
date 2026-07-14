import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { AuthContextValue } from '../types/auth.types';

/**
 * useAuth — primary hook for authentication state and actions.
 * Usage: const { user, isAuthenticated, login, logout } = useAuth();
 */
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used inside <AuthProvider>');
  }
  return ctx;
}
