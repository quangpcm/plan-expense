'use client';

import { useState } from 'react';
import type { HTMLAttributes } from 'react';

import { cn } from '@/shared/utils/cn';

type AvatarProps = HTMLAttributes<HTMLDivElement> & {
  initials?: string;
  src?: string | null;
};

export function Avatar({ className, initials = 'PE', src, ...props }: AvatarProps) {
  const [failed, setFailed] = useState(false);
  const showImage = Boolean(src) && !failed;

  return (
    <div
      className={cn(
        'flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-slate-950 text-sm font-semibold text-white',
        className,
      )}
      {...props}
    >
      {showImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img alt={initials} className="size-full object-cover" onError={() => setFailed(true)} src={src ?? undefined} />
      ) : (
        initials
      )}
    </div>
  );
}
