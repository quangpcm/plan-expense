import { Timestamp } from 'firebase/firestore';
import { describe, expect, it } from 'vitest';

import {
  calculateAllCounterpartyLedgers,
  calculateCounterpartyLedger,
  calculateOutstanding,
  calculatePlanDebtSummary,
  validateRepaymentAmount,
} from '@/modules/debt-tracking/calculators/debt-calculators';
import type { DebtTransaction } from '@/modules/debt-tracking/types/debt-transaction';

let sequence = 0;

function makeTransaction(overrides: Partial<DebtTransaction> & Pick<DebtTransaction, 'direction' | 'type' | 'amount'>): DebtTransaction {
  sequence += 1;

  return {
    id: overrides.id ?? `transaction-${sequence}`,
    planId: 'plan-1',
    counterpartyMemberId: overrides.counterpartyMemberId ?? 'member-a',
    title: overrides.title ?? '',
    category: overrides.category ?? 'other',
    occurredAt: overrides.occurredAt ?? Timestamp.fromDate(new Date(`2026-02-${String(10 + sequence).padStart(2, '0')}T00:00:00+07:00`)),
    dueDate: overrides.dueDate ?? null,
    note: overrides.note ?? null,
    attachments: overrides.attachments ?? [],
    createdByUserId: 'user-1',
    createdByMemberId: 'member-owner',
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
    ...overrides,
  };
}

describe('calculateCounterpartyLedger', () => {
  it('matches the docs/debt-plan-specs.md #9 worked example (10m + 5m loan, 7m repayment -> 8m outstanding)', () => {
    const transactions = [
      makeTransaction({ direction: 'receivable', type: 'loan', amount: 10_000_000 }),
      makeTransaction({ direction: 'receivable', type: 'loan', amount: 5_000_000 }),
      makeTransaction({ direction: 'receivable', type: 'repayment', amount: 7_000_000 }),
    ];

    const ledger = calculateCounterpartyLedger('member-a', transactions);

    expect(ledger.receivableLoan).toBe(15_000_000);
    expect(ledger.receivableRepayment).toBe(7_000_000);
    expect(ledger.receivableOutstanding).toBe(8_000_000);
  });

  it('keeps receivable and payable ledgers independent — no auto-net (docs/debt-plan-specs.md #13/#14)', () => {
    const transactions = [
      makeTransaction({ direction: 'receivable', type: 'loan', amount: 10_000_000 }),
      makeTransaction({ direction: 'receivable', type: 'loan', amount: 5_000_000 }),
      makeTransaction({ direction: 'receivable', type: 'repayment', amount: 7_000_000 }),
      makeTransaction({ direction: 'payable', type: 'loan', amount: 3_000_000 }),
      makeTransaction({ direction: 'payable', type: 'repayment', amount: 1_000_000 }),
    ];

    const ledger = calculateCounterpartyLedger('member-a', transactions);

    expect(ledger.receivableOutstanding).toBe(8_000_000);
    expect(ledger.payableOutstanding).toBe(2_000_000);
    expect(ledger.netPosition).toBe(6_000_000);
  });
});

describe('calculatePlanDebtSummary', () => {
  it('aggregates outstanding across every counterparty independently', () => {
    const transactions = [
      makeTransaction({ counterpartyMemberId: 'member-a', direction: 'receivable', type: 'loan', amount: 10_000_000 }),
      makeTransaction({ counterpartyMemberId: 'member-a', direction: 'receivable', type: 'repayment', amount: 3_000_000 }),
      makeTransaction({ counterpartyMemberId: 'member-b', direction: 'payable', type: 'loan', amount: 2_000_000 }),
    ];

    const summary = calculatePlanDebtSummary(transactions);

    expect(summary.totalReceivableOutstanding).toBe(7_000_000);
    expect(summary.totalPayableOutstanding).toBe(2_000_000);
    expect(summary.netPosition).toBe(5_000_000);
    expect(summary.counterpartyCount).toBe(2);
    expect(summary.activeCounterpartyCount).toBe(2);
  });

  it('excludes settled counterparties from the active count', () => {
    const transactions = [
      makeTransaction({ counterpartyMemberId: 'member-a', direction: 'receivable', type: 'loan', amount: 5_000_000 }),
      makeTransaction({ counterpartyMemberId: 'member-a', direction: 'receivable', type: 'repayment', amount: 5_000_000 }),
    ];

    const summary = calculatePlanDebtSummary(transactions);

    expect(summary.totalReceivableOutstanding).toBe(0);
    expect(summary.activeCounterpartyCount).toBe(0);
    expect(summary.counterpartyCount).toBe(1);
  });
});

describe('validateRepaymentAmount', () => {
  const transactions = [
    makeTransaction({ counterpartyMemberId: 'member-a', direction: 'receivable', type: 'loan', amount: 8_000_000 }),
  ];

  it('rejects a repayment larger than the current outstanding (docs/debt-plan-specs.md #20)', () => {
    const result = validateRepaymentAmount(transactions, 'member-a', 'receivable', 10_000_000);

    expect(result.valid).toBe(false);
    expect(result.outstanding).toBe(8_000_000);
  });

  it('accepts a repayment up to the current outstanding', () => {
    const result = validateRepaymentAmount(transactions, 'member-a', 'receivable', 8_000_000);

    expect(result.valid).toBe(true);
  });

  it('excludes the transaction being edited so re-validating its own amount does not double count it', () => {
    const existingRepayment = makeTransaction({
      id: 'repayment-1',
      counterpartyMemberId: 'member-a',
      direction: 'receivable',
      type: 'repayment',
      amount: 3_000_000,
    });
    const allTransactions = [...transactions, existingRepayment];

    // Without exclusion, outstanding would be 8m - 3m = 5m, rejecting a 6m edit.
    const withoutExclusion = validateRepaymentAmount(allTransactions, 'member-a', 'receivable', 6_000_000);
    expect(withoutExclusion.valid).toBe(false);

    const withExclusion = validateRepaymentAmount(
      allTransactions,
      'member-a',
      'receivable',
      6_000_000,
      'repayment-1',
    );
    expect(withExclusion.valid).toBe(true);
    expect(withExclusion.outstanding).toBe(8_000_000);
  });
});

describe('calculateOutstanding', () => {
  it('ignores transactions for a different direction', () => {
    const transactions = [
      makeTransaction({ direction: 'receivable', type: 'loan', amount: 4_000_000 }),
      makeTransaction({ direction: 'payable', type: 'loan', amount: 9_000_000 }),
    ];

    expect(calculateOutstanding(transactions, 'receivable')).toBe(4_000_000);
    expect(calculateOutstanding(transactions, 'payable')).toBe(9_000_000);
  });
});

describe('calculateAllCounterpartyLedgers', () => {
  it('returns one ledger per counterparty, sorted by most recent transaction first', () => {
    const older = makeTransaction({
      counterpartyMemberId: 'member-a',
      direction: 'receivable',
      type: 'loan',
      amount: 1_000_000,
      occurredAt: Timestamp.fromDate(new Date('2026-01-01T00:00:00+07:00')),
    });
    const newer = makeTransaction({
      counterpartyMemberId: 'member-b',
      direction: 'payable',
      type: 'loan',
      amount: 2_000_000,
      occurredAt: Timestamp.fromDate(new Date('2026-03-01T00:00:00+07:00')),
    });

    const ledgers = calculateAllCounterpartyLedgers([older, newer]);

    expect(ledgers.map((ledger) => ledger.counterpartyMemberId)).toEqual(['member-b', 'member-a']);
  });
});
