import { getCategoryIcon } from '@/modules/category/utils/category-icon';
import { Card } from '@/shared/components/ui/card';
import { formatCurrency } from '@/shared/utils/currency';
import type { StatisticResult } from '@/modules/statistic/types/statistic';

type CategoryBreakdownProps = {
  statistic: StatisticResult;
};

export function CategoryBreakdown({ statistic }: CategoryBreakdownProps) {
  return (
    <Card>
      <h3 className="text-lg font-semibold text-slate-950">Chi tiêu theo danh mục</h3>
      <div className="grid gap-3">
        {statistic.categoryBreakdown.map((row) => {
          const Icon = getCategoryIcon(row.icon);

          return (
            <div
              key={row.categoryId || 'none'}
              className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm"
            >
              <div className="flex items-center gap-3">
                <span className={`flex size-10 items-center justify-center rounded-full ${row.iconBgColor}`}>
                  <Icon className={`size-4 ${row.iconColor}`} />
                </span>
                <span className="font-medium text-slate-900">{row.categoryName}</span>
              </div>
              <span className="text-slate-600">{formatCurrency(row.totalAmount)}</span>
            </div>
          );
        })}
        {statistic.categoryBreakdown.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
            Chưa có dữ liệu danh mục để phân tích.
          </div>
        ) : null}
      </div>
    </Card>
  );
}
