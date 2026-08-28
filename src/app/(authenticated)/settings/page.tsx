import { Card } from '@/shared/components/ui/card';
import { SectionHeading } from '@/shared/components/ui/section-heading';

export default function SettingsPage() {
  return (
    <main className="flex flex-col gap-5">
      <Card>
        <SectionHeading
          eyebrow="Settings"
          title="Settings shell is ready."
          description="Phase 1 includes the authenticated route and structure. Product settings will expand in later phases."
        />
      </Card>
    </main>
  );
}
