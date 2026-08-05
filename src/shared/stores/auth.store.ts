import { create } from 'zustand';

import type { AuthUser } from '@/modules/auth/types/auth';

export type AuthStatus =
  | 'idle'
  | 'loading'
  | 'authenticated'
  | 'unauthenticated'
  | 'unconfigured';

type AuthStoreState = {
  status: AuthStatus;
  user: AuthUser | null;
  initialized: boolean;
  errorMessage: string | null;
  setStatus: (status: AuthStatus) => void;
  setUser: (user: AuthUser | null) => void;
  setInitialized: (initialized: boolean) => void;
  setErrorMessage: (message: string | null) => void;
  reset: () => void;
};

const initialState = {
  status: 'idle' as AuthStatus,
  user: null,
  initialized: false,
  errorMessage: null,
};

export const useAuthStore = create<AuthStoreState>((set) => ({
  ...initialState,
  setStatus: (status) => set({ status }),
  setUser: (user) => set({ user }),
  setInitialized: (initialized) => set({ initialized }),
  setErrorMessage: (errorMessage) => set({ errorMessage }),
  reset: () => set(initialState),
}));

