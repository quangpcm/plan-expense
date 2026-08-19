import type { PlanType } from '@/modules/plan/types/plan';

export type MilestoneTemplate = {
  title: string;
  iconId: string | null;
};

// Milestones represent WHEN/which phase a transaction happened in, not WHAT it
// was for (that's Category's job). Kept to a 3-milestone "minimum useful
// structure" per plan so a freshly created plan doesn't open onto a long,
// opinionated timeline the user has to fight — they can always add more.
export const milestoneTemplatesByPlanType: Record<PlanType, MilestoneTemplate[]> = {
  // Debt has no business milestone in UX. A hidden system milestone is created
  // separately only as a finance persistence anchor when needed.
  debt: [],
  travel: [
    { title: 'Chuẩn bị', iconId: 'luggage' },
    { title: 'Chuyến đi', iconId: 'plane' },
    { title: 'Kết thúc', iconId: 'flag' },
  ],
  wedding: [
    { title: 'Chuẩn bị', iconId: 'clipboard-list' },
    { title: 'Lễ cưới', iconId: 'rings' },
    { title: 'Hoàn tất', iconId: 'flag' },
  ],
  saving: [
    { title: 'Bắt đầu', iconId: 'flag' },
    { title: 'Tích lũy', iconId: 'piggy-bank' },
    { title: 'Hoàn thành', iconId: 'check-circle-2' },
  ],
  birthday: [
    { title: 'Chuẩn bị', iconId: 'sparkles' },
    { title: 'Tổ chức', iconId: 'cake' },
    { title: 'Hoàn tất', iconId: 'flag' },
  ],
  event: [
    { title: 'Lên kế hoạch', iconId: 'lightbulb' },
    { title: 'Chuẩn bị', iconId: 'clipboard-list' },
    { title: 'Tổ chức', iconId: 'play-circle' },
  ],
  // Shared living is an ongoing plan with no natural start/end phases; a single
  // catch-all milestone exists only because milestoneId is still required on
  // every expense/income today. Drop this back to [] once that's optional.
  shared_living: [{ title: 'Sinh hoạt chung', iconId: 'home' }],
  project: [
    { title: 'Lên kế hoạch', iconId: 'clipboard-list' },
    { title: 'Triển khai', iconId: 'play-circle' },
    { title: 'Tổng kết', iconId: 'flag' },
  ],
  general: [
    { title: 'Bắt đầu', iconId: 'flag' },
    { title: 'Thực hiện', iconId: 'list-todo' },
    { title: 'Hoàn thành', iconId: 'check-circle-2' },
  ],
};
