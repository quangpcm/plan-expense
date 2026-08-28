import type { ReactNode } from 'react';

type SectionHeadingProps = {
  // `| undefined` (not just `?`) because `exactOptionalPropertyTypes` distinguishes "prop absent"
  // from "prop present with value undefined" — Section passes these through from its own optional
  // props, which can genuinely be `undefined` at the call site, not merely omitted.
  eyebrow?: string | undefined;
  title: string;
  description?: string | undefined;
  action?: ReactNode | undefined;
};

export function SectionHeading({ eyebrow, title, description, action }: SectionHeadingProps) {
  return (
    <div className="space-y-2">
      {eyebrow ? (
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-brand-primary)]">{eyebrow}</p>
      ) : null}
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <h2 className="text-xl font-semibold text-[var(--color-text-primary)]">{title}</h2>
          {description ? <p className="text-sm leading-6 text-[var(--color-text-secondary)]">{description}</p> : null}
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
    </div>
  );
}
