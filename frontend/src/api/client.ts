import axios from 'axios';
import type { Listing, Comment, User } from '../types';

const API_URL = import.meta.env.VITE_API_URL || '';

export const api = axios.create({
  baseURL: API_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authApi = {
  login: (email: string, password: string) =>
    api.post<{ token: string }>('/api/auth/login', { email, password }),
  register: (email: string, password: string, displayName: string) =>
    api.post<{ token: string }>('/api/auth/register', { email, password, displayName }),
};

export interface CreateListingPayload {
  type: string;
  petType: string;
  petName?: string;
  breed?: string;
  color?: string;
  distinctiveMarks?: string;
  description?: string;
  eventDate?: string;
  latitude?: number;
  longitude?: number;
  city?: string;
  district?: string;
  addressText?: string;
  rewardAmount?: number;
  rewardCurrency?: string;
  imageUrls?: string[];
}

export const listingsApi = {
  getAll: (params?: { type?: string; petType?: string; city?: string }) =>
    api.get<Listing[]>('/api/listings', { params }),
  getById: (id: string) =>
    api.get<Listing>(`/api/listings/${id}`),
  getMyListings: () =>
    api.get<Listing[]>('/api/listings/my'),
  create: (data: CreateListingPayload) =>
    api.post<Listing>('/api/listings', data),
  update: (id: string, data: CreateListingPayload) =>
    api.put<Listing>(`/api/listings/${id}`, data),
  updateStatus: (id: string, status: 'ACTIVE' | 'RESOLVED' | 'EXPIRED' | 'ARCHIVED') =>
    api.patch<Listing>(`/api/listings/${id}/status`, { status }),
  getComments: (id: string) =>
    api.get<Comment[]>(`/api/listings/${id}/comments`),
  addComment: (id: string, content: string) =>
    api.post<Comment>(`/api/listings/${id}/comments`, { content }),
};

export const usersApi = {
  getMe: () => api.get<User>('/api/users/me'),
  updateMe: (data: Partial<{ displayName: string; bio: string; city: string; username: string; newPassword: string }>) =>
    api.patch<User>('/api/users/me', data),
  getByUsername: (username: string) =>
    api.get<User>(`/api/users/${username}`),
};
