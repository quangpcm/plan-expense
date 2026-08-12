import { History, User, UserRoundPlus } from 'lucide-react';

import { Badge } from '@/shared/components/ui/badge';
import { Card } from '@/shared/components/ui/card';
import { formatCurrency } from '@/shared/utils/currency';
import { formatDateTime } from '@/shared/utils/date';
import { timestampToDate } from '@/shared/utils/firebase';
import type { Category } from '@/modules/category/types/category';
import type { PlanMemberDocument } from '@/modules/member/types/member';
import type { MilestoneDocument } from '@/modules/milestone/types/milestone';
import type { ExpenseDocument } from '@/modules/expense/types/expense';
import { AttachmentGallery } from '@/modules/storage';

type ExpenseDetailCardProps = {
  expense: ExpenseDocument;
  members: PlanMemberDocument[];
  categories: Category[];
  milestones: MilestoneDocument[];
};

export function ExpenseDetailCard({ expense, members, categories, milestones }: ExpenseDetailCardProps) {
  const category = categories.find((item) => item.id === expense.categoryId);
  const milestone = milestones.find((item) => item.id === expense.milestoneId);
  const paidBy = members.find((member) => member.id === expense.paidByMemberId);
  const createdBy = members.find((member) => member.id === expense.createdByMemberId);
  const spentAt = timestampToDate(expense.spentAt);
  const createdAt = timestampToDate(expense.createdAt);
  const updatedAt = timestampToDate(expense.updatedAt);
  const isEdited = Boolean(createdAt && updatedAt && updatedAt.getTime() !== createdAt.getTime());

  return (
    <Card className="gap-5">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold text-slate-950">{expense.title}</h1>
          <div className="flex flex-wrap gap-2">
            <Badge variant="neutral">{milestone?.title || 'Không rõ mốc'}</Badge>
            <Badge variant="info">{category?.name || 'Không có danh mục'}</Badge>
            <Badge>{expense.splitMethod}</Badge>
          </div>
        </div>
        <p className="text-2xl font-semibold text-slate-950">{formatCurrency(expense.amount)}</p>
      </div>
      <div className="space-y-2 rounded-[24px] bg-slate-50 p-4 text-sm">
        <div className="flex items-center gap-2 text-slate-800">
          <User className="size-4 shrink-0 text-slate-400" />
          <span>
            <span className="font-medium">{paidBy?.nickname || 'Không rõ'}</span> đã trả ·{' '}
            {spentAt ? formatDateTime(spentAt) : 'Không rõ'}
          </span>
        </div>
        <div className="flex items-center gap-2 text-slate-500">
          <UserRoundPlus className="size-4 shrink-0 text-slate-400" />
          <span>
            Tạo bởi {createdBy?.nickname || 'Không rõ'} ·{' '}
            {createdAt ? formatDateTime(createdAt) : 'Không rõ'}
          </span>
        </div>
        {isEdited && updatedAt ? (
          <div className="flex items-center gap-2 text-slate-500">
            <History className="size-4 shrink-0 text-slate-400" />
            <span>Cập nhật lần cuối · {formatDateTime(updatedAt)}</span>
          </div>
        ) : null}
      </div>
      <div className="space-y-3">
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">Người tham gia</p>
        <div className="grid gap-3">
          {expense.participants.map((participant) => {
            const member = members.find((item) => item.id === participant.memberId);

            return (
              <div
                key={participant.memberId}
                className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm"
              >
                <span className="font-medium text-slate-800">{member?.nickname || participant.memberId}</span>
                <span className="text-slate-600">
                  {formatCurrency(participant.amount)}
                  {participant.percentage != null ? ` · ${participant.percentage}%` : null}
                  {participant.shares != null && expense.splitMethod === 'shares'
                    ? ` · ${participant.shares} phần`
                    : null}
                </span>
              </div>
            );
          })}
        </div>
      </div>
      {expense.merchantName || expense.locationName || expense.note ? (
        <div className="space-y-2 rounded-[24px] bg-slate-50 p-4 text-sm leading-7 text-slate-700">
          {expense.merchantName ? <div>Cửa hàng / đơn vị: {expense.merchantName}</div> : null}
          {expense.locationName ? <div>Địa điểm: {expense.locationName}</div> : null}
          {expense.note ? <div>Ghi chú: {expense.note}</div> : null}
        </div>
      ) : null}
      <div className="space-y-2">
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">Ảnh đính kèm</p>
        <AttachmentGallery attachments={expense.attachments} emptyLabel="Chưa có ảnh đính kèm." />
      </div>
    </Card>
  );
}
