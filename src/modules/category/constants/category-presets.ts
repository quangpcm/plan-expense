import { getCategoryIconTone } from '@/modules/category/utils/category-icon';
import type { Category } from '@/modules/category/types/category';
import type { PlanType } from '@/modules/plan/types/plan';

// iconColor/iconBgColor có thể khai báo thẳng theo từng category (bắt buộc với
// icon Iconify Flat Color Icons, vốn đã có palette màu riêng và không nên suy
// ra tông màu theo tên icon). Khi không khai báo, giữ hành vi cũ: tự tra tông
// màu theo tên icon Lucide qua getCategoryIconTone (ICON_TONES).
type CategoryPreset = Pick<Category, 'id' | 'name' | 'categoryType' | 'icon'> &
  Partial<Pick<Category, 'iconColor' | 'iconBgColor'>>;

function withTone(preset: CategoryPreset): Category {
  if (preset.iconColor && preset.iconBgColor) {
    return { ...preset, iconColor: preset.iconColor, iconBgColor: preset.iconBgColor };
  }

  const tone = getCategoryIconTone(preset.icon);

  return {
    ...preset,
    iconColor: preset.iconColor ?? tone.iconColor,
    iconBgColor: preset.iconBgColor ?? tone.iconBgColor,
  };
}

const rawCategoryPresetsByPlanType: Record<PlanType, CategoryPreset[]> = {
  debt: [
    { id: 'debt_lent_out', name: 'Cho thành viên mượn', categoryType: 'expense', icon: 'HandCoins' },
    { id: 'debt_principal_repayment', name: 'Thành viên hoàn trả', categoryType: 'income', icon: 'ReceiptText' },
    { id: 'debt_partial_collection', name: 'Thu hồi một phần', categoryType: 'income', icon: 'CircleDollarSign' },
    { id: 'debt_refund_adjustment', name: 'Hoàn / điều chỉnh thu', categoryType: 'income', icon: 'RotateCcw' },
    { id: 'debt_fee_expense', name: 'Phí xử lý công nợ', categoryType: 'expense', icon: 'FileText' },
    { id: 'debt_reminder_cost', name: 'Chi nhắc / thu hồi nợ', categoryType: 'expense', icon: 'ShieldAlert' },
    { id: 'debt_borrowed_in', name: 'Thu điều chỉnh công nợ', categoryType: 'income', icon: 'WalletCards' },
    { id: 'debt_repayment_out', name: 'Chi điều chỉnh công nợ', categoryType: 'expense', icon: 'ArrowUpCircle' },
    { id: 'debt_other_expense', name: 'Chi khác liên quan công nợ', categoryType: 'expense', icon: 'CircleEllipsis' },
    { id: 'debt_other_income', name: 'Thu khác liên quan công nợ', categoryType: 'income', icon: 'CircleEllipsis' },
  ],
  travel: [
    { id: 'travel_food', name: 'Ăn uống', categoryType: 'expense', icon: 'Utensils' },
    { id: 'travel_transport', name: 'Di chuyển', categoryType: 'expense', icon: 'Car' },
    { id: 'travel_fuel', name: 'Nhiên liệu', categoryType: 'expense', icon: 'Fuel' },
    { id: 'travel_accommodation', name: 'Lưu trú', categoryType: 'expense', icon: 'BedDouble' },
    { id: 'travel_ticket', name: 'Vé & tham quan', categoryType: 'expense', icon: 'Ticket' },
    { id: 'travel_entertainment', name: 'Giải trí', categoryType: 'expense', icon: 'PartyPopper' },
    { id: 'travel_shopping', name: 'Mua sắm', categoryType: 'expense', icon: 'flat-color-icons:shop', iconColor: 'text-fuchsia-600', iconBgColor: 'bg-fuchsia-100' },
    { id: 'travel_service_fee', name: 'Phí & dịch vụ', categoryType: 'expense', icon: 'ReceiptText' },
    { id: 'travel_other_expense', name: 'Khác', categoryType: 'expense', icon: 'CircleEllipsis' },
    { id: 'travel_contribution', name: 'Đóng góp', categoryType: 'income', icon: 'flat-color-icons:donate', iconColor: 'text-emerald-600', iconBgColor: 'bg-emerald-100' },
    { id: 'travel_refund', name: 'Hoàn tiền', categoryType: 'income', icon: 'RotateCcw' },
    { id: 'travel_income', name: 'Thu nhập', categoryType: 'income', icon: 'flat-color-icons:money-transfer', iconColor: 'text-emerald-600', iconBgColor: 'bg-emerald-100' },
    { id: 'travel_other_income', name: 'Khác', categoryType: 'income', icon: 'CircleEllipsis' },
  ],
  wedding: [
    { id: 'wedding_venue', name: 'Địa điểm', categoryType: 'expense', icon: 'MapPin' },
    { id: 'wedding_food', name: 'Tiệc & ẩm thực', categoryType: 'expense', icon: 'Utensils' },
    { id: 'wedding_decoration', name: 'Trang trí', categoryType: 'expense', icon: 'Sparkles' },
    { id: 'wedding_clothing', name: 'Trang phục', categoryType: 'expense', icon: 'Shirt' },
    { id: 'wedding_makeup', name: 'Trang điểm', categoryType: 'expense', icon: 'Paintbrush' },
    { id: 'wedding_media', name: 'Ảnh & video', categoryType: 'expense', icon: 'flat-color-icons:camera', iconColor: 'text-violet-600', iconBgColor: 'bg-violet-100' },
    { id: 'wedding_invitation_gift', name: 'Thiệp & quà', categoryType: 'expense', icon: 'MailOpen' },
    { id: 'wedding_entertainment', name: 'MC & giải trí', categoryType: 'expense', icon: 'MicVocal' },
    { id: 'wedding_transport', name: 'Di chuyển', categoryType: 'expense', icon: 'Car' },
    { id: 'wedding_service', name: 'Dịch vụ', categoryType: 'expense', icon: 'flat-color-icons:services', iconColor: 'text-teal-600', iconBgColor: 'bg-teal-100' },
    { id: 'wedding_other_expense', name: 'Khác', categoryType: 'expense', icon: 'CircleEllipsis' },
    { id: 'wedding_contribution', name: 'Đóng góp', categoryType: 'income', icon: 'flat-color-icons:donate', iconColor: 'text-emerald-600', iconBgColor: 'bg-emerald-100' },
    { id: 'wedding_gift_money', name: 'Tiền mừng', categoryType: 'income', icon: 'Gift' },
    { id: 'wedding_family_support', name: 'Hỗ trợ gia đình', categoryType: 'income', icon: 'HeartHandshake' },
    { id: 'wedding_refund', name: 'Hoàn tiền', categoryType: 'income', icon: 'RotateCcw' },
    { id: 'wedding_other_income', name: 'Khác', categoryType: 'income', icon: 'CircleEllipsis' },
  ],
  saving: [
    { id: 'saving_withdrawal', name: 'Rút quỹ', categoryType: 'expense', icon: 'flat-color-icons:safe', iconColor: 'text-cyan-600', iconBgColor: 'bg-cyan-100' },
    { id: 'saving_goal_expense', name: 'Chi theo mục tiêu', categoryType: 'expense', icon: 'Target' },
    { id: 'saving_fee', name: 'Phí', categoryType: 'expense', icon: 'ReceiptText' },
    { id: 'saving_other_expense', name: 'Khác', categoryType: 'expense', icon: 'CircleEllipsis' },
    { id: 'saving_deposit', name: 'Nạp quỹ', categoryType: 'income', icon: 'PiggyBank' },
    { id: 'saving_income', name: 'Thu nhập', categoryType: 'income', icon: 'flat-color-icons:money-transfer', iconColor: 'text-emerald-600', iconBgColor: 'bg-emerald-100' },
    { id: 'saving_interest', name: 'Tiền lãi', categoryType: 'income', icon: 'flat-color-icons:bullish', iconColor: 'text-green-600', iconBgColor: 'bg-green-100' },
    { id: 'saving_refund', name: 'Hoàn tiền', categoryType: 'income', icon: 'RotateCcw' },
    { id: 'saving_other_income', name: 'Khác', categoryType: 'income', icon: 'CircleEllipsis' },
  ],
  birthday: [
    { id: 'birthday_venue', name: 'Địa điểm', categoryType: 'expense', icon: 'MapPin' },
    { id: 'birthday_food', name: 'Ăn uống', categoryType: 'expense', icon: 'Utensils' },
    { id: 'birthday_cake_drink', name: 'Bánh & đồ uống', categoryType: 'expense', icon: 'CakeSlice' },
    { id: 'birthday_decoration', name: 'Trang trí', categoryType: 'expense', icon: 'Sparkles' },
    { id: 'birthday_gift', name: 'Quà tặng', categoryType: 'expense', icon: 'Gift' },
    { id: 'birthday_entertainment', name: 'Giải trí', categoryType: 'expense', icon: 'PartyPopper' },
    { id: 'birthday_media', name: 'Ảnh & video', categoryType: 'expense', icon: 'flat-color-icons:camera', iconColor: 'text-violet-600', iconBgColor: 'bg-violet-100' },
    { id: 'birthday_other_expense', name: 'Khác', categoryType: 'expense', icon: 'CircleEllipsis' },
    { id: 'birthday_contribution', name: 'Đóng góp', categoryType: 'income', icon: 'flat-color-icons:donate', iconColor: 'text-emerald-600', iconBgColor: 'bg-emerald-100' },
    { id: 'birthday_gift_money', name: 'Quà bằng tiền', categoryType: 'income', icon: 'Gift' },
    { id: 'birthday_refund', name: 'Hoàn tiền', categoryType: 'income', icon: 'RotateCcw' },
    { id: 'birthday_other_income', name: 'Khác', categoryType: 'income', icon: 'CircleEllipsis' },
  ],
  event: [
    { id: 'event_venue', name: 'Địa điểm', categoryType: 'expense', icon: 'MapPin' },
    { id: 'event_food', name: 'Ăn uống', categoryType: 'expense', icon: 'Utensils' },
    { id: 'event_decoration', name: 'Trang trí', categoryType: 'expense', icon: 'Sparkles' },
    { id: 'event_equipment', name: 'Thiết bị', categoryType: 'expense', icon: 'flat-color-icons:electro-devices', iconColor: 'text-[var(--color-text-secondary)]', iconBgColor: 'bg-[var(--color-surface-subtle)]' },
    { id: 'event_staff', name: 'Nhân sự', categoryType: 'expense', icon: 'Users' },
    { id: 'event_transport', name: 'Di chuyển', categoryType: 'expense', icon: 'Car' },
    { id: 'event_gift', name: 'Quà tặng', categoryType: 'expense', icon: 'Gift' },
    { id: 'event_marketing', name: 'Truyền thông', categoryType: 'expense', icon: 'flat-color-icons:advertising', iconColor: 'text-orange-600', iconBgColor: 'bg-orange-100' },
    { id: 'event_service', name: 'Dịch vụ', categoryType: 'expense', icon: 'flat-color-icons:services', iconColor: 'text-teal-600', iconBgColor: 'bg-teal-100' },
    { id: 'event_other_expense', name: 'Khác', categoryType: 'expense', icon: 'CircleEllipsis' },
    { id: 'event_contribution', name: 'Đóng góp', categoryType: 'income', icon: 'flat-color-icons:donate', iconColor: 'text-emerald-600', iconBgColor: 'bg-emerald-100' },
    { id: 'event_sponsorship', name: 'Tài trợ', categoryType: 'income', icon: 'Handshake' },
    { id: 'event_ticket_sales', name: 'Bán vé', categoryType: 'income', icon: 'Tickets' },
    { id: 'event_refund', name: 'Hoàn tiền', categoryType: 'income', icon: 'RotateCcw' },
    { id: 'event_other_income', name: 'Khác', categoryType: 'income', icon: 'CircleEllipsis' },
  ],
  shared_living: [
    { id: 'shared_living_housing', name: 'Tiền nhà', categoryType: 'expense', icon: 'flat-color-icons:home', iconColor: 'text-teal-600', iconBgColor: 'bg-teal-100' },
    { id: 'shared_living_utilities', name: 'Điện & nước', categoryType: 'expense', icon: 'Bolt' },
    { id: 'shared_living_internet', name: 'Internet', categoryType: 'expense', icon: 'Wifi' },
    { id: 'shared_living_food', name: 'Ăn uống', categoryType: 'expense', icon: 'Utensils' },
    { id: 'shared_living_transport', name: 'Đi lại', categoryType: 'expense', icon: 'Car' },
    { id: 'shared_living_household', name: 'Đồ dùng chung', categoryType: 'expense', icon: 'flat-color-icons:package', iconColor: 'text-amber-600', iconBgColor: 'bg-amber-100' },
    { id: 'shared_living_shopping', name: 'Mua sắm', categoryType: 'expense', icon: 'flat-color-icons:shop', iconColor: 'text-fuchsia-600', iconBgColor: 'bg-fuchsia-100' },
    { id: 'shared_living_maintenance', name: 'Sửa chữa', categoryType: 'expense', icon: 'Wrench' },
    { id: 'shared_living_cleaning', name: 'Dọn dẹp', categoryType: 'expense', icon: 'SprayCan' },
    { id: 'shared_living_service', name: 'Dịch vụ', categoryType: 'expense', icon: 'flat-color-icons:services', iconColor: 'text-teal-600', iconBgColor: 'bg-teal-100' },
    { id: 'shared_living_other_expense', name: 'Khác', categoryType: 'expense', icon: 'CircleEllipsis' },
    { id: 'shared_living_contribution', name: 'Đóng góp', categoryType: 'income', icon: 'flat-color-icons:donate', iconColor: 'text-emerald-600', iconBgColor: 'bg-emerald-100' },
    { id: 'shared_living_refund', name: 'Hoàn tiền', categoryType: 'income', icon: 'RotateCcw' },
    { id: 'shared_living_shared_income', name: 'Thu nhập chung', categoryType: 'income', icon: 'flat-color-icons:money-transfer', iconColor: 'text-emerald-600', iconBgColor: 'bg-emerald-100' },
    { id: 'shared_living_other_income', name: 'Khác', categoryType: 'income', icon: 'CircleEllipsis' },
  ],
  project: [
    { id: 'project_staff', name: 'Nhân sự', categoryType: 'expense', icon: 'Users' },
    { id: 'project_equipment', name: 'Thiết bị', categoryType: 'expense', icon: 'flat-color-icons:electro-devices', iconColor: 'text-[var(--color-text-secondary)]', iconBgColor: 'bg-[var(--color-surface-subtle)]' },
    { id: 'project_material', name: 'Vật tư', categoryType: 'expense', icon: 'flat-color-icons:package', iconColor: 'text-[var(--color-text-secondary)]', iconBgColor: 'bg-[var(--color-surface-subtle)]' },
    { id: 'project_service', name: 'Dịch vụ', categoryType: 'expense', icon: 'flat-color-icons:services', iconColor: 'text-teal-600', iconBgColor: 'bg-teal-100' },
    { id: 'project_software', name: 'Phần mềm', categoryType: 'expense', icon: 'Laptop' },
    { id: 'project_marketing', name: 'Marketing', categoryType: 'expense', icon: 'flat-color-icons:advertising', iconColor: 'text-orange-600', iconBgColor: 'bg-orange-100' },
    { id: 'project_transport', name: 'Di chuyển', categoryType: 'expense', icon: 'Car' },
    { id: 'project_food', name: 'Ăn uống', categoryType: 'expense', icon: 'Utensils' },
    { id: 'project_fee', name: 'Phí', categoryType: 'expense', icon: 'ReceiptText' },
    { id: 'project_other_expense', name: 'Khác', categoryType: 'expense', icon: 'CircleEllipsis' },
    { id: 'project_contribution', name: 'Đóng góp', categoryType: 'income', icon: 'flat-color-icons:donate', iconColor: 'text-emerald-600', iconBgColor: 'bg-emerald-100' },
    { id: 'project_revenue', name: 'Doanh thu', categoryType: 'income', icon: 'BadgeDollarSign' },
    { id: 'project_sponsorship', name: 'Tài trợ', categoryType: 'income', icon: 'Handshake' },
    { id: 'project_refund', name: 'Hoàn tiền', categoryType: 'income', icon: 'RotateCcw' },
    { id: 'project_other_income', name: 'Khác', categoryType: 'income', icon: 'CircleEllipsis' },
  ],
  general: [
    { id: 'general_food', name: 'Ăn uống', categoryType: 'expense', icon: 'Utensils' },
    { id: 'general_transport', name: 'Di chuyển', categoryType: 'expense', icon: 'Car' },
    { id: 'general_shopping', name: 'Mua sắm', categoryType: 'expense', icon: 'flat-color-icons:shop', iconColor: 'text-fuchsia-600', iconBgColor: 'bg-fuchsia-100' },
    { id: 'general_service', name: 'Dịch vụ', categoryType: 'expense', icon: 'flat-color-icons:services', iconColor: 'text-teal-600', iconBgColor: 'bg-teal-100' },
    { id: 'general_entertainment', name: 'Giải trí', categoryType: 'expense', icon: 'PartyPopper' },
    { id: 'general_bill', name: 'Hóa đơn', categoryType: 'expense', icon: 'Receipt' },
    { id: 'general_other_expense', name: 'Khác', categoryType: 'expense', icon: 'CircleEllipsis' },
    { id: 'general_contribution', name: 'Đóng góp', categoryType: 'income', icon: 'flat-color-icons:donate', iconColor: 'text-emerald-600', iconBgColor: 'bg-emerald-100' },
    { id: 'general_income', name: 'Thu nhập', categoryType: 'income', icon: 'flat-color-icons:money-transfer', iconColor: 'text-emerald-600', iconBgColor: 'bg-emerald-100' },
    { id: 'general_refund', name: 'Hoàn tiền', categoryType: 'income', icon: 'RotateCcw' },
    { id: 'general_other_income', name: 'Khác', categoryType: 'income', icon: 'CircleEllipsis' },
  ],
};

export const categoryPresetsByPlanType: Record<PlanType, Category[]> = Object.fromEntries(
  Object.entries(rawCategoryPresetsByPlanType).map(([planType, presets]) => [planType, presets.map(withTone)]),
) as Record<PlanType, Category[]>;

export function getExpenseCategories(planType: PlanType): Category[] {
  return categoryPresetsByPlanType[planType].filter((category) => category.categoryType === 'expense');
}

export function getIncomeCategories(planType: PlanType): Category[] {
  return categoryPresetsByPlanType[planType].filter((category) => category.categoryType === 'income');
}
