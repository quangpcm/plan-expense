'use client';

import { BarChart3, Receipt } from 'lucide-react';

import { AuthFormMessage } from '@/modules/auth/components/auth-form-message';
import { ExpenseDetailPanel } from '@/modules/expense/components/expense-detail-panel';
import { TimelineList } from '@/modules/expense/components/timeline-list';
import type { ExpenseDocument } from '@/modules/expense/types/expense';
import type { CategoryOption } from '@/modules/category/types/category';
import { IncomeDetailPanel } from '@/modules/income/components/income-detail-panel';
import type { IncomeDocument } from '@/modules/income/types/income';
import type { PlanMemberDocument } from '@/modules/member/types/member';
import type { MilestoneDocument } from '@/modules/milestone/types/milestone';
import type { PlanDocument } from '@/modules/plan/types/plan';
import type { TravelActivityDocument } from '@/modules/travel-activity/types/travel-activity';
import { Button } from '@/shared/components/ui/button';
import { Card } from '@/shared/components/ui/card';
import { SectionHeading } from '@/shared/components/ui/section-heading';

export type FinanceDesktopDetail =
  | ({ kind: 'expense'; expense: ExpenseDocument } & { canEdit: boolean; canDelete: boolean })
  | ({ kind: 'income'; income: IncomeDocument } & { canEdit: boolean; canDelete: boolean });

type FinanceTabProps = {
  categories: CategoryOption[];
  desktopDetail: FinanceDesktopDetail | null;
  desktopDetailError: string | null;
  errorMessage: string | null;
  expenses: ExpenseDocument[];
  incomes: IncomeDocument[];
  isDeletingDesktopDetail: boolean;
  isPlanEnded: boolean;
  members: PlanMemberDocument[];
  milestones: MilestoneDocument[];
  onCloseDesktopDetail: () => void;
  onDeleteDesktopDetail: () => void;
  onEditDesktopDetail: () => void;
  onOpenCreateExpense: (milestoneId: string) => void;
  onOpenCreateIncome: (milestoneId: string) => void;
  onOpenStatistic: () => void;
  onSelectExpense: (expense: ExpenseDocument) => void;
  onSelectIncome: (income: IncomeDocument) => void;
  onSelectedMilestoneChange: (milestoneId: string | null) => void;
  plan: PlanDocument;
  planId: string;
  selectedMilestoneId: string | null;
  travelActivities?: TravelActivityDocument[];
};

