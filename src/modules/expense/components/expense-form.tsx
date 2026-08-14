'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { startTransition, useEffect, useMemo, useRef, useState } from 'react';
import { Check, CheckCircle2, ChevronRight, User } from 'lucide-react';
import { useForm, useWatch } from 'react-hook-form';
import { ZodError } from 'zod';

import { AuthFormMessage } from '@/modules/auth/components/auth-form-message';
import { useAuthSession } from '@/modules/auth/hooks/use-auth-session';
import { getCategoryIcon } from '@/modules/category/utils/category-icon';
import { getExpenseCategories } from '@/modules/category/constants/category-presets';
import { usePlanMembers } from '@/modules/member/hooks/use-plan-members';
import { useMilestones } from '@/modules/milestone';
import { usePlan } from '@/modules/plan/hooks/use-plan';
import { createExpenseSchema, type CreateExpenseSchema } from '@/modules/expense/schemas/create-expense.schema';
import { updateExpenseSchema, type UpdateExpenseSchema } from '@/modules/expense/schemas/update-expense.schema';
import { expenseService } from '@/modules/expense/services';
import type { ExpenseDocument } from '@/modules/expense/types/expense';
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
  expense?: ExpenseDocument;
};

// Some legacy expenses predate this app's write path and can hold a non-string
// value (or null) in these optional text fields. The schema for these fields is
// `z.string().optional().or(z.literal(''))`, and Zod collapses ANY union mismatch
// into a bare, field-less "Invalid input" message — so a stray null/number here
// silently blocks saving with no clue which field caused it. Coerce defensively.
function toSafeString(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

export function ExpenseForm({ planId, mode, expense }: ExpenseFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuthSession();
  const { plan } = usePlan(planId);
  const { milestones } = useMilestones(planId);
  const { members, currentMember } = usePlanMembers(planId);
  const categories = useMemo(() => (plan ? getExpenseCategories(plan.planType) : []), [plan]);
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
  const defaultPaidByMemberId =
    expense?.paidByMemberId || currentMember?.id || activeMembers[0]?.id || '';
  const creatorDefaultParticipantIds = defaultPaidByMemberId ? [defaultPaidByMemberId] : [];
  const defaultParticipantIds =
    expense?.participants.map((participant) => participant.memberId) ||
    creatorDefaultParticipantIds;
  const allActiveParticipantIds = activeMembers.map((member) => member.id);
  const defaultCategoryId = toSafeString(expense?.categoryId) || categories[0]?.id || '';
  const milestoneIdFromQuery = searchParams.get('milestoneId') || '';
  const returnTab = searchParams.get('returnTab');
  const defaultMilestoneId = expense?.milestoneId || milestoneIdFromQuery || milestones[0]?.id || '';
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
      milestoneId: defaultMilestoneId,
      categoryId: defaultCategoryId,
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
  const paidByMemberIdWatched = useWatch({ control: form.control, name: 'paidByMemberId' });
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
  const selfSplitLabel = `${currentMember?.nickname || paidByMember?.nickname || 'Người tạo'}`;

  useEffect(() => {
    if (isFirstSplitMethodRender.current) {
      isFirstSplitMethodRender.current = false;
      previousSplitMethodRef.current = selectedSplitMethod;
      return;
    }

    form.setValue('splitValues', {}, { shouldDirty: true });
    const previousSplitMethod = previousSplitMethodRef.current;

    if (selectedSplitMethod === splitMethods.self) {
      form.setValue('participantMemberIds', creatorDefaultParticipantIds, { shouldDirty: true, shouldValidate: true });
    } else if (previousSplitMethod === splitMethods.self) {
      form.setValue('participantMemberIds', allActiveParticipantIds, { shouldDirty: true, shouldValidate: true });
    }

    previousSplitMethodRef.current = selectedSplitMethod;
  }, [allActiveParticipantIds, creatorDefaultParticipantIds, form, selectedSplitMethod]);

  useEffect(() => {
    if (!form.getValues('paidByMemberId') && defaultPaidByMemberId) {
      form.setValue('paidByMemberId', defaultPaidByMemberId, { shouldValidate: true });
    }

    if (form.getValues('participantMemberIds').length === 0 && defaultParticipantIds.length > 0) {
      form.setValue('participantMemberIds', defaultParticipantIds, { shouldValidate: true });
    }

    if (!form.getValues('categoryId') && defaultCategoryId) {
      form.setValue('categoryId', defaultCategoryId, { shouldValidate: true });
    }

    if (!form.getValues('milestoneId') && defaultMilestoneId) {
      form.setValue('milestoneId', defaultMilestoneId, { shouldValidate: true });
    }

    if (!form.getValues('spentAt') && defaultSpentAt) {
      form.setValue('spentAt', defaultSpentAt, { shouldValidate: true });
    }
  }, [defaultCategoryId, defaultMilestoneId, defaultPaidByMemberId, defaultParticipantIds, defaultSpentAt, form]);

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
            attachments: parsed.attachments,
          },
          {
            plan,
            members,
            currentMember,
            currentUser: user,
            milestones,
            categories,
          },
        );
        if (parsed.categoryId) {
          localStorage.setItem(`last-expense-category:${planId}`, parsed.categoryId);
        }
        startTransition(() => {
          router.replace(
            returnTab === 'milestones'
              ? `/plans/${planId}?tab=milestones&milestoneId=${parsed.milestoneId}`
              : `/plans/${planId}?tab=timeline&milestoneId=${parsed.milestoneId}`,
          );
        });
      } else if (expense) {
        const parsed = updateExpenseSchema.parse({
          ...values,
          expenseId: expense.id,
        } satisfies UpdateExpenseSchema);
        await expenseService.updateExpense(parsed, {
          plan,
          members,
          currentMember,
          currentUser: user,
          milestones,
          categories,
        }, expense);
        startTransition(() => {
          router.replace(
            returnTab === 'milestones'
              ? `/plans/${planId}?tab=milestones&milestoneId=${parsed.milestoneId}`
              : returnTab === 'timeline'
                ? `/plans/${planId}?tab=timeline&milestoneId=${parsed.milestoneId}`
                : `/plans/${planId}/expenses/${expense.id}`,
          );
        });
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
    <form className="space-y-5 pb-28" onSubmit={handleSubmit}>
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
          Tên khoản chi
        </label>
        <Input id="title" placeholder="Ăn sáng, khách sạn, vé..." {...form.register('title')} />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-700" htmlFor="milestoneId">
          Mốc kế hoạch
        </label>
        <DropdownSelect
          id="milestoneId"
          onValueChange={(value) => form.setValue('milestoneId', value, { shouldValidate: true, shouldDirty: true })}
          options={[
            { value: '', label: 'Chọn mốc kế hoạch' },
            ...milestones.map((milestone) => ({ value: milestone.id, label: milestone.title })),
          ]}
          value={milestoneIdWatched || ''}
        />
      </div>

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
            Thời gian chi
          </label>
          <DateTimeInput
            id="spentAt"
            value={spentAtWatched || defaultSpentAt}
            {...form.register('spentAt')}
          />
        </div>
      </div>

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

      <details className="rounded-[24px] border border-slate-200 bg-slate-50 p-4">
        <summary className="cursor-pointer text-sm font-semibold text-slate-800">Thiết lập nâng cao</summary>
        <div className="mt-4 space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700" htmlFor="splitMethod">
              Chia tiền
            </label>
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
          </div>
          {selectedSplitMethod === splitMethods.self ? (
            <div className="px-1 py-1 text-sm italic text-[#7a8094]">
              Khoản chi này mặc định được tính cho{' '}
              <span className="font-medium text-amber-600 not-italic">{selfSplitLabel}</span>.
            </div>
          ) : null}
          {selectedSplitMethod !== splitMethods.self ? (
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
          {selectedSplitMethod !== splitMethods.self && selectedSplitMethod !== 'equal' ? (
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
                Cửa hàng / đơn vị
              </label>
              <Input id="merchantName" placeholder="Tên cửa hàng hoặc dịch vụ" {...form.register('merchantName')} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700" htmlFor="locationName">
                Địa điểm
              </label>
              <Input id="locationName" placeholder="Nơi phát sinh khoản chi" {...form.register('locationName')} />
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
          maxCount={5}
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

      <div className="fixed inset-x-0 bottom-24 z-10 mx-auto max-w-3xl px-4">
        <Button className="w-full justify-center rounded-full" disabled={isSubmitting} type="submit">
          {isSubmitting ? (
            mode === 'create' ? 'Đang tạo khoản chi...' : 'Đang lưu khoản chi...'
          ) : (
            <>
              <CheckCircle2 className="size-4" />
              {mode === 'create' ? 'Lưu khoản chi' : 'Lưu thay đổi'}
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
