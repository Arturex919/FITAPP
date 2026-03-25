import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User } from '../types';
import { authApi } from '../services/api';

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<boolean>;
  register: (email: string, password: string, nombre: string, objetivo: string, nivel: string) => Promise<boolean>;
  logout: () => Promise<void>;
  loadToken: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  isLoading: true,
  isAuthenticated: false,
  error: null,

  login: async (email: string, password: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await authApi.login({ email, password });
      await AsyncStorage.setItem('token', response.access_token);
      set({
        user: response.user,
        token: response.access_token,
        isAuthenticated: true,
        isLoading: false,
      });
      return true;
    } catch (error: any) {
      const message = error.response?.data?.detail || 'Error al iniciar sesión';
      set({ error: message, isLoading: false });
      return false;
    }
  },

  register: async (email: string, password: string, nombre: string, objetivo: string, nivel: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await authApi.register({ email, password, nombre, objetivo, nivel });
      await AsyncStorage.setItem('token', response.access_token);
      set({
        user: response.user,
        token: response.access_token,
        isAuthenticated: true,
        isLoading: false,
      });
      return true;
    } catch (error: any) {
      const message = error.response?.data?.detail || 'Error al registrarse';
      set({ error: message, isLoading: false });
      return false;
    }
  },

  logout: async () => {
    await AsyncStorage.removeItem('token');
    set({
      user: null,
      token: null,
      isAuthenticated: false,
    });
  },

  loadToken: async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (token) {
        const user = await authApi.getMe();
        set({
          token,
          user,
          isAuthenticated: true,
          isLoading: false,
        });
      } else {
        set({ isLoading: false });
      }
    } catch (error) {
      await AsyncStorage.removeItem('token');
      set({ isLoading: false });
    }
  },

  clearError: () => set({ error: null }),
}));
