import { describe, expect, it } from 'vitest';

import { SplitService } from '@/modules/expense/services/split.service';
import { AppError } from '@/shared/errors/app-error';

describe('SplitService.equal', () => {
  const service = new SplitService();

  it('splits evenly and spreads remainder from the first participant', () => {
    expect(service.equal(1000, ['m1', 'm2', 'm3'])).toEqual([
      { memberId: 'm1', amount: 334, percentage: null, shares: 1 },
      { memberId: 'm2', amount: 333, percentage: null, shares: 1 },
      { memberId: 'm3', amount: 333, percentage: null, shares: 1 },
    ]);
  });

  it('throws when participants are empty', () => {
    expect(() => service.equal(1000, [])).toThrow(AppError);
  });
});
