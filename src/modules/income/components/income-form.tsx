'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { Landmark } from 'lucide-react';
import { useForm, useWatch } from 'react-hook-form';
import { ZodError } from 'zod';

import { AuthFormMessage } from '@/modules/auth/components/auth-form-message';
import { useAuthSession } from '@/modules/auth/hooks/use-auth-session';
import { getCategoryIcon } from '@/modules/category/utils/category-icon';
import { getIncomeCategories } from '@/modules/category/constants/category-presets';
import { usePlanMembers } from '@/modules/member/hooks/use-plan-members';
import {
  getVisibleMilestones,
  planUsesHiddenMilestone,
  resolveFinanceMilestoneId,
  useMilestones,
} from '@/modules/milestone';
import { usePlan } from '@/modules/plan/hooks/use-plan';
import { createIncomeSchema, type CreateIncomeSchema } from '@/modules/income/schemas/create-income.schema';
import { updateIncomeSchema, type UpdateIncomeSchema } from '@/modules/income/schemas/update-income.schema';
import { incomeService } from '@/modules/income/services';
import type { IncomeDocument } from '@/modules/income/types/income';
import { useExpenses } from '@/modules/expense/hooks/use-expenses';
import { useIncomes } from '@/modules/income/hooks/use-incomes';
import { resolveIncomeAllocation } from '@/modules/statistic/utils/fund-balance';
import { AmountInput } from '@/shared/components/ui/amount-input';
import { Button } from '@/shared/components/ui/button';
import { DateTimeInput } from '@/shared/components/ui/date-time-input';
import { DropdownSelect } from '@/shared/components/ui/dropdown-select';
import { Input } from '@/shared/components/ui/input';
import { Textarea } from '@/shared/components/ui/textarea';
import { formatDateTimeLocalInput } from '@/shared/utils/date';
import { cn } from '@/shared/utils/cn';

type IncomeFormProps = {
  planId: string;
  mode: 'create' | 'edit';
  income?: IncomeDocument | undefined;
  defaultMilestoneId?: string | undefined;
  onSuccess?: ((milestoneId: string) => void) | undefined;
  onCancel?: (() => void) | undefined;
};

