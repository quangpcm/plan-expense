'use client';

import { useMemo, useState } from 'react';
import { Lightbulb, Plus, UsersRound } from 'lucide-react';

import { AuthFormMessage } from '@/modules/auth/components/auth-form-message';
import {
  getWeddingGuestInvitedByLabel,
  getWeddingGuestRelationshipLabel,
  getWeddingGuestSideLabel,
} from '@/modules/wedding-guest/constants/wedding-guest-presets';
import {
  GuestInvitationFields,
  type GuestInvitationFieldValues,
} from '@/modules/wedding-guest/components/guest-invitation-fields';
import {
  WeddingGuestIdentityFields,
  type WeddingGuestIdentityValues,
} from '@/modules/wedding-guest/components/wedding-guest-identity-fields';
import type { GuestInvitationDocument } from '@/modules/wedding-guest/types/guest-invitation';
import type { WeddingGuestDocument } from '@/modules/wedding-guest/types/wedding-guest';
import type { WeddingGuestGroupDocument } from '@/modules/wedding-guest/types/wedding-guest-group';
import { findGuestsBySimilarName } from '@/modules/wedding-guest/utils/guest-duplicate';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';

const EMPTY_IDENTITY: WeddingGuestIdentityValues = {
  name: '',
  sideId: '',
  relationshipId: '',
  invitedById: '',
};
const DEFAULT_INVITATION_FIELDS: GuestInvitationFieldValues = {
  rsvp: 'pending',
  attendeeCount: 1,
  moneyGiftAmount: 0,
  goldGiftAmount: 0,
  goldGiftNote: '',
  note: '',
};

type WeddingGuestCreateFormProps = {
  groupId: string;
  groupName: string;
  existingGuests: WeddingGuestDocument[];
  invitations: GuestInvitationDocument[];
  groups: WeddingGuestGroupDocument[];
  isSubmitting: boolean;
  errorMessage: string | null;
  onCreateNewGuest: (
    identity: WeddingGuestIdentityValues,
    invitationDetails: GuestInvitationFieldValues,
  ) => Promise<void>;
  onAddExistingGuestToGroup: (guestId: string) => Promise<void>;
  onCancel: () => void;
};

export function WeddingGuestCreateForm({
  groupName,
  existingGuests,
  invitations,
  groups,
  isSubmitting,
  errorMessage,
  onCreateNewGuest,
  onAddExistingGuestToGroup,
  onCancel,
}: WeddingGuestCreateFormProps) {
  const [mode, setMode] = useState<'search' | 'create-new'>('search');
  const [searchQuery, setSearchQuery] = useState('');
  const [identity, setIdentity] =
    useState<WeddingGuestIdentityValues>(EMPTY_IDENTITY);
  const [invitationFields, setInvitationFields] =
    useState<GuestInvitationFieldValues>(DEFAULT_INVITATION_FIELDS);

  const suggestions = useMemo(
    () =>
      searchQuery.trim()
        ? findGuestsBySimilarName(searchQuery, existingGuests)
        : [],
    [searchQuery, existingGuests],
  );

  function getGuestGroupNames(guestId: string) {
    const guestGroupIds = new Set(
      invitations
        .filter((invitation) => invitation.guestId === guestId)
        .map((invitation) => invitation.groupId),
    );
    return groups
      .filter((group) => guestGroupIds.has(group.id))
      .map((group) => group.name);
  }

  function startCreateNew() {
    setIdentity({ ...EMPTY_IDENTITY, name: searchQuery });
    setMode('create-new');
  }

  async function handleSubmitNewGuest() {
    if (
      !identity.name.trim() ||
      !identity.sideId ||
      !identity.relationshipId ||
      !identity.invitedById
    ) {
      return;
    }

    await onCreateNewGuest(identity, invitationFields);
  }

  if (mode === 'search') {
    return (
      <div className="space-y-4">
        {errorMessage ? (
          <AuthFormMessage message={errorMessage} type="error" />
        ) : null}
        <div className="space-y-1.5">
          <label
            className="text-sm font-medium text-slate-700"
            htmlFor="wedding-guest-search"
          >
            Tên khách
          </label>
          <Input
            autoFocus
            id="wedding-guest-search"
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Nhập tên khách..."
            value={searchQuery}
          />
        </div>

        {suggestions.length > 0 ? (
          <div className="space-y-3">
            <p className="flex items-center gap-2 text-sm font-semibold text-slate-900">
              <Lightbulb className="size-4 text-orange-500" />
              Gợi ý khách trùng tên
            </p>
            <ul className="space-y-3">
              {suggestions.map((guest) => {
                const groupNames = getGuestGroupNames(guest.id);

                return (
                  <li
                    className="space-y-3 rounded-2xl border border-[#efd9c4] bg-[#f8ece0] p-4"
                    key={guest.id}
                  >
                    <div className="min-w-0">
                      <p className="truncate text-base font-semibold text-slate-950">
                        {guest.name}
                      </p>
                      <p className="mt-0.5 flex items-center gap-1.5 truncate text-sm text-slate-600">
                        <UsersRound className="size-3.5 shrink-0 text-slate-500" />
                        {getWeddingGuestSideLabel(guest.sideId)} ·{' '}
                        {getWeddingGuestRelationshipLabel(guest.relationshipId)}{' '}
                        · {getWeddingGuestInvitedByLabel(guest.invitedById)}
                      </p>
                    </div>
                    {groupNames.length > 0 ? (
                      <div className="space-y-1 rounded-xl bg-[#fdf5ee] p-3">
                        <p className="flex items-center gap-1.5 text-xs text-slate-600">
                          <UsersRound className="size-3.5 shrink-0 text-slate-500" />
                          Đã có trong {groupNames.length} nhóm:
                        </p>
                        <p className="text-sm font-semibold text-slate-900">
                          {groupNames.join(', ')}
                        </p>
                      </div>
                    ) : null}
                    <Button
                      className="w-full justify-center gap-2 bg-white text-[var(--color-primary)] hover:bg-white/90"
                      disabled={isSubmitting}
                      onClick={() => onAddExistingGuestToGroup(guest.id)}
                      variant="secondary"
                    >
                      <Plus className="size-4" />
                      Thêm vào {groupName}
                    </Button>
                  </li>
                );
              })}
            </ul>
          </div>
        ) : null}

        <div className="flex items-center justify-between gap-3 pt-2">
          <Button onClick={onCancel} variant="ghost">
            Hủy
          </Button>
          <Button
            disabled={!searchQuery.trim()}
            onClick={startCreateNew}
            variant="primary"
          >
            Vẫn tạo khách mới
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {errorMessage ? (
        <AuthFormMessage message={errorMessage} type="error" />
      ) : null}
      <WeddingGuestIdentityFields
        nameAutoFocus
        onChange={setIdentity}
        values={identity}
      />
      <div className="h-px bg-slate-100" />
      <GuestInvitationFields
        onChange={setInvitationFields}
        values={invitationFields}
      />
      <div className="flex items-center justify-between gap-3 pt-2">
        <Button onClick={() => setMode('search')} variant="ghost">
          Quay lại
        </Button>
        <Button
          disabled={
            isSubmitting ||
            !identity.name.trim() ||
            !identity.sideId ||
            !identity.relationshipId ||
            !identity.invitedById
          }
          onClick={handleSubmitNewGuest}
          variant="primary"
        >
          Thêm khách vào {groupName}
        </Button>
      </div>
    </div>
  );
}
