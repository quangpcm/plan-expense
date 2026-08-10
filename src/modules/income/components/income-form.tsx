'use client';

import { useRouter } from 'next/navigation';
import { startTransition, useState } from 'react';
import { Landmark } from 'lucide-react';
import { useForm, useWatch } from 'react-hook-form';
import { ZodError } from 'zod';

import { AuthFormMessage } from '@/modules/auth/components/auth-form-message';
import { useAuthSession } from '@/modules/auth/hooks/use-auth-session';
import { getCategoryIcon } from '@/modules/category/utils/category-icon';
import { useIncomeCategories } from '@/modules/category/hooks/use-income-categories';
import { usePlanMembers } from '@/modules/member/hooks/use-plan-members';
import { usePlan } from '@/modules/plan/hooks/use-plan';
import { createIncomeSchema, type CreateIncomeSchema } from '@/modules/income/schemas/create-income.schema';
import { updateIncomeSchema, type UpdateIncomeSchema } from '@/modules/income/schemas/update-income.schema';
import { incomeService } from '@/modules/income/services';
import type { IncomeDocument } from '@/modules/income/types/income';
import { AmountInput } from '@/shared/components/ui/amount-input';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Textarea } from '@/shared/components/ui/textarea';
import { cn } from '@/shared/utils/cn';

type IncomeFormProps = {
  planId: string;
  mode: 'create' | 'edit';
  income?: IncomeDocument;
};

export function IncomeForm({ planId, mode, income }: IncomeFormProps) {
  const router = useRouter();
  const { user } = useAuthSession();
  const { plan } = usePlan(planId);
  const { members, currentMember } = usePlanMembers(planId);
  const { categories } = useIncomeCategories(planId);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const activeMembers = members.filter((member) => member.status === 'active');
  const form = useForm<CreateIncomeSchema>({
    defaultValues: {
      title: income?.title || '',
      amount: income?.amount || 0,
      categoryId: income?.categoryId || '',
      contributedByMemberId: income?.contributedByMemberId || currentMember?.id || activeMembers[0]?.id || '',
      note: income?.note || '',
      receivedAt: income ? new Date(income.receivedAt.toDate()).toISOString().slice(0, 16) : '',
    },
  });
  const categoryIdWatched = useWatch({ control: form.control, name: 'categoryId' });
  const amountWatched = useWatch({ control: form.control, name: 'amount' });

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
        });
        startTransition(() => {
          router.replace(`/plans/${planId}?tab=timeline`);
        });
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
          },
          income,
        );
        startTransition(() => {
          router.replace(`/plans/${planId}/incomes/${income.id}`);
        });
      }
    } catch (error) {
      if (error instanceof ZodError) {
        setErrorMessage(error.issues[0]?.message || 'Vui lòng kiểm tra lại thông tin khoản thu.');
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
      <Input placeholder="Đóng quỹ, nạp thêm..." {...form.register('title')} />

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

      <select
        className="min-h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-950 outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
        {...form.register('contributedByMemberId')}
      >
        {activeMembers.map((member) => (
          <option key={member.id} value={member.id}>
            {member.nickname}
          </option>
        ))}
      </select>
      <Input type="datetime-local" {...form.register('receivedAt')} />
      <Textarea placeholder="Ghi chú thêm (không bắt buộc)" {...form.register('note')} />
      {errorMessage ? <AuthFormMessage message={errorMessage} type="error" /> : null}
      <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
        <Button
          href={income ? `/plans/${planId}/incomes/${income.id}` : `/plans/${planId}`}
          variant="secondary"
        >
          Hủy
        </Button>
        <Button disabled={isSubmitting} type="submit">
          <Landmark className="size-4" />
          {isSubmitting
            ? 'Đang lưu khoản thu...'
            : mode === 'create'
              ? 'Lưu khoản thu'
              : 'Lưu thay đổi'}
        </Button>
      </div>
    </form>
  );
}
