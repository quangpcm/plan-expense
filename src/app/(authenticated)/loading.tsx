import { RouteLoadingScreen } from '@/shared/components/layout/route-loading-screen';

export default function AuthenticatedLoading() {
  return (
    <div className="py-2">
      <RouteLoadingScreen
        eyebrow="Đang chuyển màn"
        title="Chuẩn bị nội dung tiếp theo"
        description="App đang tải tài nguyên cho màn mới, bạn sẽ vào ngay khi mọi thứ sẵn sàng."
      />
    </div>
  );
}
