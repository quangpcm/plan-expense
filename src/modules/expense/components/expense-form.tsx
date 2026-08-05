'use client';

import { useRouter } from 'next/navigation';
import { startTransition, useEffect, useMemo, useState } from 'react';
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
  const form = useForm<CreateExpenseSchema>({
    defaultValues: {
      title: expense?.title || '',
      amount: expense?.amount || 0,
      categoryId: defaultCategoryId,
      paidByMemberId: defaultPaidByMemberId,
      participantMemberIds: defaultParticipantIds,
      splitMethod: 'equal',
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
            'Please review your expense input.',
        );
      } else if (error instanceof Error) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage('Unable to save this expense right now.');
      }
    } finally {
      setIsSubmitting(false);
    }
  });

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-700" htmlFor="title">
          Title
        </label>
        <Input id="title" placeholder="Breakfast, hotel, ticket..." {...form.register('title')} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700" htmlFor="amount">
            Amount
          </label>
          <Input id="amount" inputMode="numeric" placeholder="150000" {...form.register('amount')} />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700" htmlFor="paidByMemberId">
            Paid by
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
          Category
        </label>
        <select
          className="min-h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-950 outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
          id="categoryId"
          {...form.register('categoryId')}
        >
          <option value="">No category</option>
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
            Attachments
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
          <p className="text-xs text-slate-500">Up to 5 images. Expense is only created after uploads succeed.</p>
        </div>
      ) : null}

      <details className="rounded-[24px] border border-slate-200 bg-slate-50 p-4">
        <summary className="cursor-pointer text-sm font-semibold text-slate-800">Advanced settings</summary>
        <div className="mt-4 space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Participants</label>
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
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700" htmlFor="merchantName">
                Merchant
              </label>
              <Input id="merchantName" placeholder="Store or service name" {...form.register('merchantName')} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700" htmlFor="locationName">
                Location
              </label>
              <Input id="locationName" placeholder="Where it happened" {...form.register('locationName')} />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700" htmlFor="spentAt">
              Spent time
            </label>
            <Input id="spentAt" type="datetime-local" {...form.register('spentAt')} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700" htmlFor="note">
              Note
            </label>
            <Textarea id="note" placeholder="Optional note" {...form.register('note')} />
          </div>
        </div>
      </details>

      {errorMessage ? <AuthFormMessage message={errorMessage} type="error" /> : null}

      <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
        <Button href={`/plans/${planId}`} variant="secondary">
          Cancel
        </Button>
        <Button disabled={isSubmitting} type="submit">
          {isSubmitting ? (
            mode === 'create' ? 'Creating expense...' : 'Saving expense...'
          ) : mode === 'create' ? (
            <>
              <PlusCircle className="size-4" />
              Save expense
            </>
          ) : (
            <>
              <Save className="size-4" />
              Save changes
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
