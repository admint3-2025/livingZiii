import { useAuthStore } from '@/store/auth.store';

export const useAuth = () => {
  const { user, loading, error, login, logout, setUser, setError } = useAuthStore();

  return {
    user,
    loading,
    error,
    login,
    logout,
    setUser,
    setError,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin',
    isManager: user?.role === 'manager',
  };
};
