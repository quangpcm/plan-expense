import type { DueUrgency } from '@/shared/utils/date';

export type TodoUrgencyTone = {
  itemClass: string;
  badgeClass: string;
  iconClass: string;
  priorityClass: string;
};

/**
 * Single source for the rose/amber/sky urgency palette previously duplicated verbatim in
 * todo-attention-section.tsx and todo-notification-screen.tsx. Field values are unchanged from
 * both originals; each consumer just reads the subset of fields it already used.
 */
export function getTodoUrgencyTone(urgency: DueUrgency): TodoUrgencyTone {
  if (urgency === 'overdue') {
    return {
      itemClass: 'border-rose-200 bg-rose-50/80',
      badgeClass: 'bg-rose-100 text-rose-700',
      iconClass: 'text-rose-500',
      priorityClass: 'text-rose-700',
    };
  }

  if (urgency === 'danger') {
    return {
      itemClass: 'border-amber-200 bg-amber-50/80',
      badgeClass: 'bg-amber-100 text-amber-700',
      iconClass: 'text-amber-500',
      priorityClass: 'text-amber-700',
    };
  }

  return {
    itemClass: 'border-sky-200 bg-sky-50/80',
    badgeClass: 'bg-sky-100 text-sky-700',
    iconClass: 'text-sky-500',
    priorityClass: 'text-sky-700',
  };
}
