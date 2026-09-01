import type { PlanMemberDocument } from '@/modules/member/types/member';
import { sortMembersForDisplay } from '@/modules/member/utils/sort-members-for-display';
import { Avatar } from '@/shared/components/ui/avatar';
import { cn } from '@/shared/utils/cn';

type MemberAvatarStackProps = {
  members: PlanMemberDocument[];
  maxVisible?: number;
};

export function MemberAvatarStack({ members, maxVisible = 4 }: MemberAvatarStackProps) {
  const sorted = sortMembersForDisplay(members.filter((member) => member.status === 'active'));
  const hasOverflow = sorted.length > maxVisible;
  const visibleCount = hasOverflow ? maxVisible - 1 : sorted.length;
  const visibleMembers = sorted.slice(0, visibleCount);
  const remainingCount = sorted.length - visibleCount;

  if (sorted.length === 0) {
    return null;
  }

  return (
    <div className="flex items-center">
      {visibleMembers.map((member, index) => (
        <Avatar
          className={cn('size-8 sm:size-9 text-xs ring-2 ring-[var(--color-surface-page)]', index > 0 && '-ml-3')}
          initials={member.nickname.slice(0, 2).toUpperCase()}
          key={member.id}
          src={member.avatarUrl}
        />
      ))}
      {hasOverflow ? (
        <div
          className={cn(
            'flex size-9 shrink-0 items-center justify-center rounded-full bg-[var(--color-surface-overlay)] text-xs font-semibold text-[var(--color-text-secondary)] ring-2 ring-[var(--color-surface-page)]',
            visibleMembers.length > 0 && '-ml-3',
          )}
        >
          +{remainingCount}
        </div>
      ) : null}
    </div>
  );
}
