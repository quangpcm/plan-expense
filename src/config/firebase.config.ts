import { getApps, initializeApp, type FirebaseApp } from 'firebase/app';

import { getEnv } from '@/config/env';

export function getFirebaseWebConfig() {
  const env = getEnv();

  return {
    apiKey: env.NEXT_PUBLIC_FIREBASE_API_KEY ?? '',
    authDomain: env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ?? '',
    projectId: env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? '',
    storageBucket: env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ?? '',
    messagingSenderId: env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? '',
    appId: env.NEXT_PUBLIC_FIREBASE_APP_ID ?? '',
  };
}

export function initializeFirebaseApp(): FirebaseApp {
  if (getApps().length > 0) {
    return getApps()[0]!;
  }

  return initializeApp(getFirebaseWebConfig());
}

