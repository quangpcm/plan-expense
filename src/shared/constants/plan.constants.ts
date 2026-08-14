export const planRoles = {
  owner: 'owner',
  editor: 'editor',
  viewer: 'viewer',
} as const;

export const planStatuses = {
  active: 'active',
  closed: 'closed',
  archived: 'archived',
} as const;

export const milestoneStatuses = {
  upcoming: 'upcoming',
  in_progress: 'in_progress',
  completed: 'completed',
  cancelled: 'cancelled',
} as const;

export const todoStatuses = {
  todo: 'todo',
  in_progress: 'in_progress',
  done: 'done',
  cancelled: 'cancelled',
} as const;

export const todoPriorities = {
  low: 'low',
  medium: 'medium',
  high: 'high',
} as const;

export const splitMethods = {
  self: 'self',
  equal: 'equal',
  exact: 'exact',
  percentage: 'percentage',
  shares: 'shares',
} as const;
