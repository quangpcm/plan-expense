import { AppError } from '@/shared/errors/app-error';

export function mapFirebaseError(
  error: unknown,
  fallbackMessage: string,
  fallbackCode = 'FIREBASE_OPERATION_FAILED',
) {
  if (error && typeof error === 'object' && 'code' in error) {
    const firebaseCode = String(error.code);

    if (firebaseCode === 'permission-denied') {
      return new AppError(
        'Access was denied by Firebase rules. Please verify your role or project rules.',
        'FIREBASE_PERMISSION_DENIED',
        403,
      );
    }

    if (firebaseCode === 'unavailable') {
      return new AppError(
        'Firebase is temporarily unavailable. Please check your connection and try again.',
        'FIREBASE_UNAVAILABLE',
        503,
      );
    }

    if (firebaseCode === 'failed-precondition') {
      return new AppError(
        'Firebase is not ready for this operation yet. Please check the database or index setup.',
        'FIREBASE_FAILED_PRECONDITION',
        400,
      );
    }
  }

  if (error instanceof Error) {
    return new AppError(error.message, fallbackCode, 500);
  }

  return new AppError(fallbackMessage, fallbackCode, 500);
}
