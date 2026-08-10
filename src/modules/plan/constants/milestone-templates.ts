import type { PlanType } from '@/modules/plan/types/plan';

export type MilestoneTemplate = {
  title: string;
  iconId: string | null;
};

export const milestoneTemplatesByPlanType: Record<PlanType, MilestoneTemplate[]> = {
  travel: [
    { title: 'Chuẩn bị', iconId: 'luggage' },
    { title: 'Di chuyển', iconId: 'plane' },
    { title: 'Lưu trú', iconId: 'hotel' },
    { title: 'Vui chơi', iconId: 'map' },
  ],
  wedding: [
    { title: 'Dạm ngõ', iconId: 'rings' },
    { title: 'Thử váy cưới', iconId: 'shirt' },
    { title: 'Chụp ảnh cưới', iconId: 'camera' },
    { title: 'Chọn nhà hàng', iconId: 'utensils' },
    { title: 'Đám hỏi', iconId: 'heart-handshake' },
    { title: 'Đám cưới nhà gái', iconId: 'home' },
    { title: 'Đám cưới nhà trai', iconId: 'home' },
  ],
  saving: [
    { title: 'Mục tiêu', iconId: 'target' },
    { title: 'Tích lũy', iconId: 'piggy-bank' },
    { title: 'Đánh giá', iconId: 'chart-column' },
  ],
  birthday: [
    { title: 'Chuẩn bị', iconId: 'sparkles' },
    { title: 'Khách mời', iconId: 'users' },
    { title: 'Tổ chức tiệc', iconId: 'cake' },
  ],
  event: [
    { title: 'Lên ý tưởng', iconId: 'lightbulb' },
    { title: 'Chuẩn bị', iconId: 'clipboard-list' },
    { title: 'Vận hành', iconId: 'play-circle' },
  ],
  shared_living: [
    { title: 'Việc chung', iconId: 'home' },
    { title: 'Hóa đơn', iconId: 'receipt' },
    { title: 'Bảo trì', iconId: 'wrench' },
  ],
  general: [
    { title: 'Bắt đầu', iconId: 'flag' },
    { title: 'Thực hiện', iconId: 'list-todo' },
    { title: 'Hoàn thành', iconId: 'check-circle-2' },
  ],
};
