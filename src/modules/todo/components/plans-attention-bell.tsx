'use client';

import { useState } from 'react';
import { Bell } from 'lucide-react';

import { useUserPlans } from '@/modules/plan/hooks/use-user-plans';
import { TodoNotificationScreen } from '@/modules/todo/components/todo-notification-screen';
import { useAttentionTodos, type AttentionBellTone } from '@/modules/todo/hooks/use-attention-todos';

function getBellToneClass(tone: AttentionBellTone) {
  if (tone === 'urgent') {
    return 'border-rose-200 bg-rose-50 text-rose-600 hover:border-rose-300 hover:text-rose-700';
  }

  if (tone === 'warning') {
    return 'border-amber-200 bg-amber-50 text-amber-600 hover:border-amber-300 hover:text-amber-700';
  }

  return 'border-[var(--color-border)] bg-white text-[var(--color-muted)] hover:border-[var(--color-brand-primary)] hover:text-[var(--color-brand-primary)]';
}

// Global header's notification entry point — same attention-todo logic that used to live inline
// in PlansPage, just relocated so it renders next to the Avatar in the header instead of inside
// the page's own PageHeader row. Now mounted unconditionally in AppHeader (desktop and mobile,
// every authenticated route) so the bell no longer disappears on /today.
export function PlansAttentionBell() {
  const { plans } = useUserPlans();
  const { todayAttentionCount, bellTone } = useAttentionTodos(plans);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);

  return (
    <>
      <button
        aria-label="Thông báo"
        className={`relative inline-flex size-7 items-center justify-center rounded-full border shadow-[0_8px_24px_rgba(15,23,42,0.06)] transition ${getBellToneClass(bellTone)}`}
        onClick={() => setIsNotificationOpen(true)}
        type="button"
      >
        <Bell className="size-4" />
        {todayAttentionCount > 0 ? (
          <span className="absolute -right-1 -top-1 inline-flex min-h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-semibold leading-none text-white shadow-[0_8px_18px_rgba(244,63,94,0.35)]">
            {todayAttentionCount > 9 ? '9+' : todayAttentionCount}
          </span>
        ) : null}
      </button>

      <TodoNotificationScreen open={isNotificationOpen} onClose={() => setIsNotificationOpen(false)} plans={plans} />
    </>
  );
}
