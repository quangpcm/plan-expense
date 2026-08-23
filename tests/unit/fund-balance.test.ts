import { describe, expect, it } from 'vitest';

import { calculateFundBalance, resolveIncomeAllocation } from '@/modules/statistic/utils/fund-balance';

const OWNER = 'owner-member';

describe('resolveIncomeAllocation', () => {
  it('COMPAT-ALLOC-01: resolves a legacy income (undefined) to the plan owner', () => {
    expect(resolveIncomeAllocation({}, OWNER)).toBe(OWNER);
  });

  it('COMPAT-ALLOC-02: keeps an explicit null (unallocated) instead of falling back to owner', () => {
    expect(resolveIncomeAllocation({ allocatedToMemberId: null }, OWNER)).toBeNull();
  });

  it('keeps an explicit allocated member id as-is', () => {
    expect(resolveIncomeAllocation({ allocatedToMemberId: 'member-a' }, OWNER)).toBe('member-a');
  });
});

describe('calculateFundBalance', () => {
  it('FUND-01: income allocated to a member counts toward totalIncome but not the unallocated pool', () => {
    const result = calculateFundBalance({
      incomes: [{ amount: 1000, status: 'active', allocatedToMemberId: 'member-a' }],
      expenses: [],
      ownerMemberId: OWNER,
    });

    expect(result.totalIncome).toBe(1000);
    expect(result.totalAllocatedIncome).toBe(1000);
    expect(result.totalUnallocatedIncome).toBe(0);
    expect(result.unallocatedBalance).toBe(0);
  });

  it('FUND-02: income explicitly unallocated (null) stays in the unallocated pool', () => {
    const result = calculateFundBalance({
      incomes: [{ amount: 1000, status: 'active', allocatedToMemberId: null }],
      expenses: [],
      ownerMemberId: OWNER,
    });

    expect(result.totalUnallocatedIncome).toBe(1000);
    expect(result.unallocatedBalance).toBe(1000);
  });

  it('legacy income (undefined allocatedToMemberId) resolves to owner and is treated as allocated', () => {
    const result = calculateFundBalance({
      incomes: [{ amount: 1000, status: 'active' }],
      expenses: [],
      ownerMemberId: OWNER,
    });

    expect(result.totalAllocatedIncome).toBe(1000);
    expect(result.totalUnallocatedIncome).toBe(0);
  });

  it('FUND-ALLOC-01/02: Fund-paid expense consumes only the unallocated pool, never allocated income', () => {
    const result = calculateFundBalance({
      incomes: [
        { amount: 1000, status: 'active', allocatedToMemberId: 'member-a' },
        { amount: 500, status: 'active', allocatedToMemberId: null },
      ],
      expenses: [{ amount: 500, status: 'active', paymentSourceType: 'fund' }],
      ownerMemberId: OWNER,
    });

    expect(result.totalAllocatedIncome).toBe(1000);
    expect(result.totalUnallocatedIncome).toBe(500);
    expect(result.totalExpensePaidFromFund).toBe(500);
    expect(result.unallocatedBalance).toBe(0);
  });

  it('member-paid expense does not affect the fund balance', () => {
    const result = calculateFundBalance({
      incomes: [{ amount: 1000, status: 'active', allocatedToMemberId: null }],
      expenses: [{ amount: 400, status: 'active', paymentSourceType: 'member' }],
      ownerMemberId: OWNER,
    });

    expect(result.unallocatedBalance).toBe(1000);
  });

  it('ignores inactive/deleted incomes and expenses', () => {
    const result = calculateFundBalance({
      incomes: [
        { amount: 1000, status: 'active', allocatedToMemberId: null },
        { amount: 500, status: 'deleted', allocatedToMemberId: null },
      ],
      expenses: [
        { amount: 400, status: 'active', paymentSourceType: 'fund' },
        { amount: 200, status: 'deleted', paymentSourceType: 'fund' },
      ],
      ownerMemberId: OWNER,
    });

    expect(result.unallocatedBalance).toBe(1000 - 400);
  });

  it('FUND-ALLOC-03: unallocated balance can go negative when a Fund-paid expense exceeds it (caller must reject before persisting)', () => {
    const result = calculateFundBalance({
      incomes: [{ amount: 300, status: 'active', allocatedToMemberId: null }],
      expenses: [{ amount: 500, status: 'active', paymentSourceType: 'fund' }],
      ownerMemberId: OWNER,
    });

    expect(result.unallocatedBalance).toBe(-200);
  });
});
