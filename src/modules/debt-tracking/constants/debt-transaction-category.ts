import {
  Briefcase,
  Car,
  CircleEllipsis,
  Gift,
  GraduationCap,
  HeartPulse,
  Home,
  Plane,
  ShoppingBag,
  User,
  Users,
  UtensilsCrossed,
  Wallet,
  type LucideIcon,
} from 'lucide-react';

import type { DebtTransactionType } from '@/modules/debt-tracking/types/debt-transaction';

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

type DebtTransactionCategoryOption = { value: DebtTransactionCategory; label: string; icon: LucideIcon };

export const loanCategoryOptions: Array<DebtTransactionCategoryOption & { value: LoanCategory }> = [
  { value: 'personal', label: 'Cá nhân', icon: User },
  { value: 'food_drink', label: 'Ăn uống', icon: UtensilsCrossed },
  { value: 'shopping', label: 'Mua sắm', icon: ShoppingBag },
  { value: 'housing', label: 'Nhà ở & sinh hoạt', icon: Home },
  { value: 'transportation', label: 'Di chuyển', icon: Car },
  { value: 'travel', label: 'Du lịch', icon: Plane },
  { value: 'healthcare', label: 'Sức khỏe', icon: HeartPulse },
  { value: 'education', label: 'Học tập', icon: GraduationCap },
  { value: 'work_business', label: 'Công việc & kinh doanh', icon: Briefcase },
  { value: 'family', label: 'Gia đình', icon: Users },
  { value: 'event_gift', label: 'Sự kiện & quà tặng', icon: Gift },
  { value: 'other', label: 'Khác', icon: CircleEllipsis },
];

export const repaymentCategoryOptions: Array<DebtTransactionCategoryOption & { value: RepaymentCategory }> = [
  { value: 'repayment', label: 'Trả nợ', icon: Wallet },
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

export const categoryIconMap: Record<DebtTransactionCategory, LucideIcon> = {
  personal: User,
  food_drink: UtensilsCrossed,
  shopping: ShoppingBag,
  housing: Home,
  transportation: Car,
  travel: Plane,
  healthcare: HeartPulse,
  education: GraduationCap,
  work_business: Briefcase,
  family: Users,
  event_gift: Gift,
  other: CircleEllipsis,
  repayment: Wallet,
};

// Data cũ trước khi đổi taxonomy (vd 'cash_loan', 'paid_for_others', 'offset'...) sẽ
// không còn khớp key nào ở trên — fallback về 'other' để không vỡ hiển thị. Người dùng
// tự chọn lại danh mục mới khi sửa transaction đó (không migrate dữ liệu cũ).
export function getDebtTransactionCategoryLabel(category: DebtTransactionCategory | null | undefined): string {
  return categoryLabelMap[category ?? 'other'] ?? categoryLabelMap.other;
}
