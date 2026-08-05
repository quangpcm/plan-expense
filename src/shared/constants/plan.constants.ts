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

export const splitMethods = {
  equal: 'equal',
  exact: 'exact',
  percentage: 'percentage',
  shares: 'shares',
} as const;

