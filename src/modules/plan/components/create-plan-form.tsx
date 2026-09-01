'use client';

import { useState } from 'react';
import { FolderPlus } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { ZodError } from 'zod';

import { planCardVisualsByType } from '@/modules/plan/constants/plan-card-visuals';
import { useCreatePlan } from '@/modules/plan/hooks/use-create-plan';
import { createPlanSchema, type CreatePlanSchema } from '@/modules/plan/schemas/create-plan.schema';
import { planTypeOptions } from '@/modules/plan/constants/plan.constants';
import { AmountInput } from '@/shared/components/ui/amount-input';
import { Button } from '@/shared/components/ui/button';
import { DateField } from '@/shared/components/ui/date-field';
import { DropdownSelect } from '@/shared/components/ui/dropdown-select';
import { Input } from '@/shared/components/ui/input';
import { Textarea } from '@/shared/components/ui/textarea';
import { AuthFormMessage } from '@/modules/auth/components/auth-form-message';

function RequiredMark() {
  return <span className="ml-1 text-red-500">*</span>;
}

function resolvePlanFormErrorMessage(error: ZodError, planType: CreatePlanSchema['planType']) {
  if (planType === 'saving') {
    const hasSavingFieldIssue = error.issues.some((issue) =>
      issue.path.some((segment) => segment === 'savingGoalAmount' || segment === 'savingTargetDate'),
    );

    if (hasSavingFieldIssue) {
      return 'Bạn cần nhập số tiền mục tiêu và ngày đến hạn.';
    }
  }

  return error.issues[0]?.message || 'Vui lòng kiểm tra lại thông tin đã nhập.';
}

type CreatePlanFormProps = {
  onSuccess: (planId: string) => void;
  onCancel: () => void;
};

export function CreatePlanForm({ onSuccess, onCancel }: CreatePlanFormProps) {
  const { createPlan, isSubmitting } = useCreatePlan();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { register, handleSubmit, setValue, watch } = useForm<CreatePlanSchema>({
    defaultValues: {
      name: '',
      description: '',
      planType: 'general',
      startDate: '',
      endDate: '',
      budgetAmount: undefined,
      savingGoalAmount: undefined,
      savingTargetDate: '',
    },
  });
  const selectedPlanType = watch('planType');
  const budgetAmount = watch('budgetAmount') ?? 0;
  const savingGoalAmount = watch('savingGoalAmount') ?? 0;
  const showsBudgetField = ['travel', 'wedding', 'birthday', 'event'].includes(selectedPlanType);
  const moneyFieldLabel = selectedPlanType === 'saving' ? 'Mục tiêu tích lũy' : 'Ngân sách dự kiến';
  const planTypeDropdownOptions = planTypeOptions.map((option) => ({
    value: option.value,
    label: option.label,
    icon: planCardVisualsByType[option.value].icon,
  }));

  const onSubmit = handleSubmit(async (values) => {
    setErrorMessage(null);

    try {
      const parsed = createPlanSchema.parse(values);
      const result = await createPlan(parsed);
      onSuccess(result.planId);
    } catch (error) {
      if (error instanceof ZodError) {
        setErrorMessage(resolvePlanFormErrorMessage(error, values.planType));
      } else if (error instanceof Error) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage('Hiện chưa thể tạo kế hoạch. Vui lòng thử lại.');
      }
    }
  });

  return (
    <form className="space-y-5" onSubmit={onSubmit}>
      {showsBudgetField || selectedPlanType === 'saving' ? (
        <div className="space-y-1 text-center">
          <label className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-text-muted)]">
            {moneyFieldLabel}
            {selectedPlanType === 'saving' ? <RequiredMark /> : null}
          </label>
          {showsBudgetField ? (
            <>
              <input type="hidden" {...register('budgetAmount', { valueAsNumber: true })} />
              <AmountInput
                id="budgetAmount"
                onChange={(value) => setValue('budgetAmount', value > 0 ? value : undefined, { shouldDirty: true, shouldValidate: true })}
                placeholder="0"
                value={budgetAmount}
              />
            </>
          ) : null}
          {selectedPlanType === 'saving' ? (
            <>
              <input type="hidden" {...register('savingGoalAmount', { valueAsNumber: true })} />
              <AmountInput
                id="savingGoalAmount"
                onChange={(value) => setValue('savingGoalAmount', value > 0 ? value : undefined, { shouldDirty: true, shouldValidate: true })}
                placeholder="0"
                value={savingGoalAmount}
              />
            </>
          ) : null}
        </div>
      ) : null}

      <div className="space-y-2">
        <label className="text-sm font-medium text-[var(--color-text-secondary)]" htmlFor="name">
          Tên kế hoạch
          <RequiredMark />
        </label>
        <Input id="name" placeholder="Ví dụ: Đi Huế, Đám cưới, Quỹ nhóm..." {...register('name')} />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-[var(--color-text-secondary)]" htmlFor="planType">
          Loại kế hoạch
          <RequiredMark />
        </label>
        <input type="hidden" {...register('planType')} />
        <DropdownSelect
          id="planType"
          onValueChange={(value) => setValue('planType', value as CreatePlanSchema['planType'], { shouldDirty: true, shouldValidate: true })}
          options={planTypeDropdownOptions}
          value={selectedPlanType}
        />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium text-[var(--color-text-secondary)]" htmlFor="startDate">
            Bắt đầu
          </label>
          <DateField id="startDate" value={watch('startDate') || ''} {...register('startDate')} />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-[var(--color-text-secondary)]" htmlFor="endDate">
            Kết thúc
            <span className="ml-1 text-xs font-normal text-[var(--color-text-muted)]">(không bắt buộc)</span>
          </label>
          <DateField id="endDate" value={watch('endDate') || ''} {...register('endDate')} />
        </div>
      </div>

      {selectedPlanType === 'saving' ? (
        <div className="space-y-2">
          <label className="text-sm font-medium text-[var(--color-text-secondary)]" htmlFor="savingTargetDate">
            Mốc mục tiêu
            <RequiredMark />
          </label>
          <DateField id="savingTargetDate" value={watch('savingTargetDate') || ''} {...register('savingTargetDate')} />
        </div>
      ) : null}

      <div className="space-y-2">
        <label className="text-sm font-medium text-[var(--color-text-secondary)]" htmlFor="description">
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
        <Button className="mx-auto w-fit px-4" onClick={onCancel} type="button" variant="ghost">
          Hủy
        </Button>
      </div>
    </form>
  );
}
