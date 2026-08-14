'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { ZodError } from 'zod';

import { AuthFormMessage } from '@/modules/auth/components/auth-form-message';
import { planCardVisualsByType } from '@/modules/plan/constants/plan-card-visuals';
import { planTypeOptions } from '@/modules/plan/constants/plan.constants';
import { useUpdatePlan } from '@/modules/plan/hooks/use-update-plan';
import { updatePlanSchema, type UpdatePlanSchema } from '@/modules/plan/schemas/update-plan.schema';
import type { PlanDocument } from '@/modules/plan/types/plan';
import type { PlanMemberDocument } from '@/modules/member/types/member';
import { Button } from '@/shared/components/ui/button';
import { CurrencyField } from '@/shared/components/ui/currency-field';
import { DateField } from '@/shared/components/ui/date-field';
import { DropdownSelect } from '@/shared/components/ui/dropdown-select';
import { Input } from '@/shared/components/ui/input';
import { Textarea } from '@/shared/components/ui/textarea';
import { timestampToDate } from '@/shared/utils/firebase';

type EditPlanFormProps = {
  plan: PlanDocument;
  currentMember: PlanMemberDocument | null;
  onClose?: () => void;
};

function toDateInputValue(date: Date | null) {
  if (!date) {
    return '';
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

export function EditPlanForm({ plan, currentMember, onClose }: EditPlanFormProps) {
  const { updatePlan, isSubmitting } = useUpdatePlan();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const { register, handleSubmit, setValue, watch } = useForm<UpdatePlanSchema>({
    defaultValues: {
      name: plan.name,
      description: plan.description || '',
      planType: plan.planType,
      startDate: toDateInputValue(timestampToDate(plan.startDate)),
      endDate: toDateInputValue(timestampToDate(plan.endDate)),
      budgetAmount: plan.budgetAmount ?? undefined,
      savingGoalAmount: plan.savingGoalAmount ?? undefined,
      savingTargetDate: toDateInputValue(timestampToDate(plan.savingTargetDate)),
    },
  });
  const selectedPlanType = watch('planType');
  const budgetAmount = watch('budgetAmount') ?? 0;
  const savingGoalAmount = watch('savingGoalAmount') ?? 0;
  const showsBudgetField = ['travel', 'wedding', 'birthday', 'event'].includes(selectedPlanType);
  const planTypeDropdownOptions = planTypeOptions.map((option) => ({
    value: option.value,
    label: option.label,
    icon: planCardVisualsByType[option.value].icon,
  }));

  const onSubmit = handleSubmit(async (values) => {
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const parsed = updatePlanSchema.parse(values);
      await updatePlan(plan, parsed, currentMember);
      setSuccessMessage('Đã cập nhật kế hoạch.');
    } catch (error) {
      if (error instanceof ZodError) {
        setErrorMessage(error.issues[0]?.message || 'Vui lòng kiểm tra lại thông tin đã nhập.');
      } else if (error instanceof Error) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage('Hiện chưa thể cập nhật kế hoạch.');
      }
    }
  });

  return (
    <form className="space-y-4" onSubmit={onSubmit}>
      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-700" htmlFor="edit-plan-name">
          Tên kế hoạch
        </label>
        <Input id="edit-plan-name" {...register('name')} />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-700" htmlFor="edit-plan-planType">
          Loại kế hoạch
        </label>
        <input type="hidden" {...register('planType')} />
        <DropdownSelect
          id="edit-plan-planType"
          onValueChange={(value) =>
            setValue('planType', value as UpdatePlanSchema['planType'], { shouldDirty: true, shouldValidate: true })
          }
          options={planTypeDropdownOptions}
          value={selectedPlanType}
        />
      </div>

      {showsBudgetField ? (
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700" htmlFor="edit-plan-budgetAmount">
            Ngân sách dự kiến
          </label>
          <input type="hidden" {...register('budgetAmount', { valueAsNumber: true })} />
          <CurrencyField
            id="edit-plan-budgetAmount"
            onChange={(value) => setValue('budgetAmount', value > 0 ? value : undefined, { shouldDirty: true, shouldValidate: true })}
            placeholder="Ví dụ: 12.000.000"
            value={budgetAmount}
          />
        </div>
      ) : null}

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700" htmlFor="edit-plan-startDate">
            Ngày bắt đầu
          </label>
          <DateField id="edit-plan-startDate" {...register('startDate')} />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700" htmlFor="edit-plan-endDate">
            Ngày kết thúc
          </label>
          <DateField id="edit-plan-endDate" {...register('endDate')} />
        </div>
      </div>

      {selectedPlanType === 'saving' ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700" htmlFor="edit-plan-savingGoalAmount">
              Mục tiêu tích lũy
            </label>
            <input type="hidden" {...register('savingGoalAmount', { valueAsNumber: true })} />
            <CurrencyField
              id="edit-plan-savingGoalAmount"
              onChange={(value) => setValue('savingGoalAmount', value > 0 ? value : undefined, { shouldDirty: true, shouldValidate: true })}
              placeholder="Ví dụ: 50.000.000"
              value={savingGoalAmount}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700" htmlFor="edit-plan-savingTargetDate">
              Mốc mục tiêu
            </label>
            <DateField id="edit-plan-savingTargetDate" {...register('savingTargetDate')} />
          </div>
        </div>
      ) : null}

      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-700" htmlFor="edit-plan-description">
          Mô tả
        </label>
        <Textarea id="edit-plan-description" placeholder="Mục tiêu hoặc ghi chú ngắn cho kế hoạch..." {...register('description')} />
      </div>

      {errorMessage ? <AuthFormMessage message={errorMessage} type="error" /> : null}
      {successMessage ? <AuthFormMessage message={successMessage} type="success" /> : null}

      <div className="flex items-center justify-end gap-3">
        {onClose ? (
          <Button onClick={onClose} type="button" variant="ghost">
            Đóng
          </Button>
        ) : null}
        <Button disabled={isSubmitting} type="submit">
          {isSubmitting ? 'Đang lưu...' : 'Lưu thay đổi'}
        </Button>
      </div>
    </form>
  );
}
