import { ArrowLeftRight, CircleEllipsis, HandCoins, Handshake, Users, Wallet, type LucideIcon } from 'lucide-react';

import type { DebtTransactionType } from '@/modules/debt-tracking/types/debt-transaction';

export type LoanCategory = 'cash_loan' | 'paid_for_others' | 'shared_expense' | 'other';
export type RepaymentCategory = 'cash_repayment' | 'offset' | 'other';
export type DebtTransactionCategory = LoanCategory | RepaymentCategory;

export const debtTransactionCategoryValues = [
  'cash_loan',
  'paid_for_others',
  'shared_expense',
  'cash_repayment',
  'offset',
  'other',
] as const satisfies readonly DebtTransactionCategory[];

type DebtTransactionCategoryOption = { value: DebtTransactionCategory; label: string; icon: LucideIcon };

export const loanCategoryOptions: Array<DebtTransactionCategoryOption & { value: LoanCategory }> = [
  { value: 'cash_loan', label: 'Cho mượn tiền', icon: HandCoins },
  { value: 'paid_for_others', label: 'Trả hộ', icon: Handshake },
  { value: 'shared_expense', label: 'Chi hộ / mua chung', icon: Users },
  { value: 'other', label: 'Khác', icon: CircleEllipsis },
];

export const repaymentCategoryOptions: Array<DebtTransactionCategoryOption & { value: RepaymentCategory }> = [
  { value: 'cash_repayment', label: 'Trả tiền', icon: Wallet },
  { value: 'offset', label: 'Cấn trừ', icon: ArrowLeftRight },
  { value: 'other', label: 'Khác', icon: CircleEllipsis },
];

export function getDebtTransactionCategoryOptions(type: DebtTransactionType): DebtTransactionCategoryOption[] {
  return type === 'loan' ? loanCategoryOptions : repaymentCategoryOptions;
}

const categoryLabelMap: Record<DebtTransactionCategory, string> = {
  cash_loan: 'Cho mượn tiền',
  paid_for_others: 'Trả hộ',
  shared_expense: 'Chi hộ / mua chung',
  cash_repayment: 'Trả tiền',
  offset: 'Cấn trừ',
  other: 'Khác',
};

export const categoryIconMap: Record<DebtTransactionCategory, LucideIcon> = {
  cash_loan: HandCoins,
  paid_for_others: Handshake,
  shared_expense: Users,
  cash_repayment: Wallet,
  offset: ArrowLeftRight,
  other: CircleEllipsis,
};

// Data cũ trước khi có category sẽ không có field này — fallback về 'other'.
export function getDebtTransactionCategoryLabel(category: DebtTransactionCategory | null | undefined): string {
  return categoryLabelMap[category ?? 'other'] ?? categoryLabelMap.other;
}
