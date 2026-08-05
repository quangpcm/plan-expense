'use client';

import { useMemo } from 'react';

import { authService } from '@/modules/auth/services';

export function useAuthActions() {
  return useMemo(
    () => ({
      login: authService.login.bind(authService),
      register: authService.register.bind(authService),
      loginWithGoogle: authService.loginWithGoogle.bind(authService),
      logout: authService.logout.bind(authService),
      sendPasswordReset: authService.sendPasswordReset.bind(authService),
    }),
    [],
  );
}

