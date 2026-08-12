'use client';

import { useState } from 'react';
import { Check, Copy, Link2, Trash2, Unlink } from 'lucide-react';

import { Avatar } from '@/shared/components/ui/avatar';
import { Badge } from '@/shared/components/ui/badge';
import { BottomSheet } from '@/shared/components/ui/bottom-sheet';
import { Button } from '@/shared/components/ui/button';
import { Card } from '@/shared/components/ui/card';
import { Collapsible } from '@/shared/components/ui/collapsible';
import { DropdownSelect } from '@/shared/components/ui/dropdown-select';
import { Input } from '@/shared/components/ui/input';
import { MemberAvatarPicker } from '@/modules/member/components/member-avatar-picker';
import type { PlanMemberDocument, PlanMemberStatus, PlanRole } from '@/modules/member/types/member';

const roleLabel: Record<PlanRole, string> = {
  owner: 'Chủ kế hoạch',
  editor: 'Thành viên',
  viewer: 'Chỉ xem',
};

const memberStatusLabel: Record<PlanMemberStatus, string> = {
  invited: 'Đang chờ',
  active: 'Đang hoạt động',
  removed: 'Đã ngừng hoạt động',
};

type UpdateMemberValues = {
  nickname: string;
  role: Exclude<PlanRole, 'owner'>;
  canEditAllExpenses: boolean;
};

