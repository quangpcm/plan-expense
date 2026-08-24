'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Check, CheckCircle2, ChevronRight, User } from 'lucide-react';
import { useForm, useWatch } from 'react-hook-form';
import { ZodError } from 'zod';

import { AuthFormMessage } from '@/modules/auth/components/auth-form-message';
import { useAuthSession } from '@/modules/auth/hooks/use-auth-session';
import { getCategoryIcon } from '@/modules/category/utils/category-icon';
import { getExpenseCategories } from '@/modules/category/constants/category-presets';
import { usePlanMembers } from '@/modules/member/hooks/use-plan-members';
import {
  getVisibleMilestones,
  planUsesHiddenMilestone,
  resolveFinanceMilestoneId,
  useMilestones,
} from '@/modules/milestone';
import { usePlan } from '@/modules/plan/hooks/use-plan';
import { createExpenseSchema, type CreateExpenseSchema } from '@/modules/expense/schemas/create-expense.schema';
import { updateExpenseSchema, type UpdateExpenseSchema } from '@/modules/expense/schemas/update-expense.schema';
import { expenseService } from '@/modules/expense/services';
import { useExpenses } from '@/modules/expense/hooks/use-expenses';
import type { ExpenseDocument } from '@/modules/expense/types/expense';
import { useIncomes } from '@/modules/income/hooks/use-incomes';
import { calculateFundBalance } from '@/modules/statistic/utils/fund-balance';
import { AttachmentPicker, type AttachmentDraft } from '@/modules/storage';
import { AmountInput } from '@/shared/components/ui/amount-input';
import { BottomSheet } from '@/shared/components/ui/bottom-sheet';
import { Button } from '@/shared/components/ui/button';
import { DateTimeInput } from '@/shared/components/ui/date-time-input';
import { DropdownSelect } from '@/shared/components/ui/dropdown-select';
import { Input } from '@/shared/components/ui/input';
import { Textarea } from '@/shared/components/ui/textarea';
import { splitMethods } from '@/shared/constants';
import { formatCurrency } from '@/shared/utils/currency';
import { formatDateTimeLocalInput } from '@/shared/utils/date';
import { cn } from '@/shared/utils/cn';

type ExpenseFormProps = {
  planId: string;
  mode: 'create' | 'edit';
  expense?: ExpenseDocument | undefined;
  defaultActivityId?: string | undefined;
  defaultMilestoneId?: string | undefined;
  onSuccess?: ((milestoneId: string) => void) | undefined;
  onCancel?: (() => void) | undefined;
};

