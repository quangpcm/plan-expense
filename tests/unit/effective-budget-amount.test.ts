import { describe, expect, it } from 'vitest';

import { getEffectiveBudgetAmount } from '@/modules/plan/utils/get-effective-budget-amount';

describe('getEffectiveBudgetAmount', () => {
  it('returns the plan budget when it is larger than the todo estimate total', () => {
    expect(getEffectiveBudgetAmount(250_000_000, 120_000_000)).toBe(250_000_000);
  });

  it('returns the todo estimate total when it is larger than the plan budget', () => {
    expect(getEffectiveBudgetAmount(250_000_000, 488_700_000)).toBe(488_700_000);
  });

  it('treats missing values as zero', () => {
    expect(getEffectiveBudgetAmount(null, undefined)).toBe(0);
  });
});
