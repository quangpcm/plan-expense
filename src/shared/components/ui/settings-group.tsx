import type { ReactNode } from 'react';

import { Card } from '@/shared/components/ui/card';

type SettingsGroupProps = {
  title: string;
  children: ReactNode;
};

export function SettingsGroup({ title, children }: SettingsGroupProps) {
  return (
    <div className="space-y-2">
      <p className="px-1 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-brand-primary)]">{title}</p>
      <Card className="gap-0 divide-y divide-[var(--color-border-subtle)] p-0">{children}</Card>
    </div>
  );
}
