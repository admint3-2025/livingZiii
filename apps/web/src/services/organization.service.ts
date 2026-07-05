import { apiClient } from './api-client';
import { Organization } from '@/types';

export const organizationService = {
  async getAll(): Promise<Organization[]> {
    return apiClient.get<Organization[]>('/organizations');
  },

  async getById(id: string): Promise<Organization> {
    return apiClient.get<Organization>(`/organizations/${id}`);
  },

  async create(data: Partial<Organization>): Promise<Organization> {
    return apiClient.post<Organization>('/organizations', data);
  },

  async update(id: string, data: Partial<Organization>): Promise<Organization> {
    return apiClient.put<Organization>(`/organizations/${id}`, data);
  },

  async delete(id: string): Promise<void> {
    await apiClient.delete(`/organizations/${id}`);
  },
};
