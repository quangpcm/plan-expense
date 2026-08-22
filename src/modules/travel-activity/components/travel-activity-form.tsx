'use client';

import { useState } from 'react';

import { AuthFormMessage } from '@/modules/auth/components/auth-form-message';
import type { AuthUser } from '@/modules/auth/types/auth';
import type { PlanMemberDocument } from '@/modules/member/types/member';
import type { PlanDocument } from '@/modules/plan/types/plan';
import { AttachmentPicker, type AttachmentDraft } from '@/modules/storage';
import { travelActivityService } from '@/modules/travel-activity/services';
import type {
  CreateTravelActivityInput,
  TravelActivityCategory,
  TravelActivityDocument,
  UpdateTravelActivityInput,
} from '@/modules/travel-activity/types/travel-activity';
import { TRAVEL_ACTIVITY_CATEGORIES } from '@/modules/travel-activity/utils/travel-activity-display';
import { Button } from '@/shared/components/ui/button';
import { DateTimeInput } from '@/shared/components/ui/date-time-input';
import { DropdownSelect } from '@/shared/components/ui/dropdown-select';
import { Input } from '@/shared/components/ui/input';
import { Textarea } from '@/shared/components/ui/textarea';
import { timestampToDate } from '@/shared/utils/firebase';

type TravelActivityFormProps = {
  plan: PlanDocument;
  currentUser: AuthUser;
  currentMember: PlanMemberDocument | null;
  activity?: TravelActivityDocument | undefined;
  onCancel: () => void;
  onSuccess: () => void;
};

type DurationPresetValue = '15' | '30' | '60' | '120' | '180' | 'custom' | 'undefined';

const DURATION_PRESET_OPTIONS: { value: DurationPresetValue; label: string }[] = [
  { value: '15', label: '15 phút' },
  { value: '30', label: '30 phút' },
  { value: '60', label: '1 giờ' },
  { value: '120', label: '2 giờ' },
  { value: '180', label: '3 giờ' },
  { value: 'custom', label: 'Tùy chỉnh' },
  { value: 'undefined', label: 'Không xác định' },
];

const DEFAULT_DURATION_PRESET: DurationPresetValue = '30';

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

// Nếu activity đang sửa không có endsAt -> preset là "Không xác định"; nếu độ dài
// start->end khớp đúng 1 preset cố định -> chọn preset đó; còn lại (mốc giờ lệch tay) -> "Tùy chỉnh".
function getInitialDurationPreset(startsAt: Date | null, endsAt: Date | null): DurationPresetValue {
  if (!endsAt) {
    return 'undefined';
  }

  if (!startsAt) {
    return 'custom';
  }

  const diffMinutes = Math.round((endsAt.getTime() - startsAt.getTime()) / (60 * 1000));
  const matchedPreset = DURATION_PRESET_OPTIONS.find((option) => option.value === String(diffMinutes));

  return matchedPreset ? matchedPreset.value : 'custom';
}

function resolveEndsAtValue(startsAt: string, preset: DurationPresetValue, customEndsAt: string) {
  if (preset === 'undefined') {
    return '';
  }

  if (preset === 'custom') {
    return customEndsAt;
  }

  if (!startsAt) {
    return '';
  }

  const start = new Date(startsAt);
  const end = new Date(start.getTime() + Number(preset) * 60 * 1000);

  return toLocalDateTimeValue(end);
}

