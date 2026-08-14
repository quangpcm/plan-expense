'use client';

import { useRouter } from 'next/navigation';
import { BellRing, CalendarClock, Clock3, FolderOpen, X } from 'lucide-react';

import type { PlanSummary } from '@/modules/plan/types/plan';
import {
  useAttentionTodos,
  type AttentionBellTone,
  type AttentionTodo,
} from '@/modules/todo/hooks/use-attention-todos';
import { priorityLabel } from '@/modules/todo/utils/todo-display';
import { Button } from '@/shared/components/ui/button';
import { formatDate, formatDueCountdown } from '@/shared/utils/date';

type TodoNotificationScreenProps = {
  plans: PlanSummary[];
  open: boolean;
  onClose: () => void;
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

function getUrgencyTone(item: AttentionTodo) {
  if (item.urgency === 'overdue') {
    return {
      badgeClass: 'bg-rose-100 text-rose-700',
      iconClass: 'text-rose-500',
      priorityClass: 'text-rose-700',
    };
  }

  if (item.urgency === 'danger') {
    return {
      badgeClass: 'bg-amber-100 text-amber-700',
      iconClass: 'text-amber-500',
      priorityClass: 'text-amber-700',
    };
  }

  return {
    badgeClass: 'bg-sky-100 text-sky-700',
    iconClass: 'text-sky-500',
    priorityClass: 'text-sky-700',
  };
}

export function TodoNotificationScreen({ plans, open, onClose }: TodoNotificationScreenProps) {
  const router = useRouter();
  const { attentionTodos, errorMessage, isLoading, todayAttentionCount, bellTone } = useAttentionTodos(plans);

  if (!open) {
    return null;
  }

  function handleOpenTodo(item: AttentionTodo) {
    onClose();
    router.push(`/plans/${item.plan.planId}?tab=todos&todoId=${item.todo.id}`);
  }

  const panelContent = (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-white md:min-h-[40vh] md:max-h-[78vh] md:rounded-t-[32px] md:border md:border-b-0 md:border-slate-200 md:shadow-[0_-16px_60px_rgba(15,23,42,0.12)]">
      <div className="shrink-0 border-b border-slate-100 px-5 pb-4 pt-[max(1rem,env(safe-area-inset-top))] md:px-6 md:pt-5">
        <div className="mx-auto mb-4 hidden h-1.5 w-14 rounded-full bg-slate-200 md:block" />
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex items-center gap-3">
            <div className={`inline-flex size-11 shrink-0 items-center justify-center rounded-2xl ${getBellToneClass(bellTone)}`}>
              <BellRing className="size-5" />
            </div>
            <div className="min-w-0">
              <h2 className="text-xl font-semibold text-slate-950">Việc cần chú ý hôm nay</h2>
              <p className="text-sm leading-6 text-slate-600">
                {todayAttentionCount > 0
                  ? `Bạn đang có ${todayAttentionCount} việc cần ưu tiên xử lý sớm.`
                  : 'Các việc sắp tới hạn và đang cần theo dõi.'}
              </p>
            </div>
          </div>
          <button
            aria-label="Đóng thông báo"
            className="mt-1 inline-flex size-11 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition hover:bg-slate-200 hover:text-slate-700"
            onClick={onClose}
            type="button"
          >
            <X className="size-5" />
          </button>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-5 pt-4 md:px-6 md:pb-6">
        {errorMessage ? (
          <div className="rounded-[24px] border border-rose-200 bg-rose-50 px-4 py-4 text-sm text-rose-700">
            Chưa tải được danh sách việc cần chú ý.
          </div>
        ) : isLoading ? (
          <div className="space-y-3">
            <div className="h-24 animate-pulse rounded-[24px] bg-slate-100" />
            <div className="h-24 animate-pulse rounded-[24px] bg-slate-100/80" />
            <div className="h-24 animate-pulse rounded-[24px] bg-slate-100/70" />
          </div>
        ) : attentionTodos.length === 0 ? (
          <div className="flex min-h-[40vh] flex-col items-center justify-center rounded-[28px] border border-dashed border-slate-200 bg-slate-50 px-6 text-center">
            <div className="flex size-14 items-center justify-center rounded-2xl bg-white text-[var(--color-accent)] shadow-[0_12px_32px_rgba(15,23,42,0.06)]">
              <CalendarClock className="size-6" />
            </div>
            <h3 className="mt-4 text-lg font-semibold text-slate-950">Hôm nay chưa có việc gấp</h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Các công việc đến hạn hoặc bị trễ sẽ xuất hiện ở đây để bạn theo dõi nhanh.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {attentionTodos.map((item) => {
              const tone = getUrgencyTone(item);

              return (
                <button
                  className="block w-full rounded-[26px] border border-slate-200 bg-white px-4 py-4 text-left shadow-[0_10px_32px_rgba(15,23,42,0.05)] transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-[0_16px_40px_rgba(15,23,42,0.08)]"
                  key={item.todo.id}
                  onClick={() => handleOpenTodo(item)}
                  type="button"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-base font-semibold text-slate-950">{item.todo.title}</p>
                      <div className="mt-1 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-xs text-slate-500">
                        <span className="inline-flex items-center gap-1.5">
                          <FolderOpen className="size-3.5 text-slate-400" />
                          {item.plan.planName}
                        </span>
                        <span className="text-slate-300">|</span>
                        <span className={`font-medium ${tone.priorityClass}`}>{priorityLabel[item.todo.priority]}</span>
                      </div>
                    </div>
                    <span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold ${tone.badgeClass}`}>
                      {formatDueCountdown(item.dueDate)}
                    </span>
                  </div>

                  <div className="mt-3 flex items-center justify-between gap-3 text-sm text-slate-600">
                    <span className="inline-flex min-w-0 items-center gap-1.5 truncate">
                      <Clock3 className={`size-4 shrink-0 ${tone.iconClass}`} />
                      Hạn {formatDate(item.dueDate)}
                    </span>
                    <span className="text-xs text-slate-400">Mở chi tiết</span>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div className="shrink-0 border-t border-slate-100 px-5 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-3 md:hidden">
        <Button className="w-full justify-center" onClick={onClose} variant="secondary">
          Đóng
        </Button>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center md:bg-slate-950/40">
      <button aria-label="Đóng thông báo" className="absolute inset-0 hidden md:block" onClick={onClose} type="button" />
      <div className="relative flex h-full w-full flex-col md:h-auto md:max-w-2xl">{panelContent}</div>
    </div>
  );
}
