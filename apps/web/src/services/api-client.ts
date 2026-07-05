import axios, { AxiosInstance, AxiosError } from 'axios';
import { ApiResponse } from '@/types';

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: '/api',
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add token to requests if available
    this.client.interceptors.request.use((config) => {
      const token = localStorage.getItem('accessToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    // Handle responses
    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        if (error.response?.status === 401) {
          // Token expired, clear and redirect to login
          localStorage.removeItem('accessToken');
          localStorage.removeItem('user');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      },
    );
  }

  private unwrap<T>(payload: ApiResponse<T> | T): T {
    if (payload && typeof payload === 'object' && 'data' in payload && payload.data !== undefined) {
      return payload.data as T;
    }
    return payload as T;
  }

  async get<T = any>(url: string, config?: any): Promise<T> {
    const response = await this.client.get<ApiResponse<T> | T>(url, config);
    return this.unwrap(response.data);
  }

  async post<T = any>(url: string, data?: any, config?: any): Promise<T> {
    const response = await this.client.post<ApiResponse<T> | T>(url, data, config);
    return this.unwrap(response.data);
  }

  async put<T = any>(url: string, data?: any, config?: any): Promise<T> {
    const response = await this.client.put<ApiResponse<T> | T>(url, data, config);
    return this.unwrap(response.data);
  }

  async delete<T = any>(url: string, config?: any): Promise<T> {
    const response = await this.client.delete<ApiResponse<T> | T>(url, config);
    return this.unwrap(response.data);
  }
}

export const apiClient = new ApiClient();
