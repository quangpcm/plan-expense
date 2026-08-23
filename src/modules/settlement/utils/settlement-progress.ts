import type { MemberBalanceRow, StatisticSummary } from '@/modules/statistic/types/statistic';
import type { SettlementSuggestion } from '@/modules/settlement/types/settlement';

export type SettlementProgress =
  | { state: 'needs-fund-allocation' }
  | { state: 'balanced' }
  | {
      state: 'pending';
      pendingCount: number;
      pendingAmount: number;
      debtorCount: number;
      creditorCount: number;
      completedCount: number;
      // completedCount + số khoản còn cần chuyển NGAY LÚC NÀY — không phải một
      // hàng đợi cố định, vì suggest() luôn tính lại minimal-transfer set từ
      // đầu theo adjustedBalance hiện tại. Con số này có thể trôi nhẹ qua mỗi
      // lần confirm nếu bộ giao dịch tối ưu lại đổi, nhưng là xấp xỉ hợp lý
      // cho trường hợp phổ biến (vài thành viên).
      totalCount: number;
      completedPercent: number;
      // true khi chưa có settlement nào hoàn thành — dùng để bỏ tiền tố "Còn"
      // ở vòng đối soát đầu tiên (chỉ có ý nghĩa khi đã dở dang).
      isFirstRound: boolean;
    };

export function computeSettlementProgress(
  memberBalances: MemberBalanceRow[],
  suggestions: SettlementSuggestion[],
  overview: Pick<StatisticSummary, 'pendingSettlementAmount' | 'settledAmount'>,
  requiresFundAllocation: boolean,
  completedSettlementsCount: number,
): SettlementProgress {
  if (requiresFundAllocation) {
    return { state: 'needs-fund-allocation' };
  }

  if (suggestions.length === 0) {
    return { state: 'balanced' };
  }

  const debtorCount = memberBalances.filter((row) => row.adjustedBalance < 0).length;
  const creditorCount = memberBalances.filter((row) => row.adjustedBalance > 0).length;
  const totalCount = completedSettlementsCount + suggestions.length;

  return {
    state: 'pending',
    pendingCount: suggestions.length,
    pendingAmount: overview.pendingSettlementAmount,
    debtorCount,
    creditorCount,
    completedCount: completedSettlementsCount,
    totalCount,
    completedPercent: totalCount > 0 ? Math.round((completedSettlementsCount / totalCount) * 100) : 0,
    isFirstRound: overview.settledAmount === 0,
  };
}
