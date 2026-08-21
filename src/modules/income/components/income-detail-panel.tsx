import { AuthFormMessage } from '@/modules/auth/components/auth-form-message';
import { IncomeDetailCard } from '@/modules/income/components/income-detail-card';
import type { IncomeDocument } from '@/modules/income/types/income';
import type { Category } from '@/modules/category/types/category';
import type { PlanMemberDocument } from '@/modules/member/types/member';
import type { MilestoneDocument } from '@/modules/milestone/types/milestone';
import { Button } from '@/shared/components/ui/button';

type IncomeDetailPanelProps = {
  income: IncomeDocument;
  members: PlanMemberDocument[];
  categories: Category[];
  milestones: MilestoneDocument[];
  canEdit: boolean;
  canDelete: boolean;
  isDeleting: boolean;
  errorMessage: string | null;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
};

// Nội dung "chi tiết khoản thu" dùng chung cho 2 nơi hiển thị: ResponsiveModal (mobile) và
// cột chi tiết trên desktop của FinanceTab — tránh lặp JSX + logic quyền giữa 2 nơi.
export function IncomeDetailPanel({
  income,
  members,
  categories,
  milestones,
  canEdit,
  canDelete,
  isDeleting,
  errorMessage,
  onClose,
  onEdit,
  onDelete,
}: IncomeDetailPanelProps) {
  return (
    <div className="space-y-4">
      <IncomeDetailCard categories={categories} income={income} members={members} milestones={milestones} />
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
