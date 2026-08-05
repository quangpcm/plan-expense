import { AppError } from '@/shared/errors/app-error';
import type { ExpenseParticipant } from '@/modules/expense/types/expense';

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
}

