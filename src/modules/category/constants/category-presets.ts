import type { CategoryPreset } from '@/modules/category/types/category';
import type { PlanType } from '@/modules/plan/types/plan';

const mapExpenseCategory = (names: string[]): CategoryPreset[] =>
  names.map((name) => ({
    name,
    categoryType: 'expense',
    icon: null,
  }));

const mapIncomeCategory = (names: string[]): CategoryPreset[] =>
  names.map((name) => ({
    name,
    categoryType: 'income',
    icon: null,
  }));

const defaultIncomeCategories = mapIncomeCategory(['Nap quy', 'Thu nhap', 'Tien lai', 'Hoan tien', 'Khac']);

export const categoryPresetsByPlanType: Record<PlanType, CategoryPreset[]> = {
  travel: [
    ...mapExpenseCategory([
      'An uong',
      'Di chuyen',
      'Nhien lieu',
      'Khach san',
      'Ve tham quan',
      'Giai tri',
      'Mua sam',
      'Phi dich vu',
      'Khac',
    ]),
    ...defaultIncomeCategories,
  ],
  wedding: [
    ...mapExpenseCategory([
      'Dia diem',
      'Trang tri',
      'Am thuc',
      'Trang phuc',
      'Trang diem',
      'Chup anh',
      'Quay phim',
      'Thiep cuoi',
      'MC va am thanh',
      'Qua tang',
      'Di chuyen',
      'Khac',
    ]),
    ...defaultIncomeCategories,
  ],
  saving: [
    ...mapExpenseCategory(['Rut quy', 'Mua sam', 'Phi dich vu', 'Chi phi phat sinh', 'Khac']),
    ...defaultIncomeCategories,
  ],
  birthday: [
    ...mapExpenseCategory([
      'Dia diem',
      'An uong',
      'Banh sinh nhat',
      'Trang tri',
      'Qua tang',
      'Giai tri',
      'Chup anh',
      'Khac',
    ]),
    ...defaultIncomeCategories,
  ],
  event: [
    ...mapExpenseCategory([
      'Dia diem',
      'Am thuc',
      'Trang tri',
      'Am thanh',
      'Nhan su',
      'Di chuyen',
      'Qua tang',
      'Truyen thong',
      'Khac',
    ]),
    ...defaultIncomeCategories,
  ],
  shared_living: [
    ...mapExpenseCategory([
      'Tien nha',
      'Dien',
      'Nuoc',
      'Internet',
      'An uong',
      'Do dung chung',
      'Sua chua',
      'Don ve sinh',
      'Khac',
    ]),
    ...defaultIncomeCategories,
  ],
  general: [
    ...mapExpenseCategory(['An uong', 'Di chuyen', 'Mua sam', 'Dich vu', 'Giai tri', 'Khac']),
    ...defaultIncomeCategories,
  ],
};

