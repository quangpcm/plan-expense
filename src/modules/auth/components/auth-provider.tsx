'use client';

import { useEffect } from 'react';
import type { ReactNode } from 'react';

import { isFirebaseConfigured } from '@/config/env';
import { authService } from '@/modules/auth/services';
import { useAuthStore } from '@/shared/stores/auth.store';

type AuthProviderProps = {
  children: ReactNode;
};

export function AuthProvider({ children }: AuthProviderProps) {
  const setStatus = useAuthStore((state) => state.setStatus);
  const setUser = useAuthStore((state) => state.setUser);
  const setInitialized = useAuthStore((state) => state.setInitialized);
  const setErrorMessage = useAuthStore((state) => state.setErrorMessage);

  useEffect(() => {
    if (!isFirebaseConfigured()) {
      setStatus('unconfigured');
      setUser(null);
      setInitialized(true);
      return undefined;
    }

    setStatus('loading');

    const unsubscribe = authService.watchAuthState(async (user) => {
      try {
        if (user) {
          setUser(user);
          setStatus('authenticated');
        } else {
          setUser(null);
          setStatus('unauthenticated');
        }

        setErrorMessage(null);
      } catch (error) {
        console.error(error);
        setErrorMessage('Failed to restore your session.');
        setStatus('unauthenticated');
      } finally {
        setInitialized(true);
      }
    });

    return () => {
      unsubscribe();
    };
  }, [setErrorMessage, setInitialized, setStatus, setUser]);

  return children;
}

