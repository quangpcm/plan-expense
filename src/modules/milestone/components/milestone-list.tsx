import { ArrowDown, ArrowUp, PencilLine } from 'lucide-react';

import type { MilestoneDocument } from '@/modules/milestone/types/milestone';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { Card } from '@/shared/components/ui/card';
import { formatCurrency } from '@/shared/utils/currency';
import { cn } from '@/shared/utils/cn';

type MilestoneListProps = {
  milestones: MilestoneDocument[];
  selectedMilestoneId: string | null;
  canManagePlan: boolean;
  isSubmitting: boolean;
  onSelect: (milestoneId: string) => void;
  onMoveUp: (milestone: MilestoneDocument) => void;
  onMoveDown: (milestone: MilestoneDocument) => void;
  onEdit: (milestone: MilestoneDocument) => void;
};

const milestoneStatusLabel: Record<MilestoneDocument['status'], string> = {
  upcoming: 'Sắp tới',
  in_progress: 'Đang diễn ra',
  completed: 'Hoàn thành',
  cancelled: 'Đã hủy',
};

export function MilestoneList({
  milestones,
  selectedMilestoneId,
  canManagePlan,
  isSubmitting,
  onSelect,
  onMoveUp,
  onMoveDown,
  onEdit,
}: MilestoneListProps) {
  if (milestones.length === 0) {
    return (
      <Card className="border-slate-200 bg-slate-50 shadow-none">
        <p className="text-sm leading-6 text-slate-600">
          Chưa có mốc kế hoạch nào. Hãy tạo mốc đầu tiên để bắt đầu tổ chức kế hoạch theo giai đoạn.
        </p>
      </Card>
    );
  }

  return (
    <div className="grid gap-3">
      {milestones.map((milestone, index) => {
        const isSelected = milestone.id === selectedMilestoneId;
        const progress =
          milestone.todoCount > 0 ? Math.round((milestone.completedTodoCount / milestone.todoCount) * 100) : 0;

        return (
          <button
            className={cn(
              'w-full rounded-[28px] border p-0 text-left transition',
              isSelected
                ? 'border-slate-950 bg-slate-950 text-white shadow-[0_18px_50px_rgba(15,23,42,0.18)]'
                : 'border-slate-200 bg-white text-slate-950 hover:border-slate-300',
            )}
            key={milestone.id}
            onClick={() => onSelect(milestone.id)}
            type="button"
          >
            <div className="flex flex-col gap-4 p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <p className="text-lg font-semibold">{milestone.title}</p>
                  <p className={cn('text-sm', isSelected ? 'text-slate-200' : 'text-slate-600')}>
                    {milestone.description || 'Chưa có mô tả'}
                  </p>
                </div>
                <Badge variant={milestone.status === 'completed' ? 'success' : milestone.status === 'cancelled' ? 'neutral' : 'info'}>
                  {milestoneStatusLabel[milestone.status]}
                </Badge>
              </div>
              <div className="grid grid-cols-3 gap-3 text-sm">
                <div>
                  <p className={cn('text-xs uppercase tracking-[0.16em]', isSelected ? 'text-slate-400' : 'text-slate-400')}>
                    Đã chi
                  </p>
                  <p className="mt-1 font-medium">{formatCurrency(milestone.totalExpense)}</p>
                </div>
                <div>
                  <p className={cn('text-xs uppercase tracking-[0.16em]', isSelected ? 'text-slate-400' : 'text-slate-400')}>
                    Công việc
                  </p>
                  <p className="mt-1 font-medium">
                    {milestone.completedTodoCount}/{milestone.todoCount}
                  </p>
                </div>
                <div>
                  <p className={cn('text-xs uppercase tracking-[0.16em]', isSelected ? 'text-slate-400' : 'text-slate-400')}>
                    Tiến độ
                  </p>
                  <p className="mt-1 font-medium">{progress}%</p>
                </div>
              </div>
              {canManagePlan ? (
                <div className="flex flex-wrap justify-end gap-2">
                  <Button
                    className={isSelected ? 'border border-slate-700 bg-transparent text-white hover:bg-slate-800' : ''}
                    disabled={index === 0 || isSubmitting}
                    onClick={(event) => {
                      event.stopPropagation();
                      onMoveUp(milestone);
                    }}
                    variant={isSelected ? 'ghost' : 'secondary'}
                  >
                    <ArrowUp className="size-4" />
                    Lên
                  </Button>
                  <Button
                    className={isSelected ? 'border border-slate-700 bg-transparent text-white hover:bg-slate-800' : ''}
                    disabled={index === milestones.length - 1 || isSubmitting}
                    onClick={(event) => {
                      event.stopPropagation();
                      onMoveDown(milestone);
                    }}
                    variant={isSelected ? 'ghost' : 'secondary'}
                  >
                    <ArrowDown className="size-4" />
                    Xuống
                  </Button>
                  <Button
                    className={isSelected ? 'border border-slate-700 bg-transparent text-white hover:bg-slate-800' : ''}
                    onClick={(event) => {
                      event.stopPropagation();
                      onEdit(milestone);
                    }}
                    variant={isSelected ? 'ghost' : 'secondary'}
                  >
                    <PencilLine className="size-4" />
                    Sửa
                  </Button>
                </div>
              ) : null}
            </div>
          </button>
        );
      })}
    </div>
  );
}
