import type { Timestamp } from 'firebase/firestore';

export type UserStatus = 'active' | 'disabled';

export type UserDocument = {
  id: string;
  displayName: string;
  email: string;
  avatarUrl: string | null;
  avatarStoragePath: string | null;
  status: UserStatus;
  secretNumberHash: string | null;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  lastActiveAt: Timestamp | null;
};

export type UpsertUserProfileInput = {
  id: string;
  displayName: string;
  email: string;
  avatarUrl: string | null;
  avatarStoragePath: string | null;
  status: UserStatus;
  lastActiveAt: Date | null;
};

