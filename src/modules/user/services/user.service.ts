import type { AuthUser } from '@/modules/auth/types/auth';
import type { UserRepository } from '@/modules/user/repositories/user.repository';

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
}

