import { ExpenseForm } from '@/modules/expense/components/expense-form';
import { Card } from '@/shared/components/ui/card';
import { SectionHeading } from '@/shared/components/ui/section-heading';

type CreateExpensePageProps = {
  params: Promise<{ planId: string }>;
};

export default async function CreateExpensePage({ params }: CreateExpensePageProps) {
  const { planId } = await params;

  return (
    <main className="flex flex-col gap-5">
      <Card>
        <SectionHeading
          eyebrow="Tạo khoản chi"
          title="Thêm khoản chi mới chỉ trong vài giây"
          description="Thiết lập mặc định sẽ dùng tất cả thành viên đang hoạt động, chia đều và lấy thời gian hiện tại để nhập nhanh."
        />
      </Card>
      <Card>
        <ExpenseForm mode="create" planId={planId} />
      </Card>
    </main>
  );
}
