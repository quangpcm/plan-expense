'use client';

import { useState } from 'react';
import { SlidersHorizontal } from 'lucide-react';

import {
  GUEST_RSVP_OPTIONS,
  WEDDING_GUEST_INVITED_BY,
  WEDDING_GUEST_RELATIONSHIPS,
  WEDDING_GUEST_SIDES,
} from '@/modules/wedding-guest/constants/wedding-guest-presets';
import type { GuestRsvpStatus } from '@/modules/wedding-guest/types/guest-invitation';
import type {
  WeddingGuestInvitedById,
  WeddingGuestRelationshipId,
  WeddingGuestSideId,
} from '@/modules/wedding-guest/types/wedding-guest';
import { DropdownSelect } from '@/shared/components/ui/dropdown-select';
import { FilterBar } from '@/shared/components/ui/filter-bar';
import { Input } from '@/shared/components/ui/input';
import { cn } from '@/shared/utils/cn';

export type WeddingGuestFilters = {
  sideId: WeddingGuestSideId | 'all';
  relationshipId: WeddingGuestRelationshipId | 'all';
  invitedById: WeddingGuestInvitedById | 'all';
  rsvp: GuestRsvpStatus | 'all';
};

export const DEFAULT_WEDDING_GUEST_FILTERS: WeddingGuestFilters = {
  sideId: 'all',
  relationshipId: 'all',
  invitedById: 'all',
  rsvp: 'all',
};

const SIDE_OPTIONS = [
  { value: 'all', label: 'Tất cả phía' },
  ...WEDDING_GUEST_SIDES.map((side) => ({ value: side.id, label: side.label })),
];
const RELATIONSHIP_OPTIONS = [
  { value: 'all', label: 'Tất cả quan hệ' },
  ...WEDDING_GUEST_RELATIONSHIPS.map((relationship) => ({
    value: relationship.id,
    label: relationship.label,
  })),
];
const INVITED_BY_OPTIONS = [
  { value: 'all', label: 'Tất cả khách của' },
  ...WEDDING_GUEST_INVITED_BY.map((invitedBy) => ({
    value: invitedBy.id,
    label: invitedBy.label,
  })),
];
const RSVP_OPTIONS = [
  { value: 'all', label: 'Tất cả xác nhận' },
  ...GUEST_RSVP_OPTIONS.map((option) => ({
    value: option.id,
    label: option.label,
  })),
];

function isFiltersActive(filters: WeddingGuestFilters) {
  return Object.values(filters).some((value) => value !== 'all');
}

type WeddingGuestFilterBarProps = {
  searchQuery: string;
  onSearchQueryChange: (value: string) => void;
  filters: WeddingGuestFilters;
  onFiltersChange: (filters: WeddingGuestFilters) => void;
  showRsvpFilter: boolean;
};

export function WeddingGuestFilterBar({
  searchQuery,
  onSearchQueryChange,
  filters,
  onFiltersChange,
  showRsvpFilter,
}: WeddingGuestFilterBarProps) {
  const [showFilters, setShowFilters] = useState(false);
  const hasActiveFilters = isFiltersActive(filters);

  return (
    <div className="space-y-3">
      <FilterBar
        actions={
          <button
            aria-expanded={showFilters}
            aria-label="Bộ lọc"
            className={cn(
              'relative flex size-11 shrink-0 items-center justify-center rounded-full border transition',
              showFilters || hasActiveFilters
                ? 'border-[var(--color-brand-primary)] bg-[var(--color-brand-selected)] text-[var(--color-brand-primary)]'
                : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300',
            )}
            onClick={() => setShowFilters((value) => !value)}
            type="button"
          >
            <SlidersHorizontal className="size-4" />
            {hasActiveFilters ? (
              <span className="absolute -right-0.5 -top-0.5 size-2.5 rounded-full bg-[var(--color-brand-primary)]" />
            ) : null}
          </button>
        }
        search={
          <Input
            onChange={(event) => onSearchQueryChange(event.target.value)}
            placeholder="Tìm khách theo tên..."
            value={searchQuery}
          />
        }
      />

      {showFilters ? (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <DropdownSelect
            onValueChange={(value) =>
              onFiltersChange({
                ...filters,
                sideId: value as WeddingGuestFilters['sideId'],
              })
            }
            options={SIDE_OPTIONS}
            value={filters.sideId}
          />
          <DropdownSelect
            onValueChange={(value) =>
              onFiltersChange({
                ...filters,
                relationshipId: value as WeddingGuestFilters['relationshipId'],
              })
            }
            options={RELATIONSHIP_OPTIONS}
            value={filters.relationshipId}
          />
          <DropdownSelect
            onValueChange={(value) =>
              onFiltersChange({
                ...filters,
                invitedById: value as WeddingGuestFilters['invitedById'],
              })
            }
            options={INVITED_BY_OPTIONS}
            value={filters.invitedById}
          />
          {showRsvpFilter ? (
            <DropdownSelect
              onValueChange={(value) =>
                onFiltersChange({
                  ...filters,
                  rsvp: value as WeddingGuestFilters['rsvp'],
                })
              }
              options={RSVP_OPTIONS}
              value={filters.rsvp}
            />
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
