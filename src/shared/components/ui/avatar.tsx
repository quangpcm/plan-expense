'use client';

import { useState } from 'react';
import type { HTMLAttributes } from 'react';

import { cn } from '@/shared/utils/cn';
import { avatarIconMap, getAvatarToneClass, parseAvatarValue } from '@/shared/utils/avatar';

type AvatarProps = HTMLAttributes<HTMLDivElement> & {
  initials?: string;
  src?: string | null;
};

export function Avatar({ className, initials = 'PE', src, ...props }: AvatarProps) {
  const [failed, setFailed] = useState(false);
  const parsedAvatar = parseAvatarValue(src);
  const showImage = parsedAvatar.kind === 'url' && !failed;
  const toneClass = getAvatarToneClass(src);
  const AvatarIcon = parsedAvatar.kind === 'icon' ? avatarIconMap[parsedAvatar.value] : null;

  return (
    <div
      className={cn(
        'flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-full text-sm font-semibold',
        parsedAvatar.kind === 'empty'
          ? 'bg-[var(--color-surface-subtle)] text-[var(--color-text-primary)]'
          : toneClass,
        className,
      )}
      {...props}
    >
      {showImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          alt={initials}
          className="size-full object-cover"
          onError={() => setFailed(true)}
          src={parsedAvatar.value}
        />
      ) : AvatarIcon ? (
        <AvatarIcon className="size-[52%]" />
      ) : parsedAvatar.kind === 'emoji' ? (
        <span className="text-[1.35em] leading-none">{parsedAvatar.value}</span>
      ) : (
        initials
      )}
    </div>
  );
}
