'use client';

import { FirestoreUserRepository } from '@/modules/user/repositories/firestore-user.repository';
import { UserService } from '@/modules/user/services/user.service';

const userRepository = new FirestoreUserRepository();

export const userService = new UserService(userRepository);
