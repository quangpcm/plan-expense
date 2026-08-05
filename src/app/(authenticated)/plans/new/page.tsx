import { CreatePlanForm } from '@/modules/plan/components/create-plan-form';
import { Card } from '@/shared/components/ui/card';
import { SectionHeading } from '@/shared/components/ui/section-heading';

export default function CreatePlanPage() {
  return (
    <main className="flex flex-col gap-5">
      <Card>
        <SectionHeading
          eyebrow="Create Plan"
          title="Start a new shared plan"
          description="Set the basic information first. Members and expenses can be added right after the plan is created."
        />
      </Card>

      <Card>
        <CreatePlanForm />
      </Card>
    </main>
  );
}

