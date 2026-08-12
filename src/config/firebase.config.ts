import { getApps, initializeApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';

import { getEnv, isFirebaseConfigured } from '@/config/env';
import { AppError } from '@/shared/errors/app-error';

export function getFirebaseWebConfig() {
  const env = getEnv();

  return {
    apiKey: env.NEXT_PUBLIC_FIREBASE_API_KEY ?? '',
    authDomain: env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ?? '',
    projectId: env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? '',
    messagingSenderId: env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? '',
    appId: env.NEXT_PUBLIC_FIREBASE_APP_ID ?? '',
  };
}

export function initializeFirebaseApp(): FirebaseApp {
  if (!isFirebaseConfigured()) {
    throw new AppError('Firebase configuration is missing.', 'FIREBASE_NOT_CONFIGURED', 500);
  }

  if (getApps().length > 0) {
    return getApps()[0]!;
  }

  return initializeApp(getFirebaseWebConfig());
}

export function getFirebaseAuth(): Auth {
  return getAuth(initializeFirebaseApp());
}

export function getFirebaseFirestore(): Firestore {
  return getFirestore(initializeFirebaseApp());
}
