'use client';

import { useState } from 'react';

import { AuthFormMessage } from '@/modules/auth/components/auth-form-message';
import { planCardVisualsByType } from '@/modules/plan/constants/plan-card-visuals';
import { PLAN_ARCHIVE_RETENTION_DAYS } from '@/modules/plan/constants/plan.constants';
import { planService } from '@/modules/plan/services';
import type { PlanSummary } from '@/modules/plan/types/plan';
import { getArchiveDaysRemaining } from '@/modules/plan/utils/plan-archive';
import { Button } from '@/shared/components/ui/button';
import { Card } from '@/shared/components/ui/card';

type ArchivedPlanListItemProps = {
  plan: PlanSummary;
  userId: string;
};

export function ArchivedPlanListItem({ plan, userId }: ArchivedPlanListItemProps) {
  const visual = planCardVisualsByType[plan.planType];
  const PlanTypeIcon = visual.icon;
  const daysRemaining = getArchiveDaysRemaining(plan.archivedAt);
  const isOwner = plan.role === 'owner';
  const [isRestoring, setIsRestoring] = useState(false);
  const [restoreError, setRestoreError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  async function handleRestore() {
    setIsRestoring(true);
    setRestoreError(null);

    try {
      await planService.unarchivePlan(userId, plan);
    } catch (error) {
      setRestoreError(error instanceof Error ? error.message : 'Hiện chưa thể khôi phục kế hoạch này.');
    } finally {
      setIsRestoring(false);
    }
  }

  async function handleDelete() {
    setIsDeleting(true);
    setDeleteError(null);

    try {
      await planService.hardDeleteArchivedPlan(userId, plan);
    } catch (error) {
      setDeleteError(error instanceof Error ? error.message : 'Hiện chưa thể xóa kế hoạch này.');
      setIsDeleting(false);
    }
  }

  return (
    <Card className="gap-3">
      <div className="flex items-center gap-3">
        <div
          className={`flex size-11 shrink-0 items-center justify-center rounded-full ${visual.iconBgClassName} ${visual.iconFgClassName}`}
        >
          <PlanTypeIcon className="size-5" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-base font-semibold text-[var(--color-foreground)]">{plan.planName}</h3>
          <p className="text-xs text-[var(--color-muted)]">
            {daysRemaining === null
              ? `Sẽ tự động xóa sau ${PLAN_ARCHIVE_RETENTION_DAYS} ngày`
              : daysRemaining > 0
                ? `Còn ${daysRemaining} ngày trước khi xóa vĩnh viễn`
                : 'Sẽ sớm bị xóa vĩnh viễn'}
          </p>
        </div>
      </div>

      {restoreError ? <AuthFormMessage message={restoreError} type="error" /> : null}
      {deleteError ? <AuthFormMessage message={deleteError} type="error" /> : null}

      {isOwner ? (
        showDeleteConfirm ? (
          <div className="space-y-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            <p>Xóa vĩnh viễn &ldquo;{plan.planName}&rdquo;? Toàn bộ dữ liệu sẽ mất và không thể khôi phục.</p>
            <div className="flex justify-end gap-2">
              <Button disabled={isDeleting} onClick={() => setShowDeleteConfirm(false)} variant="ghost">
                Hủy
              </Button>
              <Button disabled={isDeleting} onClick={handleDelete} variant="destructive">
                {isDeleting ? 'Đang xóa...' : 'Xóa vĩnh viễn'}
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-wrap justify-end gap-2">
            <Button disabled={isRestoring} onClick={handleRestore} variant="secondary">
              {isRestoring ? 'Đang khôi phục...' : 'Khôi phục'}
            </Button>
            <Button
              className="border border-red-200 bg-red-50 text-red-600 hover:bg-red-100"
              onClick={() => setShowDeleteConfirm(true)}
              variant="secondary"
            >
              Xóa vĩnh viễn
            </Button>
          </div>
        )
      ) : (
        <p className="text-xs text-[var(--color-subtle)]">Chỉ chủ sở hữu mới có thể khôi phục hoặc xóa kế hoạch này.</p>
      )}
    </Card>
  );
}
