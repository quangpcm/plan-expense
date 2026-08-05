import { CreatePlanForm } from '@/modules/plan/components/create-plan-form';
import { Breadcrumbs } from '@/shared/components/ui/breadcrumbs';
import { Card } from '@/shared/components/ui/card';
import { SectionHeading } from '@/shared/components/ui/section-heading';

export default function CreatePlanPage() {
  return (
    <main className="flex flex-col gap-5">
      <Breadcrumbs
        items={[
          { label: 'Kế hoạch', href: '/plans' },
          { label: 'Tạo kế hoạch' },
        ]}
      />
      <Card>
        <SectionHeading
          eyebrow="Tạo kế hoạch"
          title="Bắt đầu một kế hoạch dùng chung mới"
          description="Thiết lập thông tin cơ bản trước. Thành viên và khoản chi có thể được thêm ngay sau khi tạo kế hoạch."
        />
      </Card>

      <Card>
        <CreatePlanForm />
      </Card>
    </main>
  );
}
