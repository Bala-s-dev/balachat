import { create } from 'zustand';
import api from '../lib/api';
import { getOrCreateRSAKeyPair } from '../lib/crypto';

/**
 * After a successful auth (login or register) ensure the client has an RSA
 * key pair, and upload the public key to the server if it has changed or
 * wasn't set before.
 */
async function syncRSAPublicKey(serverPublicKey) {
  try {
    const { publicKeyPem } = await getOrCreateRSAKeyPair();
    // Upload only when the server doesn't have the key yet or it differs
    if (!serverPublicKey || serverPublicKey.trim() !== publicKeyPem.trim()) {
      await api.patch('/auth/public-key', { publicKey: publicKeyPem });
    }
  } catch (err) {
    console.error('[RSA] Failed to sync public key:', err);
  }
}

export const useAuthStore = create((set) => ({
  user:    null,
  token:   localStorage.getItem('token'),
  loading: true,

  login: async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    localStorage.setItem('token', data.token);
    set({ user: data.user, token: data.token });
    // Fire and forget — don't block login on RSA sync
    syncRSAPublicKey(data.user?.publicKey);
    return data.user;
  },

  register: async (username, email, password) => {
    const { data } = await api.post('/auth/register', { username, email, password });
    // BUG FIX: register now returns a token so we can stay logged in
    if (data.token) {
      localStorage.setItem('token', data.token);
      set({ user: data.user, token: data.token });
      syncRSAPublicKey(data.user?.publicKey);
      return data.user;
    }
  },

  logout: () => {
    localStorage.removeItem('token');
    set({ user: null, token: null });
  },

  fetchMe: async () => {
    try {
      const { data } = await api.get('/auth/me');
      set({ user: data.user, loading: false });
      syncRSAPublicKey(data.user?.publicKey);
    } catch {
      localStorage.removeItem('token');
      set({ user: null, token: null, loading: false });
    }
  },

  updateUser: (updates) => set((s) => ({ user: { ...s.user, ...updates } })),
}));
