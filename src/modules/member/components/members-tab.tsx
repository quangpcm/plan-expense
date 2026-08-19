'use client';

import { AuthFormMessage } from '@/modules/auth/components/auth-form-message';
import { InvitationList } from '@/modules/invitation/components/invitation-list';
import type { InvitationDocument } from '@/modules/invitation/types/invitation';
import { MemberList } from '@/modules/member/components/member-list';
import { MemberManagementPanel } from '@/modules/member/components/member-management-panel';
import type { PlanMemberDocument, PlanRole } from '@/modules/member/types/member';
import type { PlanDocument } from '@/modules/plan/types/plan';
import { Card } from '@/shared/components/ui/card';
import { SectionHeading } from '@/shared/components/ui/section-heading';

type MembersTabProps = {
  activeMemberCount: number;
  canManageMembers: boolean;
  currentMember: PlanMemberDocument | null;
  invitations: InvitationDocument[];
  isSubmitting: boolean;
  linkedMemberIds: Set<string>;
  memberActionError: string | null;
  memberActionMessage: string | null;
  members: PlanMemberDocument[];
  onCreateClaimInvitation: (member: PlanMemberDocument) => void;
  onDeleteMember: (member: PlanMemberDocument) => void;
  onReactivateMember: (member: PlanMemberDocument) => void;
  onRemoveMember: (member: PlanMemberDocument) => void;
  onRevokeInvitation: (invitation: InvitationDocument) => void;
  onUnlinkAccount: (member: PlanMemberDocument) => void;
  onUpdateAvatar: (member: PlanMemberDocument, avatarUrl: string | null) => void;
  onUpdateMember: (
    member: PlanMemberDocument,
    values: {
      nickname: string;
      role: Exclude<PlanRole, 'owner'>;
      canEditAllExpenses: boolean;
    },
  ) => void;
  plan: PlanDocument;
  planId: string;
};

export function MembersTab({
  activeMemberCount,
  canManageMembers,
  currentMember,
  invitations,
  isSubmitting,
  linkedMemberIds,
  memberActionError,
  memberActionMessage,
  members,
  onCreateClaimInvitation,
  onDeleteMember,
  onReactivateMember,
  onRemoveMember,
  onRevokeInvitation,
  onUnlinkAccount,
  onUpdateAvatar,
  onUpdateMember,
  plan,
  planId,
}: MembersTabProps) {
  return (
    <div className="space-y-5">
      <SectionHeading
        eyebrow="Thành viên"
        title="Thành viên kế hoạch"
        description="Thêm và quản lý những người tham gia kế hoạch."
      />
      {canManageMembers ? (
        <MemberManagementPanel currentMember={currentMember} plan={plan} />
      ) : (
        <Card>
          <p className="text-sm leading-6 text-slate-600">
            Bạn có thể xem danh sách thành viên, nhưng chỉ chủ kế hoạch
            mới được quản lý khách và lời mời.
          </p>
        </Card>
      )}
      <SectionHeading eyebrow="Danh sách" title={`Thành viên (${activeMemberCount})`} />
      {memberActionError ? (
        <AuthFormMessage message={memberActionError} type="error" />
      ) : null}
      {memberActionMessage ? (
        <AuthFormMessage message={memberActionMessage} type="success" />
      ) : null}
      <MemberList
        canManageMembers={canManageMembers}
        isSaving={isSubmitting}
        linkedMemberIds={linkedMemberIds}
        members={members}
        onCreateClaimInvitation={onCreateClaimInvitation}
        onDelete={onDeleteMember}
        onReactivate={onReactivateMember}
        onRemove={onRemoveMember}
        onUnlinkAccount={onUnlinkAccount}
        onUpdateAvatar={onUpdateAvatar}
        onUpdateMember={onUpdateMember}
        planId={planId}
      />
      <SectionHeading eyebrow="Lời mời" title="Đang chờ tham gia" />
      <InvitationList
        canRevoke={canManageMembers}
        invitations={invitations}
        isSubmitting={isSubmitting}
        onRevoke={onRevokeInvitation}
      />
    </div>
  );
}
