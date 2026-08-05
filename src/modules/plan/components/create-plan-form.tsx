'use client';

import { useRouter } from 'next/navigation';
import { startTransition, useState } from 'react';
import { CalendarDays, FolderPlus } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { ZodError } from 'zod';

import { useCreatePlan } from '@/modules/plan/hooks/use-create-plan';
import { createPlanSchema, type CreatePlanSchema } from '@/modules/plan/schemas/create-plan.schema';
import { planTypeOptions } from '@/modules/plan/constants/plan.constants';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Textarea } from '@/shared/components/ui/textarea';
import { AuthFormMessage } from '@/modules/auth/components/auth-form-message';

export function CreatePlanForm() {
  const router = useRouter();
  const { createPlan, isSubmitting } = useCreatePlan();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { register, handleSubmit } = useForm<CreatePlanSchema>({
    defaultValues: {
      name: '',
      description: '',
      planType: 'general',
      startDate: '',
      endDate: '',
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    setErrorMessage(null);

    try {
      const parsed = createPlanSchema.parse(values);
      const result = await createPlan(parsed);
      startTransition(() => {
        router.replace(`/plans/${result.planId}`);
      });
    } catch (error) {
      if (error instanceof ZodError) {
        setErrorMessage(error.issues[0]?.message || 'Please review your input.');
      } else if (error instanceof Error) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage('Unable to create the plan right now.');
      }
    }
  });

  return (
    <form className="space-y-5" onSubmit={onSubmit}>
      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-700" htmlFor="name">
          Plan name
        </label>
        <Input id="name" placeholder="Hue trip, wedding budget, room fund..." {...register('name')} />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-700" htmlFor="planType">
          Plan type
        </label>
        <select
          className="min-h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-950 outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
          id="planType"
          {...register('planType')}
        >
          {planTypeOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700" htmlFor="startDate">
            Start date
          </label>
          <Input id="startDate" type="date" {...register('startDate')} />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700" htmlFor="endDate">
            End date
          </label>
          <Input id="endDate" type="date" {...register('endDate')} />
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-700" htmlFor="description">
          Description
        </label>
        <Textarea
          id="description"
          placeholder="Optional context for the plan, budget purpose, or trip details."
          {...register('description')}
        />
      </div>

      {errorMessage ? <AuthFormMessage message={errorMessage} type="error" /> : null}

      <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
        <Button href="/plans" variant="secondary">
          Cancel
        </Button>
        <Button disabled={isSubmitting} type="submit">
          {isSubmitting ? (
            'Creating...'
          ) : (
            <>
              <FolderPlus className="size-4" />
              Create plan
            </>
          )}
        </Button>
      </div>

      <div className="rounded-[24px] bg-slate-50 p-4 text-sm leading-7 text-slate-600">
        <span className="inline-flex items-center gap-2 font-medium text-slate-800">
          <CalendarDays className="size-4" />
          What happens next
        </span>
        <br />
        The app will create the plan, add you as the owner, generate default categories, and open
        the new plan detail right away.
      </div>
    </form>
  );
}

