import { Badge } from '@/shared/components/ui/badge';
import { Card } from '@/shared/components/ui/card';
import type { InvitationDocument } from '@/modules/invitation/types/invitation';

type InvitationListProps = {
  invitations: InvitationDocument[];
};

export function InvitationList({ invitations }: InvitationListProps) {
  if (invitations.length === 0) {
    return (
      <Card>
        <p className="text-sm leading-6 text-slate-600">Chưa có lời mời nào.</p>
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
              <p className="text-sm text-slate-500">Vai trò: {invitation.role}</p>
            </div>
            <Badge variant={invitation.status === 'pending' ? 'info' : 'neutral'}>
              {invitation.status}
            </Badge>
          </div>
        </Card>
      ))}
    </div>
  );
}
