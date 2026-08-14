'use client';

import Link from 'next/link';

import { ArrowRight, BellRing, Clock3 } from 'lucide-react';

import type { PlanSummary } from '@/modules/plan/types/plan';
import { useAttentionTodos, type AttentionTodo, type AttentionBellTone } from '@/modules/todo/hooks/use-attention-todos';
import { Card } from '@/shared/components/ui/card';
import { formatDate, formatDueCountdown, getDueUrgency } from '@/shared/utils/date';

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

  return 'bg-[var(--color-accent-soft)] text-[var(--color-accent)]';
}

function getUrgencyTone(urgency: AttentionTodo['urgency']) {
  if (urgency === 'overdue') {
    return {
      itemClass: 'border-rose-200 bg-rose-50/80',
      badgeClass: 'bg-rose-100 text-rose-700',
      iconClass: 'text-rose-500',
    };
  }

  if (urgency === 'danger') {
    return {
      itemClass: 'border-amber-200 bg-amber-50/80',
      badgeClass: 'bg-amber-100 text-amber-700',
      iconClass: 'text-amber-500',
    };
  }

  return {
    itemClass: 'border-sky-200 bg-sky-50/80',
    badgeClass: 'bg-sky-100 text-sky-700',
    iconClass: 'text-sky-500',
  };
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
              <h2 className="text-base font-semibold text-[var(--color-foreground)]">Việc cần chú ý</h2>
              <p className="text-xs leading-5 text-[var(--color-muted)]">Các việc đang trễ hoặc sắp tới hạn.</p>
            </div>
          </div>
        </div>
        {attentionTodos.length > 0 ? (
          <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
            {attentionTodos.length} việc
          </div>
        ) : null}
      </div>

      {errorMessage ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          Chưa tải được danh sách việc cần chú ý.
        </div>
      ) : isLoading ? (
        <div className="space-y-3">
          <div className="h-20 animate-pulse rounded-[24px] bg-slate-100" />
        </div>
      ) : (
        <div className="space-y-3">
          {attentionTodos.slice(0, 1).map((item) => {
            const tone = getUrgencyTone(item.urgency);

            return (
              <Link
                key={item.todo.id}
                className={`block rounded-[24px] border px-4 py-3 transition hover:-translate-y-0.5 hover:shadow-[0_14px_32px_rgba(15,23,42,0.08)] ${tone.itemClass}`}
                href={`/plans/${item.plan.planId}?tab=todos&todoId=${item.todo.id}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 space-y-1">
                    <p className="truncate text-sm font-semibold text-[var(--color-foreground)]">{item.todo.title}</p>
                    <p className="truncate text-xs text-[var(--color-muted)]">{item.plan.planName}</p>
                  </div>
                  <span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold ${tone.badgeClass}`}>
                    {formatDueCountdown(item.dueDate)}
                  </span>
                </div>

                <div className="mt-3 flex items-center justify-between gap-3 text-xs text-[var(--color-muted)]">
                  <div className="flex min-w-0 items-center gap-1.5">
                    <Clock3 className={`size-3.5 shrink-0 ${tone.iconClass}`} />
                    <span className="truncate">Hạn {formatDate(item.dueDate)}</span>
                  </div>
                  <ArrowRight className="size-4 shrink-0 text-[var(--color-subtle)]" />
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </Card>
  );
}
