'use client';

import { Settings } from 'lucide-react';

import type { WeddingGuestGroupDocument } from '@/modules/wedding-guest/types/wedding-guest-group';
import { Card } from '@/shared/components/ui/card';
import { SectionHeading } from '@/shared/components/ui/section-heading';
import { cn } from '@/shared/utils/cn';

type WeddingGuestGroupNavProps = {
  groups: WeddingGuestGroupDocument[];
  activeGroupId: string | null;
  onSelectGroup: (groupId: string | null) => void;
  canManage: boolean;
  onManageGroups: () => void;
};

const CHIP_CLASS =
  'flex min-h-8 shrink-0 items-center rounded-full px-3 text-xs font-medium transition lg:min-h-9 lg:justify-start lg:px-4 lg:text-sm';

export function WeddingGuestGroupNav({
  groups,
  activeGroupId,
  onSelectGroup,
  canManage,
  onManageGroups,
}: WeddingGuestGroupNavProps) {
  return (
    <Card>
      <SectionHeading eyebrow="Nhóm khách" title="Chọn nhóm/tiệc" />
      <div className="flex flex-wrap items-center gap-1.5 lg:flex-col lg:flex-nowrap lg:items-stretch lg:gap-2">
        <button
          className={cn(
            CHIP_CLASS,
            activeGroupId === null
              ? 'bg-[var(--color-brand-primary)] text-[var(--color-brand-foreground)]'
              : 'bg-[var(--color-surface-subtle)] text-[var(--color-text-secondary)]',
          )}
          onClick={() => onSelectGroup(null)}
          type="button"
        >
          Tất cả khách
        </button>
        {groups.map((group) => (
          <button
            className={cn(
              CHIP_CLASS,
              activeGroupId === group.id
                ? 'bg-[var(--color-brand-primary)] text-[var(--color-brand-foreground)]'
                : 'bg-[var(--color-surface-subtle)] text-[var(--color-text-secondary)]',
            )}
            key={group.id}
            onClick={() => onSelectGroup(group.id)}
            type="button"
          >
            {group.name}
          </button>
        ))}
        {canManage ? (
          <button
            className={cn(
              CHIP_CLASS,
              'gap-1.5 bg-[var(--color-surface-subtle)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-selected)] lg:gap-2',
            )}
            onClick={onManageGroups}
            type="button"
          >
            <Settings className="size-3.5 lg:size-4" />
            Quản lý nhóm/tiệc
          </button>
        ) : null}
      </div>
    </Card>
  );
}
