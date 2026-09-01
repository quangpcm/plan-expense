import Papa from 'papaparse';

import {
  getGuestRsvpIdByLabel,
  getGuestRsvpLabel,
  getGuestTransportArrangementIdByLabel,
  getGuestTransportArrangementLabel,
  getWeddingGuestInvitedByIdByLabel,
  getWeddingGuestInvitedByLabel,
  getWeddingGuestRelationshipIdByLabel,
  getWeddingGuestRelationshipLabel,
  getWeddingGuestSideIdByLabel,
  getWeddingGuestSideLabel,
} from '@/modules/wedding-guest/constants/wedding-guest-presets';
import type {
  GuestInvitationDocument,
  GuestRsvpStatus,
  GuestTransportArrangement,
} from '@/modules/wedding-guest/types/guest-invitation';
import type {
  ImportGuestUnit,
  ImportIdentity,
  ImportInvitationDiff,
  ParsedWeddingGuestCsvResult,
  ParsedWeddingGuestCsvRow,
  RowParseError,
} from '@/modules/wedding-guest/types/wedding-guest-import';
import type { WeddingGuestGroupDocument } from '@/modules/wedding-guest/types/wedding-guest-group';
import type { WeddingGuestDocument } from '@/modules/wedding-guest/types/wedding-guest';
import { findDuplicateGuestMatches } from '@/modules/wedding-guest/utils/guest-duplicate';
import { normalizeVietnameseName } from '@/modules/wedding-guest/utils/normalize-name';

type CsvHeaderKey =
  | 'groupName'
  | 'side'
  | 'relationship'
  | 'invitedBy'
  | 'guestName'
  | 'rsvp'
  | 'attendeeCount'
  | 'moneyGiftAmount'
  | 'goldGiftAmount'
  | 'goldGiftNote'
  | 'note'
  | 'transportArrangement';

type RawCsvRow = Record<string, string | undefined>;

const CSV_HEADER_ALIASES: Record<CsvHeaderKey, string[]> = {
  groupName: ['Tên Nhóm Khách'],
  side: ['Phía'],
  relationship: ['Quan Hệ'],
  invitedBy: ['Khách của'],
  guestName: ['Tên khách mời'],
  rsvp: ['Trạng thái Xác Nhận'],
  attendeeCount: ['Số người dự kiến'],
  moneyGiftAmount: ['Tiền mừng'],
  goldGiftAmount: ['Vàng mừng'],
  goldGiftNote: ['Giá quy đổi vàng'],
  note: ['Ghi chú'],
  transportArrangement: ['Di chuyển'],
};

function getValueByAlias(row: RawCsvRow, key: CsvHeaderKey): string {
  for (const alias of CSV_HEADER_ALIASES[key]) {
    const value = row[alias];

    if (typeof value === 'string') {
      return value.trim();
    }
  }

  return '';
}

function parseIntegerLike(
  rawValue: string,
  {
    fieldLabel,
    defaultValue,
    allowNull,
  }: { fieldLabel: string; defaultValue?: number; allowNull?: boolean },
): number | null {
  const trimmed = rawValue.trim();

  if (!trimmed) {
    if (allowNull) {
      return null;
    }

    return defaultValue ?? 0;
  }

  const normalized = trimmed.replace(/[.,\s]/g, '');

  if (!/^\d+$/.test(normalized)) {
    throw new Error(`${fieldLabel} không phải số hợp lệ.`);
  }

  return Number.parseInt(normalized, 10);
}

function buildIdentityKey(identity: ImportIdentity): string {
  return [
    identity.normalizedName,
    identity.sideId,
    identity.relationshipId,
    identity.invitedById,
  ].join('|');
}

function formatNullableNumber(value: number | null): string {
  return value === null ? '' : String(value);
}

function buildInvitationDiff(
  existingInvitation: GuestInvitationDocument,
  row: ParsedWeddingGuestCsvRow,
): ImportInvitationDiff[] {
  const diffs: ImportInvitationDiff[] = [];

  if (existingInvitation.rsvp !== row.rsvp) {
    diffs.push({
      field: 'rsvp',
      currentValue: getGuestRsvpLabel(existingInvitation.rsvp),
      incomingValue: getGuestRsvpLabel(row.rsvp),
    });
  }

  if (existingInvitation.attendeeCount !== row.attendeeCount) {
    diffs.push({
      field: 'attendeeCount',
      currentValue: String(existingInvitation.attendeeCount),
      incomingValue: String(row.attendeeCount),
    });
  }

  if (existingInvitation.moneyGiftAmount !== row.moneyGiftAmount) {
    diffs.push({
      field: 'moneyGiftAmount',
      currentValue: formatNullableNumber(existingInvitation.moneyGiftAmount),
      incomingValue: formatNullableNumber(row.moneyGiftAmount),
    });
  }

  if (existingInvitation.goldGiftAmount !== row.goldGiftAmount) {
    diffs.push({
      field: 'goldGiftAmount',
      currentValue: formatNullableNumber(existingInvitation.goldGiftAmount),
      incomingValue: formatNullableNumber(row.goldGiftAmount),
    });
  }

  if ((existingInvitation.goldGiftNote ?? '') !== (row.goldGiftNote ?? '')) {
    diffs.push({
      field: 'goldGiftNote',
      currentValue: existingInvitation.goldGiftNote ?? '',
      incomingValue: row.goldGiftNote ?? '',
    });
  }

  if ((existingInvitation.note ?? '') !== (row.note ?? '')) {
    diffs.push({
      field: 'note',
      currentValue: existingInvitation.note ?? '',
      incomingValue: row.note ?? '',
    });
  }

  const existingTransportArrangement =
    existingInvitation.transportArrangement ?? 'undecided';

  if (existingTransportArrangement !== row.transportArrangement) {
    diffs.push({
      field: 'transportArrangement',
      currentValue: getGuestTransportArrangementLabel(
        existingTransportArrangement,
      ),
      incomingValue: getGuestTransportArrangementLabel(
        row.transportArrangement,
      ),
    });
  }

  return diffs;
}

