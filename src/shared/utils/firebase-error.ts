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
        'Bạn không có quyền truy cập. Vui lòng kiểm tra vai trò hoặc Firebase Rules.',
        'FIREBASE_PERMISSION_DENIED',
        403,
      );
    }

    if (firebaseCode === 'unavailable') {
      return new AppError(
        'Firebase đang tạm thời không khả dụng. Vui lòng kiểm tra kết nối và thử lại.',
        'FIREBASE_UNAVAILABLE',
        503,
      );
    }

    if (firebaseCode === 'failed-precondition') {
      return new AppError(
        'Firebase chưa sẵn sàng cho thao tác này. Vui lòng kiểm tra database hoặc cấu hình index.',
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
