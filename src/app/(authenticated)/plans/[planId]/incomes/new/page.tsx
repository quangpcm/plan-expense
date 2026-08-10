import { IncomeForm } from '@/modules/income/components/income-form';
import { Card } from '@/shared/components/ui/card';
import { SectionHeading } from '@/shared/components/ui/section-heading';

type CreateIncomePageProps = {
  params: Promise<{ planId: string }>;
};

export default async function CreateIncomePage({ params }: CreateIncomePageProps) {
  const { planId } = await params;

  return (
    <main className="flex flex-col gap-5">
      <Card>
        <SectionHeading
          eyebrow="Tạo khoản thu"
          title="Ghi nhận đóng góp hoặc nạp thêm vào quỹ"
          description="Khoản thu giúp theo dõi ai đã thêm tiền vào kế hoạch và được hiển thị riêng với số dư chi tiêu."
        />
      </Card>
      <Card>
        <IncomeForm mode="create" planId={planId} />
      </Card>
    </main>
  );
}