export function FinanceTab({
  categories,
  desktopDetail,
  desktopDetailError,
  errorMessage,
  expenses,
  incomes,
  isDeletingDesktopDetail,
  isPlanEnded,
  members,
  milestones,
  onCloseDesktopDetail,
  onDeleteDesktopDetail,
  onEditDesktopDetail,
  onOpenCreateExpense,
  onOpenCreateIncome,
  onOpenStatistic,
  onSelectExpense,
  onSelectIncome,
  onSelectedMilestoneChange,
  plan,
  planId,
  selectedMilestoneId,
  travelActivities = [],
}: FinanceTabProps) {
  const isDebtPlan = plan.planType === 'debt';
  const emptyStateDescription = isDebtPlan
    ? `Chưa có giao dịch finance nào cho khoản nợ này${
        selectedMilestoneId !== 'all' ? ' trong bộ lọc hiện tại' : ''
      }. Hãy ghi nhận khoản cho mượn khi bạn đưa tiền cho thành viên, hoặc ghi nhận khoản hoàn trả khi thành viên trả tiền lại cho bạn.`
    : null;
  const incomeActionLabel = isDebtPlan ? '+ Hoàn trả' : '+ Khoản Thu';
  const expenseActionLabel = isDebtPlan ? '+ Cho mượn' : '+ Khoản Chi';

  return (
    <>
      <div className="flex flex-col gap-4">
        <SectionHeading
          eyebrow={isDebtPlan ? 'Công nợ theo giao dịch' : 'Thu chi'}
          title={isDebtPlan ? 'Ghi nhận cho mượn và các khoản thành viên hoàn trả' : 'Dòng tiền kế hoạch'}
        />
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,0.7fr)_minmax(0,1.3fr)]">
          <div className="grid grid-cols-3 gap-2 lg:hidden">
            <Button
              className="min-w-0 justify-center px-3"
              onClick={onOpenStatistic}
              variant="secondary"
            >
              <BarChart3 className="size-4" />
              Thống kê
            </Button>
            {isPlanEnded ? (
              <Button className="min-w-0 px-3" disabled variant="secondary">
                {incomeActionLabel}
              </Button>
            ) : (
              <Button
                className="min-w-0 justify-center border border-[var(--color-income)]/14 bg-[var(--color-income-soft)] px-3 text-[var(--color-income)] hover:bg-[color:color-mix(in_srgb,var(--color-income)_16%,transparent)]"
                onClick={() => onOpenCreateIncome(selectedMilestoneId ?? '')}
                variant="secondary"
              >
                {incomeActionLabel}
              </Button>
            )}
            {isPlanEnded ? (
              <Button className="min-w-0 px-3" disabled>
                {expenseActionLabel}
              </Button>
            ) : (
              <Button
                className="min-w-0 justify-center px-3"
                onClick={() => onOpenCreateExpense(selectedMilestoneId ?? '')}
              >
                {expenseActionLabel}
              </Button>
            )}
          </div>

          <div className="hidden space-y-2 lg:block">
            <Button
              className="w-full justify-center"
              onClick={onOpenStatistic}
              variant="secondary"
            >
              <BarChart3 className="size-4" />
              Thống kê
            </Button>
          </div>
          <div className="hidden space-y-2 lg:block">
            <div className="grid grid-cols-2 gap-2">
              {isPlanEnded ? (
                <Button className="min-w-0 px-3" disabled variant="secondary">
                  {incomeActionLabel}
                </Button>
              ) : (
                <Button
                  className="min-w-0 justify-center border border-[var(--color-income)]/14 bg-[var(--color-income-soft)] text-[var(--color-income)] hover:bg-[color:color-mix(in_srgb,var(--color-income)_16%,transparent)]"
                  onClick={() => onOpenCreateIncome(selectedMilestoneId ?? '')}
                  variant="secondary"
                >
                  {incomeActionLabel}
                </Button>
              )}
              {isPlanEnded ? (
                <Button className="min-w-0 px-3" disabled>
                  {expenseActionLabel}
                </Button>
              ) : (
                <Button
                  className="min-w-0 justify-center"
                  onClick={() => onOpenCreateExpense(selectedMilestoneId ?? '')}
                >
                  {expenseActionLabel}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
      {errorMessage ? <AuthFormMessage message={errorMessage} type="error" /> : null}
      {isPlanEnded ? (
        <AuthFormMessage
          message={
            plan.status === 'completed'
              ? 'Kế hoạch này đã hoàn thành. Bạn vẫn xem được dữ liệu và báo cáo tổng kết, nhưng không thể thêm hay sửa giao dịch mới.'
              : 'Kế hoạch này đã dừng theo dõi. Bạn vẫn xem được dữ liệu và báo cáo tổng kết, nhưng không thể thêm hay sửa giao dịch mới.'
          }
          type="success"
        />
      ) : null}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <TimelineList
          categories={categories}
          expenses={expenses}
          incomes={incomes}
          members={members}
          milestones={milestones}
          onSelectedMilestoneChange={onSelectedMilestoneChange}
          onSelectExpense={onSelectExpense}
          onSelectIncome={onSelectIncome}
          planId={planId}
          selectedMilestoneId={selectedMilestoneId}
          travelActivities={travelActivities}
          {...(emptyStateDescription ? { emptyStateDescription } : {})}
        />
        <div className="hidden lg:block">
          {desktopDetail ? (
            desktopDetail.kind === 'expense' ? (
              <ExpenseDetailPanel
                canDelete={desktopDetail.canDelete}
                canEdit={desktopDetail.canEdit}
                categories={categories}
                errorMessage={desktopDetailError}
                expense={desktopDetail.expense}
                isDeleting={isDeletingDesktopDetail}
                members={members}
                milestones={milestones}
                onClose={onCloseDesktopDetail}
                onDelete={onDeleteDesktopDetail}
                onEdit={onEditDesktopDetail}
                planId={planId}
                travelActivities={travelActivities}
              />
            ) : (
              <IncomeDetailPanel
                canDelete={desktopDetail.canDelete}
                canEdit={desktopDetail.canEdit}
                categories={categories}
                errorMessage={desktopDetailError}
                income={desktopDetail.income}
                isDeleting={isDeletingDesktopDetail}
                members={members}
                milestones={milestones}
                onClose={onCloseDesktopDetail}
                onDelete={onDeleteDesktopDetail}
                onEdit={onEditDesktopDetail}
              />
            )
          ) : (
            <Card className="flex min-h-[360px] flex-col items-center justify-center gap-3 border-dashed border-[var(--color-border-subtle)] bg-[var(--color-surface-subtle)] text-center shadow-none">
              <div className="flex size-14 items-center justify-center rounded-2xl bg-[var(--color-surface-default)] text-[var(--color-brand-primary)] shadow-[0_12px_32px_rgba(15,23,42,0.06)]">
                <Receipt className="size-6" />
              </div>
              <div className="space-y-1.5">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-700">Chi tiết giao dịch</p>
                <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">Chưa chọn khoản nào</h3>
                <p className="max-w-xs text-sm leading-6 text-[var(--color-text-secondary)]">
                  Chọn một khoản chi hoặc khoản thu trong danh sách bên trái để xem đầy đủ thông
                  tin, người tham gia và ảnh đính kèm.
                </p>
              </div>
            </Card>
          )}
        </div>
      </div>
    </>
  );
}
