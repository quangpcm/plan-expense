'use client';

import { useEffect, useMemo, useState } from 'react';

import type { PlanSummary } from '@/modules/plan/types/plan';
import { todoService } from '@/modules/todo/services';
import type { TodoDocument } from '@/modules/todo/types/todo';
import { getDueUrgency } from '@/shared/utils/date';
import { timestampToDate } from '@/shared/utils/firebase';

export type AttentionTodo = {
  todo: TodoDocument;
  plan: PlanSummary;
  dueDate: Date;
  urgency: ReturnType<typeof getDueUrgency>;
};

export type AttentionBellTone = 'normal' | 'warning' | 'urgent';

const priorityScore: Record<TodoDocument['priority'], number> = {
  high: 0,
  medium: 1,
  low: 2,
};

export function useAttentionTodos(plans: PlanSummary[]) {
  const [todosByPlanId, setTodosByPlanId] = useState<Record<string, TodoDocument[]>>({});
  const [loadedPlanIds, setLoadedPlanIds] = useState<string[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const activePlans = plans.filter((plan) => plan.planStatus === 'active');

    if (activePlans.length === 0) {
      setTodosByPlanId({});
      setLoadedPlanIds([]);
      setErrorMessage(null);
      return undefined;
    }

    setLoadedPlanIds([]);
    setTodosByPlanId({});
    setErrorMessage(null);

    const unsubscribes = activePlans.map((plan) =>
      todoService.watchTodos(
        plan.planId,
        (nextTodos) => {
          setTodosByPlanId((current) => ({ ...current, [plan.planId]: nextTodos }));
          setLoadedPlanIds((current) => (current.includes(plan.planId) ? current : [...current, plan.planId]));
        },
        (error) => {
          setTodosByPlanId((current) => ({ ...current, [plan.planId]: [] }));
          setLoadedPlanIds((current) => (current.includes(plan.planId) ? current : [...current, plan.planId]));
          setErrorMessage(error.message);
        },
      ),
    );

    return () => {
      unsubscribes.forEach((unsubscribe) => unsubscribe());
    };
  }, [plans]);

  const attentionTodos = useMemo<AttentionTodo[]>(() => {
    return plans
      .filter((plan) => plan.planStatus === 'active')
      .flatMap<AttentionTodo>((plan) => {
        const todos = todosByPlanId[plan.planId] ?? [];

        return todos.reduce<AttentionTodo[]>((items, todo) => {
          if (todo.status === 'done' || todo.status === 'cancelled' || !todo.dueDate) {
            return items;
          }

          const dueDate = timestampToDate(todo.dueDate);

          if (!dueDate) {
            return items;
          }

          const urgency = getDueUrgency(dueDate);

          if (urgency === 'normal') {
            return items;
          }

          items.push({
            todo,
            plan,
            dueDate,
            urgency,
          });

          return items;
        }, []);
      })
      .sort((left, right) => {
        const timeDiff = left.dueDate.getTime() - right.dueDate.getTime();

        if (timeDiff !== 0) {
          return timeDiff;
        }

        return priorityScore[left.todo.priority] - priorityScore[right.todo.priority];
      });
  }, [plans, todosByPlanId]);

  const isLoading = plans.some((plan) => plan.planStatus === 'active') && loadedPlanIds.length === 0;
  const todayAttentionCount = useMemo(
    () => attentionTodos.filter((item) => item.urgency === 'overdue' || item.urgency === 'danger').length,
    [attentionTodos],
  );
  const bellTone = useMemo<AttentionBellTone>(() => {
    if (attentionTodos.some((item) => item.urgency === 'overdue')) {
      return 'urgent';
    }

    if (attentionTodos.some((item) => item.urgency === 'danger')) {
      return 'warning';
    }

    return 'normal';
  }, [attentionTodos]);

  return {
    attentionTodos,
    todayAttentionCount,
    bellTone,
    isLoading,
    errorMessage,
  };
}
