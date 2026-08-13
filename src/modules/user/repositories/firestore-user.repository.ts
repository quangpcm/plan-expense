'use client';

import {
  Timestamp,
  doc,
  getDoc,
  onSnapshot,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore';

import { getFirebaseFirestore } from '@/config/firebase.config';
import type { UserRepository } from '@/modules/user/repositories/user.repository';
import type { UserDocument, UpsertUserProfileInput } from '@/modules/user/types/user';

export class FirestoreUserRepository implements UserRepository {
  async findById(userId: string) {
    const snapshot = await getDoc(doc(getFirebaseFirestore(), 'users', userId));

    if (!snapshot.exists()) {
      return null;
    }

    return snapshot.data() as UserDocument;
  }

  async upsertProfile(input: UpsertUserProfileInput) {
    const reference = doc(getFirebaseFirestore(), 'users', input.id);
    const existingSnapshot = await getDoc(reference);

    const payload = {
      displayName: input.displayName,
      email: input.email,
      avatarUrl: input.avatarUrl,
      avatarStoragePath: input.avatarStoragePath,
      status: input.status,
      updatedAt: serverTimestamp(),
      lastActiveAt: input.lastActiveAt ? Timestamp.fromDate(input.lastActiveAt) : null,
    };

    if (!existingSnapshot.exists()) {
      await setDoc(reference, {
        id: input.id,
        ...payload,
        secretNumberHash: null,
        createdAt: serverTimestamp(),
      });

      return;
    }

    await setDoc(reference, payload, { merge: true });
  }

  watchUser(userId: string, callback: (user: UserDocument | null) => void, onError?: (error: Error) => void) {
    return onSnapshot(
      doc(getFirebaseFirestore(), 'users', userId),
      (snapshot) => {
        callback(snapshot.exists() ? (snapshot.data() as UserDocument) : null);
      },
      (error) => {
        onError?.(error);
      },
    );
  }

  async setPasscode(userId: string, secretNumberHash: string) {
    await updateDoc(doc(getFirebaseFirestore(), 'users', userId), {
      secretNumberHash,
      updatedAt: serverTimestamp(),
    });
  }

  async clearPasscode(userId: string) {
    await updateDoc(doc(getFirebaseFirestore(), 'users', userId), {
      secretNumberHash: null,
      updatedAt: serverTimestamp(),
    });
  }
}

