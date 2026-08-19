'use client';

import type { PlanMemberDocument } from '@/modules/member/types/member';
import type { TravelActivityDocument } from '@/modules/travel-activity/types/travel-activity';
import { Card } from '@/shared/components/ui/card';
import { formatDate } from '@/shared/utils/date';
import { timestampToDate } from '@/shared/utils/firebase';

type TravelActivityDetailProps = {
  activity: TravelActivityDocument;
  members: PlanMemberDocument[];
};

export function TravelActivityDetail({ activity, members }: TravelActivityDetailProps) {
  const participantNames = members
    .filter((member) => activity.participantMemberIds.includes(member.id))
    .map((member) => member.nickname);

  return (
    <Card>
      <div className="space-y-1">
        <p className="text-lg font-semibold text-slate-950">{activity.title}</p>
        <p className="text-sm text-slate-500">
          {formatDate(timestampToDate(activity.startsAt) ?? new Date())}
          {activity.endsAt ? ` - ${formatDate(timestampToDate(activity.endsAt) ?? new Date())}` : ''}
        </p>
      </div>
      {activity.locationName ? (
        <p className="text-sm leading-6 text-slate-600">Địa điểm: {activity.locationName}</p>
      ) : null}
      {activity.note ? <p className="text-sm leading-6 text-slate-600">{activity.note}</p> : null}
      <p className="text-sm leading-6 text-slate-600">
        {participantNames.length > 0 ? `Thành viên tham gia: ${participantNames.join(', ')}` : 'Chưa có thành viên tham gia.'}
      </p>
    </Card>
  );
}
