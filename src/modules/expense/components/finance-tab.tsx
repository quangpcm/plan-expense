'use client';

import { BarChart3 } from 'lucide-react';

import { AuthFormMessage } from '@/modules/auth/components/auth-form-message';
import { TimelineList } from '@/modules/expense/components/timeline-list';
import type { ExpenseDocument } from '@/modules/expense/types/expense';
import type { CategoryOption } from '@/modules/category/types/category';
import type { IncomeDocument } from '@/modules/income/types/income';
import type { PlanMemberDocument } from '@/modules/member/types/member';
import type { MilestoneDocument } from '@/modules/milestone/types/milestone';
import type { PlanDocument } from '@/modules/plan/types/plan';
import type { TravelActivityDocument } from '@/modules/travel-activity/types/travel-activity';
import { Button } from '@/shared/components/ui/button';
import { SectionHeading } from '@/shared/components/ui/section-heading';

type FinanceTabProps = {
  categories: CategoryOption[];
  errorMessage: string | null;
  expenses: ExpenseDocument[];
  incomes: IncomeDocument[];
  isPlanEnded: boolean;
  members: PlanMemberDocument[];
  milestones: MilestoneDocument[];
  onOpenCreateExpense: (milestoneId: string) => void;
  onOpenStatistic: () => void;
  onSelectExpense: (expense: ExpenseDocument) => void;
  onSelectedMilestoneChange: (milestoneId: string | null) => void;
  plan: PlanDocument;
  planId: string;
  selectedMilestoneId: string | null;
  travelActivities?: TravelActivityDocument[];
};

export function FinanceTab({
  categories,
  errorMessage,
  expenses,
  incomes,
  isPlanEnded,
  members,
  milestones,
  onOpenCreateExpense,
  onOpenStatistic,
  onSelectExpense,
  onSelectedMilestoneChange,
  plan,
  planId,
  selectedMilestoneId,
  travelActivities = [],
}: FinanceTabProps) {
  const isDebtPlan = plan.planType === 'debt';
  const incomeHref = `/plans/${planId}/incomes/new${
    selectedMilestoneId
      ? `?milestoneId=${selectedMilestoneId}&returnTab=timeline`
      : '?returnTab=timeline'
  }`;
  const expenseHref = `/plans/${planId}/expenses/new${
    selectedMilestoneId
      ? `?milestoneId=${selectedMilestoneId}&returnTab=timeline`
      : '?returnTab=timeline'
  }`;
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
                className="min-w-0 justify-center border border-[var(--color-income)]/14 bg-[var(--color-income-soft)] px-3 text-[var(--color-income)] hover:bg-[color-mix(in_srgb,var(--color-income-soft)_72%,white)]"
                href={incomeHref}
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
                className="min-w-0 justify-center bg-[color:color-mix(in_srgb,var(--color-primary)_92%,white)] px-3"
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
                  className="min-w-0 justify-center border border-[var(--color-income)]/14 bg-[var(--color-income-soft)] text-[var(--color-income)] hover:bg-[color-mix(in_srgb,var(--color-income-soft)_72%,white)]"
                  href={incomeHref}
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
                  className="min-w-0 justify-center bg-[color:color-mix(in_srgb,var(--color-primary)_92%,white)]"
                  href={expenseHref}
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
      <TimelineList
        categories={categories}
        expenses={expenses}
        incomes={incomes}
        members={members}
        milestones={milestones}
        onSelectedMilestoneChange={onSelectedMilestoneChange}
        onSelectExpense={onSelectExpense}
        planId={planId}
        selectedMilestoneId={selectedMilestoneId}
        travelActivities={travelActivities}
        {...(emptyStateDescription ? { emptyStateDescription } : {})}
      />
    </>
  );
}
