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
          eyebrow="Create Income"
          title="Record a contribution or fund top-up"
          description="Income tracks who added money into the plan and is shown separately from expense balance."
        />
      </Card>
      <Card>
        <IncomeForm planId={planId} />
      </Card>
    </main>
  );
}