// Some legacy expenses predate this app's write path and can hold a non-string
// value (or null) in these optional text fields. The schema for these fields is
// `z.string().optional().or(z.literal(''))`, and Zod collapses ANY union mismatch
// into a bare, field-less "Invalid input" message — so a stray null/number here
// silently blocks saving with no clue which field caused it. Coerce defensively.
function toSafeString(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

export function ExpenseForm({
  planId,
  mode,
  expense,
  defaultActivityId,
  defaultMilestoneId,
  onSuccess,
  onCancel,
}: ExpenseFormProps) {
  const searchParams = useSearchParams();
  const { user } = useAuthSession();
  const { plan } = usePlan(planId);
  const { milestones } = useMilestones(planId);
  const { members, currentMember } = usePlanMembers(planId);
  const { expenses } = useExpenses(planId);
  const { incomes } = useIncomes(planId);
  const categories = useMemo(() => (plan ? getExpenseCategories(plan.planType) : []), [plan]);
  const isDebtPlan = plan?.planType === 'debt';
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPaidByOpen, setIsPaidByOpen] = useState(false);
  const errorRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (errorMessage) {
      errorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [errorMessage]);
  const activeMembers = useMemo(
    () => members.filter((member) => member.status === 'active'),
    [members],
  );
  const defaultPaymentSourceType = expense?.paymentSourceType || 'member';
  const defaultPaidByMemberId =
    expense?.paidByMemberId || currentMember?.id || activeMembers[0]?.id || '';
  const fundBalance = useMemo(() => {
    const breakdown = calculateFundBalance({ incomes, expenses, ownerMemberId: plan?.ownerMemberId ?? '' });
    return expense && expense.paymentSourceType === 'fund'
      ? breakdown.unallocatedBalance + expense.amount
      : breakdown.unallocatedBalance;
  }, [incomes, expenses, plan?.ownerMemberId, expense]);
  const counterpartMembers = useMemo(
    () => activeMembers.filter((member) => member.id !== currentMember?.id),
    [activeMembers, currentMember?.id],
  );
  const creatorDefaultParticipantIds = useMemo(
    () =>
      isDebtPlan
        ? counterpartMembers[0]?.id
          ? [counterpartMembers[0].id]
          : []
        : defaultPaidByMemberId
          ? [defaultPaidByMemberId]
          : [],
    [counterpartMembers, defaultPaidByMemberId, isDebtPlan],
  );
  const defaultParticipantIds =
    expense?.participants.map((participant) => participant.memberId) ||
    creatorDefaultParticipantIds;
  const allActiveParticipantIds = useMemo(
    () => activeMembers.map((member) => member.id),
    [activeMembers],
  );
  const visibleMilestones = useMemo(() => getVisibleMilestones(milestones), [milestones]);
  const shouldHideMilestoneSelector = plan ? planUsesHiddenMilestone(plan) : false;
  const defaultCategoryId = toSafeString(expense?.categoryId) || categories[0]?.id || '';
  const defaultActivityIdValue = toSafeString(expense?.activityId) || defaultActivityId || '';
  const milestoneIdFromQuery = searchParams.get('milestoneId') || '';
  const resolvedDefaultMilestoneId = plan
    ? resolveFinanceMilestoneId(
        plan,
        milestones,
        expense?.milestoneId || defaultMilestoneId || milestoneIdFromQuery,
      )
    : expense?.milestoneId || defaultMilestoneId || milestoneIdFromQuery || visibleMilestones[0]?.id || milestones[0]?.id || '';
  const defaultSpentAt = expense ? formatDateTimeLocalInput(expense.spentAt.toDate()) : formatDateTimeLocalInput(new Date());
  const defaultSplitValues: Record<string, number> = {};

  if (expense && expense.splitMethod !== 'equal') {
    for (const participant of expense.participants) {
      if (expense.splitMethod === 'exact') {
        defaultSplitValues[participant.memberId] = participant.amount;
      } else if (expense.splitMethod === 'percentage' && participant.percentage != null) {
        defaultSplitValues[participant.memberId] = participant.percentage;
      } else if (expense.splitMethod === 'shares' && participant.shares != null) {
        defaultSplitValues[participant.memberId] = participant.shares;
      }
    }
  }

  const form = useForm<CreateExpenseSchema>({
    defaultValues: {
      title: expense?.title || '',
      amount: expense?.amount || 0,
      milestoneId: resolvedDefaultMilestoneId,
      activityId: defaultActivityIdValue,
      categoryId: defaultCategoryId,
      paymentSourceType: defaultPaymentSourceType,
      paidByMemberId: defaultPaidByMemberId,
      participantMemberIds: defaultParticipantIds,
      splitMethod: expense?.splitMethod || splitMethods.self,
      splitValues: defaultSplitValues,
      merchantName: toSafeString(expense?.merchantName),
      locationName: toSafeString(expense?.locationName),
      note: toSafeString(expense?.note),
      spentAt: defaultSpentAt,
      attachments: (expense?.attachments ?? []).map(
        (attachment): AttachmentDraft => ({ kind: 'existing', id: attachment.id, attachment }),
      ),
    },
  });
  const selectedMembers = useWatch({
    control: form.control,
    name: 'participantMemberIds',
  }) ?? [];
  const selectedSplitMethod = useWatch({ control: form.control, name: 'splitMethod' });
  const splitValuesWatched = useWatch({ control: form.control, name: 'splitValues' }) ?? {};
  const amountWatched = useWatch({ control: form.control, name: 'amount' });
  const categoryIdWatched = useWatch({ control: form.control, name: 'categoryId' });
  const activityIdWatched = useWatch({ control: form.control, name: 'activityId' });
  const paidByMemberIdWatched = useWatch({ control: form.control, name: 'paidByMemberId' });
  const paymentSourceTypeWatched = useWatch({ control: form.control, name: 'paymentSourceType' }) || 'member';
  const milestoneIdWatched = useWatch({ control: form.control, name: 'milestoneId' });
  const spentAtWatched = useWatch({ control: form.control, name: 'spentAt' });
  const isFirstSplitMethodRender = useRef(true);
  const previousSplitMethodRef = useRef<CreateExpenseSchema['splitMethod']>(expense?.splitMethod || splitMethods.self);
  const totalSplitValue = selectedMembers.reduce(
    (sum, memberId) => sum + (Number(splitValuesWatched[memberId]) || 0),
    0,
  );
  const paidByMember = activeMembers.find((member) => member.id === paidByMemberIdWatched);
  const paidByLabel =
    paidByMemberIdWatched && paidByMemberIdWatched === currentMember?.id
      ? 'Bạn (Mặc định)'
      : paidByMember?.nickname || 'Chọn người chi trả';
  const selectedCounterpartMember = counterpartMembers.find((member) => member.id === selectedMembers[0]);
  const selfSplitLabel = `${paidByMember?.nickname || currentMember?.nickname || 'Người tạo'}`;
  const liveSelfParticipantIds = useMemo(
    () =>
      isDebtPlan
        ? creatorDefaultParticipantIds
        : paidByMemberIdWatched
          ? [paidByMemberIdWatched]
          : creatorDefaultParticipantIds,
    [creatorDefaultParticipantIds, isDebtPlan, paidByMemberIdWatched],
  );

  useEffect(() => {
    if (isFirstSplitMethodRender.current) {
      isFirstSplitMethodRender.current = false;
      previousSplitMethodRef.current = selectedSplitMethod;
      return;
    }

    if (selectedSplitMethod === previousSplitMethodRef.current) {
      return;
    }

    form.setValue('splitValues', {}, { shouldDirty: true });
    const previousSplitMethod = previousSplitMethodRef.current;

    if (selectedSplitMethod === splitMethods.self) {
      form.setValue('participantMemberIds', liveSelfParticipantIds, { shouldDirty: true, shouldValidate: true });
    } else if (previousSplitMethod === splitMethods.self) {
      form.setValue('participantMemberIds', allActiveParticipantIds, { shouldDirty: true, shouldValidate: true });
    }

    previousSplitMethodRef.current = selectedSplitMethod;
  }, [allActiveParticipantIds, liveSelfParticipantIds, form, selectedSplitMethod]);

  useEffect(() => {
    if (isDebtPlan || selectedSplitMethod !== splitMethods.self) {
      return;
    }

    const current = form.getValues('participantMemberIds');
    if (current.length === 1 && current[0] === liveSelfParticipantIds[0]) {
      return;
    }

    form.setValue('participantMemberIds', liveSelfParticipantIds, { shouldDirty: true, shouldValidate: true });
  }, [form, isDebtPlan, liveSelfParticipantIds, selectedSplitMethod]);

  useEffect(() => {
    if (
      form.getValues('paymentSourceType') !== 'fund' &&
      !form.getValues('paidByMemberId') &&
      defaultPaidByMemberId
    ) {
      form.setValue('paidByMemberId', defaultPaidByMemberId, { shouldValidate: true });
    }

    if (form.getValues('participantMemberIds').length === 0 && defaultParticipantIds.length > 0) {
      form.setValue('participantMemberIds', defaultParticipantIds, { shouldValidate: true });
    }

    if (!form.getValues('categoryId') && defaultCategoryId) {
      form.setValue('categoryId', defaultCategoryId, { shouldValidate: true });
    }

    if (!form.getValues('activityId') && defaultActivityIdValue) {
      form.setValue('activityId', defaultActivityIdValue, { shouldValidate: true });
    }

    if ((shouldHideMilestoneSelector || !form.getValues('milestoneId')) && resolvedDefaultMilestoneId) {
      form.setValue('milestoneId', resolvedDefaultMilestoneId, { shouldValidate: true });
    }

    if (!form.getValues('spentAt') && defaultSpentAt) {
      form.setValue('spentAt', defaultSpentAt, { shouldValidate: true });
    }

    if (isDebtPlan) {
      if (form.getValues('paymentSourceType') !== 'member') {
        form.setValue('paymentSourceType', 'member', { shouldValidate: true });
      }

      if (currentMember?.id && form.getValues('paidByMemberId') !== currentMember.id) {
        form.setValue('paidByMemberId', currentMember.id, { shouldValidate: true });
      }

      if (form.getValues('splitMethod') !== splitMethods.self) {
        form.setValue('splitMethod', splitMethods.self, { shouldValidate: true });
      }

      const currentCounterpartId = form.getValues('participantMemberIds')[0];
      if ((!currentCounterpartId || currentCounterpartId === currentMember?.id) && counterpartMembers[0]?.id) {
        form.setValue('participantMemberIds', [counterpartMembers[0].id], { shouldValidate: true });
      }
    }
  }, [
    defaultCategoryId,
    defaultActivityIdValue,
    resolvedDefaultMilestoneId,
    defaultPaidByMemberId,
    defaultParticipantIds,
    defaultSpentAt,
    form,
    counterpartMembers,
    currentMember?.id,
    isDebtPlan,
    shouldHideMilestoneSelector,
  ]);

  const handleSubmit = form.handleSubmit(async (values) => {
    if (!plan || !user) {
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      if (mode === 'create') {
        const parsed = createExpenseSchema.parse(values);
        await expenseService.createExpense(
          {
            ...parsed,
            paidByMemberId: parsed.paidByMemberId || null,
            attachments: parsed.attachments,
          },
          {
            plan,
            members,
            currentMember,
            currentUser: user,
            milestones,
            categories,
            expenses,
            incomes,
          },
        );
        if (parsed.categoryId) {
          localStorage.setItem(`last-expense-category:${planId}`, parsed.categoryId);
        }
        onSuccess?.(parsed.milestoneId);
      } else if (expense) {
        const parsed = updateExpenseSchema.parse({
          ...values,
          expenseId: expense.id,
        } satisfies UpdateExpenseSchema);
        await expenseService.updateExpense(
          { ...parsed, paidByMemberId: parsed.paidByMemberId || null },
          {
            plan,
            members,
            currentMember,
            currentUser: user,
            milestones,
            categories,
            expenses,
            incomes,
          },
          expense,
        );
        onSuccess?.(parsed.milestoneId);
      }
    } catch (error) {
      if (error instanceof ZodError) {
        setErrorMessage(
          error.issues
            .map((issue) => (issue.path.length ? `${issue.path.join('.')}: ${issue.message}` : issue.message))
            .filter(Boolean)
            .join(' | ') || 'Vui lòng kiểm tra lại thông tin khoản chi.',
        );
      } else if (error instanceof Error) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage('Hiện chưa thể lưu khoản chi này.');
      }
    } finally {
      setIsSubmitting(false);
    }
  });

  const attachmentDrafts = useWatch({ control: form.control, name: 'attachments' }) ?? [];

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      {activityIdWatched ? (
        <div className="rounded-2xl border border-[var(--color-primary)]/16 bg-[color:color-mix(in_srgb,var(--color-primary)_6%,white)] px-4 py-3 text-sm leading-6 text-slate-700">
          Khoản chi này sẽ được gắn với activity đang chọn trong lịch trình.
        </div>
      ) : null}
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
          {isDebtPlan ? 'Tên khoản cho mượn' : 'Tên khoản chi'}
        </label>
        <Input
          id="title"
          placeholder={isDebtPlan ? 'Ví dụ: Cho anh A mượn tiền đợt 1' : 'Ăn sáng, khách sạn, vé...'}
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
            options={[
              { value: '', label: 'Chọn mốc kế hoạch' },
              ...visibleMilestones.map((milestone) => ({ value: milestone.id, label: milestone.title })),
            ]}
            value={milestoneIdWatched || ''}
          />
        </div>
      ) : null}

      <div className="grid grid-cols-[minmax(0,0.9fr)_minmax(0,1fr)] gap-3">
        <div className="space-y-2">
          <p className="text-sm font-medium text-slate-700">Danh mục</p>
          <DropdownSelect
            id="categoryId"
            onValueChange={(value) => form.setValue('categoryId', value, { shouldValidate: true, shouldDirty: true })}
            options={categories.map((category) => ({
              value: category.id,
              label: category.name,
              icon: getCategoryIcon(category.icon),
            }))}
            placeholder="Chọn danh mục"
            value={categoryIdWatched || ''}
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700" htmlFor="spentAt">
            {isDebtPlan ? 'Thời gian cho mượn' : 'Thời gian chi'}
          </label>
          <DateTimeInput
            id="spentAt"
            value={spentAtWatched || defaultSpentAt}
            {...form.register('spentAt')}
          />
        </div>
      </div>

      {isDebtPlan ? (
        <div className="rounded-2xl border border-[#c2c6d8] bg-white px-4 py-3 text-sm text-slate-700">
          <span className="block text-xs text-[#727687]">Người cho mượn</span>
          <span className="mt-1 block font-medium text-[#191c1e]">{currentMember?.nickname || paidByLabel}</span>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-2 rounded-2xl border border-[#c2c6d8] bg-slate-50 p-1">
            <button
              className={cn(
                'rounded-xl px-3 py-2 text-sm font-medium transition-colors',
                paymentSourceTypeWatched === 'member' ? 'bg-white text-[#0050cb] shadow-sm' : 'text-[#727687]',
              )}
              onClick={() => form.setValue('paymentSourceType', 'member', { shouldValidate: true, shouldDirty: true })}
              type="button"
            >
              Thành viên trả
            </button>
            <button
              className={cn(
                'rounded-xl px-3 py-2 text-sm font-medium transition-colors',
                paymentSourceTypeWatched === 'fund' ? 'bg-white text-[#0050cb] shadow-sm' : 'text-[#727687]',
              )}
              onClick={() => {
                form.setValue('paymentSourceType', 'fund', { shouldValidate: true, shouldDirty: true });
                form.setValue('paidByMemberId', '', { shouldValidate: true, shouldDirty: true });
              }}
              type="button"
            >
              Quỹ chung trả
            </button>
          </div>

          {paymentSourceTypeWatched === 'fund' ? (
            <div className="rounded-2xl border border-[#c2c6d8] bg-white px-4 py-3 text-sm text-slate-700">
              <span className="block text-xs text-[#727687]">Nguồn tiền</span>
              <span className="mt-1 block font-medium text-[#191c1e]">Quỹ chung</span>
              <span className="mt-1 block text-xs text-[#727687]">
                Số dư hiện tại: {formatCurrency(fundBalance)}
              </span>
            </div>
          ) : (
            <>
              <button
                className="flex w-full items-center justify-between rounded-2xl border border-[#c2c6d8] bg-white px-4 py-3 text-left"
                onClick={() => setIsPaidByOpen(true)}
                type="button"
              >
                <span className="flex items-center gap-3">
                  <span className="flex size-9 items-center justify-center rounded-full bg-[#0050cb]/10 text-[#0050cb]">
                    <User className="size-4" />
                  </span>
                  <span>
                    <span className="block text-xs text-[#727687]">Người chi trả</span>
                    <span className="block text-sm font-medium text-[#191c1e]">{paidByLabel}</span>
                  </span>
                </span>
                <ChevronRight className="size-4 text-[#727687]" />
              </button>

              <BottomSheet
                onClose={() => setIsPaidByOpen(false)}
                open={isPaidByOpen}
                title="Chọn người chi trả"
              >
                <div className="grid gap-2">
                  {activeMembers.map((member) => {
                    const isSelected = member.id === paidByMemberIdWatched;

                    return (
                      <button
                        key={member.id}
                        className={cn(
                          'flex min-h-11 items-center justify-between rounded-2xl border px-4 py-2 text-sm',
                          isSelected ? 'border-[#0050cb] bg-[#0050cb]/10' : 'border-[#c2c6d8] bg-white',
                        )}
                        onClick={() => {
                          form.setValue('paidByMemberId', member.id, { shouldValidate: true, shouldDirty: true });
                          setIsPaidByOpen(false);
                        }}
                        type="button"
                      >
                        <span className="text-[#191c1e]">
                          {member.nickname}
                          {member.id === currentMember?.id ? ' (Mặc định)' : ''}
                        </span>
                        {isSelected ? <Check className="size-4 text-[#0050cb]" /> : null}
                      </button>
                    );
                  })}
                </div>
              </BottomSheet>
            </>
          )}
        </>
      )}

      <details className="rounded-[24px] border border-slate-200 bg-slate-50 p-4">
        <summary className="cursor-pointer text-sm font-semibold text-slate-800">Thiết lập nâng cao</summary>
        <div className="mt-4 space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700" htmlFor="splitMethod">
              {isDebtPlan ? 'Thành viên nhận tiền' : 'Chia tiền'}
            </label>
            {isDebtPlan ? (
              <DropdownSelect
                id="participantMemberIds"
                onValueChange={(value) =>
                  form.setValue('participantMemberIds', value ? [value] : [], {
                    shouldValidate: true,
                    shouldDirty: true,
                  })
                }
                options={counterpartMembers.map((member) => ({
                  value: member.id,
                  label: member.nickname,
                }))}
                placeholder="Chọn thành viên đang mượn tiền"
                value={selectedCounterpartMember?.id || ''}
              />
            ) : (
              <DropdownSelect
                id="splitMethod"
                onValueChange={(value) =>
                  form.setValue('splitMethod', value as CreateExpenseSchema['splitMethod'], {
                    shouldValidate: true,
                    shouldDirty: true,
                  })
                }
                options={[
                  { value: splitMethods.self, label: selfSplitLabel },
                  { value: splitMethods.equal, label: 'Chia đều' },
                  { value: splitMethods.exact, label: 'Số tiền cụ thể' },
                  { value: splitMethods.percentage, label: 'Theo phần trăm' },
                  { value: splitMethods.shares, label: 'Theo số phần' },
                ]}
                value={selectedSplitMethod}
              />
            )}
          </div>
          {!isDebtPlan && selectedSplitMethod === splitMethods.self ? (
            <div className="px-1 py-1 text-sm italic text-[#7a8094]">
              Khoản chi này mặc định được tính cho{' '}
              <span className="font-medium text-amber-600 not-italic">{selfSplitLabel}</span>.
            </div>
          ) : null}
          {!isDebtPlan && selectedSplitMethod !== splitMethods.self ? (
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Người tham gia</label>
              <div className="grid gap-2">
                {activeMembers.map((member) => {
                  const checked = selectedMembers.includes(member.id);

                  return (
                    <label
                      key={member.id}
                      className="inline-flex min-h-11 items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700"
                    >
                      <input
                        checked={checked}
                        onChange={(event) => {
                          const nextValue = event.target.checked
                            ? [...selectedMembers, member.id]
                            : selectedMembers.filter((item) => item !== member.id);
                          form.setValue('participantMemberIds', nextValue, { shouldDirty: true });
                        }}
                        type="checkbox"
                      />
                      {member.nickname}
                    </label>
                  );
                })}
              </div>
            </div>
          ) : null}
          {!isDebtPlan && selectedSplitMethod !== splitMethods.self && selectedSplitMethod !== 'equal' ? (
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">
                {selectedSplitMethod === 'exact'
                  ? 'Số tiền từng người'
                  : selectedSplitMethod === 'percentage'
                    ? 'Phần trăm từng người'
                    : 'Số phần từng người'}
              </label>
              <div className="grid gap-2">
                {activeMembers
                  .filter((member) => selectedMembers.includes(member.id))
                  .map((member) => (
                    <div key={member.id} className="flex items-center gap-3">
                      <span className="min-w-0 flex-1 truncate text-sm text-slate-700">{member.nickname}</span>
                      <Input
                        className="w-28 text-right"
                        inputMode="numeric"
                        type="number"
                        {...form.register(`splitValues.${member.id}`)}
                      />
                      <span className="w-10 text-sm text-slate-500">
                        {selectedSplitMethod === 'exact' ? 'đ' : selectedSplitMethod === 'percentage' ? '%' : 'phần'}
                      </span>
                    </div>
                  ))}
              </div>
              <p className="text-xs text-slate-500">
                {selectedSplitMethod === 'exact'
                  ? `Tổng: ${formatCurrency(totalSplitValue)} / ${formatCurrency(Number(amountWatched) || 0)}`
                  : selectedSplitMethod === 'percentage'
                    ? `Tổng: ${totalSplitValue}% / 100%`
                    : `Tổng: ${totalSplitValue} phần`}
              </p>
            </div>
          ) : null}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700" htmlFor="merchantName">
                {isDebtPlan ? 'Nguồn / bối cảnh giao dịch' : 'Cửa hàng / đơn vị'}
              </label>
              <Input
                id="merchantName"
                placeholder={isDebtPlan ? 'Ví dụ: Chuyển khoản cá nhân, ứng tiền mặt...' : 'Tên cửa hàng hoặc dịch vụ'}
                {...form.register('merchantName')}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700" htmlFor="locationName">
                {isDebtPlan ? 'Nơi phát sinh' : 'Địa điểm'}
              </label>
              <Input
                id="locationName"
                placeholder={isDebtPlan ? 'Ví dụ: Gặp trực tiếp, chuyển khoản online...' : 'Nơi phát sinh khoản chi'}
                {...form.register('locationName')}
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700" htmlFor="note">
              Ghi chú
            </label>
            <Textarea id="note" placeholder="Ghi chú thêm (không bắt buộc)" {...form.register('note')} />
          </div>
        </div>
      </details>

      <div className="space-y-2">
        <p className="text-sm font-medium text-slate-700">Hóa đơn đính kèm</p>
        <AttachmentPicker
          label="Thêm ảnh hóa đơn"
          onChange={(next) => form.setValue('attachments', next, { shouldDirty: true })}
          value={attachmentDrafts}
        />
        <p className="text-xs text-slate-500">
          Tối đa 5 ảnh. {mode === 'create' ? 'Khoản chi chỉ được tạo' : 'Thay đổi chỉ được lưu'} sau khi tải ảnh lên
          thành công.
        </p>
      </div>

      {errorMessage ? (
        <div ref={errorRef}>
          <AuthFormMessage message={errorMessage} type="error" />
        </div>
      ) : null}

      <div className="flex items-center justify-end gap-2">
        {onCancel ? (
          <Button onClick={onCancel} type="button" variant="ghost">
            Huỷ
          </Button>
        ) : null}
        <Button disabled={isSubmitting} type="submit">
          {isSubmitting ? (
            isDebtPlan
              ? mode === 'create'
                ? 'Đang ghi nhận khoản cho mượn...'
                : 'Đang lưu khoản cho mượn...'
              : mode === 'create'
                ? 'Đang tạo khoản chi...'
                : 'Đang lưu khoản chi...'
          ) : (
            <>
              <CheckCircle2 className="size-4" />
              {isDebtPlan
                ? mode === 'create'
                  ? 'Lưu khoản cho mượn'
                  : 'Lưu thay đổi'
                : mode === 'create'
                  ? 'Lưu khoản chi'
                  : 'Lưu thay đổi'}
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
