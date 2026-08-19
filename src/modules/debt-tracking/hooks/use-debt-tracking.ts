'use client';

import { useMemo } from 'react';
import { Timestamp } from 'firebase/firestore';

import type { ExpenseDocument } from '@/modules/expense/types/expense';
import type { IncomeDocument } from '@/modules/income/types/income';
import type {
  DebtTrackingSummary,
  MemberDebtAggregate,
  MemberDebtSnapshot,
  MemberDebtTransaction,
} from '@/modules/debt-tracking/types/debt-tracking';

type UseDebtTrackingParams = {
  currentMemberId: string | null;
  enabled?: boolean;
  expenses: ExpenseDocument[];
  incomes: IncomeDocument[];
};

function maxTimestamp(left: Timestamp | null, right: Timestamp | null) {
  if (!left) {
    return right;
  }

  if (!right) {
    return left;
  }

  return left.toMillis() >= right.toMillis() ? left : right;
}

export function useDebtTracking({
  currentMemberId,
  enabled = true,
  expenses,
  incomes,
}: UseDebtTrackingParams) {
  const isActive = Boolean(enabled && currentMemberId);

  const aggregates = useMemo<MemberDebtAggregate[]>(() => {
    if (!isActive || !currentMemberId) {
      return [];
    }

    const aggregateMap = new Map<string, MemberDebtAggregate>();

    const upsert = (memberId: string) => {
      const existing = aggregateMap.get(memberId);

      if (existing) {
        return existing;
      }

      const created: MemberDebtAggregate = {
        snapshot: {
          memberId,
          totalLentAmount: 0,
          totalRepaidAmount: 0,
          outstandingAmount: 0,
          transactionCount: 0,
          lastTransactionAt: null,
          lastExpenseAt: null,
          lastIncomeAt: null,
        },
        transactions: [],
      };

      aggregateMap.set(memberId, created);
      return created;
    };

    for (const expense of expenses) {
      if (expense.paidByMemberId !== currentMemberId) {
        continue;
      }

      const counterpartMemberId =
        expense.participants.find((participant) => participant.memberId !== currentMemberId)?.memberId ?? null;

      if (!counterpartMemberId) {
        continue;
      }

      const aggregate = upsert(counterpartMemberId);

      aggregate.snapshot.totalLentAmount += expense.amount;
      aggregate.snapshot.transactionCount += 1;
      aggregate.snapshot.lastExpenseAt = maxTimestamp(aggregate.snapshot.lastExpenseAt, expense.spentAt);
      aggregate.snapshot.lastTransactionAt = maxTimestamp(aggregate.snapshot.lastTransactionAt, expense.spentAt);
      aggregate.transactions.push({
        transactionId: expense.id,
        memberId: counterpartMemberId,
        kind: 'expense',
        amount: expense.amount,
        occurredAt: expense.spentAt,
        title: expense.title,
        note: expense.note,
      });
    }

    for (const income of incomes) {
      if (income.contributedByMemberId === currentMemberId) {
        continue;
      }

      const aggregate = upsert(income.contributedByMemberId);

      aggregate.snapshot.totalRepaidAmount += income.amount;
      aggregate.snapshot.transactionCount += 1;
      aggregate.snapshot.lastIncomeAt = maxTimestamp(aggregate.snapshot.lastIncomeAt, income.receivedAt);
      aggregate.snapshot.lastTransactionAt = maxTimestamp(aggregate.snapshot.lastTransactionAt, income.receivedAt);
      aggregate.transactions.push({
        transactionId: income.id,
        memberId: income.contributedByMemberId,
        kind: 'income',
        amount: income.amount,
        occurredAt: income.receivedAt,
        title: income.title,
        note: income.note,
      });
    }

    return Array.from(aggregateMap.values())
      .map((aggregate) => ({
        snapshot: {
          ...aggregate.snapshot,
          outstandingAmount: Math.max(
            aggregate.snapshot.totalLentAmount - aggregate.snapshot.totalRepaidAmount,
            0,
          ),
        },
        transactions: aggregate.transactions.sort(
          (left, right) => right.occurredAt.toMillis() - left.occurredAt.toMillis(),
        ),
      }))
      .sort(
        (left, right) =>
          (right.snapshot.lastTransactionAt?.toMillis() ?? 0) - (left.snapshot.lastTransactionAt?.toMillis() ?? 0),
      );
  }, [currentMemberId, expenses, incomes, isActive]);

  const snapshots = useMemo<MemberDebtSnapshot[]>(
    () => aggregates.map((aggregate) => aggregate.snapshot),
    [aggregates],
  );

  const summary = useMemo<DebtTrackingSummary>(() => {
    const totalLentAmount = snapshots.reduce((total, snapshot) => total + snapshot.totalLentAmount, 0);
    const totalRepaidAmount = snapshots.reduce((total, snapshot) => total + snapshot.totalRepaidAmount, 0);
    const outstandingAmount = snapshots.reduce((total, snapshot) => total + snapshot.outstandingAmount, 0);

    return {
      totalLentAmount,
      totalRepaidAmount,
      outstandingAmount,
      counterpartCount: snapshots.length,
      activeCounterpartCount: snapshots.filter((snapshot) => snapshot.outstandingAmount > 0).length,
      settledCounterpartCount: snapshots.filter(
        (snapshot) => snapshot.outstandingAmount <= 0 && snapshot.totalRepaidAmount > 0,
      ).length,
      transactionCount: snapshots.reduce((total, snapshot) => total + snapshot.transactionCount, 0),
      lentOutstandingAmount: outstandingAmount,
      borrowedOutstandingAmount: 0,
    };
  }, [snapshots]);

  return {
    aggregates,
    snapshots,
    summary: isActive
      ? summary
      : {
          totalLentAmount: 0,
          totalRepaidAmount: 0,
          outstandingAmount: 0,
          counterpartCount: 0,
          activeCounterpartCount: 0,
          settledCounterpartCount: 0,
          transactionCount: 0,
          lentOutstandingAmount: 0,
          borrowedOutstandingAmount: 0,
        },
    isLoading: false,
    errorMessage: null,
  };
}
