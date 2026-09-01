'use client';

import Link from 'next/link';

import { ArrowRight, BellRing, Clock3 } from 'lucide-react';

import type { PlanSummary } from '@/modules/plan/types/plan';
import { useAttentionTodos, type AttentionBellTone } from '@/modules/todo/hooks/use-attention-todos';
import { getTodoUrgencyTone } from '@/modules/todo/utils/todo-urgency';
import { Badge } from '@/shared/components/ui/badge';
import { Card } from '@/shared/components/ui/card';
import { ErrorState } from '@/shared/components/ui/error-state';
import { Skeleton } from '@/shared/components/ui/skeleton';
import { formatDate, formatDueCountdown } from '@/shared/utils/date';

type TodoAttentionSectionProps = {
  plans: PlanSummary[];
};

function getBellToneClass(tone: AttentionBellTone) {
  if (tone === 'urgent') {
    return 'bg-rose-100 text-rose-600';
  }

  if (tone === 'warning') {
    return 'bg-amber-100 text-amber-600';
  }

  return 'bg-[var(--color-brand-subtle)] text-[var(--color-brand-primary)]';
}

export function TodoAttentionSection({ plans }: TodoAttentionSectionProps) {
  const { attentionTodos, errorMessage, isLoading, bellTone } = useAttentionTodos(plans);

  if (!isLoading && !errorMessage && attentionTodos.length === 0) {
    return null;
  }

  return (
    <Card className="gap-4 rounded-[28px] p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <div className="flex items-center gap-2">
            <div className={`flex size-9 items-center justify-center rounded-2xl ${getBellToneClass(bellTone)}`}>
              <BellRing className="size-4" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-[var(--color-text-primary)]">Việc cần chú ý</h2>
              <p className="text-xs leading-5 text-[var(--color-text-muted)]">Các việc đang trễ hoặc sắp tới hạn.</p>
            </div>
          </div>
        </div>
        {attentionTodos.length > 0 ? <Badge>{attentionTodos.length} việc</Badge> : null}
      </div>

      {errorMessage ? (
        <ErrorState className="py-4" title="Chưa tải được danh sách việc cần chú ý." />
      ) : isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-20 rounded-[24px]" />
        </div>
      ) : (
        <div className="space-y-3">
          {attentionTodos.slice(0, 1).map((item) => {
            const tone = getTodoUrgencyTone(item.urgency);

            return (
              <Link
                key={item.todo.id}
                className={`block rounded-[24px] border px-4 py-3 transition hover:-translate-y-0.5 hover:shadow-[0_14px_32px_rgba(15,23,42,0.08)] ${tone.itemClass}`}
                href={`/plans/${item.plan.planId}?tab=todos&todoId=${item.todo.id}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 space-y-1">
                    <p className="truncate text-sm font-semibold text-[var(--color-text-primary)]">{item.todo.title}</p>
                    <p className="truncate text-xs text-[var(--color-text-muted)]">{item.plan.planName}</p>
                  </div>
                  <span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold ${tone.badgeClass}`}>
                    {formatDueCountdown(item.dueDate)}
                  </span>
                </div>

                <div className="mt-3 flex items-center justify-between gap-3 text-xs text-[var(--color-text-muted)]">
                  <div className="flex min-w-0 items-center gap-1.5">
                    <Clock3 className={`size-3.5 shrink-0 ${tone.iconClass}`} />
                    <span className="truncate">Hạn {formatDate(item.dueDate)}</span>
                  </div>
                  <ArrowRight className="size-4 shrink-0 text-[var(--color-text-muted)]" />
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </Card>
  );
}
