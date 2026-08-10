'use client';

import { useState } from 'react';
import { Trash2, Unlink } from 'lucide-react';

import { Avatar } from '@/shared/components/ui/avatar';
import { Badge } from '@/shared/components/ui/badge';
import { BottomSheet } from '@/shared/components/ui/bottom-sheet';
import { Button } from '@/shared/components/ui/button';
import { Card } from '@/shared/components/ui/card';
import { Collapsible } from '@/shared/components/ui/collapsible';
import { Input } from '@/shared/components/ui/input';
import type { PlanMemberDocument, PlanRole } from '@/modules/member/types/member';

type UpdateMemberValues = {
  nickname: string;
  role: Exclude<PlanRole, 'owner'>;
  canEditAllExpenses: boolean;
};

type MemberListProps = {
  members: PlanMemberDocument[];
  canManageMembers?: boolean;
  isSaving?: boolean;
  linkedMemberIds?: Set<string>;
  onUpdateMember?: (member: PlanMemberDocument, values: UpdateMemberValues) => Promise<void>;
  onRemove?: (member: PlanMemberDocument) => Promise<void>;
  onReactivate?: (member: PlanMemberDocument) => Promise<void>;
  onDelete?: (member: PlanMemberDocument) => Promise<void>;
  onUnlinkAccount?: (member: PlanMemberDocument) => Promise<void>;
};

function EditableMemberRow({
  member,
  canManageMembers = false,
  isSaving = false,
  isLinked = false,
  onUpdateMember,
  onRemove,
  onReactivate,
  onDelete,
  onUnlinkAccount,
}: {
  member: PlanMemberDocument;
  canManageMembers?: boolean;
  isSaving?: boolean;
  isLinked?: boolean;
  onUpdateMember?: MemberListProps['onUpdateMember'];
  onRemove?: MemberListProps['onRemove'];
  onReactivate?: MemberListProps['onReactivate'];
  onDelete?: MemberListProps['onDelete'];
  onUnlinkAccount?: MemberListProps['onUnlinkAccount'];
}) {
  const [nickname, setNickname] = useState(member.nickname);
  const [role, setRole] = useState<Exclude<PlanRole, 'owner'>>(
    member.role === 'owner' ? 'viewer' : member.role,
  );
  const [canEditAllExpenses, setCanEditAllExpenses] = useState(member.permissions.canEditAllExpenses);
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
  const [isConfirmUnlinkOpen, setIsConfirmUnlinkOpen] = useState(false);
  const canUnlink = member.memberType === 'registered' && Boolean(member.userId);

  const trimmedNickname = nickname.trim();
  const hasChanges =
    member.role !== 'owner' &&
    (trimmedNickname !== member.nickname ||
      role !== member.role ||
      canEditAllExpenses !== member.permissions.canEditAllExpenses);
  const isRemoved = member.status === 'removed';

  const summary = (
    <div className="flex items-center gap-3">
      <Avatar initials={member.nickname.slice(0, 2).toUpperCase()} />
      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold text-slate-950">{member.nickname}</p>
        {member.memberType === 'guest' ? null : (
          <p className="text-sm text-slate-500">{member.email || 'Thành viên đã đăng ký'}</p>
        )}
      </div>
      <div className="flex flex-wrap justify-end gap-2">
        <Badge variant="info">{member.role}</Badge>
        <Badge variant={member.status === 'active' ? 'success' : 'neutral'}>{member.status}</Badge>
        {member.permissions.canEditAllExpenses ? <Badge>được sửa mọi khoản chi</Badge> : null}
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
      <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-center">
        <select
          className="min-h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-950 outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
          onChange={(event) => setRole(event.target.value as Exclude<PlanRole, 'owner'>)}
          value={role}
        >
          <option value="editor">Biên tập</option>
          <option value="viewer">Chỉ xem</option>
        </select>
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
          {isRemoved ? 'Active' : 'Deactive'}
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
    </Card>
  );
}

export function MemberList({
  members,
  canManageMembers = false,
  isSaving = false,
  linkedMemberIds,
  onUpdateMember,
  onRemove,
  onReactivate,
  onDelete,
  onUnlinkAccount,
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
          onDelete={onDelete}
          onReactivate={onReactivate}
          onRemove={onRemove}
          onUnlinkAccount={onUnlinkAccount}
          onUpdateMember={onUpdateMember}
        />
      ))}
    </div>
  );
}
