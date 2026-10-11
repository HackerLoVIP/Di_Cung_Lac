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
  generate: async (province_id: number, num_days: number, num_nights: number, prompt?: string): Promise<Itinerary> => {
    const res = await api.post('/itineraries/generate', {
      province_id,
      num_days,
      num_nights,
      prompt,
    });
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

export default api;
