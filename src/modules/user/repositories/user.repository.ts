import type { UserDocument, UpsertUserProfileInput } from '@/modules/user/types/user';

export interface UserRepository {
  findById(userId: string): Promise<UserDocument | null>;
  upsertProfile(input: UpsertUserProfileInput): Promise<void>;
}

