export type CategoryType = 'expense' | 'income';

export type Category = {
  id: string;
  name: string;
  categoryType: CategoryType;
  icon: string | null;
  iconColor: string;
  iconBgColor: string;
};