export function parseWeddingGuestCsv(rawText: string): ParsedWeddingGuestCsvResult {
  const parsed = Papa.parse<RawCsvRow>(rawText, {
    header: true,
    skipEmptyLines: true,
  });

  const rows: ParsedWeddingGuestCsvRow[] = [];
  const errors: RowParseError[] = [];

  parsed.data.forEach((rawRow, index) => {
    const rowNumber = index + 2;

    try {
      const name = getValueByAlias(rawRow, 'guestName');
      const groupNameRaw = getValueByAlias(rawRow, 'groupName');
      const sideLabel = getValueByAlias(rawRow, 'side');
      const relationshipLabel = getValueByAlias(rawRow, 'relationship');
      const invitedByLabel = getValueByAlias(rawRow, 'invitedBy');
      const rsvpLabel = getValueByAlias(rawRow, 'rsvp');
      const normalizedName = normalizeVietnameseName(name);

      if (!normalizedName) {
        throw new Error('Thiếu tên khách mời.');
      }

      if (!groupNameRaw.trim()) {
        throw new Error('Thiếu tên nhóm khách.');
      }

      const sideId = getWeddingGuestSideIdByLabel(sideLabel);
      const relationshipId =
        getWeddingGuestRelationshipIdByLabel(relationshipLabel);
      const invitedById = getWeddingGuestInvitedByIdByLabel(invitedByLabel);

      if (!sideId) {
        throw new Error(`Không nhận diện được phía "${sideLabel}".`);
      }

      if (!relationshipId) {
        throw new Error(`Không nhận diện được quan hệ "${relationshipLabel}".`);
      }

      if (!invitedById) {
        throw new Error(`Không nhận diện được khách của "${invitedByLabel}".`);
      }

      let rsvp: GuestRsvpStatus = 'pending';

      if (rsvpLabel) {
        const parsedRsvp = getGuestRsvpIdByLabel(rsvpLabel);

        if (!parsedRsvp) {
          throw new Error(
            `Không nhận diện được trạng thái xác nhận "${rsvpLabel}".`,
          );
        }

        rsvp = parsedRsvp;
      }

      const attendeeCount =
        parseIntegerLike(getValueByAlias(rawRow, 'attendeeCount'), {
          fieldLabel: 'Số người dự kiến',
          defaultValue: 1,
        }) ?? 1;

      const transportArrangementLabel = getValueByAlias(
        rawRow,
        'transportArrangement',
      );
      let transportArrangement: GuestTransportArrangement = 'undecided';

      if (transportArrangementLabel) {
        const parsedTransportArrangement = getGuestTransportArrangementIdByLabel(
          transportArrangementLabel,
        );

        if (!parsedTransportArrangement) {
          throw new Error(
            `Không nhận diện được phương tiện di chuyển "${transportArrangementLabel}".`,
          );
        }

        transportArrangement = parsedTransportArrangement;
      }

      rows.push({
        rowNumber,
        groupNameRaw: groupNameRaw.trim(),
        name: name.trim(),
        normalizedName,
        sideId,
        relationshipId,
        invitedById,
        rsvp,
        attendeeCount,
        moneyGiftAmount: parseIntegerLike(
          getValueByAlias(rawRow, 'moneyGiftAmount'),
          {
            fieldLabel: 'Tiền mừng',
            allowNull: true,
          },
        ),
        goldGiftAmount: parseIntegerLike(
          getValueByAlias(rawRow, 'goldGiftAmount'),
          {
            fieldLabel: 'Vàng mừng',
            allowNull: true,
          },
        ),
        goldGiftNote: getValueByAlias(rawRow, 'goldGiftNote') || null,
        note: getValueByAlias(rawRow, 'note') || null,
        transportArrangement,
      });
    } catch (error) {
      errors.push({
        rowNumber,
        message:
          error instanceof Error ? error.message : 'Dòng CSV không hợp lệ.',
      });
    }
  });

  return { rows, errors };
}

