'use client';

import { FirebaseAuthRepository } from '@/modules/auth/repositories/firebase-auth.repository';
import { AuthService } from '@/modules/auth/services/auth.service';
import { FirestoreUserRepository } from '@/modules/user/repositories/firestore-user.repository';
import { UserService } from '@/modules/user/services/user.service';

const userRepository = new FirestoreUserRepository();
const userService = new UserService(userRepository);
const authRepository = new FirebaseAuthRepository();

export const authService = new AuthService(authRepository, userService);

