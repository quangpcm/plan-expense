import type { DebtTransactionType } from '@/modules/debt-tracking/types/debt-transaction';
import type { CategoryIconTone } from '@/modules/category/utils/category-icon';
import { type IconComponent, getIconifyIconComponent } from '@/shared/utils/iconify-icon';

// Ưu tiên bộ `flat-color-icons` (nhẹ, đã dùng sẵn cho category chung của app).
const shopIcon = getIconifyIconComponent('flat-color-icons:shop');
const homeIcon = getIconifyIconComponent('flat-color-icons:home');
const automotiveIcon = getIconifyIconComponent('flat-color-icons:automotive');
const graduationCapIcon = getIconifyIconComponent('flat-color-icons:graduation-cap');
const businessIcon = getIconifyIconComponent('flat-color-icons:business');
const moneyTransferIcon = getIconifyIconComponent('flat-color-icons:money-transfer');
// `flat-color-icons` không có icon đồ ăn/y tế/máy bay/quà/người — dùng bộ `emojione`
// (xem src/shared/utils/iconify-icon.tsx) cho các category này.
const personIcon = getIconifyIconComponent('emojione:bust-in-silhouette');
const foodIcon = getIconifyIconComponent('emojione:fork-and-knife-with-plate');
const airplaneIcon = getIconifyIconComponent('emojione:airplane');
const pillIcon = getIconifyIconComponent('emojione:pill');
const familyIcon = getIconifyIconComponent('emojione:family');
const giftIcon = getIconifyIconComponent('emojione:wrapped-gift');
const otherIcon = getIconifyIconComponent('flat-color-icons:view-details');

// Loan category trả lời "khoản tiền này dùng cho việc gì?" — hoàn toàn độc lập với
// direction (họ nợ tôi / tôi nợ họ đều dùng chung 12 giá trị này).
export type LoanCategory =
  | 'personal'
  | 'food_drink'
  | 'shopping'
  | 'housing'
  | 'transportation'
  | 'travel'
  | 'healthcare'
  | 'education'
  | 'work_business'
  | 'family'
  | 'event_gift'
  | 'other';

// Repayment không cần taxonomy — chỉ biểu diễn "đây là khoản trả nợ", không mô tả
// mục đích/hình thức. Nếu sau này có nghiệp vụ khác hẳn (xoá nợ, điều chỉnh sai số)
// thì nên là DebtTransactionType mới (vd 'adjustment'), không phải category ở đây.
export type RepaymentCategory = 'repayment';

export type DebtTransactionCategory = LoanCategory | RepaymentCategory;

export const debtTransactionCategoryValues = [
  'personal',
  'food_drink',
  'shopping',
  'housing',
  'transportation',
  'travel',
  'healthcare',
  'education',
  'work_business',
  'family',
  'event_gift',
  'other',
  'repayment',
] as const satisfies readonly DebtTransactionCategory[];

type DebtTransactionCategoryOption = { value: DebtTransactionCategory; label: string; icon: IconComponent };

export const loanCategoryOptions: Array<DebtTransactionCategoryOption & { value: LoanCategory }> = [
  { value: 'personal', label: 'Cá nhân', icon: personIcon },
  { value: 'food_drink', label: 'Ăn uống', icon: foodIcon },
  { value: 'shopping', label: 'Mua sắm', icon: shopIcon },
  { value: 'housing', label: 'Nhà ở & sinh hoạt', icon: homeIcon },
  { value: 'transportation', label: 'Di chuyển', icon: automotiveIcon },
  { value: 'travel', label: 'Du lịch', icon: airplaneIcon },
  { value: 'healthcare', label: 'Sức khỏe', icon: pillIcon },
  { value: 'education', label: 'Học tập', icon: graduationCapIcon },
  { value: 'work_business', label: 'Công việc & kinh doanh', icon: businessIcon },
  { value: 'family', label: 'Gia đình', icon: familyIcon },
  { value: 'event_gift', label: 'Sự kiện & quà tặng', icon: giftIcon },
  { value: 'other', label: 'Khác', icon: otherIcon },
];

export const repaymentCategoryOptions: Array<DebtTransactionCategoryOption & { value: RepaymentCategory }> = [
  { value: 'repayment', label: 'Trả nợ', icon: moneyTransferIcon },
];

