import { Card } from '@/shared/components/ui/card';
import { cn } from '@/shared/utils/cn';
import { formatCurrency } from '@/shared/utils/currency';

type FinanceBudgetProgressProps = {
  spent: number;
  budgetAmount: number;
};

// Ngưỡng "khoẻ mạnh" của ngân sách — dùng đúng token semantic (success/warning/danger) để
// progress bar trở thành tín hiệu cảnh báo thật, không chỉ trang trí.
function getBudgetHealthTone(usedPercent: number) {
  if (usedPercent > 100) {
    return { barClass: 'bg-[color:var(--color-danger)]', textClass: 'text-[color:var(--color-danger)]' };
  }

  if (usedPercent >= 70) {
    return { barClass: 'bg-[color:var(--color-warning)]', textClass: 'text-[color:var(--color-warning)]' };
  }

  return { barClass: 'bg-[color:var(--color-success)]', textClass: 'text-[color:var(--color-success)]' };
}

export function FinanceBudgetProgress({ spent, budgetAmount }: FinanceBudgetProgressProps) {
  const usedPercent = budgetAmount > 0 ? Math.round((spent / budgetAmount) * 100) : 0;
  const tone = getBudgetHealthTone(usedPercent);
  const remaining = budgetAmount - spent;

  return (
    <Card className="gap-3">
      <h3 className="text-lg font-semibold text-slate-950">Ngân sách</h3>
      <div className="flex items-center justify-between gap-4 text-sm">
        <div>
          <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Đã chi</p>
          <p className="mt-1 text-lg font-semibold text-slate-950">{formatCurrency(spent)}</p>
        </div>
        <div className="text-right">
          <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Ngân sách</p>
          <p className="mt-1 text-lg font-semibold text-slate-950">{formatCurrency(budgetAmount)}</p>
        </div>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
        <div className={cn('h-full rounded-full', tone.barClass)} style={{ width: `${Math.min(usedPercent, 100)}%` }} />
      </div>
      <p className={cn('text-sm font-medium', tone.textClass)}>
        {usedPercent}% ngân sách
        {remaining >= 0
          ? ` · Còn lại ${formatCurrency(remaining)}`
          : ` · Vượt ngân sách ${formatCurrency(Math.abs(remaining))}`}
      </p>
    </Card>
  );
}
