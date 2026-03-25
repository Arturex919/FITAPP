import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { User } from '../types';
import { authApi } from '../services/api';

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
  cookiesAccepted: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  register: (email: string, password: string, nombre: string, objetivo: string, nivel: string) => Promise<boolean>;
  logout: () => Promise<void>;
  loadToken: () => Promise<void>;
  clearError: () => void;
  acceptCookies: () => Promise<void>;
  checkCookies: () => Promise<void>;
}

// Safe storage wrapper for web compatibility
const safeStorage = {
  getItem: async (key: string): Promise<string | null> => {
    try {
      if (Platform.OS === 'web') {
        return localStorage.getItem(key);
      }
      return await AsyncStorage.getItem(key);
    } catch {
      return null;
    }
  },
  setItem: async (key: string, value: string): Promise<void> => {
    try {
      if (Platform.OS === 'web') {
        localStorage.setItem(key, value);
      } else {
        await AsyncStorage.setItem(key, value);
      }
    } catch {
      console.warn('Storage not available');
    }
  },
  removeItem: async (key: string): Promise<void> => {
    try {
      if (Platform.OS === 'web') {
        localStorage.removeItem(key);
      } else {
        await AsyncStorage.removeItem(key);
      }
    } catch {
      console.warn('Storage not available');
    }
  },
};

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  isLoading: true,
  isAuthenticated: false,
  error: null,
  cookiesAccepted: false,

  login: async (email: string, password: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await authApi.login({ email, password });
      await safeStorage.setItem('token', response.access_token);
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
      await safeStorage.setItem('token', response.access_token);
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
    try {
      await safeStorage.removeItem('token');
      set({
        user: null,
        token: null,
        isAuthenticated: false,
      });
    } catch (error) {
      console.error('Error during logout:', error);
      // Force state reset even if storage fails
      set({
        user: null,
        token: null,
        isAuthenticated: false,
      });
    }
  },

  loadToken: async () => {
    try {
      const token = await safeStorage.getItem('token');
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
      await safeStorage.removeItem('token');
      set({ isLoading: false });
    }
  },

  clearError: () => set({ error: null }),

  acceptCookies: async () => {
    await safeStorage.setItem('cookies_accepted', 'true');
    set({ cookiesAccepted: true });
  },

  checkCookies: async () => {
    const accepted = await safeStorage.getItem('cookies_accepted');
    set({ cookiesAccepted: accepted === 'true' });
  },
}));
