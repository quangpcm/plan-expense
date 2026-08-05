export const appRoutes = {
  home: '/',
  login: '/login',
  register: '/register',
  forgotPassword: '/forgot-password',
  plans: '/plans',
  planCreate: '/plans/new',
  profile: '/profile',
  settings: '/settings',
} as const;

export function getPlanDetailRoute(planId: string) {
  return `/plans/${planId}`;
}
