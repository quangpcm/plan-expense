'use client';

import { useMemo } from 'react';

import { authService } from '@/modules/auth/services';
import { useAuthStore } from '@/shared/stores/auth.store';

export function useAuthActions() {
  return useMemo(
    () => ({
      login: authService.login.bind(authService),
      register: authService.register.bind(authService),
      loginWithGoogle: authService.loginWithGoogle.bind(authService),
      logout: authService.logout.bind(authService),
      sendPasswordReset: authService.sendPasswordReset.bind(authService),
      // updateProfile() on an already-signed-in user does not trigger onAuthStateChanged,
      // so the store must be refreshed explicitly here for useAuthSession() to reflect it.
      updateDisplayName: async (displayName: string) => {
        const user = await authService.updateDisplayName(displayName);
        useAuthStore.getState().setUser(user);
        return user;
      },
    }),
    [],
  );
}

