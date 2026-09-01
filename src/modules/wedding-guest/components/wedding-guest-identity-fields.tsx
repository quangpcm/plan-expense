'use client';

import {
  WEDDING_GUEST_INVITED_BY,
  WEDDING_GUEST_RELATIONSHIPS,
  WEDDING_GUEST_SIDES,
} from '@/modules/wedding-guest/constants/wedding-guest-presets';
import type {
  WeddingGuestInvitedById,
  WeddingGuestRelationshipId,
  WeddingGuestSideId,
} from '@/modules/wedding-guest/types/wedding-guest';
import { DropdownSelect } from '@/shared/components/ui/dropdown-select';
import { Input } from '@/shared/components/ui/input';

const SIDE_OPTIONS = WEDDING_GUEST_SIDES.map((side) => ({
  value: side.id,
  label: side.label,
}));
const RELATIONSHIP_OPTIONS = WEDDING_GUEST_RELATIONSHIPS.map(
  (relationship) => ({
    value: relationship.id,
    label: relationship.label,
  }),
);
const INVITED_BY_OPTIONS = WEDDING_GUEST_INVITED_BY.map((invitedBy) => ({
  value: invitedBy.id,
  label: invitedBy.label,
}));

export type WeddingGuestIdentityValues = {
  name: string;
  sideId: WeddingGuestSideId | '';
  relationshipId: WeddingGuestRelationshipId | '';
  invitedById: WeddingGuestInvitedById | '';
};

type WeddingGuestIdentityFieldsProps = {
  values: WeddingGuestIdentityValues;
  onChange: (values: WeddingGuestIdentityValues) => void;
  nameAutoFocus?: boolean;
};

export function WeddingGuestIdentityFields({
  values,
  onChange,
  nameAutoFocus,
}: WeddingGuestIdentityFieldsProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <label
          className="text-sm font-medium text-[var(--color-text-secondary)]"
          htmlFor="wedding-guest-name"
        >
          Tên khách
        </label>
        <Input
          autoFocus={nameAutoFocus}
          id="wedding-guest-name"
          onChange={(event) =>
            onChange({ ...values, name: event.target.value })
          }
          placeholder="Ví dụ: Nguyễn Văn Minh"
          value={values.name}
        />
      </div>

      <div className="space-y-1.5">
        <p className="text-sm font-medium text-[var(--color-text-secondary)]">Phía</p>
        <DropdownSelect
          onValueChange={(value) =>
            onChange({ ...values, sideId: value as WeddingGuestSideId })
          }
          options={SIDE_OPTIONS}
          placeholder="Chọn phía"
          value={values.sideId}
        />
      </div>

      <div className="space-y-1.5">
        <p className="text-sm font-medium text-[var(--color-text-secondary)]">Quan hệ</p>
        <DropdownSelect
          onValueChange={(value) =>
            onChange({
              ...values,
              relationshipId: value as WeddingGuestRelationshipId,
            })
          }
          options={RELATIONSHIP_OPTIONS}
          placeholder="Chọn quan hệ"
          value={values.relationshipId}
        />
      </div>

      <div className="space-y-1.5">
        <p className="text-sm font-medium text-[var(--color-text-secondary)]">Khách của</p>
        <DropdownSelect
          onValueChange={(value) =>
            onChange({
              ...values,
              invitedById: value as WeddingGuestInvitedById,
            })
          }
          options={INVITED_BY_OPTIONS}
          placeholder="Chọn khách của ai"
          value={values.invitedById}
        />
      </div>
    </div>
  );
}
