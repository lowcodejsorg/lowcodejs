/* eslint-disable @typescript-eslint/explicit-function-return-type */
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { API } from '@/lib/api';
import type { IUser } from '@/lib/interfaces';

type AuthStore = {
  user: IUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  hasHydrated: boolean;
  setHasHydrated: (val: boolean) => void;
  fetchUser: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (name: string, email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  clear: () => void;
};

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      isLoading: false,
      isAuthenticated: false,
      hasHydrated: false,

      setHasHydrated: (val: boolean) => set({ hasHydrated: val }),

      async fetchUser() {
        try {
          set({ isLoading: true });
          const response = await API.get<IUser>('/profile');
          set({ user: response.data, isAuthenticated: true, isLoading: false });
        } catch {
          set({ user: null, isAuthenticated: false, isLoading: false });
        }
      },

      async signIn(email: string, password: string) {
        await API.post('/authentication/sign-in', { email, password });
        const { data } = await API.get<IUser>('/profile');
        set({ user: data, isAuthenticated: true });
      },

      async signUp(name: string, email: string, password: string) {
        await API.post('/authentication/sign-up', { name, email, password });
        const { data } = await API.get<IUser>('/profile');
        set({ user: data, isAuthenticated: true });
      },

      async signOut() {
        try {
          await API.post('/authentication/sign-out');
        } finally {
          set({ user: null, isAuthenticated: false });
        }
      },

      clear() {
        set({ user: null, isAuthenticated: false, isLoading: false });
      },
    }),
    {
      name: 'low-code-js-auth',
      storage: createJSONStorage(() => {
        if (typeof window === 'undefined') {
          return {
            getItem: () => null,
            setItem: () => {},
            removeItem: () => {},
          };
        }
        return localStorage;
      }),
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    },
  ),
);
