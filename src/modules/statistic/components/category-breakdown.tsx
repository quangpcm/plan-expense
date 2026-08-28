import { getCategoryIcon } from '@/modules/category/utils/category-icon';
import { Card } from '@/shared/components/ui/card';
import { DataRow } from '@/shared/components/ui/data-row';
import { formatCurrency } from '@/shared/utils/currency';
import type { StatisticResult } from '@/modules/statistic/types/statistic';

type CategoryBreakdownProps = {
  statistic: StatisticResult;
};

export function CategoryBreakdown({ statistic }: CategoryBreakdownProps) {
  return (
    <Card>
      <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">Chi tiêu theo danh mục</h3>
      <div className="grid gap-3">
        {statistic.categoryBreakdown.map((row) => {
          const Icon = getCategoryIcon(row.icon);

          return (
            <DataRow
              className="rounded-2xl border border-[var(--color-border-default)] bg-[var(--color-surface-default)] px-4 text-sm"
              key={row.categoryId || 'none'}
              leading={
                <span className={`flex size-10 items-center justify-center rounded-full ${row.iconBgColor}`}>
                  <Icon className={`size-4 ${row.iconColor}`} />
                </span>
              }
              main={<span className="font-medium text-[var(--color-text-primary)]">{row.categoryName}</span>}
              trailing={<span className="text-[var(--color-text-secondary)]">{formatCurrency(row.totalAmount)}</span>}
            />
          );
        })}
        {statistic.categoryBreakdown.length === 0 ? (
          <div className="rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-subtle)] px-4 py-3 text-sm text-[var(--color-text-secondary)]">
            Chưa có dữ liệu danh mục để phân tích.
          </div>
        ) : null}
      </div>
    </Card>
  );
}
