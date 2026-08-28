'use client';

import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  CircleSlash2,
} from 'lucide-react';
import { useState } from 'react';

import { AuthFormMessage } from '@/modules/auth/components/auth-form-message';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import {
  getImportGuestLevelLabel,
  type ImportGuestDecision,
  type ImportGuestUnit,
  type ImportInvitationAction,
} from '@/modules/wedding-guest/types/wedding-guest-import';
import { getImportIdentitySummary } from '@/modules/wedding-guest/utils/wedding-guest-csv-import';
import { cn } from '@/shared/utils/cn';

type WeddingGuestImportPreviewTableProps = {
  units: ImportGuestUnit[];
  invalidRows: Array<{ rowNumber: number; message: string }>;
  onGuestDecisionChange: (
    unitKey: string,
    decision: ImportGuestDecision,
  ) => void;
  onInvitationActionChange: (
    unitKey: string,
    rowKey: string,
    action: ImportInvitationAction,
  ) => void;
  onSelectAllNew: () => void;
  onSyncAllChanges: () => void;
};

function GuestDecisionChoice({
  checked,
  label,
  description,
  name,
  onSelect,
}: {
  checked: boolean;
  label: string;
  description: string;
  name: string;
  onSelect: () => void;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-slate-200 bg-white p-3">
      <input
        checked={checked}
        className="mt-1"
        name={name}
        onChange={onSelect}
        type="radio"
      />
      <span className="space-y-1">
        <span className="block text-sm font-semibold text-slate-950">
          {label}
        </span>
        <span className="block text-xs text-slate-500">{description}</span>
      </span>
    </label>
  );
}

