import type { AuthUser } from '@/modules/auth/types/auth';
import type { UserRepository } from '@/modules/user/repositories/user.repository';
import type { UserDocument } from '@/modules/user/types/user';
import { AppError } from '@/shared/errors/app-error';
import { hashPin } from '@/shared/utils/pin-hash';

const PIN_PATTERN = /^\d{4}$/;

export class UserService {
  constructor(private readonly userRepository: UserRepository) {}

  async syncAuthUser(user: AuthUser) {
    await this.userRepository.upsertProfile({
      id: user.uid,
      displayName: user.displayName?.trim() || user.email?.split('@')[0] || 'User',
      email: user.email ?? '',
      avatarUrl: user.photoURL,
      avatarStoragePath: null,
      status: 'active',
      lastActiveAt: new Date(),
    });
  }

  watchUser(userId: string, callback: (user: UserDocument | null) => void, onError?: (error: Error) => void) {
    return this.userRepository.watchUser(userId, callback, onError);
  }

  async setPasscode(userId: string, pin: string) {
    if (!PIN_PATTERN.test(pin)) {
      throw new AppError('The PIN must be exactly 4 digits.', 'USER_PASSCODE_PIN_INVALID', 400);
    }

    const secretNumberHash = await hashPin(pin);

    await this.userRepository.setPasscode(userId, secretNumberHash);
  }

  async clearPasscode(userId: string) {
    await this.userRepository.clearPasscode(userId);
  }

  async verifyPasscode(secretNumberHash: string | null, pin: string) {
    if (!secretNumberHash) {
      return true;
    }

    if (!PIN_PATTERN.test(pin)) {
      return false;
    }

    const attemptHash = await hashPin(pin);

    return attemptHash === secretNumberHash;
  }
}

