import type { PlanRole } from '@/modules/member/types/member';

export const PLAN_ROLE_LABEL: Record<PlanRole, string> = {
  owner: 'Chủ kế hoạch',
  editor: 'Cộng tác viên',
  viewer: 'Chỉ xem',
};
