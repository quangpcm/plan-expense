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
          eyebrow="Create Expense"
          title="Add a new expense in seconds"
          description="The default setup uses all active members, equal split, and the current time to keep entry fast."
        />
      </Card>
      <Card>
        <ExpenseForm mode="create" planId={planId} />
      </Card>
    </main>
  );
}

