import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type { IUser } from '@/lib/interfaces';

type AuthStore = {
  user: IUser | null;
  isAuthenticated: boolean;
  hasHydrated: boolean;
  setHasHydrated: (val: boolean) => void;
  setUser: (user: IUser | null) => void;
  clear: () => void;
};

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      hasHydrated: false,

      setHasHydrated: (val: boolean): void => { set({ hasHydrated: val }); },

      setUser: (user: IUser | null): void => { set({ user, isAuthenticated: Boolean(user) }); },

      clear(): void {
        set({ user: null, isAuthenticated: false });
      },
    }),
    {
      name: 'low-code-js-auth',
      storage: createJSONStorage(() => {
        if (typeof window === 'undefined') {
          return {
            getItem: (): string | null => null,
            setItem: (): void => {},
            removeItem: (): void => {},
          };
        }
        return localStorage;
      }),
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage:
        (): ((state?: AuthStore) => void) =>
        (state): void => {
          state?.setHasHydrated(true);
        },
    },
  ),
);