export function WeddingGuestImportPreviewTable({
  units,
  invalidRows,
  onGuestDecisionChange,
  onInvitationActionChange,
  onSelectAllNew,
  onSyncAllChanges,
}: WeddingGuestImportPreviewTableProps) {
  const [expandedKeys, setExpandedKeys] = useState<Record<string, boolean>>({});

  function isExpanded(unitKey: string) {
    return expandedKeys[unitKey] ?? true;
  }

  return (
    <div className="space-y-4">
      {invalidRows.length > 0 ? (
        <AuthFormMessage
          message={`${invalidRows.length} dòng CSV không hợp lệ và sẽ không được import.`}
          type="error"
        />
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="text-sm text-slate-600">
          {units.length} guest unit cần xem trước
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={onSelectAllNew} variant="secondary">
            Chọn tất cả mới
          </Button>
          <Button onClick={onSyncAllChanges} variant="secondary">
            Đồng bộ tất cả thay đổi
          </Button>
        </div>
      </div>

      {invalidRows.length > 0 ? (
        <div className="rounded-2xl bg-rose-50 p-4 text-sm text-rose-700">
          {invalidRows.map((row) => (
            <p key={`${row.rowNumber}-${row.message}`}>
              Dòng {row.rowNumber}: {row.message}
            </p>
          ))}
        </div>
      ) : null}

      <div className="space-y-3">
        {units.map((unit) => (
          <div
            className="overflow-hidden rounded-[24px] border border-slate-200 bg-slate-50"
            key={unit.unitKey}
          >
            <button
              className="flex w-full items-start justify-between gap-4 bg-white px-4 py-4 text-left"
              onClick={() =>
                setExpandedKeys((current) => ({
                  ...current,
                  [unit.unitKey]: !isExpanded(unit.unitKey),
                }))
              }
              type="button"
            >
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-base font-semibold text-slate-950">
                    {unit.name}
                  </p>
                  <Badge
                    variant={
                      unit.matchStatus === 'high'
                        ? 'danger'
                        : unit.matchStatus === 'name_only'
                          ? 'warning'
                          : 'success'
                    }
                  >
                    {unit.matchStatus === 'high'
                      ? 'Khớp tuyệt đối'
                      : unit.matchStatus === 'name_only'
                        ? 'Cùng tên'
                        : 'Khách mới'}
                  </Badge>
                </div>
                <p className="text-sm text-slate-600">
                  {getImportIdentitySummary(unit)}
                </p>
              </div>
              {isExpanded(unit.unitKey) ? (
                <ChevronDown className="mt-1 size-5 shrink-0 text-slate-500" />
              ) : (
                <ChevronRight className="mt-1 size-5 shrink-0 text-slate-500" />
              )}
            </button>

            {isExpanded(unit.unitKey) ? (
              <div className="space-y-4 p-4">
                {unit.matchStatus === 'name_only' ? (
                  <div className="space-y-3 rounded-2xl bg-amber-50 p-3">
                    <p className="text-sm font-semibold text-amber-800">
                      Cần chọn cách xử lý guest này
                    </p>
                    <div className="grid gap-3">
                      <GuestDecisionChoice
                        checked={unit.guestDecision === 'use_existing_sync'}
                        description="Dùng guest có sẵn và ghi đè thông tin định danh theo CSV."
                        label="Cùng 1 khách"
                        name={`guest-decision-${unit.unitKey}`}
                        onSelect={() =>
                          onGuestDecisionChange(
                            unit.unitKey,
                            'use_existing_sync',
                          )
                        }
                      />
                      <GuestDecisionChoice
                        checked={unit.guestDecision === 'create_new'}
                        description="Tạo guest mới riêng biệt với các dòng CSV này."
                        label="Khác khách"
                        name={`guest-decision-${unit.unitKey}`}
                        onSelect={() =>
                          onGuestDecisionChange(unit.unitKey, 'create_new')
                        }
                      />
                      <GuestDecisionChoice
                        checked={unit.guestDecision === 'skip'}
                        description="Bỏ qua toàn bộ guest unit này."
                        label="Bỏ qua"
                        name={`guest-decision-${unit.unitKey}`}
                        onSelect={() =>
                          onGuestDecisionChange(unit.unitKey, 'skip')
                        }
                      />
                    </div>
                    {unit.candidateMatches.length > 0 ? (
                      <div className="space-y-2">
                        {unit.candidateMatches.map((match) => (
                          <div
                            className="rounded-2xl bg-white px-3 py-2 text-sm text-slate-700"
                            key={match.guest.id}
                          >
                            <span className="font-medium">{match.guest.name}</span>{' '}
                            · {getImportGuestLevelLabel(match.level)}
                          </div>
                        ))}
                      </div>
                    ) : null}
                  </div>
                ) : null}

                <div className="space-y-3">
                  {unit.invitations.map((invitation) => (
                    <div
                      className={cn(
                        'rounded-2xl border p-3',
                        invitation.status === 'invalid'
                          ? 'border-rose-200 bg-rose-50'
                          : 'border-slate-200 bg-white',
                      )}
                      key={invitation.rowKey}
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-sm font-semibold text-slate-950">
                              {invitation.resolvedGroupName}
                            </p>
                            {invitation.isNewGroup ? (
                              <Badge variant="info">Nhóm mới</Badge>
                            ) : null}
                            {invitation.status === 'create' ? (
                              <Badge variant="success">Thêm vào nhóm</Badge>
                            ) : null}
                            {invitation.status === 'sync_available' ? (
                              <Badge variant="warning">Có thay đổi</Badge>
                            ) : null}
                            {invitation.status === 'unchanged' ? (
                              <Badge variant="neutral">Không đổi</Badge>
                            ) : null}
                            {invitation.status === 'invalid' ? (
                              <Badge variant="danger">Không hợp lệ</Badge>
                            ) : null}
                          </div>
                          <p className="text-xs text-slate-500">
                            Dòng {invitation.rowNumber} · RSVP {invitation.rsvp}
                            {' · '}
                            {invitation.attendeeCount} người
                          </p>
                        </div>

                        {invitation.status === 'create' ? (
                          <div className="flex items-center gap-2 text-sm text-emerald-700">
                            <CheckCircle2 className="size-4" />
                            Sẽ tạo mới
                          </div>
                        ) : null}
                        {invitation.status === 'unchanged' ? (
                          <div className="flex items-center gap-2 text-sm text-slate-500">
                            <CircleSlash2 className="size-4" />
                            Không cần thao tác
                          </div>
                        ) : null}
                        {invitation.status === 'invalid' ? (
                          <div className="flex items-center gap-2 text-sm text-rose-700">
                            <AlertTriangle className="size-4" />
                            Bị loại khỏi commit
                          </div>
                        ) : null}
                      </div>

                      {invitation.diff.length > 0 ? (
                        <div className="mt-3 space-y-1 rounded-2xl bg-amber-50 p-3 text-xs text-amber-900">
                          {invitation.diff.map((diff) => (
                            <p key={`${invitation.rowKey}-${diff.field}`}>
                              {diff.field}: &quot;{diff.currentValue}&quot; →
                              &quot;{diff.incomingValue}&quot;
                            </p>
                          ))}
                        </div>
                      ) : null}

                      {invitation.validationError ? (
                        <p className="mt-3 text-sm text-rose-700">
                          {invitation.validationError}
                        </p>
                      ) : null}

                      {invitation.status === 'sync_available' ? (
                        <div className="mt-3 flex flex-wrap gap-2">
                          <Button
                            className={cn(
                              invitation.selectedAction === 'sync'
                                ? 'ring-2 ring-[var(--color-brand-primary)]'
                                : '',
                            )}
                            onClick={() =>
                              onInvitationActionChange(
                                unit.unitKey,
                                invitation.rowKey,
                                'sync',
                              )
                            }
                            variant="secondary"
                          >
                            Đồng bộ
                          </Button>
                          <Button
                            className={cn(
                              invitation.selectedAction === 'skip'
                                ? 'ring-2 ring-[var(--color-brand-primary)]'
                                : '',
                            )}
                            onClick={() =>
                              onInvitationActionChange(
                                unit.unitKey,
                                invitation.rowKey,
                                'skip',
                              )
                            }
                            variant="ghost"
                          >
                            Bỏ qua
                          </Button>
                        </div>
                      ) : null}
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}
