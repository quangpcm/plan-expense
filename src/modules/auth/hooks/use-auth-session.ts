'use client';

import { useAuthStore } from '@/shared/stores/auth.store';

export function useAuthSession() {
  const status = useAuthStore((state) => state.status);
  const user = useAuthStore((state) => state.user);
  const initialized = useAuthStore((state) => state.initialized);
  const errorMessage = useAuthStore((state) => state.errorMessage);

  return {
    status,
    user,
    initialized,
    errorMessage,
    isAuthenticated: status === 'authenticated',
    isLoading: status === 'loading' || (!initialized && status === 'idle'),
    isConfigured: status !== 'unconfigured',
  };
}

