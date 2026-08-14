import type { RefinementCtx } from 'zod';

type SplitValuesInput = {
  amount: number;
  participantMemberIds: string[];
  splitMethod: string;
  splitValues?: Record<string, number> | undefined;
};

export function validateSplitValues(value: SplitValuesInput, ctx: RefinementCtx) {
  if (value.splitMethod === 'equal' || value.splitMethod === 'self') {
    return;
  }

  const values = value.splitValues ?? {};
  const entries = value.participantMemberIds.map((memberId) => ({
    memberId,
    value: values[memberId],
  }));

  for (const entry of entries) {
    if (entry.value === undefined) {
      ctx.addIssue(`Missing ${value.splitMethod} value for participant ${entry.memberId}.`);
    }
  }

  if (entries.some((entry) => entry.value === undefined)) {
    return;
  }

  if (value.splitMethod === 'exact') {
    for (const entry of entries) {
      if (!Number.isInteger(entry.value) || entry.value! <= 0) {
        ctx.addIssue('Each exact amount must be a positive integer.');
      }
    }

    const sum = entries.reduce((total, entry) => total + (entry.value ?? 0), 0);

    if (sum !== value.amount) {
      ctx.addIssue(`Sum of exact amounts (${sum}) must equal the total amount (${value.amount}).`);
    }
  }

  if (value.splitMethod === 'percentage') {
    for (const entry of entries) {
      if (!Number.isInteger(entry.value) || entry.value! <= 0 || entry.value! > 100) {
        ctx.addIssue('Each percentage must be an integer between 1 and 100.');
      }
    }

    const sum = entries.reduce((total, entry) => total + (entry.value ?? 0), 0);

    if (sum !== 100) {
      ctx.addIssue(`Total percentage (${sum}%) must equal 100%.`);
    }
  }

  if (value.splitMethod === 'shares') {
    for (const entry of entries) {
      if (!Number.isInteger(entry.value) || entry.value! < 1) {
        ctx.addIssue('Each shares value must be an integer of at least 1.');
      }
    }
  }
}
