import type {
  GuestInvitationDocument,
  GuestRsvpStatus,
  GuestTransportArrangement,
} from '@/modules/wedding-guest/types/guest-invitation';
import type {
  DuplicateGuestMatch,
  DuplicateGuestLevel,
} from '@/modules/wedding-guest/utils/guest-duplicate';
import type {
  WeddingGuestDocument,
  WeddingGuestInvitedById,
  WeddingGuestRelationshipId,
  WeddingGuestSideId,
} from '@/modules/wedding-guest/types/wedding-guest';

export type ImportInvitationRowStatus =
  | 'create'
  | 'sync_available'
  | 'unchanged'
  | 'invalid';

export type ImportGuestMatchStatus = 'new' | 'high' | 'name_only';

export type ImportGuestDecision =
  | 'create_new'
  | 'use_existing_sync'
  | 'use_existing_no_sync'
  | 'skip';

export type ImportInvitationAction = 'create' | 'sync' | 'skip';

export type ImportIdentity = {
  name: string;
  normalizedName: string;
  sideId: WeddingGuestSideId;
  relationshipId: WeddingGuestRelationshipId;
  invitedById: WeddingGuestInvitedById;
};

export type ParsedWeddingGuestCsvRow = ImportIdentity & {
  rowNumber: number;
  groupNameRaw: string;
  rsvp: GuestRsvpStatus;
  attendeeCount: number;
  moneyGiftAmount: number | null;
  goldGiftAmount: number | null;
  goldGiftNote: string | null;
  note: string | null;
  transportArrangement: GuestTransportArrangement;
};

export type RowParseError = {
  rowNumber: number;
  message: string;
};

export type ParsedWeddingGuestCsvResult = {
  rows: ParsedWeddingGuestCsvRow[];
  errors: RowParseError[];
};

export type ImportInvitationDiffField =
  | 'rsvp'
  | 'attendeeCount'
  | 'moneyGiftAmount'
  | 'goldGiftAmount'
  | 'goldGiftNote'
  | 'note'
  | 'transportArrangement';

export type ImportInvitationDiff = {
  field: ImportInvitationDiffField;
  currentValue: string;
  incomingValue: string;
};

export type ImportInvitationRow = {
  rowKey: string;
  rowNumber: number;
  groupNameRaw: string;
  resolvedGroupId: string | null;
  resolvedGroupName: string;
  isNewGroup: boolean;
  rsvp: GuestRsvpStatus;
  attendeeCount: number;
  moneyGiftAmount: number | null;
  goldGiftAmount: number | null;
  goldGiftNote: string | null;
  note: string | null;
  transportArrangement: GuestTransportArrangement;
  existingInvitation: GuestInvitationDocument | null;
  status: ImportInvitationRowStatus;
  diff: ImportInvitationDiff[];
  validationError?: string | undefined;
  selectedAction: ImportInvitationAction | undefined;
};

export type ImportGuestUnit = ImportIdentity & {
  unitKey: string;
  rawGroupNames: string[];
  matchStatus: ImportGuestMatchStatus;
  candidateMatches: DuplicateGuestMatch[];
  resolvedGuest: WeddingGuestDocument | null;
  guestDecision: ImportGuestDecision | undefined;
  invitations: ImportInvitationRow[];
};

export function getImportGuestLevelLabel(level: DuplicateGuestLevel): string {
  return level === 'high' ? 'Khả năng trùng cao' : 'Có khách cùng tên';
}
