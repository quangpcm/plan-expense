import { describe, expect, it } from 'vitest';

import { SplitService, distributeByLargestRemainder } from '@/modules/expense/services/split.service';
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

describe('SplitService.exact', () => {
  const service = new SplitService();

  it('accepts exact amounts that sum to the total', () => {
    expect(
      service.exact(1000, [
        { memberId: 'm1', amount: 600 },
        { memberId: 'm2', amount: 400 },
      ]),
    ).toEqual([
      { memberId: 'm1', amount: 600, percentage: null, shares: null },
      { memberId: 'm2', amount: 400, percentage: null, shares: null },
    ]);
  });

  it('throws when the sum does not match the total amount', () => {
    expect(() =>
      service.exact(1000, [
        { memberId: 'm1', amount: 600 },
        { memberId: 'm2', amount: 300 },
      ]),
    ).toThrow(AppError);
  });

  it('throws on a non-integer or non-positive amount', () => {
    expect(() => service.exact(1000, [{ memberId: 'm1', amount: 0 }])).toThrow(AppError);
    expect(() => service.exact(1000, [{ memberId: 'm1', amount: 1000.5 }])).toThrow(AppError);
  });

  it('throws when participants are empty', () => {
    expect(() => service.exact(1000, [])).toThrow(AppError);
  });
});

describe('SplitService.percentage', () => {
  const service = new SplitService();

  it('distributes rounding remainder to the largest fraction', () => {
    expect(
      service.percentage(1001, [
        { memberId: 'm1', percentage: 50 },
        { memberId: 'm2', percentage: 30 },
        { memberId: 'm3', percentage: 20 },
      ]),
    ).toEqual([
      { memberId: 'm1', amount: 501, percentage: 50, shares: null },
      { memberId: 'm2', amount: 300, percentage: 30, shares: null },
      { memberId: 'm3', amount: 200, percentage: 20, shares: null },
    ]);
  });

  it('throws when percentages do not sum to 100', () => {
    expect(() =>
      service.percentage(1000, [
        { memberId: 'm1', percentage: 50 },
        { memberId: 'm2', percentage: 40 },
      ]),
    ).toThrow(AppError);
  });

  it('throws on a non-integer or out-of-range percentage', () => {
    expect(() => service.percentage(1000, [{ memberId: 'm1', percentage: 0 }])).toThrow(AppError);
    expect(() => service.percentage(1000, [{ memberId: 'm1', percentage: 101 }])).toThrow(AppError);
  });

  it('throws when participants are empty', () => {
    expect(() => service.percentage(1000, [])).toThrow(AppError);
  });
});

describe('SplitService.shares', () => {
  const service = new SplitService();

  it('splits proportionally to shares without rounding when it divides evenly', () => {
    expect(
      service.shares(700, [
        { memberId: 'm1', shares: 2 },
        { memberId: 'm2', shares: 1 },
        { memberId: 'm3', shares: 1 },
      ]),
    ).toEqual([
      { memberId: 'm1', amount: 350, percentage: null, shares: 2 },
      { memberId: 'm2', amount: 175, percentage: null, shares: 1 },
      { memberId: 'm3', amount: 175, percentage: null, shares: 1 },
    ]);
  });

  it('breaks rounding ties by original participant order', () => {
    expect(
      service.shares(100, [
        { memberId: 'm1', shares: 1 },
        { memberId: 'm2', shares: 1 },
        { memberId: 'm3', shares: 1 },
      ]),
    ).toEqual([
      { memberId: 'm1', amount: 34, percentage: null, shares: 1 },
      { memberId: 'm2', amount: 33, percentage: null, shares: 1 },
      { memberId: 'm3', amount: 33, percentage: null, shares: 1 },
    ]);
  });

  it('throws on shares below 1 or non-integer', () => {
    expect(() => service.shares(1000, [{ memberId: 'm1', shares: 0 }])).toThrow(AppError);
    expect(() => service.shares(1000, [{ memberId: 'm1', shares: 1.5 }])).toThrow(AppError);
  });

  it('throws when participants are empty', () => {
    expect(() => service.shares(1000, [])).toThrow(AppError);
  });
});

describe('distributeByLargestRemainder', () => {
  it('distributes the remainder to the largest fractional weights', () => {
    expect(distributeByLargestRemainder(1001, [50, 30, 20])).toEqual([501, 300, 200]);
  });

  it('breaks ties by original index order', () => {
    expect(distributeByLargestRemainder(100, [1, 1, 1])).toEqual([34, 33, 33]);
  });

  it('always sums back to the total amount for arbitrary weights', () => {
    const result = distributeByLargestRemainder(999, [7, 5, 3]);
    expect(result.reduce((sum, value) => sum + value, 0)).toBe(999);
  });
});
