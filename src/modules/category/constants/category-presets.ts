import type { Category } from '@/modules/category/types/category';
import type { PlanType } from '@/modules/plan/types/plan';

const incomeCategories: Category[] = [
  { id: 'income_topup', name: 'Nạp quỹ', categoryType: 'income', icon: null },
  { id: 'income_earning', name: 'Thu nhập', categoryType: 'income', icon: null },
  { id: 'income_interest', name: 'Tiền lãi', categoryType: 'income', icon: null },
  { id: 'income_refund', name: 'Hoàn tiền', categoryType: 'income', icon: null },
  { id: 'income_other', name: 'Khác', categoryType: 'income', icon: null },
];

export const categoryPresetsByPlanType: Record<PlanType, Category[]> = {
  travel: [
    { id: 'travel_food', name: 'Ăn uống', categoryType: 'expense', icon: null },
    { id: 'travel_transport', name: 'Di chuyển', categoryType: 'expense', icon: null },
    { id: 'travel_fuel', name: 'Nhiên liệu', categoryType: 'expense', icon: null },
    { id: 'travel_hotel', name: 'Khách sạn', categoryType: 'expense', icon: null },
    { id: 'travel_ticket', name: 'Vé tham quan', categoryType: 'expense', icon: null },
    { id: 'travel_entertainment', name: 'Giải trí', categoryType: 'expense', icon: null },
    { id: 'travel_shopping', name: 'Mua sắm', categoryType: 'expense', icon: null },
    { id: 'travel_service_fee', name: 'Phí dịch vụ', categoryType: 'expense', icon: null },
    { id: 'travel_other', name: 'Khác', categoryType: 'expense', icon: null },
    ...incomeCategories,
  ],
  wedding: [
    { id: 'wedding_venue', name: 'Địa điểm', categoryType: 'expense', icon: null },
    { id: 'wedding_decor', name: 'Trang trí', categoryType: 'expense', icon: null },
    { id: 'wedding_food', name: 'Ẩm thực', categoryType: 'expense', icon: null },
    { id: 'wedding_attire', name: 'Trang phục', categoryType: 'expense', icon: null },
    { id: 'wedding_makeup', name: 'Trang điểm', categoryType: 'expense', icon: null },
    { id: 'wedding_photography', name: 'Chụp ảnh', categoryType: 'expense', icon: null },
    { id: 'wedding_videography', name: 'Quay phim', categoryType: 'expense', icon: null },
    { id: 'wedding_invitation', name: 'Thiệp cưới', categoryType: 'expense', icon: null },
    { id: 'wedding_mc_sound', name: 'MC và âm thanh', categoryType: 'expense', icon: null },
    { id: 'wedding_gift', name: 'Quà tặng', categoryType: 'expense', icon: null },
    { id: 'wedding_transport', name: 'Di chuyển', categoryType: 'expense', icon: null },
    { id: 'wedding_other', name: 'Khác', categoryType: 'expense', icon: null },
    ...incomeCategories,
  ],
  saving: [
    { id: 'saving_withdrawal', name: 'Rút quỹ', categoryType: 'expense', icon: null },
    { id: 'saving_shopping', name: 'Mua sắm', categoryType: 'expense', icon: null },
    { id: 'saving_service_fee', name: 'Phí dịch vụ', categoryType: 'expense', icon: null },
    { id: 'saving_incidental', name: 'Chi phí phát sinh', categoryType: 'expense', icon: null },
    { id: 'saving_other', name: 'Khác', categoryType: 'expense', icon: null },
    ...incomeCategories,
  ],
  birthday: [
    { id: 'birthday_venue', name: 'Địa điểm', categoryType: 'expense', icon: null },
    { id: 'birthday_food', name: 'Ăn uống', categoryType: 'expense', icon: null },
    { id: 'birthday_cake', name: 'Bánh sinh nhật', categoryType: 'expense', icon: null },
    { id: 'birthday_decor', name: 'Trang trí', categoryType: 'expense', icon: null },
    { id: 'birthday_gift', name: 'Quà tặng', categoryType: 'expense', icon: null },
    { id: 'birthday_entertainment', name: 'Giải trí', categoryType: 'expense', icon: null },
    { id: 'birthday_photography', name: 'Chụp ảnh', categoryType: 'expense', icon: null },
    { id: 'birthday_other', name: 'Khác', categoryType: 'expense', icon: null },
    ...incomeCategories,
  ],
  event: [
    { id: 'event_venue', name: 'Địa điểm', categoryType: 'expense', icon: null },
    { id: 'event_food', name: 'Ẩm thực', categoryType: 'expense', icon: null },
    { id: 'event_decor', name: 'Trang trí', categoryType: 'expense', icon: null },
    { id: 'event_sound', name: 'Âm thanh', categoryType: 'expense', icon: null },
    { id: 'event_staffing', name: 'Nhân sự', categoryType: 'expense', icon: null },
    { id: 'event_transport', name: 'Di chuyển', categoryType: 'expense', icon: null },
    { id: 'event_gift', name: 'Quà tặng', categoryType: 'expense', icon: null },
    { id: 'event_media', name: 'Truyền thông', categoryType: 'expense', icon: null },
    { id: 'event_other', name: 'Khác', categoryType: 'expense', icon: null },
    ...incomeCategories,
  ],
  shared_living: [
    { id: 'shared_living_rent', name: 'Tiền nhà', categoryType: 'expense', icon: null },
    { id: 'shared_living_electricity', name: 'Điện', categoryType: 'expense', icon: null },
    { id: 'shared_living_water', name: 'Nước', categoryType: 'expense', icon: null },
    { id: 'shared_living_internet', name: 'Internet', categoryType: 'expense', icon: null },
    { id: 'shared_living_food', name: 'Ăn uống', categoryType: 'expense', icon: null },
    { id: 'shared_living_supplies', name: 'Đồ dùng chung', categoryType: 'expense', icon: null },
    { id: 'shared_living_repair', name: 'Sửa chữa', categoryType: 'expense', icon: null },
    { id: 'shared_living_cleaning', name: 'Dọn vệ sinh', categoryType: 'expense', icon: null },
    { id: 'shared_living_other', name: 'Khác', categoryType: 'expense', icon: null },
    ...incomeCategories,
  ],
  general: [
    { id: 'general_food', name: 'Ăn uống', categoryType: 'expense', icon: null },
    { id: 'general_transport', name: 'Di chuyển', categoryType: 'expense', icon: null },
    { id: 'general_shopping', name: 'Mua sắm', categoryType: 'expense', icon: null },
    { id: 'general_service', name: 'Dịch vụ', categoryType: 'expense', icon: null },
    { id: 'general_entertainment', name: 'Giải trí', categoryType: 'expense', icon: null },
    { id: 'general_other', name: 'Khác', categoryType: 'expense', icon: null },
    ...incomeCategories,
  ],
};

export function getExpenseCategories(planType: PlanType): Category[] {
  return categoryPresetsByPlanType[planType].filter((category) => category.categoryType === 'expense');
}

export function getIncomeCategories(planType: PlanType): Category[] {
  return categoryPresetsByPlanType[planType].filter((category) => category.categoryType === 'income');
}
