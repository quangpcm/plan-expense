import { AuthFormMessage } from '@/modules/auth/components/auth-form-message';
import { ExpenseDetailCard } from '@/modules/expense/components/expense-detail-card';
import type { ExpenseDocument } from '@/modules/expense/types/expense';
import type { Category } from '@/modules/category/types/category';
import type { PlanMemberDocument } from '@/modules/member/types/member';
import type { MilestoneDocument } from '@/modules/milestone/types/milestone';
import type { TravelActivityDocument } from '@/modules/travel-activity/types/travel-activity';
import { Button } from '@/shared/components/ui/button';

type ExpenseDetailPanelProps = {
  expense: ExpenseDocument;
  members: PlanMemberDocument[];
  categories: Category[];
  milestones: MilestoneDocument[];
  planId: string;
  travelActivities?: TravelActivityDocument[];
  canEdit: boolean;
  canDelete: boolean;
  isDeleting: boolean;
  errorMessage: string | null;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
};

// Nội dung "chi tiết khoản chi" dùng chung cho 2 nơi hiển thị: ResponsiveModal (mobile) và
// cột chi tiết trên desktop của FinanceTab — tránh lặp JSX + logic quyền giữa 2 nơi.
export function ExpenseDetailPanel({
  expense,
  members,
  categories,
  milestones,
  planId,
  travelActivities,
  canEdit,
  canDelete,
  isDeleting,
  errorMessage,
  onClose,
  onEdit,
  onDelete,
}: ExpenseDetailPanelProps) {
  return (
    <div className="space-y-4">
      <ExpenseDetailCard
        categories={categories}
        expense={expense}
        members={members}
        milestones={milestones}
        planId={planId}
        {...(travelActivities ? { travelActivities } : {})}
      />
      {errorMessage ? <AuthFormMessage message={errorMessage} type="error" /> : null}
      <div className="flex flex-wrap items-center justify-end gap-2">
        <Button onClick={onClose} variant="ghost">
          Đóng
        </Button>
        {canEdit ? <Button onClick={onEdit}>Chỉnh sửa</Button> : null}
        {canDelete ? (
          <Button disabled={isDeleting} onClick={onDelete} variant="ghost">
            Xoá
          </Button>
        ) : null}
      </div>
    </div>
  );
}
