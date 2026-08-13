'use client';

import { FirebaseAuthRepository } from '@/modules/auth/repositories/firebase-auth.repository';
import { AuthService } from '@/modules/auth/services/auth.service';
import { userService } from '@/modules/user/services';

const authRepository = new FirebaseAuthRepository();

export const authService = new AuthService(authRepository, userService);

