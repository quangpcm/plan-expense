'use client';

import {
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
} from 'firebase/auth';

import { getFirebaseAuth } from '@/config/firebase.config';
import type { AuthRepository, AuthStateCallback } from '@/modules/auth/repositories/auth.repository';
import type { AuthUser, LoginInput } from '@/modules/auth/types/auth';
import { AppError } from '@/shared/errors/app-error';

function mapAuthUser(user: {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}): AuthUser {
  return {
    uid: user.uid,
    email: user.email,
    displayName: user.displayName,
    photoURL: user.photoURL,
  };
}

export class FirebaseAuthRepository implements AuthRepository {
  async signIn(input: LoginInput) {
    const credential = await signInWithEmailAndPassword(
      getFirebaseAuth(),
      input.email,
      input.password,
    );

    return mapAuthUser(credential.user);
  }

  async register(input: LoginInput & { displayName: string }) {
    const credential = await createUserWithEmailAndPassword(
      getFirebaseAuth(),
      input.email,
      input.password,
    );

    if (input.displayName) {
      await updateProfile(credential.user, { displayName: input.displayName });
    }

    return mapAuthUser({
      ...credential.user,
      displayName: input.displayName,
    });
  }

  async signInWithGoogle() {
    const credential = await signInWithPopup(getFirebaseAuth(), new GoogleAuthProvider());

    return mapAuthUser(credential.user);
  }

  async sendPasswordResetEmail(email: string) {
    await sendPasswordResetEmail(getFirebaseAuth(), email);
  }

  async signOut() {
    await signOut(getFirebaseAuth());
  }

  async updateDisplayName(displayName: string) {
    const currentUser = getFirebaseAuth().currentUser;

    if (!currentUser) {
      throw new AppError('You must be signed in to update your display name.', 'AUTH_NOT_SIGNED_IN', 401);
    }

    await updateProfile(currentUser, { displayName });

    return mapAuthUser({ ...currentUser, displayName });
  }

  watchAuthState(callback: AuthStateCallback) {
    return onAuthStateChanged(getFirebaseAuth(), (user) => {
      void callback(user ? mapAuthUser(user) : null);
    });
  }
}