type MemberListProps = {
  planId: string;
  members: PlanMemberDocument[];
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
  const [canEditAllExpenses, setCanEditAllExpenses] = useState(member.permissions.canEditAllExpenses);
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
  const [isConfirmUnlinkOpen, setIsConfirmUnlinkOpen] = useState(false);
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
      canEditAllExpenses !== member.permissions.canEditAllExpenses);
  const isRemoved = member.status === 'removed';

  const summary = (
    <div className="flex items-center gap-3">
      <button
        aria-label={`Đổi avatar của ${member.nickname}`}
        className="rounded-full transition hover:scale-[1.03] disabled:cursor-default disabled:hover:scale-100"
        disabled={!canManageMembers}
        onClick={() => setIsAvatarPickerOpen(true)}
        type="button"
      >
        <Avatar initials={member.nickname.slice(0, 2).toUpperCase()} src={member.avatarUrl} />
      </button>
      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="truncate font-semibold text-slate-950">{member.nickname}</p>
          <Badge variant="info">{roleLabel[member.role]}</Badge>
          {member.status !== 'active' ? (
            <Badge variant={member.status === 'invited' ? 'info' : 'neutral'}>
              {memberStatusLabel[member.status]}
            </Badge>
          ) : null}
          {member.permissions.canEditAllExpenses ? <Badge>được sửa mọi khoản chi</Badge> : null}
        </div>
        {member.memberType === 'guest' ? null : (
          <p className="text-sm text-slate-500">{member.email || 'Thành viên đã đăng ký'}</p>
        )}
      </div>
    </div>
  );

  const editForm = (
    <div className="grid gap-3 rounded-[24px] bg-slate-50 p-4">
      <Input
        onChange={(event) => setNickname(event.target.value)}
        placeholder="Biệt danh"
        value={nickname}
      />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_auto] sm:items-center">
        <DropdownSelect
          onValueChange={(value) => setRole(value as Exclude<PlanRole, 'owner'>)}
          options={[
            { value: 'editor', label: 'Thành viên' },
            { value: 'viewer', label: 'Chỉ xem' },
          ]}
          value={role}
        />
        <label className="inline-flex min-h-11 items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-700">
          <input
            checked={canEditAllExpenses}
            onChange={(event) => setCanEditAllExpenses(event.target.checked)}
            type="checkbox"
          />
          Sửa mọi khoản chi
        </label>
      </div>
      <div className="flex items-center gap-2">
        <Button
          className="flex-1"
          disabled={isSaving || !hasChanges || !trimmedNickname || !onUpdateMember}
          onClick={() =>
            onUpdateMember?.(member, { nickname: trimmedNickname, role, canEditAllExpenses })
          }
        >
          Lưu
        </Button>
        <Button
          className="flex-1"
          disabled={isSaving || (isRemoved ? !onReactivate : !onRemove)}
          onClick={() => (isRemoved ? onReactivate?.(member) : onRemove?.(member))}
          variant="secondary"
        >
          {isRemoved ? 'Kích hoạt lại' : 'Ngừng hoạt động'}
        </Button>
        {canUnlink ? (
          <Button
            aria-label="Gỡ liên kết tài khoản"
            className="size-11 shrink-0 p-0"
            disabled={isSaving || !onUnlinkAccount}
            onClick={() => setIsConfirmUnlinkOpen(true)}
            variant="ghost"
          >
            <Unlink className="size-4" />
          </Button>
        ) : null}
        {isClaimable ? (
          <Button
            aria-label="Mời liên kết tài khoản"
            className="size-11 shrink-0 p-0"
            disabled={isSaving || !onCreateClaimInvitation}
            onClick={() => setIsClaimSheetOpen(true)}
            variant="ghost"
          >
            <Link2 className="size-4" />
          </Button>
        ) : null}
        <Button
          aria-label="Xóa thành viên"
          className="size-11 shrink-0 p-0 text-red-600 hover:bg-red-50"
          disabled={isSaving || !onDelete}
          onClick={() => setIsConfirmDeleteOpen(true)}
          variant="ghost"
        >
          <Trash2 className="size-4" />
        </Button>
      </div>
    </div>
  );

  return (
    <Card className="gap-3">
      {!canManageMembers || member.role === 'owner' ? (
        summary
      ) : (
        <Collapsible header={summary}>{editForm}</Collapsible>
      )}
      <BottomSheet
        description={
          isLinked
            ? `${member.nickname} đã có khoản chi, khoản thu hoặc đối soát liên quan nên không thể xóa hẳn. Hãy dùng "Ngừng hoạt động" để giữ nguyên lịch sử.`
            : `Xóa vĩnh viễn ${member.nickname} khỏi kế hoạch. Hành động này không thể hoàn tác.`
        }
        onClose={() => setIsConfirmDeleteOpen(false)}
        open={isConfirmDeleteOpen}
        title={isLinked ? 'Không thể xóa thành viên' : 'Xóa thành viên?'}
      >
        <div className="flex justify-end gap-2">
          <Button onClick={() => setIsConfirmDeleteOpen(false)} variant="secondary">
            {isLinked ? 'Đóng' : 'Hủy'}
          </Button>
          {isLinked ? null : (
            <Button
              className="bg-red-600 text-white hover:bg-red-700"
              disabled={isSaving || !onDelete}
              onClick={async () => {
                await onDelete?.(member);
                setIsConfirmDeleteOpen(false);
              }}
            >
              Xóa
            </Button>
          )}
        </div>
      </BottomSheet>
      <BottomSheet
        description={`Tài khoản hiện tại sẽ không còn xem được kế hoạch này nữa, nhưng ${member.nickname} vẫn giữ nguyên trong danh sách thành viên cùng lịch sử chi tiêu/thu cũ, giờ ở dạng khách.`}
        onClose={() => setIsConfirmUnlinkOpen(false)}
        open={isConfirmUnlinkOpen}
        title="Gỡ liên kết tài khoản?"
      >
        <div className="flex justify-end gap-2">
          <Button onClick={() => setIsConfirmUnlinkOpen(false)} variant="secondary">
            Hủy
          </Button>
          <Button
            disabled={isSaving || !onUnlinkAccount}
            onClick={async () => {
              await onUnlinkAccount?.(member);
              setIsConfirmUnlinkOpen(false);
            }}
          >
            Gỡ liên kết
          </Button>
        </div>
      </BottomSheet>
      <BottomSheet
        description={`Người nhận link sẽ liên kết tài khoản của họ với ${member.nickname} — giữ nguyên lịch sử chi tiêu/thu đã có, không tạo thành viên mới.`}
        onClose={closeClaimSheet}
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
      </BottomSheet>
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
