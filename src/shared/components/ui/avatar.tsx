import type { HTMLAttributes } from 'react';

import { cn } from '@/shared/utils/cn';

type AvatarProps = HTMLAttributes<HTMLDivElement> & {
  initials?: string;
};

export function Avatar({ className, initials = 'PE', ...props }: AvatarProps) {
  return (
    <div
      className={cn(
        'flex size-11 items-center justify-center rounded-full bg-slate-950 text-sm font-semibold text-white',
        className,
      )}
      {...props}
    >
      {initials}
    </div>
  );
}

