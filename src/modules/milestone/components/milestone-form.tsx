'use client';

import { useState } from 'react';
import { ZodError } from 'zod';

import { createMilestoneSchema } from '@/modules/milestone/schemas/create-milestone.schema';
import { updateMilestoneSchema } from '@/modules/milestone/schemas/update-milestone.schema';
import { milestoneService } from '@/modules/milestone/services';
import type { MilestoneDocument } from '@/modules/milestone/types/milestone';
import type { PlanMemberDocument } from '@/modules/member/types/member';
import type { PlanDocument } from '@/modules/plan/types/plan';
import type { AuthUser } from '@/modules/auth/types/auth';
import { AuthFormMessage } from '@/modules/auth/components/auth-form-message';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Textarea } from '@/shared/components/ui/textarea';

type MilestoneFormProps = {
  plan: PlanDocument;
  currentMember: PlanMemberDocument | null;
  currentUser: AuthUser | null;
  milestone?: MilestoneDocument;
  onSuccess?: () => void;
};

export function MilestoneForm({ plan, currentMember, currentUser, milestone, onSuccess }: MilestoneFormProps) {
  const [title, setTitle] = useState(milestone?.title ?? '');
  const [description, setDescription] = useState(milestone?.description ?? '');
  const [startDate, setStartDate] = useState(
    milestone?.startDate ? new Date(milestone.startDate.toDate()).toISOString().slice(0, 10) : '',
  );
  const [endDate, setEndDate] = useState(
    milestone?.endDate ? new Date(milestone.endDate.toDate()).toISOString().slice(0, 10) : '',
  );
  const [budgetAmount, setBudgetAmount] = useState(milestone?.budgetAmount?.toString() ?? '');
  const [status, setStatus] = useState<MilestoneDocument['status']>(milestone?.status ?? 'upcoming');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!currentUser) {
      setErrorMessage('Bạn cần đăng nhập để thao tác với mốc kế hoạch.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      if (milestone) {
        const parsed = updateMilestoneSchema.parse({
          milestoneId: milestone.id,
          title,
          description,
          startDate,
          endDate,
          budgetAmount: budgetAmount ? Number(budgetAmount) : undefined,
          status,
          iconId: milestone.iconId ?? '',
        });

        await milestoneService.updateMilestone(plan, parsed, currentUser, currentMember);
        setSuccessMessage('Đã cập nhật mốc kế hoạch.');
      } else {
        const parsed = createMilestoneSchema.parse({
          title,
          description,
          startDate,
          endDate,
          budgetAmount: budgetAmount ? Number(budgetAmount) : undefined,
          iconId: '',
        });

        await milestoneService.createMilestone(plan, parsed, currentUser, currentMember);
        setSuccessMessage('Đã tạo mốc kế hoạch mới.');
        setTitle('');
        setDescription('');
        setStartDate('');
        setEndDate('');
        setBudgetAmount('');
      }

      onSuccess?.();
    } catch (error) {
      if (error instanceof ZodError) {
        setErrorMessage(error.issues.map((issue) => issue.message).join(' | '));
      } else if (error instanceof Error) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage('Hiện chưa thể lưu mốc kế hoạch này.');
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      {errorMessage ? <AuthFormMessage message={errorMessage} type="error" /> : null}
      {successMessage ? <AuthFormMessage message={successMessage} type="success" /> : null}
      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-700" htmlFor={`milestone-title-${milestone?.id ?? 'new'}`}>
          Tên mốc kế hoạch
        </label>
        <Input
          id={`milestone-title-${milestone?.id ?? 'new'}`}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Ví dụ: Chọn nhà hàng"
          value={title}
        />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-700" htmlFor={`milestone-description-${milestone?.id ?? 'new'}`}>
          Mô tả
        </label>
        <Textarea
          id={`milestone-description-${milestone?.id ?? 'new'}`}
          onChange={(event) => setDescription(event.target.value)}
          placeholder="Ghi chú ngắn cho mốc này"
          value={description}
        />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700" htmlFor={`milestone-start-${milestone?.id ?? 'new'}`}>
            Ngày bắt đầu
          </label>
          <Input
            id={`milestone-start-${milestone?.id ?? 'new'}`}
            onChange={(event) => setStartDate(event.target.value)}
            type="date"
            value={startDate}
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700" htmlFor={`milestone-end-${milestone?.id ?? 'new'}`}>
            Ngày kết thúc
          </label>
          <Input
            id={`milestone-end-${milestone?.id ?? 'new'}`}
            onChange={(event) => setEndDate(event.target.value)}
            type="date"
            value={endDate}
          />
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700" htmlFor={`milestone-budget-${milestone?.id ?? 'new'}`}>
            Ngân sách dự kiến
          </label>
          <Input
            id={`milestone-budget-${milestone?.id ?? 'new'}`}
            inputMode="numeric"
            onChange={(event) => setBudgetAmount(event.target.value)}
            placeholder="0"
            type="number"
            value={budgetAmount}
          />
        </div>
        {milestone ? (
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700" htmlFor={`milestone-status-${milestone.id}`}>
              Trạng thái
            </label>
            <select
              className="min-h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-950 outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
              id={`milestone-status-${milestone.id}`}
              onChange={(event) => setStatus(event.target.value as MilestoneDocument['status'])}
              value={status}
            >
              <option value="upcoming">Sắp tới</option>
              <option value="in_progress">Đang làm</option>
              <option value="completed">Hoàn thành</option>
              <option value="cancelled">Đã hủy</option>
            </select>
          </div>
        ) : null}
      </div>
      <div className="flex justify-end">
        <Button disabled={isSubmitting} type="submit">
          {isSubmitting ? 'Đang lưu...' : milestone ? 'Lưu thay đổi' : 'Tạo mốc kế hoạch'}
        </Button>
      </div>
    </form>
  );
}
