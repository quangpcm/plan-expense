import type { TodoStatus } from '@/modules/todo/types/todo';

// "Active" = not yet resolved either way (todo/in_progress), excludes done/cancelled.
export const ACTIVE_TODO_STATUSES: TodoStatus[] = ['todo', 'in_progress'];
