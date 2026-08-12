import type { MilestoneDocument } from '@/modules/milestone/types/milestone';
import { timestampToDate } from '@/shared/utils/firebase';

export const milestoneStatusLabel: Record<MilestoneDocument['status'], string> = {
  upcoming: 'Sắp tới',
  in_progress: 'Đang diễn ra',
  completed: 'Hoàn thành',
  cancelled: 'Đã hủy',
};

export function getDisplayedMilestoneStatus(milestone: MilestoneDocument): MilestoneDocument['status'] {
  if (milestone.status === 'cancelled' || milestone.status === 'completed') {
    return milestone.status;
  }

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startDate = timestampToDate(milestone.startDate);
  const endDate = timestampToDate(milestone.endDate);
  const normalizedStartDate = startDate
    ? new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate())
    : null;
  const normalizedEndDate = endDate
    ? new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate())
    : null;

  if (normalizedStartDate && today < normalizedStartDate) {
    return 'upcoming';
  }

  if (normalizedEndDate && today > normalizedEndDate) {
    return 'completed';
  }

  if (normalizedStartDate || normalizedEndDate) {
    return 'in_progress';
  }

  return milestone.status;
}

export function getMilestoneAnchorDate(milestone: MilestoneDocument): Date | null {
  return (
    timestampToDate(milestone.startDate) ?? timestampToDate(milestone.endDate) ?? timestampToDate(milestone.createdAt)
  );
}
