import { describe, expect, it } from 'vitest';

import { resolveTodayBrief, type TodayBriefState } from '@/modules/today/utils/today-brief';

function makeState(overrides: Partial<TodayBriefState> = {}): TodayBriefState {
  return {
    attentionCount: 0,
    todayCount: 0,
    upcomingCount: 0,
    planCount: 0,
    ...overrides,
  };
}

describe('resolveTodayBrief', () => {
  it('prioritizes attention >= 3 over every other condition', () => {
    const result = resolveTodayBrief(makeState({ attentionCount: 3, todayCount: 10, upcomingCount: 5 }));

    expect(result.headline).toBe('Có vài việc cần bạn ưu tiên.');
    expect(result.supportingText).toBe('3 việc đang tồn đọng trước hôm nay.');
  });

  it('uses the "một chút việc" message for attention 1-2', () => {
    const result = resolveTodayBrief(makeState({ attentionCount: 2, todayCount: 5 }));

    expect(result.headline).toBe('Có một chút việc cần xử lý trước.');
    expect(result.supportingText).toBe('2 việc cần chú ý và 5 việc trong hôm nay.');
  });

  it('flags a heavy workload day at today >= 8, mentioning plan count', () => {
    const result = resolveTodayBrief(makeState({ todayCount: 8, planCount: 3 }));

    expect(result.headline).toBe('Hôm nay khá bận.');
    expect(result.supportingText).toBe('Bạn có 8 việc trong 3 kế hoạch.');
  });

  it('uses the "khá nhiều việc" message for today 4-7', () => {
    const result = resolveTodayBrief(makeState({ todayCount: 4 }));

    expect(result.headline).toBe('Hôm nay có khá nhiều việc.');
    expect(result.supportingText).toBe('4 việc đang chờ bạn xử lý.');
  });

  it('uses the light-day message for today 1-3', () => {
    const result = resolveTodayBrief(makeState({ todayCount: 3 }));

    expect(result.headline).toBe('Một ngày khá nhẹ nhàng.');
    expect(result.supportingText).toBe('Bạn có 3 việc cần xử lý hôm nay.');
  });

  it('uses the "khá thoải mái" message when today is empty but upcoming has items', () => {
    const result = resolveTodayBrief(makeState({ upcomingCount: 4 }));

    expect(result.headline).toBe('Hôm nay khá thoải mái.');
    expect(result.supportingText).toBe('Không có việc cần xử lý. 4 việc đang chờ phía trước.');
  });

  it('falls back to the calm/empty message when nothing is due at all', () => {
    const result = resolveTodayBrief(makeState());

    expect(result.headline).toBe('Mọi thứ đang ổn.');
    expect(result.supportingText).toBe('Hôm nay chưa có việc nào cần bạn xử lý.');
  });

  it('treats today >= 4 as higher priority than the today 1-3 case at the boundary', () => {
    const below = resolveTodayBrief(makeState({ todayCount: 3 }));
    const at = resolveTodayBrief(makeState({ todayCount: 4 }));

    expect(below.headline).toBe('Một ngày khá nhẹ nhàng.');
    expect(at.headline).toBe('Hôm nay có khá nhiều việc.');
  });

  it('treats today >= 8 as higher priority than the today 4-7 case at the boundary', () => {
    const below = resolveTodayBrief(makeState({ todayCount: 7, planCount: 2 }));
    const at = resolveTodayBrief(makeState({ todayCount: 8, planCount: 2 }));

    expect(below.headline).toBe('Hôm nay có khá nhiều việc.');
    expect(at.headline).toBe('Hôm nay khá bận.');
  });

  it('lets any attention item override a heavy today workload', () => {
    const result = resolveTodayBrief(makeState({ attentionCount: 1, todayCount: 9, planCount: 4 }));

    expect(result.headline).toBe('Có một chút việc cần xử lý trước.');
  });
});
