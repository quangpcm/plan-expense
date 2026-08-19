'use client';

import { AuthFormMessage } from '@/modules/auth/components/auth-form-message';
import type { PlanMemberDocument } from '@/modules/member/types/member';
import { SectionHeading } from '@/shared/components/ui/section-heading';
import { Card } from '@/shared/components/ui/card';
import { Skeleton } from '@/shared/components/ui/skeleton';
import {
  TravelActivityDetail,
  TravelActivityList,
} from '@/modules/travel-activity';
import type { TravelActivityDocument } from '@/modules/travel-activity/types/travel-activity';

type TravelItineraryTabProps = {
  activities: TravelActivityDocument[];
  canManage: boolean;
  detailActivity: TravelActivityDocument | null;
  errorMessage: string | null;
  isLoading: boolean;
  members: PlanMemberDocument[];
  onCreate: () => void;
  onDelete: (activity: TravelActivityDocument) => void;
  onEdit: (activity: TravelActivityDocument) => void;
  onSelect: (activity: TravelActivityDocument) => void;
};

export function TravelItineraryTab({
  activities,
  canManage,
  detailActivity,
  errorMessage,
  isLoading,
  members,
  onCreate,
  onDelete,
  onEdit,
  onSelect,
}: TravelItineraryTabProps) {
  return (
    <div className="space-y-5">
      <SectionHeading
        eyebrow="Lịch trình"
        title="Lịch trình chuyến đi"
        description="Theo dõi hoạt động, chặng dừng và các điểm mốc di chuyển của chuyến đi."
      />
      {errorMessage ? <AuthFormMessage message={errorMessage} type="error" /> : null}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
        <div className="space-y-4">
          {isLoading ? (
            <Skeleton className="h-52 rounded-[28px]" />
          ) : (
            <TravelActivityList
              activities={activities}
              canManage={canManage}
              members={members}
              onCreate={onCreate}
              onDelete={onDelete}
              onEdit={onEdit}
              onSelect={onSelect}
            />
          )}
        </div>
        <div className="space-y-4">
          {detailActivity ? (
            <TravelActivityDetail activity={detailActivity} members={members} />
          ) : (
            <Card className="border-slate-200 bg-slate-50 shadow-none">
              <p className="text-sm leading-6 text-slate-600">
                Chọn một activity để xem chi tiết lịch trình.
              </p>
            </Card>
          )}
          <Card>
            <p className="text-xs uppercase tracking-[0.16em] text-slate-400">
              Tổng hoạt động
            </p>
            <p className="mt-2 text-2xl font-semibold text-slate-950">
              {activities.length}
            </p>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Itinerary được tách khỏi planning checklist và finance, nên tab này chỉ tập trung vào lịch trình chuyến đi.
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}
