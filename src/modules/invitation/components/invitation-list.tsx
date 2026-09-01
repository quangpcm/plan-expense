import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { Card } from '@/shared/components/ui/card';
import { DataRow } from '@/shared/components/ui/data-row';
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
        <p className="text-sm leading-6 text-[var(--color-text-secondary)]">Không có lời mời đang chờ.</p>
      </Card>
    );
  }

  return (
    <div className="grid gap-2">
      {invitations.map((invitation) => (
        <DataRow
          className="rounded-2xl border border-[var(--color-border-subtle)] px-4"
          key={invitation.id}
          main={
            <div className="min-w-0">
              {/* break-words, not truncate: a long invitation email must stay fully readable
                  (may wrap to 2 lines) rather than being clipped mid-address. */}
              <p className="font-semibold break-words text-[var(--color-text-primary)]">
                {invitation.email || 'Liên kết mời'}
              </p>
              <p className="text-sm text-[var(--color-text-muted)]">{PLAN_ROLE_LABEL[invitation.role]}</p>
            </div>
          }
          trailing={
            // Badge + action stacked in one column (rather than side-by-side) so `main` keeps
            // the most available width on narrow viewports, letting long emails wrap instead of
            // being squeezed down to only a few visible characters.
            <div className="flex flex-col items-end gap-1.5">
              <Badge variant={invitation.status === 'pending' ? 'info' : 'neutral'}>
                {invitationStatusLabel[invitation.status]}
              </Badge>
              {canRevoke && invitation.status === 'pending' ? (
                <Button disabled={isSubmitting} onClick={() => onRevoke(invitation)} variant="ghost">
                  Hủy lời mời
                </Button>
              ) : null}
            </div>
          }
        />
      ))}
    </div>
  );
}
