'use client';

import { useMemo, useState } from 'react';

import type { PlanMemberDocument } from '@/modules/member/types/member';
import { AuthFormMessage } from '@/modules/auth/components/auth-form-message';
import { Button } from '@/shared/components/ui/button';
import { DropdownSelect } from '@/shared/components/ui/dropdown-select';
import { Input } from '@/shared/components/ui/input';
import { ResponsiveModal } from '@/shared/components/ui/responsive-modal';

const ADD_NEW_VALUE = '__add_new_counterparty__';

type CounterpartyPickerProps = {
  members: PlanMemberDocument[];
  currentMemberId: string | null;
  value: string;
  onChange: (memberId: string) => void;
  onAddGuest: (nickname: string) => Promise<PlanMemberDocument>;
  disabled?: boolean;
};

export function CounterpartyPicker({
  members,
  currentMemberId,
  value,
  onChange,
  onAddGuest,
  disabled,
}: CounterpartyPickerProps) {
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [nickname, setNickname] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const counterpartyMembers = useMemo(
    () => members.filter((member) => member.status === 'active' && member.id !== currentMemberId),
    [members, currentMemberId],
  );

  const options = [
    ...counterpartyMembers.map((member) => ({ value: member.id, label: member.nickname })),
    { value: ADD_NEW_VALUE, label: '+ Thêm đối tượng mới' },
  ];

  async function handleAddGuest() {
    const trimmedNickname = nickname.trim();

    if (!trimmedNickname) {
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const created = await onAddGuest(trimmedNickname);
      onChange(created.id);
      setIsAddOpen(false);
      setNickname('');
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Không thể thêm đối tượng này.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-2">
      <DropdownSelect
        disabled={disabled ?? false}
        onValueChange={(next) => {
          if (next === ADD_NEW_VALUE) {
            setErrorMessage(null);
            setIsAddOpen(true);
            return;
          }

          onChange(next);
        }}
        options={options}
        placeholder="Chọn người"
        value={value}
      />

      <ResponsiveModal
        onOpenChange={setIsAddOpen}
        open={isAddOpen}
        title="Thêm đối tượng mới"
      >
        <div className="space-y-3">
          <Input
            autoFocus
            onChange={(event) => setNickname(event.target.value)}
            placeholder="Tên đối tượng, ví dụ: Anh A"
            value={nickname}
          />
          {errorMessage ? <AuthFormMessage message={errorMessage} type="error" /> : null}
          <Button disabled={isSubmitting || !nickname.trim()} onClick={handleAddGuest} type="button">
            {isSubmitting ? 'Đang thêm...' : 'Thêm đối tượng'}
          </Button>
        </div>
      </ResponsiveModal>
    </div>
  );
}
