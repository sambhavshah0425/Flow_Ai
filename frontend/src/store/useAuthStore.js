import { create } from 'zustand';
import { api } from '../services/api';

export const useAuthStore = create((set) => ({
  user: null,
  token: localStorage.getItem('flowforge_token') || null,
  isAuthenticated: !!localStorage.getItem('flowforge_token'),
  loading: false,
  error: null,

  clearError: () => {
    set({ error: null });
  },

  login: async (email, password) => {
    set({ loading: true, error: null });

    try {
      const res = await api.post('/auth/login', { email, password });
      const { token, user } = res.data;

      localStorage.setItem('flowforge_token', token);

      set({
        user,
        token,
        isAuthenticated: true,
        loading: false,
        error: null,
      });

      return true;
    } catch (err) {
      const msg = err.response?.data?.message || 'Login failed';

      set({
        error: msg,
        loading: false,
      });

      return false;
    }
  },

  register: async (name, email, password) => {
    set({ loading: true, error: null });

    try {
      const res = await api.post('/auth/register', {
        name,
        email,
        password,
      });

      const { token, user } = res.data;

      localStorage.setItem('flowforge_token', token);

      set({
        user,
        token,
        isAuthenticated: true,
        loading: false,
        error: null,
      });

      return true;
    } catch (err) {
      const msg =
        err.response?.data?.message || 'Registration failed';

      set({
        error: msg,
        loading: false,
      });

      return false;
    }
  },

  logout: () => {
    localStorage.removeItem('flowforge_token');

    set({
      user: null,
      token: null,
      isAuthenticated: false,
      error: null,
    });
  },

  checkAuth: async () => {
    const token = localStorage.getItem('flowforge_token');

    if (!token) return;

    try {
      const res = await api.get('/auth/me');

      set({
        user: res.data.user,
        token,
        isAuthenticated: true,
        error: null,
      });
    } catch {
      localStorage.removeItem('flowforge_token');

      set({
        user: null,
        token: null,
        isAuthenticated: false,
        error: null,
      });
    }
  },
}));
