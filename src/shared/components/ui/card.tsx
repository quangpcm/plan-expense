import type { HTMLAttributes } from 'react';

import { cn } from '@/shared/utils/cn';

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        // TEMPORARY LEGACY COMPATIBILITY (reverted after Wave 4 review, 2026-08-25): the V2
        // target for Card is `--radius-ds-lg` (16px) + `elevation.none`, per
        // 04.StructuralComponents.md §21/§75/§121. That was implemented and then reverted — Card
        // has 58 consumers whose surrounding hierarchy (nesting, Section-vs-Card classification)
        // hasn't been reviewed yet, so changing Card's own recipe was cascading an app-wide visual
        // change ahead of that review. `--radius-card` (24px) and the original shadow are kept
        // here on purpose until Pilot/Rollout migrates each consumer's context deliberately. Do
        // NOT read this as the canonical target — it is not. Do not add a "legacy" variant prop to
        // carry this; when a consumer's context is reviewed, its Card usage should move straight to
        // the V2 recipe, not to an intermediate opt-in flag.
        'flex flex-col gap-5 rounded-[var(--radius-card)] border border-[var(--color-border-default)] bg-[color:var(--color-surface-default)] p-5 shadow-[0_18px_54px_color-mix(in_srgb,var(--color-overlay-backdrop)_18%,transparent)]',
        className,
      )}
      {...props}
    />
  );
}
