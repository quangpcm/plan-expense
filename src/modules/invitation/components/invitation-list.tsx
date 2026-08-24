import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { Card } from '@/shared/components/ui/card';
import type { InvitationDocument, InvitationStatus } from '@/modules/invitation/types/invitation';
import { PLAN_ROLE_LABEL } from '@/modules/member/constants/role-labels';

const invitationStatusLabel: Record<InvitationStatus, string> = {
  pending: 'Đang chờ',
  accepted: 'Đã chấp nhận',
  expired: 'Đã hết hạn',
  revoked: 'Đã hủy',
};

type InvitationListProps = {
  invitations: InvitationDocument[];
  canRevoke: boolean;
  isSubmitting: boolean;
  onRevoke: (invitation: InvitationDocument) => void;
};

export function InvitationList({ invitations, canRevoke, isSubmitting, onRevoke }: InvitationListProps) {
  if (invitations.length === 0) {
    return (
      <Card>
        <p className="text-sm leading-6 text-slate-600">Không có lời mời đang chờ.</p>
      </Card>
    );
  }

  return (
    <div className="grid gap-3">
      {invitations.map((invitation) => (
        <Card key={invitation.id} className="gap-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-semibold text-slate-950">{invitation.email || 'Liên kết mời'}</p>
              <p className="text-sm text-slate-500">Vai trò: {PLAN_ROLE_LABEL[invitation.role]}</p>
            </div>
            <Badge variant={invitation.status === 'pending' ? 'info' : 'neutral'}>
              {invitationStatusLabel[invitation.status]}
            </Badge>
          </div>
          {canRevoke && invitation.status === 'pending' ? (
            <div className="flex justify-end">
              <Button disabled={isSubmitting} onClick={() => onRevoke(invitation)} variant="ghost">
                Hủy lời mời
              </Button>
            </div>
          ) : null}
        </Card>
      ))}
    </div>
  );
}
