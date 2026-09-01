'use client';

import { Coins, Wallet } from 'lucide-react';

import { GUEST_RSVP_OPTIONS } from '@/modules/wedding-guest/constants/wedding-guest-presets';
import type { GuestRsvpStatus } from '@/modules/wedding-guest/types/guest-invitation';
import { CurrencyField } from '@/shared/components/ui/currency-field';
import { DropdownSelect } from '@/shared/components/ui/dropdown-select';
import { Input } from '@/shared/components/ui/input';
import { Textarea } from '@/shared/components/ui/textarea';

const RSVP_OPTIONS = GUEST_RSVP_OPTIONS.map((option) => ({
  value: option.id,
  label: option.label,
}));

export type GuestInvitationFieldValues = {
  rsvp: GuestRsvpStatus;
  attendeeCount: number;
  moneyGiftAmount: number;
  goldGiftAmount: number;
  goldGiftNote: string;
  note: string;
};

type GuestInvitationFieldsProps = {
  values: GuestInvitationFieldValues;
  onChange: (values: GuestInvitationFieldValues) => void;
};

export function GuestInvitationFields({
  values,
  onChange,
}: GuestInvitationFieldsProps) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <p className="text-sm font-medium text-[var(--color-text-secondary)]">Xác nhận</p>
          <DropdownSelect
            onValueChange={(value) =>
              onChange({ ...values, rsvp: value as GuestRsvpStatus })
            }
            options={RSVP_OPTIONS}
            value={values.rsvp}
          />
        </div>

        <div className="space-y-1.5">
          <label
            className="text-sm font-medium text-[var(--color-text-secondary)]"
            htmlFor="guest-invitation-attendee-count"
          >
            Số người tham dự
          </label>
          <Input
            id="guest-invitation-attendee-count"
            inputMode="numeric"
            min={0}
            onChange={(event) =>
              onChange({
                ...values,
                attendeeCount: Number(event.target.value) || 0,
              })
            }
            type="number"
            value={values.attendeeCount}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <label
            className="text-sm font-medium text-[var(--color-text-secondary)]"
            htmlFor="guest-invitation-money-gift"
          >
            Tiền mừng (VNĐ)
          </label>
          <div className="relative">
            <span className="absolute left-2 top-1/2 flex size-6 -translate-y-1/2 items-center justify-center rounded-full bg-[var(--color-surface-subtle)] text-[var(--color-text-muted)]">
              <Wallet className="size-3.5" />
            </span>
            <CurrencyField
              className="pl-10"
              id="guest-invitation-money-gift"
              onChange={(value) =>
                onChange({ ...values, moneyGiftAmount: value })
              }
              value={values.moneyGiftAmount}
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label
            className="text-sm font-medium text-[var(--color-text-secondary)]"
            htmlFor="guest-invitation-gold-gift"
          >
            Vàng mừng (phân)
          </label>
          <div className="relative">
            <span className="absolute left-2 top-1/2 flex size-6 -translate-y-1/2 items-center justify-center rounded-full bg-orange-100 text-orange-600">
              <Coins className="size-3.5" />
            </span>
            <Input
              className="pl-10"
              id="guest-invitation-gold-gift"
              inputMode="numeric"
              min={0}
              onChange={(event) =>
                onChange({
                  ...values,
                  goldGiftAmount: Number(event.target.value) || 0,
                })
              }
              type="number"
              value={values.goldGiftAmount}
            />
          </div>
          <p className="text-xs text-[var(--color-text-muted)]">
            10 phân = 1 chỉ, 10 chỉ = 1 lượng
          </p>
        </div>
      </div>

      {values.goldGiftAmount > 0 ? (
        <div className="space-y-1.5">
          <label
            className="text-sm font-medium text-[var(--color-text-secondary)]"
            htmlFor="guest-invitation-gold-gift-note"
          >
            Ghi chú giá vàng
          </label>
          <Input
            id="guest-invitation-gold-gift-note"
            onChange={(event) =>
              onChange({ ...values, goldGiftNote: event.target.value })
            }
            placeholder="Ví dụ: Giá vàng thời điểm nhận khoảng 15.200.000đ/chỉ"
            value={values.goldGiftNote}
          />
        </div>
      ) : null}

      <div className="space-y-1.5">
        <label
          className="text-sm font-medium text-[var(--color-text-secondary)]"
          htmlFor="guest-invitation-note"
        >
          Ghi chú
        </label>
        <Textarea
          id="guest-invitation-note"
          onChange={(event) =>
            onChange({ ...values, note: event.target.value })
          }
          placeholder="Ăn chay, dị ứng hải sản..."
          value={values.note}
        />
      </div>
    </div>
  );
}
