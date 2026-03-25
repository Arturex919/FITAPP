import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User, Exercise, Routine, WorkoutSession, Achievement, UserAchievement, WorkoutStats, NutritionAdvice } from '../types';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth
export const authApi = {
  register: async (data: { email: string; password: string; nombre: string; objetivo: string; nivel: string }) => {
    const response = await api.post('/auth/register', data);
    return response.data;
  },
  login: async (data: { email: string; password: string }) => {
    const response = await api.post('/auth/login', data);
    return response.data;
  },
  getMe: async () => {
    const response = await api.get<User>('/auth/me');
    return response.data;
  },
  updateProfile: async (data: { objetivo?: string; nivel?: string; nombre?: string }) => {
    const response = await api.put('/auth/profile', null, { params: data });
    return response.data;
  },
};

// Exercises
export const exerciseApi = {
  getAll: async (params?: { categoria?: string; dificultad?: string; musculo?: string }) => {
    const response = await api.get<Exercise[]>('/exercises', { params });
    return response.data;
  },
  getById: async (id: string) => {
    const response = await api.get<Exercise>(`/exercises/${id}`);
    return response.data;
  },
  getByCategory: async (categoria: string) => {
    const response = await api.get<Exercise[]>(`/exercises/category/${categoria}`);
    return response.data;
  },
};

// Routines
export const routineApi = {
  getAll: async (params?: { tipo?: string; nivel?: string }) => {
    const response = await api.get<Routine[]>('/routines', { params });
    return response.data;
  },
  getById: async (id: string) => {
    const response = await api.get<Routine>(`/routines/${id}`);
    return response.data;
  },
  getExercises: async (id: string) => {
    const response = await api.get<Exercise[]>(`/routines/${id}/exercises`);
    return response.data;
  },
};

// Workouts
export const workoutApi = {
  create: async (data: { rutina_id?: string; ejercicios_completados: string[]; duracion_minutos: number; calorias_quemadas: number; notas?: string }) => {
    const response = await api.post<WorkoutSession>('/workouts', data);
    return response.data;
  },
  getHistory: async (limit = 20) => {
    const response = await api.get<WorkoutSession[]>('/workouts', { params: { limit } });
    return response.data;
  },
  getStats: async () => {
    const response = await api.get<WorkoutStats>('/workouts/stats');
    return response.data;
  },
};

// Warmup
export const warmupApi = {
  get: async (workoutType: string) => {
    const response = await api.get<Exercise[]>(`/warmup/${workoutType}`);
    return response.data;
  },
};

// Achievements
export const achievementApi = {
  getAll: async () => {
    const response = await api.get<Achievement[]>('/achievements');
    return response.data;
  },
  getUserAchievements: async () => {
    const response = await api.get<UserAchievement[]>('/achievements/user');
    return response.data;
  },
};

// Nutrition
export const nutritionApi = {
  getAdvice: async (data: { objetivo: string; nivel_actividad: string; ultimo_entrenamiento?: string; calorias_quemadas?: number; preferencias?: string }) => {
    const response = await api.post<NutritionAdvice>('/nutrition/advice', data);
    return response.data;
  },
};

export default api;
