import type { PlanSummary } from '@/modules/plan/types/plan';
import type { PlanCardViewModel } from '@/modules/plan/types/plan-card';
import { buildPlanCardConfig } from '@/modules/plan/constants/plan-card-config';

function getRoleLabel(role: PlanSummary['role']) {
  switch (role) {
    case 'owner':
      return 'Chủ sở hữu';
    case 'editor':
      return 'Biên tập';
    case 'viewer':
      return 'Theo dõi';
    default:
      return role;
  }
}

function getStatusLabel(status: PlanSummary['planStatus']) {
  switch (status) {
    case 'active':
      return 'Đang hoạt động';
    case 'closed':
      return 'Đã đóng';
    case 'archived':
      return 'Lưu trữ';
    default:
      return status;
  }
}

export function buildPlanCardViewModel(plan: PlanSummary): PlanCardViewModel {
  const config = buildPlanCardConfig(plan);

  return {
    title: plan.planName,
    coverImageUrl: plan.coverImageUrl,
    roleLabel: getRoleLabel(plan.role),
    statusLabel: getStatusLabel(plan.planStatus),
    statusTone: plan.planStatus === 'active' ? 'active' : 'inactive',
    primaryMetric: config.primaryMetric,
    secondaryMetric: config.secondaryMetric,
    progress: config.progress,
    footerLeft: config.footerLeft,
    footerRight: config.footerRight,
  };
}
