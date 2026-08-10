'use client';

import { useEffect, useState } from 'react';

import { todoService } from '@/modules/todo/services';
import type { TodoDocument } from '@/modules/todo/types/todo';

export function useTodos(planId: string) {
  const [todos, setTodos] = useState<TodoDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!planId) {
      return undefined;
    }

    const unsubscribe = todoService.watchTodos(
      planId,
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
  }, [planId]);

  return {
    todos,
    isLoading,
    errorMessage,
  };
}
