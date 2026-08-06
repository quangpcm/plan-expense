import { AppError } from '@/shared/errors/app-error';
import type { ExpenseParticipant } from '@/modules/expense/types/expense';

type ExactEntry = { memberId: string; amount: number };
type PercentageEntry = { memberId: string; percentage: number };
type SharesEntry = { memberId: string; shares: number };

export function distributeByLargestRemainder(totalAmount: number, weights: number[]): number[] {
  const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
  const rawShares = weights.map((weight) => (totalAmount * weight) / totalWeight);
  const floorShares = rawShares.map((value) => Math.floor(value));
  const remainder = totalAmount - floorShares.reduce((sum, value) => sum + value, 0);

  const order = rawShares
    .map((value, index) => ({ index, fraction: value - floorShares[index]! }))
    .sort((a, b) => (b.fraction !== a.fraction ? b.fraction - a.fraction : a.index - b.index));

  const result = [...floorShares];

  for (let i = 0; i < remainder; i += 1) {
    const target = order[i]!.index;
    result[target] = result[target]! + 1;
  }

  return result;
}

export class SplitService {
  equal(amount: number, memberIds: string[]): ExpenseParticipant[] {
    if (memberIds.length === 0) {
      throw new AppError('Participants cannot be empty.', 'EXPENSE_PARTICIPANTS_REQUIRED', 400);
    }

    const baseAmount = Math.floor(amount / memberIds.length);
    let remainder = amount % memberIds.length;

    return memberIds.map((memberId) => {
      const extra = remainder > 0 ? 1 : 0;
      remainder = Math.max(0, remainder - 1);

      return {
        memberId,
        amount: baseAmount + extra,
        percentage: null,
        shares: 1,
      };
    });
  }

  exact(amount: number, entries: ExactEntry[]): ExpenseParticipant[] {
    if (entries.length === 0) {
      throw new AppError('Participants cannot be empty.', 'EXPENSE_PARTICIPANTS_REQUIRED', 400);
    }

    for (const entry of entries) {
      if (!Number.isInteger(entry.amount) || entry.amount <= 0) {
        throw new AppError('Each exact amount must be a positive integer.', 'EXPENSE_SPLIT_INVALID_AMOUNT', 400);
      }
    }

    const sum = entries.reduce((total, entry) => total + entry.amount, 0);

    if (sum !== amount) {
      throw new AppError(
        `Sum of exact amounts (${sum}) must equal the total amount (${amount}).`,
        'EXPENSE_SPLIT_AMOUNT_MISMATCH',
        400,
      );
    }

    return entries.map((entry) => ({
      memberId: entry.memberId,
      amount: entry.amount,
      percentage: null,
      shares: null,
    }));
  }

  percentage(amount: number, entries: PercentageEntry[]): ExpenseParticipant[] {
    if (entries.length === 0) {
      throw new AppError('Participants cannot be empty.', 'EXPENSE_PARTICIPANTS_REQUIRED', 400);
    }

    for (const entry of entries) {
      if (!Number.isInteger(entry.percentage) || entry.percentage <= 0 || entry.percentage > 100) {
        throw new AppError(
          'Each percentage must be an integer between 1 and 100.',
          'EXPENSE_SPLIT_INVALID_PERCENTAGE',
          400,
        );
      }
    }

    const sum = entries.reduce((total, entry) => total + entry.percentage, 0);

    if (sum !== 100) {
      throw new AppError(
        `Total percentage (${sum}%) must equal 100%.`,
        'EXPENSE_SPLIT_PERCENTAGE_MISMATCH',
        400,
      );
    }

    const amounts = distributeByLargestRemainder(amount, entries.map((entry) => entry.percentage));

    return entries.map((entry, index) => ({
      memberId: entry.memberId,
      amount: amounts[index]!,
      percentage: entry.percentage,
      shares: null,
    }));
  }

  shares(amount: number, entries: SharesEntry[]): ExpenseParticipant[] {
    if (entries.length === 0) {
      throw new AppError('Participants cannot be empty.', 'EXPENSE_PARTICIPANTS_REQUIRED', 400);
    }

    for (const entry of entries) {
      if (!Number.isInteger(entry.shares) || entry.shares < 1) {
        throw new AppError('Each shares value must be an integer of at least 1.', 'EXPENSE_SPLIT_INVALID_SHARES', 400);
      }
    }

    const amounts = distributeByLargestRemainder(amount, entries.map((entry) => entry.shares));

    return entries.map((entry, index) => ({
      memberId: entry.memberId,
      amount: amounts[index]!,
      percentage: null,
      shares: entry.shares,
    }));
  }
}
