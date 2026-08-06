'use client';

import { useRouter } from 'next/navigation';
import { startTransition, useEffect, useMemo, useRef, useState } from 'react';
import { PlusCircle, Save } from 'lucide-react';
import { useForm, useWatch } from 'react-hook-form';
import { ZodError } from 'zod';

import { AuthFormMessage } from '@/modules/auth/components/auth-form-message';
import { useAuthSession } from '@/modules/auth/hooks/use-auth-session';
import { useExpenseCategories } from '@/modules/category/hooks/use-expense-categories';
import { usePlanMembers } from '@/modules/member/hooks/use-plan-members';
import { usePlan } from '@/modules/plan/hooks/use-plan';
import { createExpenseSchema, type CreateExpenseSchema } from '@/modules/expense/schemas/create-expense.schema';
import { updateExpenseSchema, type UpdateExpenseSchema } from '@/modules/expense/schemas/update-expense.schema';
import { expenseService } from '@/modules/expense/services';
import type { ExpenseDocument } from '@/modules/expense/types/expense';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Textarea } from '@/shared/components/ui/textarea';
import { splitMethods } from '@/shared/constants';
import { formatCurrency } from '@/shared/utils/currency';

type ExpenseFormProps = {
  planId: string;
  mode: 'create' | 'edit';
  expense?: ExpenseDocument;
};

export function ExpenseForm({ planId, mode, expense }: ExpenseFormProps) {
  const router = useRouter();
  const { user } = useAuthSession();
  const { plan } = usePlan(planId);
  const { members, currentMember } = usePlanMembers(planId);
  const { categories } = useExpenseCategories(planId);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
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
  const isFirstSplitMethodRender = useRef(true);
  const totalSplitValue = selectedMembers.reduce(
    (sum, memberId) => sum + (Number(splitValuesWatched[memberId]) || 0),
    0,
  );

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
  }, [defaultCategoryId, defaultPaidByMemberId, defaultParticipantIds, form]);

  const handleSubmit = form.handleSubmit(async (values) => {
    if (!plan || !user) {
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      if (mode === 'create') {
        const parsed = createExpenseSchema.parse(values);
        const result = await expenseService.createExpense(
          {
            ...parsed,
            attachments: parsed.attachments,
          },
          {
            plan,
            members,
            currentMember,
            currentUser: user,
            categories,
          },
        );
        if (parsed.categoryId) {
          localStorage.setItem(`last-expense-category:${planId}`, parsed.categoryId);
        }
        startTransition(() => {
          router.replace(`/plans/${planId}/expenses/${result.expenseId}`);
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

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-700" htmlFor="title">
          Tên khoản chi
        </label>
        <Input id="title" placeholder="Ăn sáng, khách sạn, vé..." {...form.register('title')} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700" htmlFor="amount">
            Số tiền
          </label>
          <Input id="amount" inputMode="numeric" placeholder="150000" {...form.register('amount')} />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700" htmlFor="paidByMemberId">
            Người trả
          </label>
          <select
            className="min-h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-950 outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
            id="paidByMemberId"
            {...form.register('paidByMemberId')}
          >
            {activeMembers.map((member) => (
              <option key={member.id} value={member.id}>
                {member.nickname}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-700" htmlFor="categoryId">
          Danh mục
        </label>
        <select
          className="min-h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-950 outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
          id="categoryId"
          {...form.register('categoryId')}
        >
          <option value="">Không chọn danh mục</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      </div>

      {mode === 'create' ? (
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700" htmlFor="attachments">
            Ảnh đính kèm
          </label>
          <Input
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
          <p className="text-xs text-slate-500">Tối đa 5 ảnh. Khoản chi chỉ được tạo sau khi tải ảnh lên thành công.</p>
        </div>
      ) : null}

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

      {errorMessage ? <AuthFormMessage message={errorMessage} type="error" /> : null}

      <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
        <Button href={`/plans/${planId}`} variant="secondary">
          Hủy
        </Button>
        <Button disabled={isSubmitting} type="submit">
          {isSubmitting ? (
            mode === 'create' ? 'Đang tạo khoản chi...' : 'Đang lưu khoản chi...'
          ) : mode === 'create' ? (
            <>
              <PlusCircle className="size-4" />
              Lưu khoản chi
            </>
          ) : (
            <>
              <Save className="size-4" />
              Lưu thay đổi
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
