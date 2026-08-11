'use client';

import { useRouter } from 'next/navigation';
import { startTransition, useState } from 'react';
import { CalendarDays, ChevronDown, FolderPlus } from 'lucide-react';
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
        setErrorMessage(error.issues[0]?.message || 'Vui lòng kiểm tra lại thông tin đã nhập.');
      } else if (error instanceof Error) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage('Hiện chưa thể tạo kế hoạch. Vui lòng thử lại.');
      }
    }
  });

  return (
    <form className="space-y-5" onSubmit={onSubmit}>
      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-700" htmlFor="name">
          Tên kế hoạch
        </label>
        <Input id="name" placeholder="Ví dụ: Đi Huế, Đám cưới, Quỹ nhóm..." {...register('name')} />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-700" htmlFor="planType">
          Loại kế hoạch
        </label>
        <div className="relative">
          <select
            className="min-h-11 w-full appearance-none rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2.5 pr-11 text-sm text-[var(--color-foreground)] outline-none transition focus:border-[var(--color-accent)] focus:ring-4 focus:ring-[var(--color-accent-soft)]"
            id="planType"
            {...register('planType')}
          >
            {planTypeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <span className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-[var(--color-subtle)]">
            <ChevronDown className="size-4" />
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700" htmlFor="startDate">
            Bắt đầu
          </label>
          <div className="relative">
            <Input
              className="pr-11 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:right-0 [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:w-11 [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-0"
              id="startDate"
              type="date"
              {...register('startDate')}
            />
            <span className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-[var(--color-subtle)]">
              <CalendarDays className="size-4" />
            </span>
          </div>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700" htmlFor="endDate">
            Kết thúc
            <span className="ml-1 text-xs font-normal text-slate-500">(không bắt buộc)</span>
          </label>
          <div className="relative">
            <Input
              className="pr-11 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:right-0 [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:w-11 [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-0"
              id="endDate"
              type="date"
              {...register('endDate')}
            />
            <span className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-[var(--color-subtle)]">
              <CalendarDays className="size-4" />
            </span>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-700" htmlFor="description">
          Mô tả
        </label>
        <Textarea
          id="description"
          placeholder="Thêm ghi chú hoặc mục tiêu của kế hoạch..."
          {...register('description')}
        />
      </div>

      {errorMessage ? <AuthFormMessage message={errorMessage} type="error" /> : null}

      <div className="flex flex-col gap-3">
        <Button disabled={isSubmitting} type="submit">
          {isSubmitting ? (
            'Đang tạo...'
          ) : (
            <>
              <FolderPlus className="size-4" />
              Tạo kế hoạch
            </>
          )}
        </Button>
        <Button className="mx-auto w-fit px-4" href="/plans" variant="ghost">
          Hủy
        </Button>
      </div>
    </form>
  );
}
