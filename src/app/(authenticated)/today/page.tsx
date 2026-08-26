import { Card } from '@/shared/components/ui/card';
import { SectionHeading } from '@/shared/components/ui/section-heading';

export default function TodayPage() {
  return (
    <main className="flex flex-col gap-5">
      <Card>
        <SectionHeading
          eyebrow="Hôm nay"
          title="Trang Hôm nay sắp ra mắt."
          description="Đây là placeholder cho route Hôm nay. Nội dung dashboard sẽ được triển khai ở giai đoạn sau."
        />
      </Card>
    </main>
  );
}
