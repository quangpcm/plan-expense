import { ArrowRight } from 'lucide-react';
import type { MouseEventHandler } from 'react';

import { Avatar } from '@/shared/components/ui/avatar';
import { Button } from '@/shared/components/ui/button';
import { formatCurrency } from '@/shared/utils/currency';
import type { PlanMemberDocument } from '@/modules/member/types/member';
import type { SettlementSuggestion } from '@/modules/settlement/types/settlement';

type SettlementSuggestionCardProps = {
  canConfirm: boolean;
  isSubmitting: boolean;
  members: PlanMemberDocument[];
  onConfirm: MouseEventHandler<HTMLButtonElement>;
  suggestion: SettlementSuggestion;
};

export function SettlementSuggestionCard({
  canConfirm,
  isSubmitting,
  members,
  onConfirm,
  suggestion,
}: SettlementSuggestionCardProps) {
  const fromMember = members.find((member) => member.id === suggestion.fromMemberId);
  const toMember = members.find((member) => member.id === suggestion.toMemberId);
  const fromName = fromMember?.nickname || suggestion.fromMemberId;
  const toName = toMember?.nickname || suggestion.toMemberId;

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3">
      <div className="flex min-w-0 items-center gap-2 text-sm">
        <Avatar
          className="size-8 text-xs"
          initials={fromName.slice(0, 2).toUpperCase()}
          src={fromMember?.avatarUrl ?? null}
        />
        <span className="truncate font-medium text-slate-900">{fromName}</span>
        <ArrowRight className="size-4 shrink-0 text-slate-400" />
        <Avatar
          className="size-8 text-xs"
          initials={toName.slice(0, 2).toUpperCase()}
          src={toMember?.avatarUrl ?? null}
        />
        <span className="truncate font-medium text-slate-900">{toName}</span>
        <span className="ml-1 shrink-0 font-semibold text-slate-950">{formatCurrency(suggestion.amount)}</span>
      </div>
      {canConfirm ? (
        <Button className="shrink-0" disabled={isSubmitting} onClick={onConfirm} size="sm">
          {isSubmitting ? 'Đang lưu...' : 'Xác nhận đã chuyển'}
        </Button>
      ) : null}
    </div>
  );
}
