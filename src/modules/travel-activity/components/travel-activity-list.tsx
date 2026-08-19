'use client';

import type { PlanMemberDocument } from '@/modules/member/types/member';
import type { TravelActivityDocument } from '@/modules/travel-activity/types/travel-activity';
import { Card } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { formatDate } from '@/shared/utils/date';
import { timestampToDate } from '@/shared/utils/firebase';

type TravelActivityListProps = {
  activities: TravelActivityDocument[];
  members: PlanMemberDocument[];
  canManage: boolean;
  onCreate: () => void;
  onEdit: (activity: TravelActivityDocument) => void;
  onDelete: (activity: TravelActivityDocument) => void;
  onSelect: (activity: TravelActivityDocument) => void;
};

export function TravelActivityList({
  activities,
  members,
  canManage,
  onCreate,
  onEdit,
  onDelete,
  onSelect,
}: TravelActivityListProps) {
  if (activities.length === 0) {
    return (
      <Card className="border-slate-200 bg-slate-50 shadow-none">
        <p className="text-sm leading-6 text-slate-600">
          Chưa có hoạt động nào trong itinerary. {canManage ? 'Bạn có thể tạo hoạt động đầu tiên ngay bây giờ.' : ''}
        </p>
        {canManage ? (
          <div>
            <Button onClick={onCreate} variant="secondary">
              Tạo hoạt động
            </Button>
          </div>
        ) : null}
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {canManage ? (
        <div className="flex justify-end">
          <Button onClick={onCreate}>Tạo hoạt động</Button>
        </div>
      ) : null}
      {activities.map((activity) => {
        const participantNames = members
          .filter((member) => activity.participantMemberIds.includes(member.id))
          .map((member) => member.nickname);

        return (
          <Card className="gap-3" key={activity.id}>
            <div className="flex items-start justify-between gap-3">
              <button className="min-w-0 flex-1 text-left" onClick={() => onSelect(activity)} type="button">
                <p className="text-lg font-semibold text-slate-950">{activity.title}</p>
                <p className="mt-1 text-sm text-slate-500">
                  {formatDate(timestampToDate(activity.startsAt) ?? new Date())}
                  {activity.locationName ? ` · ${activity.locationName}` : ''}
                </p>
              </button>
              {canManage ? (
                <div className="flex gap-2">
                  <Button onClick={() => onEdit(activity)} variant="ghost">
                    Sửa
                  </Button>
                  <Button
                    className="text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                    onClick={() => onDelete(activity)}
                    variant="ghost"
                  >
                    Xóa
                  </Button>
                </div>
              ) : null}
            </div>
            {activity.note ? <p className="text-sm leading-6 text-slate-600">{activity.note}</p> : null}
            <p className="text-sm text-slate-500">
              {participantNames.length > 0 ? `Tham gia: ${participantNames.join(', ')}` : 'Chưa gắn thành viên tham gia'}
            </p>
          </Card>
        );
      })}
    </div>
  );
}
