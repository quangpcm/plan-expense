import { useState } from 'react';
import { ArrowRight } from 'lucide-react';

import { Avatar } from '@/shared/components/ui/avatar';
import { Button } from '@/shared/components/ui/button';
import { ConfirmDialog } from '@/shared/components/ui/confirm-dialog';
import { formatCurrency } from '@/shared/utils/currency';
import type { PlanMemberDocument } from '@/modules/member/types/member';
import type { SettlementSuggestion } from '@/modules/settlement/types/settlement';

type SettlementSuggestionCardProps = {
  canConfirm: boolean;
  isSubmitting: boolean;
  members: PlanMemberDocument[];
  onConfirm: () => void;
  suggestion: SettlementSuggestion;
};

export function SettlementSuggestionCard({
  canConfirm,
  isSubmitting,
  members,
  onConfirm,
  suggestion,
}: SettlementSuggestionCardProps) {
  const [showConfirm, setShowConfirm] = useState(false);
  const fromMember = members.find((member) => member.id === suggestion.fromMemberId);
  const toMember = members.find((member) => member.id === suggestion.toMemberId);
  const fromName = fromMember?.nickname || suggestion.fromMemberId;
  const toName = toMember?.nickname || suggestion.toMemberId;

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-default)] px-4 py-3">
      <div className="flex min-w-0 items-center gap-2 text-sm">
        <Avatar
          className="size-8 text-xs"
          initials={fromName.slice(0, 2).toUpperCase()}
          src={fromMember?.avatarUrl ?? null}
        />
        <span className="truncate font-medium text-[var(--color-text-primary)]">{fromName}</span>
        <ArrowRight className="size-4 shrink-0 text-[var(--color-text-muted)]" />
        <Avatar
          className="size-8 text-xs"
          initials={toName.slice(0, 2).toUpperCase()}
          src={toMember?.avatarUrl ?? null}
        />
        <span className="truncate font-medium text-[var(--color-text-primary)]">{toName}</span>
        <span className="ml-1 shrink-0 font-semibold text-[var(--color-text-primary)]">{formatCurrency(suggestion.amount)}</span>
      </div>
      {canConfirm ? (
        <Button className="shrink-0" disabled={isSubmitting} onClick={() => setShowConfirm(true)} size="sm">
          {isSubmitting ? 'Đang lưu...' : 'Xác nhận đã chuyển'}
        </Button>
      ) : null}
      <ConfirmDialog
        confirmLabel="Xác nhận"
        confirmVariant="default"
        description={`${fromName} → ${toName} · ${formatCurrency(suggestion.amount)}. Khoản chuyển này sẽ được ghi nhận là đã hoàn tất.`}
        loading={isSubmitting}
        onConfirm={() => {
          onConfirm();
          setShowConfirm(false);
        }}
        onOpenChange={setShowConfirm}
        open={showConfirm}
        title="Xác nhận đã chuyển khoản?"
      />
    </div>
  );
}
