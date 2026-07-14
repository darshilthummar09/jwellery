import { User } from './user.types';

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface AuthContextValue extends AuthState {
  login: (credentials: LoginCredentials) => Promise<AuthResult>;
  logout: () => void;
}

export interface AuthResult {
  success: boolean;
  error?: string;
  user?: User;
}
