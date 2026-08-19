import { Timestamp } from 'firebase/firestore';
import { describe, expect, it } from 'vitest';

import {
  calculateAllCounterpartyLedgers,
  calculateCounterpartyLedger,
  calculateDebtAttentionItems,
  calculateOutstanding,
  calculatePlanDebtSummary,
  isDebtTransactionCashIn,
  validateRepaymentAmount,
} from '@/modules/debt-tracking/calculators/debt-calculators';
import type { DebtTransaction } from '@/modules/debt-tracking/types/debt-transaction';

let sequence = 0;

function makeTransaction(
  overrides: Partial<DebtTransaction> &
    Pick<DebtTransaction, 'direction' | 'type' | 'amount'>,
): DebtTransaction {
  sequence += 1;

  return {
    id: overrides.id ?? `transaction-${sequence}`,
    planId: 'plan-1',
    counterpartyMemberId: overrides.counterpartyMemberId ?? 'member-a',
    title: overrides.title ?? '',
    category: overrides.category ?? 'other',
    occurredAt:
      overrides.occurredAt ??
      Timestamp.fromDate(
        new Date(
          `2026-02-${String(10 + sequence).padStart(2, '0')}T00:00:00+07:00`,
        ),
      ),
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
      makeTransaction({
        direction: 'receivable',
        type: 'loan',
        amount: 10_000_000,
      }),
      makeTransaction({
        direction: 'receivable',
        type: 'loan',
        amount: 5_000_000,
      }),
      makeTransaction({
        direction: 'receivable',
        type: 'repayment',
        amount: 7_000_000,
      }),
    ];

    const ledger = calculateCounterpartyLedger('member-a', transactions);

    expect(ledger.receivableLoan).toBe(15_000_000);
    expect(ledger.receivableRepayment).toBe(7_000_000);
    expect(ledger.receivableOutstanding).toBe(8_000_000);
  });

  it('keeps receivable and payable ledgers independent — no auto-net (docs/debt-plan-specs.md #13/#14)', () => {
    const transactions = [
      makeTransaction({
        direction: 'receivable',
        type: 'loan',
        amount: 10_000_000,
      }),
      makeTransaction({
        direction: 'receivable',
        type: 'loan',
        amount: 5_000_000,
      }),
      makeTransaction({
        direction: 'receivable',
        type: 'repayment',
        amount: 7_000_000,
      }),
      makeTransaction({
        direction: 'payable',
        type: 'loan',
        amount: 3_000_000,
      }),
      makeTransaction({
        direction: 'payable',
        type: 'repayment',
        amount: 1_000_000,
      }),
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
      makeTransaction({
        counterpartyMemberId: 'member-a',
        direction: 'receivable',
        type: 'loan',
        amount: 10_000_000,
      }),
      makeTransaction({
        counterpartyMemberId: 'member-a',
        direction: 'receivable',
        type: 'repayment',
        amount: 3_000_000,
      }),
      makeTransaction({
        counterpartyMemberId: 'member-b',
        direction: 'payable',
        type: 'loan',
        amount: 2_000_000,
      }),
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
      makeTransaction({
        counterpartyMemberId: 'member-a',
        direction: 'receivable',
        type: 'loan',
        amount: 5_000_000,
      }),
      makeTransaction({
        counterpartyMemberId: 'member-a',
        direction: 'receivable',
        type: 'repayment',
        amount: 5_000_000,
      }),
    ];

    const summary = calculatePlanDebtSummary(transactions);

    expect(summary.totalReceivableOutstanding).toBe(0);
    expect(summary.activeCounterpartyCount).toBe(0);
    expect(summary.counterpartyCount).toBe(1);
  });
});

describe('validateRepaymentAmount', () => {
  const transactions = [
    makeTransaction({
      counterpartyMemberId: 'member-a',
      direction: 'receivable',
      type: 'loan',
      amount: 8_000_000,
    }),
  ];

  it('rejects a repayment larger than the current outstanding (docs/debt-plan-specs.md #20)', () => {
    const result = validateRepaymentAmount(
      transactions,
      'member-a',
      'receivable',
      10_000_000,
    );

    expect(result.valid).toBe(false);
    expect(result.outstanding).toBe(8_000_000);
  });

  it('accepts a repayment up to the current outstanding', () => {
    const result = validateRepaymentAmount(
      transactions,
      'member-a',
      'receivable',
      8_000_000,
    );

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
    const withoutExclusion = validateRepaymentAmount(
      allTransactions,
      'member-a',
      'receivable',
      6_000_000,
    );
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
      makeTransaction({
        direction: 'receivable',
        type: 'loan',
        amount: 4_000_000,
      }),
      makeTransaction({
        direction: 'payable',
        type: 'loan',
        amount: 9_000_000,
      }),
    ];

    expect(calculateOutstanding(transactions, 'receivable')).toBe(4_000_000);
    expect(calculateOutstanding(transactions, 'payable')).toBe(9_000_000);
  });
});

