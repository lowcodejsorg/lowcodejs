/* eslint-disable @typescript-eslint/explicit-function-return-type */
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type { IUser } from '@/lib/interfaces';

export type Authenticated = Pick<IUser, 'name' | 'email'> & {
  role: 'ADMINISTRATOR' | 'REGISTERED' | 'MANAGER' | 'MASTER';
  sub: string;
};

type AuthenticationStore = {
  authenticated: Authenticated | null;
  isAuthenticated: boolean;
  setAuthenticated: (authenticated: Authenticated | null) => void;
  logout: () => void;
};

export const useAuthenticationStore = create<AuthenticationStore>()(
  persist(
    (set) => ({
      authenticated: null,
      isAuthenticated: false,
      setAuthenticated: (authenticated) =>
        set({ authenticated, isAuthenticated: !!authenticated }),
      logout: () => set({ authenticated: null, isAuthenticated: false }),
    }),
    {
      name: 'authentication-store',
      partialize: (state) => ({
        authenticated: state.authenticated,
        isAuthenticated: state.isAuthenticated,
        sub: state.authenticated?.sub,
      }),
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
