import { Button } from '@/shared/components/ui/button';
import { Card } from '@/shared/components/ui/card';
import { Badge } from '@/shared/components/ui/badge';
import { formatCurrency } from '@/shared/utils/currency';
import { formatDateTime } from '@/shared/utils/date';
import { timestampToDate } from '@/shared/utils/firebase';
import type { PlanMemberDocument } from '@/modules/member/types/member';
import type { SettlementDocument } from '@/modules/settlement/types/settlement';

type SettlementListProps = {
  canCancel: boolean;
  isSubmitting: boolean;
  members: PlanMemberDocument[];
  onCancel: (settlement: SettlementDocument) => void;
  settlements: SettlementDocument[];
};

export function SettlementList({
  canCancel,
  isSubmitting,
  members,
  onCancel,
  settlements,
}: SettlementListProps) {
  if (settlements.length === 0) {
    return (
      <Card>
        <p className="text-sm leading-6 text-slate-600">Chưa có bản ghi đối soát nào.</p>
      </Card>
    );
  }

  return (
    <div className="grid gap-3">
      {settlements.map((settlement) => {
        const fromMember = members.find((member) => member.id === settlement.fromMemberId);
        const toMember = members.find((member) => member.id === settlement.toMemberId);
        const settledAt = timestampToDate(settlement.settledAt);

        return (
          <Card key={settlement.id} className="gap-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="space-y-2">
                <div className="flex flex-wrap gap-2">
                  <Badge variant={settlement.status === 'completed' ? 'success' : 'danger'}>
                    {settlement.status}
                  </Badge>
                  <Badge>{formatCurrency(settlement.amount)}</Badge>
                </div>
                <p className="text-base font-semibold text-slate-950">
                  {fromMember?.nickname || settlement.fromMemberId} {'->'}{' '}
                  {toMember?.nickname || settlement.toMemberId}
                </p>
                <p className="text-sm text-slate-600">
                  Thời gian đối soát: {settledAt ? formatDateTime(settledAt) : 'Không rõ'}
                </p>
                {settlement.note ? <p className="text-sm text-slate-600">Ghi chú: {settlement.note}</p> : null}
              </div>
              {canCancel && settlement.status === 'completed' ? (
                <Button disabled={isSubmitting} onClick={() => onCancel(settlement)} variant="ghost">
                  {isSubmitting ? 'Đang cập nhật...' : 'Hủy đối soát'}
                </Button>
              ) : null}
            </div>
          </Card>
        );
      })}
    </div>
  );
}
