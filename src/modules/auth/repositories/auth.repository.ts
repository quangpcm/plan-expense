import type { AuthUser, LoginInput } from '@/modules/auth/types/auth';

export type AuthStateCallback = (user: AuthUser | null) => void | Promise<void>;

export interface AuthRepository {
  signIn(input: LoginInput): Promise<AuthUser>;
  register(input: LoginInput & { displayName: string }): Promise<AuthUser>;
  signInWithGoogle(): Promise<AuthUser>;
  sendPasswordResetEmail(email: string): Promise<void>;
  signOut(): Promise<void>;
  watchAuthState(callback: AuthStateCallback): () => void;
}