describe('isDebtTransactionCashIn', () => {
  it('is true for a payable loan (tôi vay -> nhận tiền) and a receivable repayment (được trả -> nhận tiền)', () => {
    expect(
      isDebtTransactionCashIn({ type: 'loan', direction: 'payable' }),
    ).toBe(true);
    expect(
      isDebtTransactionCashIn({ type: 'repayment', direction: 'receivable' }),
    ).toBe(true);
  });

  it('is false for a receivable loan (cho vay -> đưa tiền đi) and a payable repayment (tôi trả -> đưa tiền đi)', () => {
    expect(
      isDebtTransactionCashIn({ type: 'loan', direction: 'receivable' }),
    ).toBe(false);
    expect(
      isDebtTransactionCashIn({ type: 'repayment', direction: 'payable' }),
    ).toBe(false);
  });
});

describe('calculateDebtAttentionItems', () => {
  const now = new Date('2026-08-20T12:00:00+07:00');

  it('flags a loan overdue and one due within the upcoming window, ignores one far in the future', () => {
    const transactions = [
      makeTransaction({
        counterpartyMemberId: 'member-a',
        direction: 'receivable',
        type: 'loan',
        amount: 10_000_000,
        dueDate: Timestamp.fromDate(new Date('2026-08-10T00:00:00+07:00')),
      }),
      makeTransaction({
        counterpartyMemberId: 'member-b',
        direction: 'payable',
        type: 'loan',
        amount: 2_000_000,
        dueDate: Timestamp.fromDate(new Date('2026-08-24T00:00:00+07:00')),
      }),
      makeTransaction({
        counterpartyMemberId: 'member-c',
        direction: 'receivable',
        type: 'loan',
        amount: 5_000_000,
        dueDate: Timestamp.fromDate(new Date('2026-12-01T00:00:00+07:00')),
      }),
    ];
    const ledgers = calculateAllCounterpartyLedgers(transactions);

    const items = calculateDebtAttentionItems(transactions, ledgers, now);

    expect(items.map((item) => item.counterpartyMemberId)).toEqual([
      'member-a',
      'member-b',
    ]);
    expect(items[0]!.isOverdue).toBe(true);
    expect(items[1]!.isOverdue).toBe(false);
  });

  it('ignores a loan with no dueDate and a repayment with a dueDate (schema forbids it, but stay defensive)', () => {
    const transactions = [
      makeTransaction({
        direction: 'receivable',
        type: 'loan',
        amount: 1_000_000,
        dueDate: null,
      }),
      makeTransaction({
        direction: 'receivable',
        type: 'repayment',
        amount: 500_000,
        dueDate: Timestamp.fromDate(new Date('2026-08-10T00:00:00+07:00')),
      }),
    ];
    const ledgers = calculateAllCounterpartyLedgers(transactions);

    expect(calculateDebtAttentionItems(transactions, ledgers, now)).toEqual([]);
  });

  it('drops a group whose outstanding has already been fully repaid', () => {
    const transactions = [
      makeTransaction({
        counterpartyMemberId: 'member-a',
        direction: 'receivable',
        type: 'loan',
        amount: 5_000_000,
        dueDate: Timestamp.fromDate(new Date('2026-08-10T00:00:00+07:00')),
      }),
      makeTransaction({
        counterpartyMemberId: 'member-a',
        direction: 'receivable',
        type: 'repayment',
        amount: 5_000_000,
      }),
    ];
    const ledgers = calculateAllCounterpartyLedgers(transactions);

    expect(calculateDebtAttentionItems(transactions, ledgers, now)).toEqual([]);
  });

  it('sorts overdue before upcoming, each by nearest due date first', () => {
    const transactions = [
      makeTransaction({
        counterpartyMemberId: 'member-a',
        direction: 'receivable',
        type: 'loan',
        amount: 1_000_000,
        dueDate: Timestamp.fromDate(new Date('2026-08-05T00:00:00+07:00')),
      }),
      makeTransaction({
        counterpartyMemberId: 'member-b',
        direction: 'receivable',
        type: 'loan',
        amount: 1_000_000,
        dueDate: Timestamp.fromDate(new Date('2026-08-01T00:00:00+07:00')),
      }),
      makeTransaction({
        counterpartyMemberId: 'member-c',
        direction: 'receivable',
        type: 'loan',
        amount: 1_000_000,
        dueDate: Timestamp.fromDate(new Date('2026-08-25T00:00:00+07:00')),
      }),
      makeTransaction({
        counterpartyMemberId: 'member-d',
        direction: 'receivable',
        type: 'loan',
        amount: 1_000_000,
        dueDate: Timestamp.fromDate(new Date('2026-08-21T00:00:00+07:00')),
      }),
    ];
    const ledgers = calculateAllCounterpartyLedgers(transactions);

    const items = calculateDebtAttentionItems(transactions, ledgers, now);

    expect(items.map((item) => item.counterpartyMemberId)).toEqual([
      'member-b',
      'member-a',
      'member-d',
      'member-c',
    ]);
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

    expect(ledgers.map((ledger) => ledger.counterpartyMemberId)).toEqual([
      'member-b',
      'member-a',
    ]);
  });
});
