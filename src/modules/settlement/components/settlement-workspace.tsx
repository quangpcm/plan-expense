'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

import { AuthFormMessage } from '@/modules/auth/components/auth-form-message';
import type { PlanMemberDocument } from '@/modules/member/types/member';
import { SettlementList } from '@/modules/settlement/components/settlement-list';
import { SettlementProgressSummary } from '@/modules/settlement/components/settlement-progress-summary';
import { SettlementSuggestionCard } from '@/modules/settlement/components/settlement-suggestion-card';
import type { SettlementDocument, SettlementSuggestion } from '@/modules/settlement/types/settlement';
import { computeSettlementProgress } from '@/modules/settlement/utils/settlement-progress';
import type { StatisticResult, MemberBalanceRow } from '@/modules/statistic/types/statistic';
import { Avatar } from '@/shared/components/ui/avatar';
import { cn } from '@/shared/utils/cn';
import { formatCurrency } from '@/shared/utils/currency';

type SettlementWorkspaceProps = {
  canConfirm: boolean;
  completedSettlementsCount: number;
  errorMessage: string | null;
  isSubmitting: boolean;
  members: PlanMemberDocument[];
  message: string | null;
  onCancel: (settlement: SettlementDocument) => void;
  onConfirm: (suggestion: SettlementSuggestion) => void;
  onOpenFullStatistics: () => void;
  requiresFundAllocation: boolean;
  settlements: SettlementDocument[];
  statistic: StatisticResult;
  suggestions: SettlementSuggestion[];
};

// Balance row rút gọn cho dialog — chỉ balance cuối cùng của từng người, KHÔNG
// hiện Đóng góp ròng/Phải chịu/Tự thanh toán/Nạp quỹ như MemberBalanceTable ở
// Statistics. Đó là explanation layer, không phải thứ cần khi đang xử lý đối
// soát. Màu đỏ/xanh chỉ dùng cho balance của riêng từng member (không phải
// tổng hợp) — nhất quán với quy ước chung của app.
function MemberBalanceRowItem({ row }: { row: MemberBalanceRow }) {
  const willReceive = row.adjustedBalance >= 0;

  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-2.5">
      <div className="flex min-w-0 items-center gap-2.5">
        <Avatar
          className="size-8 text-xs"
          initials={row.nickname.slice(0, 2).toUpperCase()}
          src={row.avatarUrl ?? null}
        />
        <span className="truncate font-medium text-slate-900">{row.nickname}</span>
      </div>
      <div className="flex shrink-0 flex-col items-end">
        <span
          className={cn(
            'text-sm font-semibold',
            willReceive ? 'text-[color:var(--color-success)]' : 'text-[color:var(--color-danger)]',
          )}
        >
          {willReceive ? '+' : '−'}
          {formatCurrency(Math.abs(row.adjustedBalance))}
        </span>
        <span
          className={cn(
            'text-[11px]',
            willReceive ? 'text-[color:var(--color-success)]' : 'text-[color:var(--color-danger)]',
          )}
        >
          {willReceive ? 'Còn được nhận' : 'Cần trả'}
        </span>
      </div>
    </div>
  );
}

// Nội dung dialog "Đối soát thành viên" — mở từ CTA "Xem đối soát →" ở
// Overview. Cố tình KHÔNG phải một bản thu nhỏ của "Thống kê tài chính":
// chỉ trả lời "tình trạng hiện tại → vì sao → cần làm gì", với "Ai chuyển
// cho ai?" là hero content (có thể xác nhận ngay tại đây). Lịch sử đã hoàn
// thành là phần phụ, gấp mặc định. Statistics đầy đủ vẫn tới được qua CTA
// phụ ở cuối.
export function SettlementWorkspace({
  canConfirm,
  completedSettlementsCount,
  errorMessage,
  isSubmitting,
  members,
  message,
  onCancel,
  onConfirm,
  onOpenFullStatistics,
  requiresFundAllocation,
  settlements,
  statistic,
  suggestions,
}: SettlementWorkspaceProps) {
  const [showHistory, setShowHistory] = useState(false);
  const progress = computeSettlementProgress(
    statistic.memberBalances,
    suggestions,
    statistic.overview,
    requiresFundAllocation,
    completedSettlementsCount,
  );

  return (
    <div className="space-y-5">
      {errorMessage ? <AuthFormMessage message={errorMessage} type="error" /> : null}
      {message ? <AuthFormMessage message={message} type="success" /> : null}

      <SettlementProgressSummary progress={progress} />

      <div className="space-y-2">
        <h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Cân đối</h3>
        <div className="grid gap-2">
          {statistic.memberBalances.map((row) => (
            <MemberBalanceRowItem key={row.memberId} row={row} />
          ))}
        </div>
      </div>

      {suggestions.length > 0 ? (
        <div className="space-y-2">
          <h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Cần đối soát</h3>
          <div className="grid gap-2">
            {suggestions.map((suggestion) => (
              <SettlementSuggestionCard
                canConfirm={canConfirm}
                isSubmitting={isSubmitting}
                key={`${suggestion.fromMemberId}-${suggestion.toMemberId}-${suggestion.amount}`}
                members={members}
                onConfirm={() => onConfirm(suggestion)}
                suggestion={suggestion}
              />
            ))}
          </div>
        </div>
      ) : null}

      {settlements.length > 0 ? (
        <div className="space-y-2">
          <button
            className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-slate-400 transition hover:text-slate-600"
            onClick={() => setShowHistory((current) => !current)}
            type="button"
          >
            Đã hoàn thành ({completedSettlementsCount})
            <ChevronDown className={cn('size-3.5 transition-transform', showHistory ? 'rotate-180' : '')} />
          </button>
          {showHistory ? (
            <SettlementList
              canCancel={canConfirm}
              isSubmitting={isSubmitting}
              members={members}
              onCancel={onCancel}
              settlements={settlements}
            />
          ) : null}
        </div>
      ) : null}

      <button
        className="text-sm font-medium text-[var(--color-primary)] transition hover:text-[color:color-mix(in_srgb,var(--color-primary)_78%,black)]"
        onClick={onOpenFullStatistics}
        type="button"
      >
        Xem phân tích tài chính đầy đủ ➔
      </button>
    </div>
  );
}
