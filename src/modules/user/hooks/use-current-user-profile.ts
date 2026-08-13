'use client';

import { useEffect, useState } from 'react';

import { useAuthSession } from '@/modules/auth/hooks/use-auth-session';
import { userService } from '@/modules/user/services';
import type { UserDocument } from '@/modules/user/types/user';

export function useCurrentUserProfile() {
  const { user, isAuthenticated } = useAuthSession();
  const [userProfile, setUserProfile] = useState<UserDocument | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const canWatchProfile = isAuthenticated && Boolean(user?.uid);

  useEffect(() => {
    if (!canWatchProfile || !user?.uid) {
      return undefined;
    }

    const unsubscribe = userService.watchUser(
      user.uid,
      (profile) => {
        setUserProfile(profile);
        setErrorMessage(null);
        setIsLoading(false);
      },
      (error) => {
        setUserProfile(null);
        setErrorMessage(error.message);
        setIsLoading(false);
      },
    );

    return () => {
      unsubscribe();
    };
  }, [canWatchProfile, user?.uid]);

  return {
    userProfile: canWatchProfile ? userProfile : null,
    isLoading: canWatchProfile ? isLoading : false,
    errorMessage,
  };
}
