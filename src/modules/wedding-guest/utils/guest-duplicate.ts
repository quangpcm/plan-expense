import { normalizeVietnameseName } from '@/modules/wedding-guest/utils/normalize-name';
import type {
  WeddingGuestDocument,
  WeddingGuestIdentityInput,
} from '@/modules/wedding-guest/types/wedding-guest';

export type DuplicateGuestLevel = 'high' | 'name_only';

export type DuplicateGuestMatch = {
  guest: WeddingGuestDocument;
  level: DuplicateGuestLevel;
};

export function findDuplicateGuestMatches(
  candidate: Pick<
    WeddingGuestIdentityInput,
    'name' | 'sideId' | 'relationshipId' | 'invitedById'
  >,
  existingGuests: WeddingGuestDocument[],
  excludeGuestId?: string,
): DuplicateGuestMatch[] {
  const normalizedName = normalizeVietnameseName(candidate.name);

  if (!normalizedName) {
    return [];
  }

  return existingGuests
    .filter(
      (guest) =>
        guest.id !== excludeGuestId && guest.normalizedName === normalizedName,
    )
    .map((guest) => ({
      guest,
      level:
        guest.sideId === candidate.sideId &&
        guest.relationshipId === candidate.relationshipId &&
        guest.invitedById === candidate.invitedById
          ? ('high' as const)
          : ('name_only' as const),
    }));
}

export function findGuestsBySimilarName(
  query: string,
  existingGuests: WeddingGuestDocument[],
): WeddingGuestDocument[] {
  const normalizedQuery = normalizeVietnameseName(query);

  if (!normalizedQuery) {
    return [];
  }

  return existingGuests.filter((guest) =>
    guest.normalizedName.includes(normalizedQuery),
  );
}
