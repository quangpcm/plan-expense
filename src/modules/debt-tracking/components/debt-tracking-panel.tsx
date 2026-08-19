'use client';

import type { ComponentProps } from 'react';

import type { PlanDocument } from '@/modules/plan/types/plan';
import { resolvePlanDebtModel } from '@/modules/plan/utils/plan-type-config';
import { DebtNativeTab } from '@/modules/debt-tracking/components/debt-native-tab';
import { DebtTrackingTab } from '@/modules/debt-tracking/components/debt-tracking-tab';

type DebtTrackingPanelProps = {
  plan: Pick<PlanDocument, 'planType' | 'debtModel'>;
  legacyProps: ComponentProps<typeof DebtTrackingTab>;
  nativeProps: ComponentProps<typeof DebtNativeTab>;
};

// docs/debt-plan-specs.md #26: legacy (finance_aggregate) và native_debt là hai
// engine tách biệt hoàn toàn — panel chỉ là điểm rẽ nhánh render, không trộn dữ liệu.
export function DebtTrackingPanel({ plan, legacyProps, nativeProps }: DebtTrackingPanelProps) {
  if (resolvePlanDebtModel(plan) === 'native_debt') {
    return <DebtNativeTab {...nativeProps} />;
  }

  return <DebtTrackingTab {...legacyProps} />;
}
