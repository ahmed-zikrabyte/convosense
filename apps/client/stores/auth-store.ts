import { create } from 'zustand';
import { User, getToken, getUser, isAuthenticated } from '@/lib/auth';

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  initializeAuth: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,

  initializeAuth: () => {
    const storedToken = getToken();
    const storedUser = getUser();

    set({
      token: storedToken,
      user: storedUser,
      isAuthenticated: isAuthenticated(),
      isLoading: false,
    });
  },
}));