// Some legacy incomes predate this app's write path and can hold a non-string
// value (or null) in these optional text fields. The schema for these fields is
// `z.string().optional().or(z.literal(''))`, and Zod collapses ANY union mismatch
// into a bare, field-less "Invalid input" message — so a stray null/number here
// silently blocks saving with no clue which field caused it. Coerce defensively.
function toSafeString(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

export function IncomeForm({ planId, mode, income, defaultMilestoneId, onSuccess, onCancel }: IncomeFormProps) {
  const searchParams = useSearchParams();
  const { user } = useAuthSession();
  const { plan } = usePlan(planId);
  const { members, currentMember } = usePlanMembers(planId);
  const { milestones } = useMilestones(planId);
  const { expenses } = useExpenses(planId);
  const { incomes } = useIncomes(planId);
  const categories = useMemo(() => (plan ? getIncomeCategories(plan.planType) : []), [plan]);
  const isDebtPlan = plan?.planType === 'debt';
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const activeMembers = members.filter((member) => member.status === 'active');
  const counterpartMembers = useMemo(
    () => activeMembers.filter((member) => member.id !== currentMember?.id),
    [activeMembers, currentMember?.id],
  );
  const visibleMilestones = useMemo(() => getVisibleMilestones(milestones), [milestones]);
  const shouldHideMilestoneSelector = plan ? planUsesHiddenMilestone(plan) : false;
  const [hasUserSetAllocation, setHasUserSetAllocation] = useState(false);
  const defaultAllocatedToMemberId = isDebtPlan
    ? null
    : income
      ? resolveIncomeAllocation(income, plan?.ownerMemberId ?? '')
      : (plan?.ownerMemberId ?? null);
  const milestoneIdFromQuery = searchParams.get('milestoneId') || '';
  const resolvedDefaultMilestoneId = plan
    ? resolveFinanceMilestoneId(
        plan,
        milestones,
        income?.milestoneId || defaultMilestoneId || milestoneIdFromQuery,
      )
    : income?.milestoneId || defaultMilestoneId || milestoneIdFromQuery || visibleMilestones[0]?.id || milestones[0]?.id || '';
  const form = useForm<CreateIncomeSchema>({
    defaultValues: {
      title: income?.title || '',
      amount: income?.amount || 0,
      milestoneId: resolvedDefaultMilestoneId,
      categoryId: toSafeString(income?.categoryId),
      contributedByMemberId:
        income?.contributedByMemberId ||
        (isDebtPlan ? counterpartMembers[0]?.id : currentMember?.id) ||
        activeMembers[0]?.id ||
        '',
      allocatedToMemberId: defaultAllocatedToMemberId,
      note: toSafeString(income?.note),
      receivedAt: income ? formatDateTimeLocalInput(income.receivedAt.toDate()) : '',
    },
  });
  const categoryIdWatched = useWatch({ control: form.control, name: 'categoryId' });
  const amountWatched = useWatch({ control: form.control, name: 'amount' });
  const milestoneIdWatched = useWatch({ control: form.control, name: 'milestoneId' });
  const contributedByMemberIdWatched = useWatch({ control: form.control, name: 'contributedByMemberId' });
  const allocatedToMemberIdWatched = useWatch({ control: form.control, name: 'allocatedToMemberId' });

  const selectedContributor = activeMembers.find((member) => member.id === contributedByMemberIdWatched);

  useEffect(() => {
    if ((shouldHideMilestoneSelector || !form.getValues('milestoneId')) && resolvedDefaultMilestoneId) {
      form.setValue('milestoneId', resolvedDefaultMilestoneId, { shouldValidate: true });
    }

    const defaultContributorId =
      (isDebtPlan ? counterpartMembers[0]?.id : currentMember?.id) || activeMembers[0]?.id || '';

    if (!form.getValues('contributedByMemberId') && defaultContributorId) {
      form.setValue('contributedByMemberId', defaultContributorId, {
        shouldValidate: true,
      });
    }

    if (
      isDebtPlan &&
      currentMember?.id &&
      form.getValues('contributedByMemberId') === currentMember.id &&
      counterpartMembers[0]?.id
    ) {
      form.setValue('contributedByMemberId', counterpartMembers[0].id, {
        shouldValidate: true,
      });
    }
  }, [
    activeMembers,
    counterpartMembers,
    currentMember?.id,
    resolvedDefaultMilestoneId,
    form,
    isDebtPlan,
    shouldHideMilestoneSelector,
  ]);

  useEffect(() => {
    if (hasUserSetAllocation) {
      return;
    }

    form.setValue('allocatedToMemberId', defaultAllocatedToMemberId, { shouldValidate: true });
  }, [defaultAllocatedToMemberId, form, hasUserSetAllocation]);

  const handleSubmit = form.handleSubmit(async (values) => {
    if (!plan || !user) {
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      if (mode === 'create') {
        const parsed = createIncomeSchema.parse(values);
        await incomeService.createIncome(parsed, {
          plan,
          members,
          currentMember,
          currentUser: user,
          categories,
          milestones,
          expenses,
          incomes,
        });
        onSuccess?.(parsed.milestoneId);
      } else if (income) {
        const parsed = updateIncomeSchema.parse({
          ...values,
          incomeId: income.id,
        } satisfies UpdateIncomeSchema);
        await incomeService.updateIncome(
          parsed,
          {
            plan,
            members,
            currentMember,
            currentUser: user,
            categories,
            milestones,
            expenses,
            incomes,
          },
          income,
        );
        onSuccess?.(parsed.milestoneId);
      }
    } catch (error) {
      if (error instanceof ZodError) {
        setErrorMessage(
          error.issues
            .map((issue) => (issue.path.length ? `${issue.path.join('.')}: ${issue.message}` : issue.message))
            .filter(Boolean)
            .join(' | ') || 'Vui lòng kiểm tra lại thông tin khoản thu.',
        );
      } else if (error instanceof Error) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage('Hiện chưa thể lưu khoản thu này.');
      }
    } finally {
      setIsSubmitting(false);
    }
  });

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      <div className="space-y-1 text-center">
        <label className="text-xs font-semibold uppercase tracking-[0.16em] text-[#727687]" htmlFor="amount">
          Số tiền (VND)
        </label>
        <AmountInput
          id="amount"
          onChange={(value) => form.setValue('amount', value, { shouldValidate: true, shouldDirty: true })}
          value={Number(amountWatched) || 0}
        />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-700" htmlFor="title">
          {isDebtPlan ? 'Tên khoản hoàn trả' : 'Tên khoản thu'}
        </label>
        <Input
          id="title"
          placeholder={isDebtPlan ? 'Ví dụ: Anh A hoàn trả đợt 1' : 'Đóng quỹ, nạp thêm...'}
          {...form.register('title')}
        />
      </div>

      {!shouldHideMilestoneSelector ? (
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700" htmlFor="milestoneId">
            Mốc kế hoạch
          </label>
          <DropdownSelect
            id="milestoneId"
            onValueChange={(value) => form.setValue('milestoneId', value, { shouldValidate: true, shouldDirty: true })}
            options={visibleMilestones.map((milestone) => ({ value: milestone.id, label: milestone.title }))}
            placeholder="Chọn mốc kế hoạch"
            value={milestoneIdWatched || ''}
          />
        </div>
      ) : null}

      <div className="space-y-2">
        <p className="text-sm font-medium text-slate-700">Danh mục</p>
        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
          {categories.map((category) => {
            const CategoryIcon = getCategoryIcon(category.icon);
            const isSelected = categoryIdWatched === category.id;

            return (
              <button
                key={category.id}
                className={cn(
                  'flex min-h-11 shrink-0 items-center gap-2 rounded-full border px-4 text-sm font-medium transition',
                  isSelected
                    ? 'border-[#0050cb] bg-[#0050cb] text-white'
                    : 'border-[#c2c6d8] bg-white text-[#424656]',
                )}
                onClick={() =>
                  form.setValue('categoryId', category.id, { shouldValidate: true, shouldDirty: true })
                }
                type="button"
              >
                <CategoryIcon className="size-4" />
                {category.name}
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-700" htmlFor="contributedByMemberId">
          {isDebtPlan ? 'Thành viên hoàn trả' : 'Người nạp'}
        </label>
        <DropdownSelect
          id="contributedByMemberId"
          onValueChange={(value) =>
            form.setValue('contributedByMemberId', value, { shouldValidate: true, shouldDirty: true })
          }
          options={activeMembers
            .filter((member) => !isDebtPlan || member.id !== currentMember?.id)
            .map((member) => ({
            value: member.id,
            label:
              member.id === currentMember?.id
                ? isDebtPlan
                  ? `${member.nickname} (Bạn)`
                  : `${member.nickname} (Mặc định)`
                : member.nickname,
          }))}
          placeholder={isDebtPlan ? 'Chọn thành viên đang hoàn trả cho bạn' : 'Chọn người nạp'}
          value={contributedByMemberIdWatched || selectedContributor?.id || ''}
        />
      </div>

      {!isDebtPlan ? (
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700" htmlFor="allocatedToMemberId">
            Hoàn cho
          </label>
          <DropdownSelect
            id="allocatedToMemberId"
            onValueChange={(value) => {
              setHasUserSetAllocation(true);
              form.setValue('allocatedToMemberId', value || null, { shouldValidate: true, shouldDirty: true });
            }}
            options={[
              { value: '', label: 'Chưa phân bổ' },
              ...activeMembers.map((member) => ({
                value: member.id,
                label: member.id === currentMember?.id ? `${member.nickname} (Bạn)` : member.nickname,
              })),
            ]}
            placeholder="Chọn thành viên được hoàn"
            value={allocatedToMemberIdWatched ?? ''}
          />
          <p className="text-xs text-slate-500">
            Khoản tiền này sẽ được tính là phần hoàn lại cho thành viên được chọn.
          </p>
        </div>
      ) : null}

      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-700" htmlFor="receivedAt">
          {isDebtPlan ? 'Thời gian hoàn trả' : 'Thời gian nhận'}
        </label>
        <DateTimeInput id="receivedAt" {...form.register('receivedAt')} />
      </div>
      <Textarea
        placeholder={isDebtPlan ? 'Ghi chú thêm về lần hoàn trả này (không bắt buộc)' : 'Ghi chú thêm (không bắt buộc)'}
        {...form.register('note')}
      />
      {errorMessage ? <AuthFormMessage message={errorMessage} type="error" /> : null}
      <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
        {onCancel ? (
          <Button onClick={onCancel} type="button" variant="secondary">
            Hủy
          </Button>
        ) : null}
        <Button disabled={isSubmitting} type="submit">
          <Landmark className="size-4" />
          {isSubmitting
            ? isDebtPlan
              ? 'Đang lưu khoản hoàn trả...'
              : 'Đang lưu khoản thu...'
            : mode === 'create'
              ? isDebtPlan
                ? 'Lưu khoản hoàn trả'
                : 'Lưu khoản thu'
              : 'Lưu thay đổi'}
        </Button>
      </div>
    </form>
  );
}
