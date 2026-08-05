import type { PlanType } from '@/modules/plan/types/plan';

export const planTypeOptions: Array<{ value: PlanType; label: string }> = [
  { value: 'travel', label: 'Du lịch' },
  { value: 'wedding', label: 'Cưới hỏi' },
  { value: 'saving', label: 'Tiết kiệm' },
  { value: 'birthday', label: 'Sinh nhật' },
  { value: 'event', label: 'Sự kiện' },
  { value: 'shared_living', label: 'Sinh hoạt chung' },
  { value: 'general', label: 'Tổng hợp' },
];
