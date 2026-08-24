import type { HTMLAttributes, ReactNode } from 'react';

import { cn } from '@/shared/utils/cn';
import { SectionHeading } from '@/shared/components/ui/section-heading';

type SectionProps = HTMLAttributes<HTMLDivElement> & {
  eyebrow?: string;
  title?: string;
  description?: string;
  action?: ReactNode;
};

/**
 * Logical grouping of related content — section rhythm and header/content relationship only.
 * Does NOT create a surface: no background, border or shadow. Use `Card` inside a Section when a
 * contained surface is actually needed (04.StructuralComponents.md §13/§20/§25).
 */
export function Section({ eyebrow, title, description, action, children, className, ...props }: SectionProps) {
  return (
    <div className={cn('flex flex-col gap-4', className)} {...props}>
      {title ? <SectionHeading action={action} description={description} eyebrow={eyebrow} title={title} /> : null}
      {children}
    </div>
  );
}
