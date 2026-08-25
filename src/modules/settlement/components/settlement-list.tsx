'use client';

import { useState } from 'react';
import { CheckCircle2, XCircle } from 'lucide-react';

import { ConfirmDialog } from '@/shared/components/ui/confirm-dialog';
import { DataRow } from '@/shared/components/ui/data-row';
import { formatCurrency } from '@/shared/utils/currency';
import { formatDateTime } from '@/shared/utils/date';
import { timestampToDate } from '@/shared/utils/firebase';
import type { PlanMemberDocument } from '@/modules/member/types/member';
import type { SettlementDocument } from '@/modules/settlement/types/settlement';

const VISIBLE_LIMIT = 5;

type SettlementListProps = {
  canCancel: boolean;
  isSubmitting: boolean;
  members: PlanMemberDocument[];
  onCancel: (settlement: SettlementDocument) => void;
  settlements: SettlementDocument[];
};

export function SettlementList({
  canCancel,
  isSubmitting,
  members,
  onCancel,
  settlements,
}: SettlementListProps) {
  const [showAll, setShowAll] = useState(false);
  const [pendingCancel, setPendingCancel] = useState<SettlementDocument | null>(null);

  if (settlements.length === 0) {
    return null;
  }

  const visibleSettlements = showAll ? settlements : settlements.slice(0, VISIBLE_LIMIT);
  const pendingCancelFromMember = pendingCancel
    ? members.find((member) => member.id === pendingCancel.fromMemberId)
    : undefined;
  const pendingCancelToMember = pendingCancel
    ? members.find((member) => member.id === pendingCancel.toMemberId)
    : undefined;

  return (
    <div className="grid gap-2">
      {visibleSettlements.map((settlement) => {
        const fromMember = members.find((member) => member.id === settlement.fromMemberId);
        const toMember = members.find((member) => member.id === settlement.toMemberId);
        const settledAt = timestampToDate(settlement.settledAt);
        const isCompleted = settlement.status === 'completed';

        return (
          <DataRow
            className="rounded-2xl border border-slate-200 bg-white px-4 text-sm"
            key={settlement.id}
            leading={
              isCompleted ? (
                <CheckCircle2 className="size-4 shrink-0 text-[color:var(--color-success)]" />
              ) : (
                <XCircle className="size-4 shrink-0 text-slate-400" />
              )
            }
            main={
              <div className="flex flex-wrap items-center gap-2">
                <span className={isCompleted ? 'font-medium text-slate-900' : 'font-medium text-slate-400 line-through'}>
                  {fromMember?.nickname || settlement.fromMemberId} {'->'} {toMember?.nickname || settlement.toMemberId}
                </span>
                <span className="text-slate-600">{formatCurrency(settlement.amount)}</span>
                <span className="text-xs text-slate-400">
                  {settledAt ? formatDateTime(settledAt) : 'Không rõ thời gian'}
                </span>
              </div>
            }
            trailing={
              canCancel && isCompleted ? (
                <button
                  className="shrink-0 text-xs font-medium text-slate-500 hover:text-rose-600 disabled:pointer-events-none disabled:opacity-60"
                  disabled={isSubmitting}
                  onClick={() => setPendingCancel(settlement)}
                  type="button"
                >
                  Hủy
                </button>
              ) : null
            }
          />
        );
      })}
      {!showAll && settlements.length > VISIBLE_LIMIT ? (
        <button
          className="w-fit text-sm font-medium text-[var(--color-primary)] hover:underline"
          onClick={() => setShowAll(true)}
          type="button"
        >
          Xem tất cả ({settlements.length})
        </button>
      ) : null}
      <ConfirmDialog
        confirmLabel="Hủy đối soát"
        confirmVariant="destructive"
        description={
          pendingCancel
            ? `${pendingCancelFromMember?.nickname || pendingCancel.fromMemberId} → ${pendingCancelToMember?.nickname || pendingCancel.toMemberId} · ${formatCurrency(pendingCancel.amount)}. Xác nhận đã hoàn tất trước đó sẽ bị hủy.`
            : undefined
        }
        loading={isSubmitting}
        onConfirm={() => {
          if (pendingCancel) {
            onCancel(pendingCancel);
          }

          setPendingCancel(null);
        }}
        onOpenChange={(next) => {
          if (!next) {
            setPendingCancel(null);
          }
        }}
        open={Boolean(pendingCancel)}
        title="Hủy xác nhận đối soát?"
      />
    </div>
  );
}
