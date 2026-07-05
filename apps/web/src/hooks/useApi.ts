import { useState, useCallback } from 'react';
import { apiClient } from '@/services/api-client';

interface UseApiOptions {
  onSuccess?: (data: any) => void;
  onError?: (error: any) => void;
}

export const useApi = <T,>(options?: UseApiOptions) => {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const execute = useCallback(
    async (method: 'get' | 'post' | 'put' | 'delete', url: string, payload?: any) => {
      setLoading(true);
      setError(null);

      try {
        let result: T;
        switch (method) {
          case 'get':
            result = await apiClient.get<T>(url);
            break;
          case 'post':
            result = await apiClient.post<T>(url, payload);
            break;
          case 'put':
            result = await apiClient.put<T>(url, payload);
            break;
          case 'delete':
            result = await apiClient.delete<T>(url);
            break;
          default:
            throw new Error('Invalid method');
        }

        setData(result);
        options?.onSuccess?.(result);
        return result;
      } catch (err: any) {
        const errorMessage = err.response?.data?.message || err.message || 'An error occurred';
        setError(errorMessage);
        options?.onError?.(err);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [options],
  );

  return {
    data,
    loading,
    error,
    execute,
    reset: () => {
      setData(null);
      setError(null);
    },
  };
};
