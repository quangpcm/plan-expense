import type { PlanType } from '@/modules/plan/types/plan';

export const planTypeOptions: Array<{ value: PlanType; label: string }> = [
  { value: 'travel', label: 'Travel' },
  { value: 'wedding', label: 'Wedding' },
  { value: 'saving', label: 'Saving' },
  { value: 'birthday', label: 'Birthday' },
  { value: 'event', label: 'Event' },
  { value: 'shared_living', label: 'Shared Living' },
  { value: 'general', label: 'General' },
];

