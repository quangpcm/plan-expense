import type { MilestoneDocument } from '@/modules/milestone/types/milestone';
import { timestampToDate } from '@/shared/utils/firebase';

export const milestoneStatusLabel: Record<MilestoneDocument['status'], string> = {
  upcoming: 'Sắp tới',
  in_progress: 'Đang diễn ra',
  completed: 'Hoàn thành',
  cancelled: 'Đã hủy',
};

export function getMilestoneAnchorDate(milestone: MilestoneDocument): Date | null {
  return (
    timestampToDate(milestone.startDate) ?? timestampToDate(milestone.endDate) ?? timestampToDate(milestone.createdAt)
  );
}
