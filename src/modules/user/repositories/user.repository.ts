import type { UserDocument, UpsertUserProfileInput } from '@/modules/user/types/user';

export interface UserRepository {
  findById(userId: string): Promise<UserDocument | null>;
  upsertProfile(input: UpsertUserProfileInput): Promise<void>;
  watchUser(userId: string, callback: (user: UserDocument | null) => void, onError?: (error: Error) => void): () => void;
  setPasscode(userId: string, secretNumberHash: string): Promise<void>;
  clearPasscode(userId: string): Promise<void>;
}

