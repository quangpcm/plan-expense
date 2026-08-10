import { AppError } from '@/shared/errors/app-error';
import type { AuthRepository } from '@/modules/auth/repositories/auth.repository';
import type {
  AuthUser,
  ForgotPasswordInput,
  LoginInput,
  RegisterInput,
} from '@/modules/auth/types/auth';
import type { UserService } from '@/modules/user/services/user.service';

export class AuthService {
  constructor(
    private readonly authRepository: AuthRepository,
    private readonly userService: UserService,
  ) {}

  async login(input: LoginInput) {
    const user = await this.authRepository.signIn(input);
    await this.userService.syncAuthUser(user);
    return user;
  }

  async register(input: RegisterInput) {
    if (input.password !== input.confirmPassword) {
      throw new AppError('Passwords do not match.', 'AUTH_PASSWORD_MISMATCH', 400);
    }

    const user = await this.authRepository.register({
      email: input.email,
      password: input.password,
      displayName: input.displayName,
    });

    await this.userService.syncAuthUser(user);
    return user;
  }

  async loginWithGoogle() {
    const user = await this.authRepository.signInWithGoogle();
    await this.userService.syncAuthUser(user);
    return user;
  }

  async sendPasswordReset(input: ForgotPasswordInput) {
    await this.authRepository.sendPasswordResetEmail(input.email);
  }

  async logout() {
    await this.authRepository.signOut();
  }

  async updateDisplayName(displayName: string) {
    const user = await this.authRepository.updateDisplayName(displayName);
    await this.userService.syncAuthUser(user);
    return user;
  }

  watchAuthState(callback: (user: AuthUser | null) => void | Promise<void>) {
    return this.authRepository.watchAuthState(callback);
  }
}

