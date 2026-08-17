'use client';

import { useMemo, useState } from 'react';

import { AuthFormMessage } from '@/modules/auth/components/auth-form-message';
import { GuestDuplicateSuggestList } from '@/modules/wedding-guest/components/guest-duplicate-suggest-list';
import {
  WeddingGuestIdentityFields,
  type WeddingGuestIdentityValues,
} from '@/modules/wedding-guest/components/wedding-guest-identity-fields';
import type { WeddingGuestDocument } from '@/modules/wedding-guest/types/wedding-guest';
import { findDuplicateGuestMatches } from '@/modules/wedding-guest/utils/guest-duplicate';
import { Button } from '@/shared/components/ui/button';

type WeddingGuestEditFormProps = {
  guest: WeddingGuestDocument;
  existingGuests: WeddingGuestDocument[];
  isSubmitting: boolean;
  errorMessage: string | null;
  onSave: (identity: WeddingGuestIdentityValues) => Promise<void>;
  onCancel: () => void;
};

export function WeddingGuestEditForm({
  guest,
  existingGuests,
  isSubmitting,
  errorMessage,
  onSave,
  onCancel,
}: WeddingGuestEditFormProps) {
  const [identity, setIdentity] = useState<WeddingGuestIdentityValues>({
    name: guest.name,
    sideId: guest.sideId,
    relationshipId: guest.relationshipId,
    invitedById: guest.invitedById,
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

  async function handleSave() {
    if (
      !identity.name.trim() ||
      !identity.sideId ||
      !identity.relationshipId ||
      !identity.invitedById
    ) {
      return;
    }

    await onSave(identity);
  }

  return (
    <div className="space-y-5">
      {errorMessage ? (
        <AuthFormMessage message={errorMessage} type="error" />
      ) : null}
      <WeddingGuestIdentityFields onChange={setIdentity} values={identity} />

      {duplicateMatches.length > 0 ? (
        <GuestDuplicateSuggestList
          items={duplicateMatches}
          title="Thông tin này có thể trùng với một khách đã có"
        />
      ) : null}

      <div className="flex items-center justify-between gap-3 pt-2">
        <Button onClick={onCancel} variant="ghost">
          Hủy
        </Button>
        <Button
          disabled={
            isSubmitting ||
            !identity.name.trim() ||
            !identity.sideId ||
            !identity.relationshipId ||
            !identity.invitedById
          }
          onClick={handleSave}
          variant="primary"
        >
          Vẫn lưu
        </Button>
      </div>
    </div>
  );
}
