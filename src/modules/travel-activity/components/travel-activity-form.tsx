'use client';

import { useState } from 'react';

import { AuthFormMessage } from '@/modules/auth/components/auth-form-message';
import type { AuthUser } from '@/modules/auth/types/auth';
import type { PlanMemberDocument } from '@/modules/member/types/member';
import type { PlanDocument } from '@/modules/plan/types/plan';
import { travelActivityService } from '@/modules/travel-activity/services';
import type {
  CreateTravelActivityInput,
  TravelActivityDocument,
  UpdateTravelActivityInput,
} from '@/modules/travel-activity/types/travel-activity';
import { Button } from '@/shared/components/ui/button';
import { timestampToDate } from '@/shared/utils/firebase';

type TravelActivityFormProps = {
  plan: PlanDocument;
  members: PlanMemberDocument[];
  currentUser: AuthUser;
  currentMember: PlanMemberDocument | null;
  activity?: TravelActivityDocument | undefined;
  onCancel: () => void;
  onSuccess: () => void;
};

function toLocalDateTimeValue(value: Date | null) {
  if (!value) {
    return '';
  }

  const year = value.getFullYear();
  const month = `${value.getMonth() + 1}`.padStart(2, '0');
  const day = `${value.getDate()}`.padStart(2, '0');
  const hours = `${value.getHours()}`.padStart(2, '0');
  const minutes = `${value.getMinutes()}`.padStart(2, '0');

  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

export function TravelActivityForm({
  plan,
  members,
  currentUser,
  currentMember,
  activity,
  onCancel,
  onSuccess,
}: TravelActivityFormProps) {
  const [title, setTitle] = useState(activity?.title ?? '');
  const [locationName, setLocationName] = useState(activity?.locationName ?? '');
  const [note, setNote] = useState(activity?.note ?? '');
  const [startsAt, setStartsAt] = useState(
    toLocalDateTimeValue(timestampToDate(activity?.startsAt ?? null)),
  );
  const [endsAt, setEndsAt] = useState(
    toLocalDateTimeValue(timestampToDate(activity?.endsAt ?? null)),
  );
  const [participantMemberIds, setParticipantMemberIds] = useState<string[]>(
    activity?.participantMemberIds ?? [],
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit() {
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const baseInput: CreateTravelActivityInput = {
        title,
        locationName,
        note,
        startsAt,
        endsAt,
        participantMemberIds,
      };

      if (activity) {
        const updateInput: UpdateTravelActivityInput = {
          activityId: activity.id,
          ...baseInput,
        };

        await travelActivityService.updateActivity(plan, updateInput, currentUser, currentMember);
      } else {
        await travelActivityService.createActivity(plan, baseInput, currentUser, currentMember);
      }

      onSuccess();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to save itinerary activity.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-4">
      {errorMessage ? <AuthFormMessage message={errorMessage} type="error" /> : null}
      <label className="grid gap-2 text-sm text-slate-700">
        Tiêu đề
        <input
          className="rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-slate-400"
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Ví dụ: Bay đến Tokyo"
          value={title}
        />
      </label>
      <label className="grid gap-2 text-sm text-slate-700">
        Địa điểm
        <input
          className="rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-slate-400"
          onChange={(event) => setLocationName(event.target.value)}
          placeholder="Sân bay Narita, khách sạn..."
          value={locationName}
        />
      </label>
      <div className="grid gap-4 md:grid-cols-2">
        <label className="grid gap-2 text-sm text-slate-700">
          Bắt đầu
          <input
            className="rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-slate-400"
            onChange={(event) => setStartsAt(event.target.value)}
            type="datetime-local"
            value={startsAt}
          />
        </label>
        <label className="grid gap-2 text-sm text-slate-700">
          Kết thúc
          <input
            className="rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-slate-400"
            onChange={(event) => setEndsAt(event.target.value)}
            type="datetime-local"
            value={endsAt}
          />
        </label>
      </div>
      <label className="grid gap-2 text-sm text-slate-700">
        Ghi chú
        <textarea
          className="min-h-28 rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-slate-400"
          onChange={(event) => setNote(event.target.value)}
          placeholder="Ghi chú thêm cho hoạt động..."
          value={note}
        />
      </label>
      <div className="grid gap-2 text-sm text-slate-700">
        Thành viên tham gia
        <div className="grid gap-2 rounded-2xl border border-slate-200 p-3">
          {members.map((member) => {
            const isChecked = participantMemberIds.includes(member.id);

            return (
              <label className="flex items-center gap-3 text-sm text-slate-700" key={member.id}>
                <input
                  checked={isChecked}
                  onChange={(event) =>
                    setParticipantMemberIds((current) =>
                      event.target.checked
                        ? [...current, member.id]
                        : current.filter((memberId) => memberId !== member.id),
                    )
                  }
                  type="checkbox"
                />
                <span>{member.nickname}</span>
              </label>
            );
          })}
        </div>
      </div>
      <div className="flex justify-end gap-2">
        <Button onClick={onCancel} variant="ghost">
          Hủy
        </Button>
        <Button disabled={isSubmitting} onClick={() => void handleSubmit()}>
          {isSubmitting ? 'Đang lưu...' : activity ? 'Lưu thay đổi' : 'Tạo hoạt động'}
        </Button>
      </div>
    </div>
  );
}
