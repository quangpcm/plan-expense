'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { ZodError } from 'zod';

import { AuthFormMessage } from '@/modules/auth/components/auth-form-message';
import { useUpdatePlan } from '@/modules/plan/hooks/use-update-plan';
import { updatePlanSchema, type UpdatePlanSchema } from '@/modules/plan/schemas/update-plan.schema';
import type { PlanDocument } from '@/modules/plan/types/plan';
import type { PlanMemberDocument } from '@/modules/member/types/member';
import { Button } from '@/shared/components/ui/button';
import { DateField } from '@/shared/components/ui/date-field';
import { Input } from '@/shared/components/ui/input';
import { Textarea } from '@/shared/components/ui/textarea';
import { timestampToDate } from '@/shared/utils/firebase';

type EditPlanFormProps = {
  plan: PlanDocument;
  currentMember: PlanMemberDocument | null;
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

export function EditPlanForm({ plan, currentMember }: EditPlanFormProps) {
  const { updatePlan, isSubmitting } = useUpdatePlan();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const { register, handleSubmit } = useForm<UpdatePlanSchema>({
    defaultValues: {
      name: plan.name,
      description: plan.description || '',
      startDate: toDateInputValue(timestampToDate(plan.startDate)),
      endDate: toDateInputValue(timestampToDate(plan.endDate)),
    },
  });

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

      <div className="grid gap-4 sm:grid-cols-2">
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

      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-700" htmlFor="edit-plan-description">
          Mô tả
        </label>
        <Textarea id="edit-plan-description" placeholder="Mục tiêu hoặc ghi chú ngắn cho kế hoạch..." {...register('description')} />
      </div>

      {errorMessage ? <AuthFormMessage message={errorMessage} type="error" /> : null}
      {successMessage ? <AuthFormMessage message={successMessage} type="success" /> : null}

      <div className="flex justify-end">
        <Button disabled={isSubmitting} type="submit">
          {isSubmitting ? 'Đang lưu...' : 'Lưu thay đổi'}
        </Button>
      </div>
    </form>
  );
}
