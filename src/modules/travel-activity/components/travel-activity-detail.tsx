'use client';

import { MapPinned, Pencil, Trash2 } from 'lucide-react';

import type { PlanMemberDocument } from '@/modules/member/types/member';
import { AttachmentGallery } from '@/modules/storage';
import { toMapHref } from '@/modules/travel-activity/utils/travel-activity-display';
import type { TravelActivityDocument } from '@/modules/travel-activity/types/travel-activity';
import { Card } from '@/shared/components/ui/card';
import { formatDate } from '@/shared/utils/date';
import { timestampToDate } from '@/shared/utils/firebase';

type TravelActivityDetailProps = {
  activity: TravelActivityDocument;
  members: PlanMemberDocument[];
  canManage: boolean;
  onEdit: (activity: TravelActivityDocument) => void;
  onDelete: (activity: TravelActivityDocument) => void;
};

export function TravelActivityDetail({
  activity,
  members,
  canManage,
  onEdit,
  onDelete,
}: TravelActivityDetailProps) {
  const participantNames = members
    .filter((member) => activity.participantMemberIds.includes(member.id))
    .map((member) => member.nickname);

  return (
    <Card>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1 space-y-1">
          <p className="text-lg font-semibold text-slate-950">{activity.title}</p>
          <p className="text-sm text-slate-500">
            {formatDate(timestampToDate(activity.startsAt) ?? new Date())}
            {activity.endsAt ? ` - ${formatDate(timestampToDate(activity.endsAt) ?? new Date())}` : ''}
          </p>
        </div>
        {canManage ? (
          <div className="flex shrink-0 gap-1">
            <button
              aria-label={`Sửa hoạt động ${activity.title}`}
              className="flex size-8 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100"
              onClick={() => onEdit(activity)}
              type="button"
            >
              <Pencil className="size-4" />
            </button>
            <button
              aria-label={`Xóa hoạt động ${activity.title}`}
              className="flex size-8 items-center justify-center rounded-full text-rose-600 hover:bg-rose-50"
              onClick={() => onDelete(activity)}
              type="button"
            >
              <Trash2 className="size-4" />
            </button>
          </div>
        ) : null}
      </div>
      {activity.locationName ? (
        <p className="flex items-center gap-1.5 text-sm leading-6 text-slate-600">
          <MapPinned className="size-4 shrink-0 text-slate-400" />
          Địa điểm:{' '}
          {activity.locationMapUrl ? (
            <a
              className="font-medium text-[var(--color-primary)] underline-offset-2 hover:underline"
              href={toMapHref(activity.locationMapUrl)}
              rel="noreferrer"
              target="_blank"
            >
              {activity.locationName}
            </a>
          ) : (
            activity.locationName
          )}
        </p>
      ) : null}
      {activity.note ? <p className="text-sm leading-6 text-slate-600">{activity.note}</p> : null}
      <p className="text-sm leading-6 text-slate-600">
        {participantNames.length > 0 ? `Thành viên tham gia: ${participantNames.join(', ')}` : 'Chưa có thành viên tham gia.'}
      </p>
      <AttachmentGallery attachments={activity.attachments} emptyLabel="Chưa có ảnh đính kèm." />
    </Card>
  );
}
