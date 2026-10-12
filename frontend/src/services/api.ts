import axios from 'axios';
import { Province, Location, Itinerary, User } from '../types';

const api = axios.create({
  baseURL: '/api',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authAPI = {
  login: async (email: string, password: string) => {
    const res = await api.post('/auth/login', { email, password });
    return res.data;
  },
  register: async (email: string, password: string, full_name: string) => {
    const res = await api.post('/auth/register', { email, password, full_name });
    return res.data;
  },
  getMe: async (): Promise<User> => {
    const res = await api.get('/auth/me');
    return res.data;
  },
  googleLogin: async (data: { credential?: string; access_token?: string; email?: string; full_name?: string; avatar_url?: string }) => {
    const res = await api.post('/auth/google', data);
    return res.data;
  },
};

export const provinceAPI = {
  getAll: async (): Promise<Province[]> => {
    const res = await api.get('/provinces');
    return res.data;
  },
  getById: async (id: number): Promise<Province> => {
    const res = await api.get(`/provinces/${id}`);
    return res.data;
  },
  getLocations: async (provinceId: number, category?: string): Promise<Location[]> => {
    const params = category && category !== 'all' ? { category } : {};
    const res = await api.get(`/provinces/${provinceId}/locations`, { params });
    return res.data;
  },
};

export const locationAPI = {
  getById: async (id: number): Promise<Location> => {
    const res = await api.get(`/locations/${id}`);
    return res.data;
  },
  search: async (params: { q?: string; category?: string; min_rating?: number; max_cost?: number }): Promise<Location[]> => {
    const res = await api.get('/locations/search', { params });
    return res.data;
  },
};

export const itineraryAPI = {
  generate: async (
    params: {
      province_id?: number;
      destination?: string;
      start_location?: string;
      num_days?: number;
      num_nights?: number;
      prompt?: string;
    } | number,
    num_days?: number,
    num_nights?: number,
    prompt?: string
  ): Promise<Itinerary> => {
    let payload = {};
    if (typeof params === 'object') {
      payload = params;
    } else {
      payload = {
        province_id: params,
        num_days: num_days || 3,
        num_nights: num_nights || 2,
        prompt: prompt,
      };
    }
    const res = await api.post('/itineraries/generate', payload);
    return res.data;
  },
  save: async (itinerary: Itinerary): Promise<Itinerary> => {
    const res = await api.post('/itineraries', itinerary);
    return res.data;
  },
  getMyTrips: async () => {
    const res = await api.get('/itineraries/my');
    return res.data;
  },
  getById: async (id: number): Promise<Itinerary> => {
    const res = await api.get(`/itineraries/${id}`);
    return res.data;
  },
  delete: async (id: number) => {
    const res = await api.delete(`/itineraries/${id}`);
    return res.data;
  },
  getCosts: async (id: number) => {
    const res = await api.get(`/itineraries/${id}/costs`);
    return res.data;
  },
};

export const expenseAPI = {
  getByItineraryId: async (itineraryId: number) => {
    const res = await api.get(`/expenses/${itineraryId}`);
    return res.data;
  },
  create: async (data: { itinerary_id?: number; title: string; category: string; planned_cost: number; actual_cost: number }) => {
    const res = await api.post('/expenses', data);
    return res.data;
  },
  update: async (id: number, data: { title?: string; category?: string; planned_cost?: number; actual_cost?: number }) => {
    const res = await api.put(`/expenses/${id}`, data);
    return res.data;
  },
  delete: async (id: number) => {
    const res = await api.delete(`/expenses/${id}`);
    return res.data;
  },
};

export default api;
