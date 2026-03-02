import { create } from 'zustand';
import { initSocket, disconnectSocket } from './api';

export const useUserStore = create((set) => ({
  currentUser: null,
  token: localStorage.getItem('token') || null,
  isLoading: true,
  
  fetchUserInfo: async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      return set({ currentUser: null, isLoading: false, token: null });
    }

    try {
      // Dynamic import to avoid circular dependency
      const { api } = await import('./api');
      const res = await api.get('/auth/me');
      
      if (res.data.user) {
        set({ currentUser: res.data.user, isLoading: false, token });
        initSocket(res.data.user.id);
      } else {
        localStorage.removeItem('token');
        set({ currentUser: null, isLoading: false, token: null });
        disconnectSocket();
      }
    } catch (err) {
      console.log(err);
      localStorage.removeItem('token');
      set({ currentUser: null, isLoading: false, token: null });
      disconnectSocket();
    }
  },

  loginUser: (userData) => {
    const { user, token } = userData;
    localStorage.setItem('token', token);
    set({ currentUser: user, token: token, isLoading: false });
    initSocket(user.id);
  },

  logoutUser: () => {
    localStorage.removeItem('token');
    set({ currentUser: null, token: null, isLoading: false });
    disconnectSocket();
  },

  updateUser: (user) => {
    set({ currentUser: user });
  }
}));
