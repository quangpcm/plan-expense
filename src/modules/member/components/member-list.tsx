'use client';

import { useState } from 'react';
import { Check, Copy, Link2, Trash2, Unlink, UserCheck, UserX } from 'lucide-react';

import { Avatar } from '@/shared/components/ui/avatar';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { Card } from '@/shared/components/ui/card';
import { Collapsible } from '@/shared/components/ui/collapsible';
import { ConfirmDialog } from '@/shared/components/ui/confirm-dialog';
import { DropdownSelect } from '@/shared/components/ui/dropdown-select';
import { Input } from '@/shared/components/ui/input';
import { ResponsiveModal } from '@/shared/components/ui/responsive-modal';
import { MemberActionsMenu } from '@/modules/member/components/member-actions-menu';
import type { MemberActionMenuItem } from '@/modules/member/components/member-actions-menu';
import { MemberAvatarPicker } from '@/modules/member/components/member-avatar-picker';
import { ModuleAccessEditor } from '@/modules/member/components/module-access-editor';
import { PLAN_ROLE_LABEL } from '@/modules/member/constants/role-labels';
import type { PlanMemberDocument, PlanMemberStatus, PlanRole } from '@/modules/member/types/member';
import { summarizeMemberAccess } from '@/modules/member/utils/member-access-summary';
import type { ConfigurableModuleId, ModuleAccessLevel, PlanModuleId } from '@/modules/plan/types/plan-modular';

const memberStatusLabel: Record<PlanMemberStatus, string> = {
  invited: 'Đang chờ',
  active: 'Đang hoạt động',
  removed: 'Đã ngừng hoạt động',
};

type UpdateMemberValues = {
  nickname: string;
  role: Exclude<PlanRole, 'owner'>;
  moduleAccess: Partial<Record<ConfigurableModuleId, ModuleAccessLevel>>;
};

type MemberListProps = {
  planId: string;
  members: PlanMemberDocument[];
  enabledModuleIds?: PlanModuleId[];
  canManageMembers?: boolean;
  isSaving?: boolean;
  linkedMemberIds?: Set<string>;
  onUpdateMember?: (member: PlanMemberDocument, values: UpdateMemberValues) => Promise<void>;
  onRemove?: (member: PlanMemberDocument) => Promise<void>;
  onReactivate?: (member: PlanMemberDocument) => Promise<void>;
  onDelete?: (member: PlanMemberDocument) => Promise<void>;
  onUnlinkAccount?: (member: PlanMemberDocument) => Promise<void>;
  onUpdateAvatar?: (member: PlanMemberDocument, avatarUrl: string | null) => Promise<void>;
  onCreateClaimInvitation?: (
    member: PlanMemberDocument,
    email: string | null,
  ) => Promise<{ invitationId: string }>;
};

