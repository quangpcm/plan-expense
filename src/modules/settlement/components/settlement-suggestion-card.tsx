import type { MouseEventHandler } from 'react';

import { Button } from '@/shared/components/ui/button';
import { Card } from '@/shared/components/ui/card';
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

  return (
    <Card className="gap-4 border-slate-200 bg-slate-50 shadow-none">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <p className="text-base font-semibold text-slate-950">
            {fromMember?.nickname || suggestion.fromMemberId} {'->'} {toMember?.nickname || suggestion.toMemberId}
          </p>
          <p className="text-sm text-slate-600">Suggested transfer to settle the current adjusted balance.</p>
        </div>
        <p className="text-xl font-semibold text-slate-950">{formatCurrency(suggestion.amount)}</p>
      </div>
      {canConfirm ? (
        <div className="flex justify-end">
          <Button disabled={isSubmitting} onClick={onConfirm}>
            {isSubmitting ? 'Saving settlement...' : 'Da Thanh Toan'}
          </Button>
        </div>
      ) : null}
    </Card>
  );
}
