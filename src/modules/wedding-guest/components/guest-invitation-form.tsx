'use client';

import { useMemo, useState } from 'react';

import { AuthFormMessage } from '@/modules/auth/components/auth-form-message';
import { GuestDuplicateSuggestList } from '@/modules/wedding-guest/components/guest-duplicate-suggest-list';
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
import { findDuplicateGuestMatches } from '@/modules/wedding-guest/utils/guest-duplicate';
import { Button } from '@/shared/components/ui/button';

type GuestInvitationFormProps = {
  guest: WeddingGuestDocument;
  invitation: GuestInvitationDocument;
  existingGuests: WeddingGuestDocument[];
  isSubmitting: boolean;
  errorMessage: string | null;
  onSave: (
    identity: WeddingGuestIdentityValues,
    invitationValues: GuestInvitationFieldValues,
  ) => Promise<void>;
  onRemoveFromGroup: () => Promise<void>;
  onCancel: () => void;
};

export function GuestInvitationForm({
  guest,
  invitation,
  existingGuests,
  isSubmitting,
  errorMessage,
  onSave,
  onRemoveFromGroup,
  onCancel,
}: GuestInvitationFormProps) {
  const [identity, setIdentity] = useState<WeddingGuestIdentityValues>({
    name: guest.name,
    sideId: guest.sideId,
    relationshipId: guest.relationshipId,
    invitedById: guest.invitedById,
  });
  const [invitationValues, setInvitationValues] =
    useState<GuestInvitationFieldValues>({
      rsvp: invitation.rsvp,
      attendeeCount: invitation.attendeeCount,
      moneyGiftAmount: invitation.moneyGiftAmount ?? 0,
      goldGiftAmount: invitation.goldGiftAmount ?? 0,
      goldGiftNote: invitation.goldGiftNote ?? '',
      note: invitation.note ?? '',
    });

  const duplicateMatches = useMemo(
    () =>
      identity.name.trim() &&
      identity.sideId &&
      identity.relationshipId &&
      identity.invitedById
        ? findDuplicateGuestMatches(
            {
              name: identity.name,
              sideId: identity.sideId,
              relationshipId: identity.relationshipId,
              invitedById: identity.invitedById,
            },
            existingGuests,
            guest.id,
          )
        : [],
    [identity, existingGuests, guest.id],
  );

  const isIdentityValid = Boolean(
    identity.name.trim() &&
    identity.sideId &&
    identity.relationshipId &&
    identity.invitedById,
  );

  async function handleSave() {
    if (!isIdentityValid) {
      return;
    }

    await onSave(identity, invitationValues);
  }

  return (
    <div className="space-y-6">
      {errorMessage ? (
        <AuthFormMessage message={errorMessage} type="error" />
      ) : null}

      <div className="space-y-4">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
          Thông tin cơ bản
        </p>
        <WeddingGuestIdentityFields onChange={setIdentity} values={identity} />
        <p className="text-xs text-slate-400">
          Áp dụng cho khách này trên toàn kế hoạch, không riêng nhóm này.
        </p>
        {duplicateMatches.length > 0 ? (
          <GuestDuplicateSuggestList
            items={duplicateMatches}
            title="Thông tin này có thể trùng với một khách đã có"
          />
        ) : null}
      </div>

      <div className="h-px bg-slate-200" />

      <div className="space-y-4">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
          Thông tin tham dự
        </p>
        <GuestInvitationFields
          onChange={setInvitationValues}
          values={invitationValues}
        />
      </div>

      <div className="flex items-center justify-between gap-3 pt-2">
        <button
          className="text-sm font-medium text-rose-600 hover:underline"
          disabled={isSubmitting}
          onClick={onRemoveFromGroup}
          type="button"
        >
          Xóa khỏi nhóm này
        </button>
        <div className="flex items-center gap-3">
          <Button onClick={onCancel} variant="ghost">
            Hủy
          </Button>
          <Button
            disabled={isSubmitting || !isIdentityValid}
            onClick={handleSave}
            variant="primary"
          >
            Lưu
          </Button>
        </div>
      </div>
    </div>
  );
}
