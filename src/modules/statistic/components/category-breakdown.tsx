import { Card } from '@/shared/components/ui/card';
import { formatCurrency } from '@/shared/utils/currency';
import type { StatisticResult } from '@/modules/statistic/types/statistic';

type CategoryBreakdownProps = {
  statistic: StatisticResult;
};

export function CategoryBreakdown({ statistic }: CategoryBreakdownProps) {
  return (
    <Card>
      <div className="space-y-1">
        <h3 className="text-lg font-semibold text-slate-950">Phân bổ theo danh mục</h3>
        <p className="text-sm leading-6 text-slate-600">
          Danh mục vẫn giữ vai trò lớp phân tích phụ bên trong từng giai đoạn chi tiêu của kế hoạch.
        </p>
      </div>
      <div className="grid gap-3">
        {statistic.categoryBreakdown.map((row) => (
          <div
            key={row.categoryId || 'none'}
            className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm"
          >
            <span className="font-medium text-slate-900">{row.categoryName}</span>
            <span className="text-slate-600">{formatCurrency(row.totalAmount)}</span>
          </div>
        ))}
        {statistic.categoryBreakdown.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
            Chưa có dữ liệu danh mục để phân tích.
          </div>
        ) : null}
      </div>
    </Card>
  );
}
