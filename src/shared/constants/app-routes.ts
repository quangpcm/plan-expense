export const appRoutes = {
  home: '/',
  login: '/login',
  register: '/register',
  forgotPassword: '/forgot-password',
  today: '/today',
  plans: '/plans',
  archivedPlans: '/plans/archived',
  profile: '/profile',
  settings: '/settings',
} as const;

export function getPlanDetailRoute(planId: string) {
  return `/plans/${planId}`;
}
