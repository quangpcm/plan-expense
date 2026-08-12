import { cert, getApps, initializeApp, type App } from 'firebase-admin/app';
import { getAuth, type Auth } from 'firebase-admin/auth';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';

import { AppError } from '@/shared/errors/app-error';

function getServiceAccountEnv() {
  const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY;

  if (!projectId || !clientEmail || !privateKey) {
    throw new AppError('Firebase Admin configuration is missing.', 'FIREBASE_ADMIN_NOT_CONFIGURED', 500);
  }

  return { projectId, clientEmail, privateKey: privateKey.replace(/\\n/g, '\n') };
}

function initializeFirebaseAdminApp(): App {
  if (getApps().length > 0) {
    return getApps()[0]!;
  }

  return initializeApp({ credential: cert(getServiceAccountEnv()) });
}

export function getAdminAuth(): Auth {
  return getAuth(initializeFirebaseAdminApp());
}

export function getAdminFirestore(): Firestore {
  return getFirestore(initializeFirebaseAdminApp());
}
