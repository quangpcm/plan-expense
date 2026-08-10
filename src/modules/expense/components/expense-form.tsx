'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { startTransition, useEffect, useMemo, useRef, useState } from 'react';
import { Camera, Check, CheckCircle2, ChevronRight, User } from 'lucide-react';
import { useForm, useWatch } from 'react-hook-form';
import { ZodError } from 'zod';

import { AuthFormMessage } from '@/modules/auth/components/auth-form-message';
import { useAuthSession } from '@/modules/auth/hooks/use-auth-session';
import { getCategoryIcon } from '@/modules/category/utils/category-icon';
import { useExpenseCategories } from '@/modules/category/hooks/use-expense-categories';
import { usePlanMembers } from '@/modules/member/hooks/use-plan-members';
import { useMilestones } from '@/modules/milestone';
import { usePlan } from '@/modules/plan/hooks/use-plan';
import { createExpenseSchema, type CreateExpenseSchema } from '@/modules/expense/schemas/create-expense.schema';
import { updateExpenseSchema, type UpdateExpenseSchema } from '@/modules/expense/schemas/update-expense.schema';
import { expenseService } from '@/modules/expense/services';
import type { ExpenseDocument } from '@/modules/expense/types/expense';
import { AmountInput } from '@/shared/components/ui/amount-input';
import { BottomSheet } from '@/shared/components/ui/bottom-sheet';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Textarea } from '@/shared/components/ui/textarea';
import { splitMethods } from '@/shared/constants';
import { formatCurrency } from '@/shared/utils/currency';
import { cn } from '@/shared/utils/cn';

type ExpenseFormProps = {
  planId: string;
  mode: 'create' | 'edit';
  expense?: ExpenseDocument;
};

export function ExpenseForm({ planId, mode, expense }: ExpenseFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuthSession();
  const { plan } = usePlan(planId);
  const { milestones } = useMilestones(planId);
  const { members, currentMember } = usePlanMembers(planId);
  const { categories } = useExpenseCategories(planId);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPaidByOpen, setIsPaidByOpen] = useState(false);
  const activeMembers = useMemo(
    () => members.filter((member) => member.status === 'active'),
    [members],
  );
  const defaultPaidByMemberId =
    expense?.paidByMemberId || currentMember?.id || activeMembers[0]?.id || '';
  const defaultParticipantIds =
    expense?.participants.map((participant) => participant.memberId) ||
    activeMembers.map((member) => member.id);
  const defaultCategoryId = expense?.categoryId || categories[0]?.id || '';
  const milestoneIdFromQuery = searchParams.get('milestoneId') || '';
  const defaultMilestoneId = expense?.milestoneId || milestoneIdFromQuery || milestones[0]?.id || '';
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
      splitMethod: expense?.splitMethod || 'equal',
      splitValues: defaultSplitValues,
      merchantName: expense?.merchantName || '',
      locationName: expense?.locationName || '',
      note: expense?.note || '',
      spentAt: expense ? new Date(expense.spentAt.toDate()).toISOString().slice(0, 16) : '',
      attachments: [],
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
  const isFirstSplitMethodRender = useRef(true);
  const totalSplitValue = selectedMembers.reduce(
    (sum, memberId) => sum + (Number(splitValuesWatched[memberId]) || 0),
    0,
  );
  const paidByMember = activeMembers.find((member) => member.id === paidByMemberIdWatched);
  const paidByLabel =
    paidByMemberIdWatched && paidByMemberIdWatched === currentMember?.id
      ? 'Bạn (Mặc định)'
      : paidByMember?.nickname || 'Chọn người chi trả';

  useEffect(() => {
    if (isFirstSplitMethodRender.current) {
      isFirstSplitMethodRender.current = false;
      return;
    }

    form.setValue('splitValues', {}, { shouldDirty: true });
  }, [selectedSplitMethod, form]);

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
  }, [defaultCategoryId, defaultMilestoneId, defaultPaidByMemberId, defaultParticipantIds, form]);

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
          router.replace(`/plans/${planId}?tab=timeline&milestoneId=${parsed.milestoneId}`);
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
          router.replace(`/plans/${planId}/expenses/${expense.id}`);
        });
      }
    } catch (error) {
      if (error instanceof ZodError) {
        setErrorMessage(
          error.issues.map((issue) => issue.message).filter(Boolean).join(' | ') ||
            'Vui lòng kiểm tra lại thông tin khoản chi.',
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

  const attachmentFiles = useWatch({ control: form.control, name: 'attachments' }) ?? [];

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
        <select
          className="min-h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-950 outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
          id="milestoneId"
          {...form.register('milestoneId')}
        >
          <option value="">Chọn mốc kế hoạch</option>
          {milestones.map((milestone) => (
            <option key={milestone.id} value={milestone.id}>
              {milestone.title}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <p className="text-sm font-medium text-slate-700">Danh mục</p>
        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
          {categories.map((category) => {
            const CategoryIcon = getCategoryIcon(category.name);
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
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700" htmlFor="splitMethod">
              Chia tiền
            </label>
            <select
              className="min-h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-950 outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
              id="splitMethod"
              {...form.register('splitMethod')}
            >
              <option value={splitMethods.equal}>Chia đều</option>
              <option value={splitMethods.exact}>Số tiền cụ thể</option>
              <option value={splitMethods.percentage}>Theo phần trăm</option>
              <option value={splitMethods.shares}>Theo số phần</option>
            </select>
          </div>
          {selectedSplitMethod !== 'equal' ? (
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
            <label className="text-sm font-medium text-slate-700" htmlFor="spentAt">
              Thời gian chi
            </label>
            <Input id="spentAt" type="datetime-local" {...form.register('spentAt')} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700" htmlFor="note">
              Ghi chú
            </label>
            <Textarea id="note" placeholder="Ghi chú thêm (không bắt buộc)" {...form.register('note')} />
          </div>
        </div>
      </details>

      {mode === 'create' ? (
        <div className="space-y-2">
          <label
            className="flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-[#c2c6d8] bg-[#f7f9fb] py-8 text-center"
            htmlFor="attachments"
          >
            <Camera className="size-6 text-[#727687]" />
            <span className="text-sm text-[#727687]">
              {attachmentFiles.length > 0 ? `${attachmentFiles.length} ảnh đã chọn` : 'Thêm ảnh hóa đơn'}
            </span>
            <input
              className="hidden"
              id="attachments"
              accept="image/*"
              multiple
              type="file"
              onChange={(event) => {
                form.setValue('attachments', Array.from(event.target.files || []), {
                  shouldDirty: true,
                });
              }}
            />
          </label>
          <p className="text-xs text-slate-500">Tối đa 5 ảnh. Khoản chi chỉ được tạo sau khi tải ảnh lên thành công.</p>
        </div>
      ) : null}

      {errorMessage ? <AuthFormMessage message={errorMessage} type="error" /> : null}

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
