import { RouteLoadingScreen } from '@/shared/components/layout/route-loading-screen';

export default function Loading() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-4 py-6 sm:px-6 lg:px-8">
      <RouteLoadingScreen
        eyebrow="Plan Expense"
        title="Đang mở không gian làm việc"
        description="Mọi dữ liệu cần thiết đang được nạp để bạn vào đúng màn hình mong muốn."
      />
    </main>
  );
}
