'use client';

import { useState } from 'react';
import { Pencil, Plus, Trash2, X } from 'lucide-react';

import type { WeddingGuestGroupDocument } from '@/modules/wedding-guest/types/wedding-guest-group';
import { AuthFormMessage } from '@/modules/auth/components/auth-form-message';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';

type WeddingGuestGroupListProps = {
  groups: WeddingGuestGroupDocument[];
  canManage: boolean;
  isSubmitting: boolean;
  errorMessage: string | null;
  onCreateGroup: (name: string) => Promise<void>;
  onUpdateGroup: (
    group: WeddingGuestGroupDocument,
    name: string,
  ) => Promise<void>;
  onDeleteGroup: (group: WeddingGuestGroupDocument) => Promise<void>;
};

export function WeddingGuestGroupList({
  groups,
  canManage,
  isSubmitting,
  errorMessage,
  onCreateGroup,
  onUpdateGroup,
  onDeleteGroup,
}: WeddingGuestGroupListProps) {
  const [newGroupName, setNewGroupName] = useState('');
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');

  async function handleCreate() {
    if (!newGroupName.trim()) {
      return;
    }

    await onCreateGroup(newGroupName);
    setNewGroupName('');
  }

  function startEditing(group: WeddingGuestGroupDocument) {
    setEditingGroupId(group.id);
    setEditingName(group.name);
  }

  async function handleSaveEdit(group: WeddingGuestGroupDocument) {
    if (!editingName.trim()) {
      return;
    }

    await onUpdateGroup(group, editingName);
    setEditingGroupId(null);
  }

  return (
    <div className="space-y-3">
      {errorMessage ? (
        <AuthFormMessage message={errorMessage} type="error" />
      ) : null}

      {groups.length === 0 ? (
        <p className="text-sm text-slate-500">
          Chưa có nhóm/tiệc nào. Tạo nhóm đầu tiên để bắt đầu thêm khách.
        </p>
      ) : null}

      <ul className="space-y-2">
        {groups.map((group) => (
          <li
            className="flex items-center gap-2 rounded-2xl bg-slate-50 px-3 py-2"
            key={group.id}
          >
            {editingGroupId === group.id ? (
              <>
                <Input
                  className="flex-1"
                  onChange={(event) => setEditingName(event.target.value)}
                  value={editingName}
                />
                <Button
                  className="px-3"
                  disabled={isSubmitting}
                  onClick={() => handleSaveEdit(group)}
                  variant="secondary"
                >
                  Lưu
                </Button>
                <button
                  aria-label="Hủy"
                  className="flex size-9 shrink-0 items-center justify-center rounded-full text-slate-400 hover:bg-slate-200"
                  onClick={() => setEditingGroupId(null)}
                  type="button"
                >
                  <X className="size-4" />
                </button>
              </>
            ) : (
              <>
                <span className="flex-1 text-sm font-medium text-slate-950">
                  {group.name}
                </span>
                {canManage ? (
                  <>
                    <button
                      aria-label={`Sửa nhóm ${group.name}`}
                      className="flex size-9 shrink-0 items-center justify-center rounded-full text-slate-500 hover:bg-slate-200"
                      onClick={() => startEditing(group)}
                      type="button"
                    >
                      <Pencil className="size-4" />
                    </button>
                    <button
                      aria-label={`Xóa nhóm ${group.name}`}
                      className="flex size-9 shrink-0 items-center justify-center rounded-full text-rose-600 hover:bg-rose-50"
                      onClick={() => onDeleteGroup(group)}
                      type="button"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </>
                ) : null}
              </>
            )}
          </li>
        ))}
      </ul>

      {canManage ? (
        <div className="flex items-center gap-2">
          <Input
            className="flex-1"
            onChange={(event) => setNewGroupName(event.target.value)}
            placeholder="Tên nhóm/tiệc mới, ví dụ: Tiệc nhà gái"
            value={newGroupName}
          />
          <Button
            className="px-4"
            disabled={isSubmitting || !newGroupName.trim()}
            onClick={handleCreate}
            variant="primary"
          >
            <Plus className="size-4" />
            Thêm
          </Button>
        </div>
      ) : null}
    </div>
  );
}
