'use client';

import { useState } from 'react';

import { Avatar } from '@/shared/components/ui/avatar';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { Card } from '@/shared/components/ui/card';
import type { PlanMemberDocument, PlanRole } from '@/modules/member/types/member';

type MemberListProps = {
  members: PlanMemberDocument[];
  canManageMembers?: boolean;
  isSaving?: boolean;
  onUpdateRole?: (member: PlanMemberDocument, role: Exclude<PlanRole, 'owner'>, canEditAllExpenses: boolean) => Promise<void>;
  onRemove?: (member: PlanMemberDocument) => Promise<void>;
};

function EditableMemberRow({
  member,
  canManageMembers = false,
  isSaving = false,
  onUpdateRole,
  onRemove,
}: {
  member: PlanMemberDocument;
  canManageMembers?: boolean;
  isSaving?: boolean;
  onUpdateRole?: MemberListProps['onUpdateRole'];
  onRemove?: MemberListProps['onRemove'];
}) {
  const [role, setRole] = useState<Exclude<PlanRole, 'owner'>>(
    member.role === 'owner' ? 'viewer' : member.role,
  );
  const [canEditAllExpenses, setCanEditAllExpenses] = useState(member.permissions.canEditAllExpenses);

  const roleChanged =
    member.role !== 'owner' &&
    (role !== member.role || canEditAllExpenses !== member.permissions.canEditAllExpenses);

  return (
    <Card className="gap-3">
      <div className="flex items-center gap-3">
        <Avatar initials={member.nickname.slice(0, 2).toUpperCase()} />
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold text-slate-950">{member.nickname}</p>
          <p className="text-sm text-slate-500">
            {member.memberType === 'guest' ? 'Guest member' : member.email || 'Registered member'}
          </p>
        </div>
        <div className="flex flex-wrap justify-end gap-2">
          <Badge variant="info">{member.role}</Badge>
          <Badge variant={member.status === 'active' ? 'success' : 'neutral'}>{member.status}</Badge>
          {member.permissions.canEditAllExpenses ? <Badge>edit all expenses</Badge> : null}
        </div>
      </div>

      {canManageMembers && member.role !== 'owner' ? (
        <div className="grid gap-3 rounded-[24px] bg-slate-50 p-4">
          <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-center">
            <select
              className="min-h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-950 outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
              onChange={(event) => setRole(event.target.value as Exclude<PlanRole, 'owner'>)}
              value={role}
            >
              <option value="editor">Editor</option>
              <option value="viewer">Viewer</option>
            </select>
            <label className="inline-flex min-h-11 items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-700">
              <input
                checked={canEditAllExpenses}
                onChange={(event) => setCanEditAllExpenses(event.target.checked)}
                type="checkbox"
              />
              Edit all expenses
            </label>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
            <Button
              disabled={isSaving || !roleChanged || !onUpdateRole}
              onClick={() => onUpdateRole?.(member, role, canEditAllExpenses)}
              variant="secondary"
            >
              Save role
            </Button>
            <Button
              disabled={isSaving || member.status === 'removed' || !onRemove}
              onClick={() => onRemove?.(member)}
              variant="ghost"
            >
              Remove member
            </Button>
          </div>
        </div>
      ) : null}
    </Card>
  );
}

export function MemberList({
  members,
  canManageMembers = false,
  isSaving = false,
  onUpdateRole,
  onRemove,
}: MemberListProps) {
  return (
    <div className="grid gap-3">
      {members.map((member) => (
        <EditableMemberRow
          key={member.id}
          canManageMembers={canManageMembers}
          isSaving={isSaving}
          member={member}
          onRemove={onRemove}
          onUpdateRole={onUpdateRole}
        />
      ))}
    </div>
  );
}
