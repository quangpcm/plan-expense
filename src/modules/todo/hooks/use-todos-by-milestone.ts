'use client';

import { useEffect, useState } from 'react';

import { todoService } from '@/modules/todo/services';
import type { TodoDocument } from '@/modules/todo/types/todo';

export function useTodosByMilestone(planId: string, milestoneId: string | null) {
  const [todos, setTodos] = useState<TodoDocument[]>([]);
  const [isLoading, setIsLoading] = useState(Boolean(milestoneId));
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!planId || !milestoneId) {
      setTodos([]);
      setIsLoading(false);
      setErrorMessage(null);
      return undefined;
    }

    setIsLoading(true);

    const unsubscribe = todoService.watchTodosByMilestone(
      planId,
      milestoneId,
      (nextTodos) => {
        setTodos(nextTodos);
        setIsLoading(false);
        setErrorMessage(null);
      },
      (error) => {
        setTodos([]);
        setIsLoading(false);
        setErrorMessage(error.message);
      },
    );

    return () => unsubscribe();
  }, [milestoneId, planId]);

  return {
    todos,
    isLoading,
    errorMessage,
  };
}
