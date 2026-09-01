import { AlertTriangle, CheckCircle2 } from 'lucide-react';

import { formatCurrency } from '@/shared/utils/currency';
import type { SettlementProgress } from '@/modules/settlement/utils/settlement-progress';

type SettlementProgressSummaryProps = {
  progress: SettlementProgress;
};

export function SettlementProgressSummary({ progress }: SettlementProgressSummaryProps) {
  if (progress.state === 'needs-fund-allocation') {
    return (
      <div className="flex items-start gap-2 rounded-2xl border border-[color:var(--color-warning)]/30 bg-[color:var(--color-warning)]/10 px-4 py-3 text-sm text-[var(--color-text-secondary)]">
        <AlertTriangle className="mt-0.5 size-4 shrink-0 text-[color:var(--color-warning)]" />
        <span>Quỹ chung còn tiền chưa phân bổ — hoàn tất trước khi đối soát.</span>
      </div>
    );
  }

  if (progress.state === 'balanced') {
    return (
      <div className="flex items-center gap-2 rounded-2xl border border-[color:var(--color-success)]/25 bg-[color:var(--color-success)]/10 px-4 py-3 text-sm text-[color:var(--color-success)]">
        <CheckCircle2 className="size-4 shrink-0" />
        <span className="font-medium">Đã cân bằng — không còn khoản nào cần đối soát.</span>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div>
        <p className="text-sm text-[var(--color-text-secondary)]">
          {progress.isFirstRound ? '' : 'Còn '}
          <span className="font-semibold text-[var(--color-text-primary)]">{progress.pendingCount} khoản</span> cần đối soát
        </p>
        <p className="text-lg font-semibold text-[var(--color-text-primary)]">{formatCurrency(progress.pendingAmount)}</p>
      </div>
      <p className="text-xs text-[var(--color-text-muted)]">
        {progress.debtorCount} người cần trả · {progress.creditorCount} người được nhận
      </p>
      <div>
        <div className="flex items-baseline justify-between gap-2 text-xs">
          <span className="text-[var(--color-text-muted)]">Đã đối soát</span>
          <span className="font-medium text-[var(--color-text-secondary)]">
            {progress.completedCount} / {progress.totalCount}
          </span>
        </div>
        <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-[var(--color-surface-subtle)]">
          <div
            className="h-full rounded-full bg-[color:var(--color-success)]"
            style={{ width: `${progress.completedPercent}%` }}
          />
        </div>
      </div>
    </div>
  );
}