function EditableMemberRow({
  planId,
  member,
  enabledModuleIds = [],
  canManageMembers = false,
  isSaving = false,
  isLinked = false,
  onUpdateMember,
  onRemove,
  onReactivate,
  onDelete,
  onUnlinkAccount,
  onUpdateAvatar,
  onCreateClaimInvitation,
}: {
  planId: string;
  member: PlanMemberDocument;
  enabledModuleIds?: PlanModuleId[];
  canManageMembers?: boolean;
  isSaving?: boolean;
  isLinked?: boolean;
  onUpdateMember?: MemberListProps['onUpdateMember'];
  onRemove?: MemberListProps['onRemove'];
  onReactivate?: MemberListProps['onReactivate'];
  onDelete?: MemberListProps['onDelete'];
  onUnlinkAccount?: MemberListProps['onUnlinkAccount'];
  onUpdateAvatar?: MemberListProps['onUpdateAvatar'];
  onCreateClaimInvitation?: MemberListProps['onCreateClaimInvitation'];
}) {
  const [nickname, setNickname] = useState(member.nickname);
  const [role, setRole] = useState<Exclude<PlanRole, 'owner'>>(
    member.role === 'owner' ? 'viewer' : member.role,
  );
  const [moduleAccess, setModuleAccess] = useState<Partial<Record<ConfigurableModuleId, ModuleAccessLevel>>>(
    member.permissions.moduleAccess ?? {},
  );
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
  const [isConfirmUnlinkOpen, setIsConfirmUnlinkOpen] = useState(false);
  const [isConfirmDeactivateOpen, setIsConfirmDeactivateOpen] = useState(false);
  const [isClaimSheetOpen, setIsClaimSheetOpen] = useState(false);
  const [claimEmail, setClaimEmail] = useState('');
  const [claimLink, setClaimLink] = useState<string | null>(null);
  const [claimError, setClaimError] = useState<string | null>(null);
  const [isClaimSubmitting, setIsClaimSubmitting] = useState(false);
  const [isClaimLinkCopied, setIsClaimLinkCopied] = useState(false);
  const [isAvatarPickerOpen, setIsAvatarPickerOpen] = useState(false);
  const canUnlink = member.memberType === 'registered' && Boolean(member.userId);
  const isClaimable = member.memberType === 'guest' && member.status === 'active';

  async function handleCreateClaimLink() {
    if (!onCreateClaimInvitation) {
      return;
    }

    setIsClaimSubmitting(true);
    setClaimError(null);

    try {
      const result = await onCreateClaimInvitation(member, claimEmail.trim() || null);
      setClaimLink(`${window.location.origin}/invite/${planId}/${result.invitationId}`);
      setIsClaimLinkCopied(false);
    } catch (error) {
      setClaimError(error instanceof Error ? error.message : 'Hiện chưa thể tạo link liên kết.');
    } finally {
      setIsClaimSubmitting(false);
    }
  }

  async function handleCopyClaimLink() {
    if (!claimLink) {
      return;
    }

    await navigator.clipboard.writeText(claimLink);
    setIsClaimLinkCopied(true);
  }

  function closeClaimSheet() {
    setIsClaimSheetOpen(false);
    setClaimEmail('');
    setClaimLink(null);
    setClaimError(null);
    setIsClaimLinkCopied(false);
  }

  const trimmedNickname = nickname.trim();
  const hasChanges =
    member.role !== 'owner' &&
    (trimmedNickname !== member.nickname ||
      role !== member.role ||
      JSON.stringify(moduleAccess) !== JSON.stringify(member.permissions.moduleAccess ?? {}));
  const isRemoved = member.status === 'removed';

  const identityLabel = member.memberType === 'guest' ? 'Khách' : member.email || 'Đã đăng ký';
  const accessSummaryLabel =
    member.role === 'owner' ? null : summarizeMemberAccess(member, enabledModuleIds);
  const secondaryLine = [identityLabel, accessSummaryLabel].filter(Boolean).join(' · ');

  const avatarButton = (
    <button
      aria-label={`Đổi avatar của ${member.nickname}`}
      className="rounded-full transition hover:scale-[1.03] disabled:cursor-default disabled:hover:scale-100"
      disabled={!canManageMembers}
      onClick={() => setIsAvatarPickerOpen(true)}
      type="button"
    >
      <Avatar initials={member.nickname.slice(0, 2).toUpperCase()} src={member.avatarUrl} />
    </button>
  );

  const nameBlock = (
    <div className="min-w-0 flex-1 space-y-1">
      <div className="flex flex-wrap items-center gap-2">
        <p className="truncate font-semibold text-[var(--color-text-primary)]">{member.nickname}</p>
        <Badge variant="info">{PLAN_ROLE_LABEL[member.role]}</Badge>
        {member.status !== 'active' ? (
          <Badge variant={member.status === 'invited' ? 'info' : 'neutral'}>
            {memberStatusLabel[member.status]}
          </Badge>
        ) : null}
      </div>
      <p className="text-sm text-[var(--color-text-muted)]">{secondaryLine}</p>
    </div>
  );

  const summary = (
    <div className="flex items-center gap-3">
      {avatarButton}
      {nameBlock}
    </div>
  );

  const menuItems: MemberActionMenuItem[] = [
    ...(isClaimable && onCreateClaimInvitation
      ? [{ key: 'claim', label: 'Mời liên kết tài khoản', icon: Link2, onSelect: () => setIsClaimSheetOpen(true) }]
      : []),
    ...((isRemoved ? onReactivate : onRemove)
      ? [
          {
            key: 'toggle-status',
            label: isRemoved ? 'Kích hoạt lại' : 'Ngừng hoạt động',
            icon: isRemoved ? UserCheck : UserX,
            onSelect: () => setIsConfirmDeactivateOpen(true),
          },
        ]
      : []),
    ...(canUnlink && onUnlinkAccount
      ? [{ key: 'unlink', label: 'Gỡ liên kết tài khoản', icon: Unlink, onSelect: () => setIsConfirmUnlinkOpen(true) }]
      : []),
    ...(onDelete
      ? [{ key: 'delete', label: 'Xóa thành viên', icon: Trash2, destructive: true, onSelect: () => setIsConfirmDeleteOpen(true) }]
      : []),
  ];

  const editForm = (
    <div className="grid gap-3 rounded-[24px] bg-[var(--color-surface-subtle)] p-4">
      <Input
        onChange={(event) => setNickname(event.target.value)}
        placeholder="Tên hiển thị"
        value={nickname}
      />
      <DropdownSelect
        onValueChange={(value) => setRole(value as Exclude<PlanRole, 'owner'>)}
        options={[
          { value: 'editor', label: PLAN_ROLE_LABEL.editor },
          { value: 'viewer', label: PLAN_ROLE_LABEL.viewer },
        ]}
        value={role}
      />
      <ModuleAccessEditor
        enabledModuleIds={enabledModuleIds}
        onChange={(moduleId, level) =>
          setModuleAccess((current) => ({ ...current, [moduleId]: level }))
        }
        role={role}
        value={moduleAccess}
      />
      <div className="flex items-center gap-2">
        <Button
          className="flex-1"
          disabled={isSaving || !hasChanges || !trimmedNickname || !onUpdateMember}
          onClick={() =>
            onUpdateMember?.(member, { nickname: trimmedNickname, role, moduleAccess })
          }
        >
          Lưu thay đổi
        </Button>
        <MemberActionsMenu ariaLabel={`Thêm tùy chọn cho ${member.nickname}`} disabled={isSaving} items={menuItems} />
      </div>
    </div>
  );

  return (
    <Card className="gap-3">
      {!canManageMembers || member.role === 'owner' ? (
        summary
      ) : (
        <Collapsible header={nameBlock} leading={avatarButton}>
          {editForm}
        </Collapsible>
      )}
      <ConfirmDialog
        cancelLabel={isLinked ? 'Đóng' : 'Hủy'}
        {...(isLinked ? {} : { confirmLabel: 'Xóa' })}
        confirmVariant="destructive"
        description={
          isLinked
            ? `${member.nickname} đã có khoản chi, khoản thu hoặc đối soát liên quan nên không thể xóa hẳn. Hãy dùng "Ngừng hoạt động" để giữ nguyên lịch sử.`
            : `Xóa vĩnh viễn ${member.nickname} khỏi kế hoạch. Hành động này không thể hoàn tác.`
        }
        loading={isSaving}
        onConfirm={async () => {
          await onDelete?.(member);
          setIsConfirmDeleteOpen(false);
        }}
        onOpenChange={setIsConfirmDeleteOpen}
        open={isConfirmDeleteOpen}
        title={isLinked ? 'Không thể xóa thành viên' : 'Xóa thành viên?'}
      />
      <ConfirmDialog
        cancelLabel="Hủy"
        confirmLabel="Gỡ liên kết"
        confirmVariant="default"
        description={`Tài khoản hiện tại sẽ không còn xem được kế hoạch này nữa, nhưng ${member.nickname} vẫn giữ nguyên trong danh sách thành viên cùng lịch sử chi tiêu/thu cũ, giờ ở dạng khách.`}
        loading={isSaving}
        onConfirm={async () => {
          await onUnlinkAccount?.(member);
          setIsConfirmUnlinkOpen(false);
        }}
        onOpenChange={setIsConfirmUnlinkOpen}
        open={isConfirmUnlinkOpen}
        title="Gỡ liên kết tài khoản?"
      />
      <ConfirmDialog
        cancelLabel="Hủy"
        confirmLabel={isRemoved ? 'Kích hoạt lại' : 'Ngừng hoạt động'}
        confirmVariant="default"
        description={
          isRemoved
            ? `${member.nickname} sẽ có thể được chọn lại trong dữ liệu mới.`
            : 'Thành viên sẽ không thể được chọn trong dữ liệu mới, nhưng lịch sử cũ vẫn được giữ lại.'
        }
        loading={isSaving}
        onConfirm={async () => {
          await (isRemoved ? onReactivate?.(member) : onRemove?.(member));
          setIsConfirmDeactivateOpen(false);
        }}
        onOpenChange={setIsConfirmDeactivateOpen}
        open={isConfirmDeactivateOpen}
        title={isRemoved ? 'Kích hoạt lại thành viên?' : 'Ngừng hoạt động thành viên?'}
      />
      <ResponsiveModal
        description={`Người nhận link sẽ liên kết tài khoản của họ với ${member.nickname} — giữ nguyên lịch sử chi tiêu/thu đã có, không tạo thành viên mới.`}
        onOpenChange={(next) => {
          if (!next) {
            closeClaimSheet();
          }
        }}
        open={isClaimSheetOpen}
        title="Mời liên kết tài khoản"
      >
        <div className="space-y-3">
          <Input
            onChange={(event) => setClaimEmail(event.target.value)}
            placeholder="Email (tùy chọn, để giới hạn ai được nhận)"
            value={claimEmail}
          />
          {claimError ? <p className="text-sm text-red-600">{claimError}</p> : null}
          {claimLink ? (
            <div className="flex gap-2">
              <Input className="flex-1" readOnly value={claimLink} />
              <Button onClick={handleCopyClaimLink} type="button" variant="secondary">
                {isClaimLinkCopied ? <Check className="size-4" /> : <Copy className="size-4" />}
              </Button>
            </div>
          ) : (
            <Button
              className="w-full"
              disabled={isClaimSubmitting || !onCreateClaimInvitation}
              onClick={handleCreateClaimLink}
              type="button"
            >
              {isClaimSubmitting ? 'Đang tạo link...' : 'Tạo link'}
            </Button>
          )}
        </div>
      </ResponsiveModal>
      <MemberAvatarPicker
        isSaving={isSaving}
        memberName={member.nickname}
        onClose={() => setIsAvatarPickerOpen(false)}
        onSave={async (avatarUrl) => onUpdateAvatar?.(member, avatarUrl)}
        open={isAvatarPickerOpen}
        value={member.avatarUrl}
      />
    </Card>
  );
}

export function MemberList({
  planId,
  members,
  enabledModuleIds = [],
  canManageMembers = false,
  isSaving = false,
  linkedMemberIds,
  onUpdateMember,
  onRemove,
  onReactivate,
  onDelete,
  onUnlinkAccount,
  onUpdateAvatar,
  onCreateClaimInvitation,
}: MemberListProps) {
  return (
    <div className="grid gap-3">
      {members.map((member) => (
        <EditableMemberRow
          key={member.id}
          canManageMembers={canManageMembers}
          enabledModuleIds={enabledModuleIds}
          isLinked={linkedMemberIds?.has(member.id) ?? false}
          isSaving={isSaving}
          member={member}
          onCreateClaimInvitation={onCreateClaimInvitation}
          onDelete={onDelete}
          onReactivate={onReactivate}
          onRemove={onRemove}
          onUnlinkAccount={onUnlinkAccount}
          onUpdateAvatar={onUpdateAvatar}
          onUpdateMember={onUpdateMember}
          planId={planId}
        />
      ))}
    </div>
  );
}