export function buildImportPreview(
  rawRows: ParsedWeddingGuestCsvRow[],
  existingGuests: WeddingGuestDocument[],
  existingGroups: WeddingGuestGroupDocument[],
  existingInvitations: GuestInvitationDocument[],
): ImportGuestUnit[] {
  const groupByNormalizedName = new Map(
    existingGroups.map((group) => [normalizeVietnameseName(group.name), group]),
  );
  const invitationByGuestAndGroup = new Map(
    existingInvitations.map((invitation) => [
      `${invitation.guestId}|${invitation.groupId}`,
      invitation,
    ]),
  );
  const unitsByKey = new Map<string, ImportGuestUnit>();

  for (const row of rawRows) {
    const unitKey = buildIdentityKey(row);
    const normalizedGroupName = normalizeVietnameseName(row.groupNameRaw);
    const existingGroup = groupByNormalizedName.get(normalizedGroupName) ?? null;

    let unit = unitsByKey.get(unitKey);

    if (!unit) {
      const candidateMatches = findDuplicateGuestMatches(
        {
          name: row.name,
          sideId: row.sideId,
          relationshipId: row.relationshipId,
          invitedById: row.invitedById,
        },
        existingGuests,
      );

      const highMatch = candidateMatches.find((match) => match.level === 'high');

      unit = {
        unitKey,
        name: row.name,
        normalizedName: row.normalizedName,
        sideId: row.sideId,
        relationshipId: row.relationshipId,
        invitedById: row.invitedById,
        rawGroupNames: [],
        matchStatus: highMatch
          ? 'high'
          : candidateMatches.length > 0
            ? 'name_only'
            : 'new',
        candidateMatches,
        resolvedGuest: highMatch?.guest ?? null,
        guestDecision:
          highMatch?.guest ? 'use_existing_no_sync' : undefined,
        invitations: [],
      };
      unitsByKey.set(unitKey, unit);
    }

    if (!unit) {
      continue;
    }

    if (!unit.rawGroupNames.includes(row.groupNameRaw)) {
      unit.rawGroupNames.push(row.groupNameRaw);
    }

    const duplicateGroupRow = unit.invitations.find(
      (invitation) =>
        normalizeVietnameseName(invitation.groupNameRaw) === normalizedGroupName,
    );

    if (duplicateGroupRow) {
      unit.invitations.push({
        rowKey: `${unitKey}|row-${row.rowNumber}`,
        rowNumber: row.rowNumber,
        groupNameRaw: row.groupNameRaw,
        resolvedGroupId: existingGroup?.id ?? null,
        resolvedGroupName: existingGroup?.name ?? row.groupNameRaw,
        isNewGroup: !existingGroup,
        rsvp: row.rsvp,
        attendeeCount: row.attendeeCount,
        moneyGiftAmount: row.moneyGiftAmount,
        goldGiftAmount: row.goldGiftAmount,
        goldGiftNote: row.goldGiftNote,
        note: row.note,
        transportArrangement: row.transportArrangement,
        existingInvitation: null,
        status: 'invalid',
        diff: [],
        validationError: 'Trùng guest + nhóm ngay trong file CSV.',
        selectedAction: undefined,
      });
      continue;
    }

    const existingInvitation =
      existingGroup && unit.resolvedGuest
        ? invitationByGuestAndGroup.get(
            `${unit.resolvedGuest.id}|${existingGroup.id}`,
          ) ?? null
        : null;
    const diff = existingInvitation
      ? buildInvitationDiff(existingInvitation, row)
      : [];

    unit.invitations.push({
      rowKey: `${unitKey}|row-${row.rowNumber}`,
      rowNumber: row.rowNumber,
      groupNameRaw: row.groupNameRaw,
      resolvedGroupId: existingGroup?.id ?? null,
      resolvedGroupName: existingGroup?.name ?? row.groupNameRaw,
      isNewGroup: !existingGroup,
      rsvp: row.rsvp,
      attendeeCount: row.attendeeCount,
      moneyGiftAmount: row.moneyGiftAmount,
      goldGiftAmount: row.goldGiftAmount,
      goldGiftNote: row.goldGiftNote,
      note: row.note,
      transportArrangement: row.transportArrangement,
      existingInvitation,
      status: existingInvitation
        ? diff.length > 0
          ? 'sync_available'
          : 'unchanged'
        : 'create',
      diff,
      selectedAction: existingInvitation
        ? diff.length > 0
          ? undefined
          : 'skip'
        : 'create',
    });
  }

  return Array.from(unitsByKey.values()).sort((left, right) =>
    left.name.localeCompare(right.name, 'vi'),
  );
}

export function getImportIdentitySummary(unit: ImportIdentity): string {
  return [
    getWeddingGuestSideLabel(unit.sideId),
    getWeddingGuestRelationshipLabel(unit.relationshipId),
    getWeddingGuestInvitedByLabel(unit.invitedById),
  ].join(' · ');
}