export function TravelActivityForm({
  plan,
  currentUser,
  currentMember,
  activity,
  onCancel,
  onSuccess,
}: TravelActivityFormProps) {
  const activityStartsAtDate = timestampToDate(activity?.startsAt ?? null);
  const activityEndsAtDate = timestampToDate(activity?.endsAt ?? null);

  const [title, setTitle] = useState(activity?.title ?? '');
  const [category, setCategory] = useState<TravelActivityCategory>(activity?.category ?? 'other');
  const [locationName, setLocationName] = useState(activity?.locationName ?? '');
  const [locationMapUrl, setLocationMapUrl] = useState(activity?.locationMapUrl ?? '');
  const [isMapUrlVisible, setIsMapUrlVisible] = useState(Boolean(activity?.locationMapUrl));
  const [note, setNote] = useState(activity?.note ?? '');
  const [attachmentDrafts, setAttachmentDrafts] = useState<AttachmentDraft[]>(
    (activity?.attachments ?? []).map((attachment) => ({ kind: 'existing', id: attachment.id, attachment })),
  );
  const [isAttachmentsVisible, setIsAttachmentsVisible] = useState(Boolean(activity?.attachments?.length));
  const [startsAt, setStartsAt] = useState(toLocalDateTimeValue(activityStartsAtDate));
  const [durationPreset, setDurationPreset] = useState<DurationPresetValue>(
    activity ? getInitialDurationPreset(activityStartsAtDate, activityEndsAtDate) : DEFAULT_DURATION_PRESET,
  );
  const [customEndsAt, setCustomEndsAt] = useState(toLocalDateTimeValue(activityEndsAtDate));
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit() {
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const baseInput: CreateTravelActivityInput = {
        title,
        category,
        locationName,
        locationMapUrl: isMapUrlVisible ? locationMapUrl : '',
        note,
        startsAt,
        endsAt: resolveEndsAtValue(startsAt, durationPreset, customEndsAt),
        attachments: attachmentDrafts,
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
        <Input
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Ví dụ: Bay đến Tokyo"
          value={title}
        />
      </label>

      <div className="grid gap-2 text-sm text-slate-700">
        Danh mục
        <DropdownSelect
          onValueChange={(value) => setCategory(value as TravelActivityCategory)}
          options={TRAVEL_ACTIVITY_CATEGORIES}
          value={category}
        />
      </div>

      <div className="space-y-2">
        <label className="grid gap-2 text-sm text-slate-700">
          Địa điểm
          <Input
            onChange={(event) => setLocationName(event.target.value)}
            placeholder="Sân bay Narita, khách sạn..."
            value={locationName}
          />
        </label>
        {isMapUrlVisible ? (
          <label className="grid gap-2 text-sm text-slate-700">
            Link bản đồ
            <Input
              onChange={(event) => setLocationMapUrl(event.target.value)}
              placeholder="https://maps.google.com/..."
              value={locationMapUrl}
            />
          </label>
        ) : (
          <button
            className="w-fit text-sm font-medium text-[var(--color-primary)] hover:underline"
            onClick={() => setIsMapUrlVisible(true)}
            type="button"
          >
            + Thêm link bản đồ
          </button>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="grid gap-2 text-sm text-slate-700">
          Bắt đầu
          <DateTimeInput onChange={(event) => setStartsAt(event.target.value)} value={startsAt} />
        </label>
        <div className="grid gap-2 text-sm text-slate-700">
          Thời lượng
          <DropdownSelect
            onValueChange={(value) => setDurationPreset(value as DurationPresetValue)}
            options={DURATION_PRESET_OPTIONS}
            value={durationPreset}
          />
        </div>
      </div>

      {durationPreset === 'custom' ? (
        <label className="grid gap-2 text-sm text-slate-700">
          Kết thúc
          <DateTimeInput onChange={(event) => setCustomEndsAt(event.target.value)} value={customEndsAt} />
        </label>
      ) : null}

      <label className="grid gap-2 text-sm text-slate-700">
        Ghi chú
        <Textarea
          onChange={(event) => setNote(event.target.value)}
          placeholder="Ghi chú thêm cho hoạt động..."
          value={note}
        />
      </label>

      <div className="space-y-2">
        {isAttachmentsVisible ? (
          <div className="grid gap-2 text-sm text-slate-700">
            Ảnh đính kèm (vé, QR code, thông tin quan trọng...)
            <AttachmentPicker maxCount={5} onChange={setAttachmentDrafts} value={attachmentDrafts} />
          </div>
        ) : (
          <button
            className="w-fit text-sm font-medium text-[var(--color-primary)] hover:underline"
            onClick={() => setIsAttachmentsVisible(true)}
            type="button"
          >
            + Thêm đính kèm
          </button>
        )}
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
