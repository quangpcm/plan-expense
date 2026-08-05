import { Badge } from '@/shared/components/ui/badge';
import { Card } from '@/shared/components/ui/card';
import { formatCurrency } from '@/shared/utils/currency';
import { formatDateTime } from '@/shared/utils/date';
import { timestampToDate } from '@/shared/utils/firebase';
import type { CategoryDocument } from '@/modules/category/types/category';
import type { PlanMemberDocument } from '@/modules/member/types/member';
import type { ExpenseDocument } from '@/modules/expense/types/expense';

type ExpenseDetailCardProps = {
  expense: ExpenseDocument;
  members: PlanMemberDocument[];
  categories: CategoryDocument[];
};

export function ExpenseDetailCard({ expense, members, categories }: ExpenseDetailCardProps) {
  const category = categories.find((item) => item.id === expense.categoryId);
  const paidBy = members.find((member) => member.id === expense.paidByMemberId);
  const createdBy = members.find((member) => member.id === expense.createdByMemberId);
  const spentAt = timestampToDate(expense.spentAt);
  const createdAt = timestampToDate(expense.createdAt);
  const updatedAt = timestampToDate(expense.updatedAt);

  return (
    <Card className="gap-5">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold text-slate-950">{expense.title}</h1>
          <div className="flex flex-wrap gap-2">
            <Badge variant="info">{category?.name || 'No category'}</Badge>
            <Badge>{expense.splitMethod}</Badge>
          </div>
        </div>
        <p className="text-2xl font-semibold text-slate-950">{formatCurrency(expense.amount)}</p>
      </div>
      <div className="grid gap-4 rounded-[24px] bg-slate-50 p-4 sm:grid-cols-2">
        <div>
          <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Paid by</p>
          <p className="mt-1 font-medium text-slate-900">{paidBy?.nickname || 'Unknown'}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Spent at</p>
          <p className="mt-1 font-medium text-slate-900">{spentAt ? formatDateTime(spentAt) : 'Unknown'}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Created by</p>
          <p className="mt-1 font-medium text-slate-900">{createdBy?.nickname || 'Unknown'}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Updated</p>
          <p className="mt-1 font-medium text-slate-900">{updatedAt ? formatDateTime(updatedAt) : 'Unknown'}</p>
        </div>
      </div>
      <div className="space-y-3">
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">Participants</p>
        <div className="grid gap-3">
          {expense.participants.map((participant) => {
            const member = members.find((item) => item.id === participant.memberId);

            return (
              <div
                key={participant.memberId}
                className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm"
              >
                <span className="font-medium text-slate-800">{member?.nickname || participant.memberId}</span>
                <span className="text-slate-600">{formatCurrency(participant.amount)}</span>
              </div>
            );
          })}
        </div>
      </div>
      {expense.merchantName || expense.locationName || expense.note ? (
        <div className="space-y-2 rounded-[24px] bg-slate-50 p-4 text-sm leading-7 text-slate-700">
          {expense.merchantName ? <div>Merchant: {expense.merchantName}</div> : null}
          {expense.locationName ? <div>Location: {expense.locationName}</div> : null}
          {expense.note ? <div>Note: {expense.note}</div> : null}
        </div>
      ) : null}
      <div className="space-y-2">
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">Attachments</p>
        {expense.attachments.length > 0 ? (
          <div className="grid gap-3">
            {expense.attachments.map((attachment) => (
              <div
                key={attachment.id}
                className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700"
              >
                {attachment.fileName}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-600">No attachments.</p>
        )}
      </div>
      <div className="text-xs text-slate-400">
        Created: {createdAt ? formatDateTime(createdAt) : 'Unknown'}
      </div>
    </Card>
  );
}

