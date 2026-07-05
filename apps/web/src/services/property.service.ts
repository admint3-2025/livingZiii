import { apiClient } from './api-client';
import { Property } from '@/types';

export const propertyService = {
  async getAll(): Promise<Property[]> {
    return apiClient.get<Property[]>('/properties');
  },

  async getById(id: string): Promise<Property> {
    return apiClient.get<Property>(`/properties/${id}`);
  },

  async getByOrganization(organizationId: string): Promise<Property[]> {
    return apiClient.get<Property[]>(`/properties?organizationId=${organizationId}`);
  },

  async create(data: Partial<Property>): Promise<Property> {
    return apiClient.post<Property>('/properties', data);
  },

  async update(id: string, data: Partial<Property>): Promise<Property> {
    return apiClient.put<Property>(`/properties/${id}`, data);
  },

  async delete(id: string): Promise<void> {
    await apiClient.delete(`/properties/${id}`);
  },
};
