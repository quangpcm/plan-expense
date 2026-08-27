export type TodayBriefState = {
  attentionCount: number;
  todayCount: number;
  upcomingCount: number;
  planCount: number;
};

export type TodayBriefMessage = {
  headline: string;
  supportingText: string;
};

// Deterministic dominant-state matrix (docs/design-sys-v2/today-ui.md, Phase 1) — no AI/LLM
// generation, no combinatorial case table. Conditions are checked in the documented priority
// order and the first match wins, so adding a case later stays a simple insertion, not a matrix
// rebuild.
export function resolveTodayBrief(state: TodayBriefState): TodayBriefMessage {
  const { attentionCount, todayCount, upcomingCount, planCount } = state;

  if (attentionCount >= 3) {
    return {
      headline: 'Có vài việc cần bạn ưu tiên.',
      supportingText: `${attentionCount} việc đang tồn đọng trước hôm nay.`,
    };
  }

  if (attentionCount > 0) {
    return {
      headline: 'Có một chút việc cần xử lý trước.',
      supportingText: `${attentionCount} việc cần chú ý và ${todayCount} việc trong hôm nay.`,
    };
  }

  if (todayCount >= 8) {
    return {
      headline: 'Hôm nay khá bận.',
      supportingText: `Bạn có ${todayCount} việc trong ${planCount} kế hoạch.`,
    };
  }

  if (todayCount >= 4) {
    return {
      headline: 'Hôm nay có khá nhiều việc.',
      supportingText: `${todayCount} việc đang chờ bạn xử lý.`,
    };
  }

  if (todayCount >= 1) {
    return {
      headline: 'Một ngày khá nhẹ nhàng.',
      supportingText: `Bạn có ${todayCount} việc cần xử lý hôm nay.`,
    };
  }

  if (upcomingCount > 0) {
    return {
      headline: 'Hôm nay khá thoải mái.',
      supportingText: `Không có việc cần xử lý. ${upcomingCount} việc đang chờ phía trước.`,
    };
  }

  return {
    headline: 'Mọi thứ đang ổn.',
    supportingText: 'Hôm nay chưa có việc nào cần bạn xử lý.',
  };
}
