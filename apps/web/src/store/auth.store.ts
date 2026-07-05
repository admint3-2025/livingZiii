import { create } from 'zustand';
import { User } from '@/types';
import { authService } from '@/services/auth.service';

interface AuthStore {
  user: User | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  setUser: (user: User | null) => void;
  setError: (error: string | null) => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: authService.getCurrentUser(),
  loading: false,
  error: null,

  login: async (email: string, password: string) => {
    set({ loading: true, error: null });
    try {
      const response = await authService.login(email, password);
      set({ user: response.user, loading: false });
    } catch (error: any) {
      const message = error.response?.data?.message;
      const errorMessage = Array.isArray(message)
        ? message.join(', ')
        : message || 'Credenciales inválidas';
      set({ error: errorMessage, loading: false });
      throw error;
    }
  },

  logout: () => {
    authService.logout();
    set({ user: null, error: null });
  },

  setUser: (user: User | null) => set({ user }),
  setError: (error: string | null) => set({ error }),
}));
