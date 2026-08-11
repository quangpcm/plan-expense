import type { TodoDocument, TodoVendor } from '@/modules/todo/types/todo';

export function getSelectedTodoVendor(todo: TodoDocument): TodoVendor | null {
  if (!todo.selectedTodoVendorId) {
    return null;
  }

  return todo.vendors.find((vendor) => vendor.id === todo.selectedTodoVendorId) ?? null;
}

export function getTodoBudgetAmount(todo: TodoDocument) {
  return getSelectedTodoVendor(todo)?.price ?? todo.budget ?? null;
}
