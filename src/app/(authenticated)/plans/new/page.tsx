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
          eyebrow="Kế hoạch mới"
          title="Tạo kế hoạch mới"
          description="Nhập thông tin cơ bản để bắt đầu."
        />
      </Card>

      <Card>
        <CreatePlanForm />
      </Card>
    </main>
  );
}
