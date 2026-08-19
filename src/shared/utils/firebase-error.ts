import { AppError } from '@/shared/errors/app-error';

function getFirebaseMessage(error: unknown) {
  if (!error || typeof error !== 'object' || !('message' in error)) {
    return null;
  }

  const message = error.message;
  return typeof message === 'string' ? message : null;
}

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
      const firebaseMessage = getFirebaseMessage(error);
      const likelyMissingIndex =
        firebaseMessage?.toLowerCase().includes('index') ||
        firebaseMessage?.includes('FAILED_PRECONDITION: The query requires an index');

      return new AppError(
        likelyMissingIndex
          ? 'Firestore cần thêm index cho truy vấn này. Vui lòng tạo index được gợi ý trong Firebase Console rồi thử lại.'
          : 'Firestore chưa sẵn sàng cho thao tác này. Vui lòng kiểm tra database đã được tạo đầy đủ và cấu hình hiện tại.',
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