export function getDebtTransactionCategoryOptions(type: DebtTransactionType): DebtTransactionCategoryOption[] {
  return type === 'loan' ? loanCategoryOptions : repaymentCategoryOptions;
}

const categoryLabelMap: Record<DebtTransactionCategory, string> = {
  personal: 'Cá nhân',
  food_drink: 'Ăn uống',
  shopping: 'Mua sắm',
  housing: 'Nhà ở & sinh hoạt',
  transportation: 'Di chuyển',
  travel: 'Du lịch',
  healthcare: 'Sức khỏe',
  education: 'Học tập',
  work_business: 'Công việc & kinh doanh',
  family: 'Gia đình',
  event_gift: 'Sự kiện & quà tặng',
  other: 'Khác',
  repayment: 'Trả nợ',
};

export const categoryIconMap: Record<DebtTransactionCategory, IconComponent> = {
  personal: personIcon,
  food_drink: foodIcon,
  shopping: shopIcon,
  housing: homeIcon,
  transportation: automotiveIcon,
  travel: airplaneIcon,
  healthcare: pillIcon,
  education: graduationCapIcon,
  work_business: businessIcon,
  family: familyIcon,
  event_gift: giftIcon,
  other: otherIcon,
  repayment: moneyTransferIcon,
};

// Data cũ trước khi đổi taxonomy (vd 'cash_loan', 'paid_for_others', 'offset'...) sẽ
// không còn khớp key nào ở trên — fallback về 'other' để không vỡ hiển thị. Người dùng
// tự chọn lại danh mục mới khi sửa transaction đó (không migrate dữ liệu cũ).
export function getDebtTransactionCategoryLabel(category: DebtTransactionCategory | null | undefined): string {
  return categoryLabelMap[category ?? 'other'] ?? categoryLabelMap.other;
}

// Màu nền/icon tròn theo category — tái dùng đúng cặp màu Tailwind -100/-600 đã định
// nghĩa sẵn cho icon tương ứng ở hệ category chung (ICON_TONES trong
// modules/category/utils/category-icon.tsx), để không phát sinh thêm bảng màu riêng.
// Chỉ 2 cặp mới (personal: gray, work_business: slate) do chưa có icon tương ứng nào
// trong ICON_TONES từng dùng 2 tông này — chọn màu trung tính, chưa trùng với category
// nào khác trong map dưới đây, tránh vừa thêm màu vừa đụng hàng.
export const categoryIconToneMap: Record<DebtTransactionCategory, CategoryIconTone> = {
  personal: { iconColor: 'text-gray-600', iconBgColor: 'bg-gray-100' },
  food_drink: { iconColor: 'text-orange-600', iconBgColor: 'bg-orange-100' },
  shopping: { iconColor: 'text-fuchsia-600', iconBgColor: 'bg-fuchsia-100' },
  housing: { iconColor: 'text-teal-600', iconBgColor: 'bg-teal-100' },
  transportation: { iconColor: 'text-blue-600', iconBgColor: 'bg-blue-100' },
  travel: { iconColor: 'text-sky-600', iconBgColor: 'bg-sky-100' },
  healthcare: { iconColor: 'text-rose-600', iconBgColor: 'bg-rose-100' },
  education: { iconColor: 'text-indigo-600', iconBgColor: 'bg-indigo-100' },
  work_business: { iconColor: 'text-slate-600', iconBgColor: 'bg-slate-100' },
  family: { iconColor: 'text-blue-600', iconBgColor: 'bg-blue-100' },
  event_gift: { iconColor: 'text-rose-600', iconBgColor: 'bg-rose-100' },
  other: {
    iconColor: 'text-[var(--color-text-secondary)]',
    iconBgColor: 'bg-[var(--color-surface-subtle)]',
  },
  repayment: { iconColor: 'text-emerald-600', iconBgColor: 'bg-emerald-100' },
};

export function getDebtTransactionCategoryTone(
  category: DebtTransactionCategory | null | undefined,
): CategoryIconTone {
  return categoryIconToneMap[category ?? 'other'] ?? categoryIconToneMap.other;
}
