'use client';

import { useRouter } from 'next/navigation';
import { startTransition, useState } from 'react';
import { Landmark } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { ZodError } from 'zod';

import { AuthFormMessage } from '@/modules/auth/components/auth-form-message';
import { useAuthSession } from '@/modules/auth/hooks/use-auth-session';
import { useExpenseCategories } from '@/modules/category/hooks/use-expense-categories';
import { usePlanMembers } from '@/modules/member/hooks/use-plan-members';
import { usePlan } from '@/modules/plan/hooks/use-plan';
import { createIncomeSchema, type CreateIncomeSchema } from '@/modules/income/schemas/create-income.schema';
import { incomeService } from '@/modules/income/services';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Textarea } from '@/shared/components/ui/textarea';

type IncomeFormProps = {
  planId: string;
};

export function IncomeForm({ planId }: IncomeFormProps) {
  const router = useRouter();
  const { user } = useAuthSession();
  const { plan } = usePlan(planId);
  const { members, currentMember } = usePlanMembers(planId);
  const { categories } = useExpenseCategories(planId);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const activeMembers = members.filter((member) => member.status === 'active');
  const form = useForm<CreateIncomeSchema>({
    defaultValues: {
      title: '',
      amount: 0,
      categoryId: '',
      contributedByMemberId: currentMember?.id || activeMembers[0]?.id || '',
      note: '',
      receivedAt: '',
    },
  });

  const handleSubmit = form.handleSubmit(async (values) => {
    if (!plan || !user) {
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const parsed = createIncomeSchema.parse(values);
      await incomeService.createIncome(parsed, {
        plan,
        members,
        currentMember,
        currentUser: user,
        categories,
      });
      startTransition(() => {
        router.replace(`/plans/${planId}`);
      });
    } catch (error) {
      if (error instanceof ZodError) {
        setErrorMessage(error.issues[0]?.message || 'Please review your income input.');
      } else if (error instanceof Error) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage('Unable to save this income right now.');
      }
    } finally {
      setIsSubmitting(false);
    }
  });

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      <Input placeholder="Fund contribution, deposit..." {...form.register('title')} />
      <Input inputMode="numeric" placeholder="2000000" {...form.register('amount')} />
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
      <Textarea placeholder="Optional note" {...form.register('note')} />
      {errorMessage ? <AuthFormMessage message={errorMessage} type="error" /> : null}
      <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
        <Button href={`/plans/${planId}`} variant="secondary">
          Cancel
        </Button>
        <Button disabled={isSubmitting} type="submit">
          <Landmark className="size-4" />
          {isSubmitting ? 'Saving income...' : 'Save income'}
        </Button>
      </div>
    </form>
  );
}

