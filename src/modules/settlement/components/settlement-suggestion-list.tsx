import { AuthFormMessage } from '@/modules/auth/components/auth-form-message';
import type { PlanMemberDocument } from '@/modules/member/types/member';
import type { SettlementSuggestion } from '@/modules/settlement/types/settlement';
import { SettlementSuggestionCard } from '@/modules/settlement/components/settlement-suggestion-card';
import { Card } from '@/shared/components/ui/card';
import { SectionHeading } from '@/shared/components/ui/section-heading';
import { formatCurrency } from '@/shared/utils/currency';

type SettlementSuggestionListProps = {
  canConfirm: boolean;
  errorMessage: string | null;
  isSubmitting: boolean;
  members: PlanMemberDocument[];
  message: string | null;
  onConfirm: (suggestion: SettlementSuggestion) => void;
  pendingAmount: number;
  settledAmount: number;
  suggestions: SettlementSuggestion[];
};

export function SettlementSuggestionList({
  canConfirm,
  errorMessage,
  isSubmitting,
  members,
  message,
  onConfirm,
  pendingAmount,
  settledAmount,
  suggestions,
}: SettlementSuggestionListProps) {
  const totalToSettle = pendingAmount + settledAmount;
  const settledPercent = totalToSettle > 0 ? Math.round((settledAmount / totalToSettle) * 100) : 0;

  return (
    <Card className="gap-4">
      <SectionHeading
        eyebrow="Đối soát"
        title="Ai cần chuyển cho ai?"
        description="Các khoản chuyển đề xuất để cân bằng chi phí giữa các thành viên."
      />
      {errorMessage ? <AuthFormMessage message={errorMessage} type="error" /> : null}
      {message ? <AuthFormMessage message={message} type="success" /> : null}
      {suggestions.length > 0 ? (
        <>
          <div className="space-y-1.5">
            <p className="text-sm text-slate-600">
              Còn {suggestions.length} khoản cần chuyển · {formatCurrency(pendingAmount)}
            </p>
            <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-[color:var(--color-success)]"
                style={{ width: `${settledPercent}%` }}
              />
            </div>
          </div>
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
        </>
      ) : (
        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
          Chi phí giữa các thành viên đã cân bằng, chưa cần chuyển khoản nào.
        </div>
      )}
    </Card>
  );
}
