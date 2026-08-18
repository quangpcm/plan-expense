'use client';

import { useMemo, useRef, useState } from 'react';
import { FileUp, RotateCcw, Upload, X } from 'lucide-react';

import { AuthFormMessage } from '@/modules/auth/components/auth-form-message';
import { useAuthSession } from '@/modules/auth/hooks/use-auth-session';
import { weddingGuestImportService } from '@/modules/wedding-guest/services';
import type { GuestInvitationDocument } from '@/modules/wedding-guest/types/guest-invitation';
import type {
  ImportGuestDecision,
  ImportGuestUnit,
  ImportInvitationAction,
  RowParseError,
} from '@/modules/wedding-guest/types/wedding-guest-import';
import type { WeddingGuestGroupDocument } from '@/modules/wedding-guest/types/wedding-guest-group';
import type { WeddingGuestDocument } from '@/modules/wedding-guest/types/wedding-guest';
import {
  buildImportPreview,
  parseWeddingGuestCsv,
} from '@/modules/wedding-guest/utils/wedding-guest-csv-import';
import type { PlanMemberDocument } from '@/modules/member/types/member';
import type { PlanDocument } from '@/modules/plan/types/plan';
import { Button } from '@/shared/components/ui/button';
import { Dialog } from '@/shared/components/ui/dialog';
import { WeddingGuestImportPreviewTable } from '@/modules/wedding-guest/components/wedding-guest-import-preview-table';

type WeddingGuestImportDialogProps = {
  open: boolean;
  plan: PlanDocument;
  currentMember: PlanMemberDocument | null;
  groups: WeddingGuestGroupDocument[];
  guests: WeddingGuestDocument[];
  invitations: GuestInvitationDocument[];
  onClose: () => void;
};

type ImportSummary = {
  createdGuestCount: number;
  createdInvitationCount: number;
  syncedInvitationCount: number;
  syncedGuestCount: number;
  skippedCount: number;
};

function cloneUnits(units: ImportGuestUnit[]) {
  return units.map((unit) => ({
    ...unit,
    candidateMatches: [...unit.candidateMatches],
    invitations: unit.invitations.map((invitation) => ({ ...invitation })),
    rawGroupNames: [...unit.rawGroupNames],
  }));
}

export function WeddingGuestImportDialog({
  open,
  plan,
  currentMember,
  groups,
  guests,
  invitations,
  onClose,
}: WeddingGuestImportDialogProps) {
  const { user } = useAuthSession();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [step, setStep] = useState<'upload' | 'preview' | 'result'>('upload');
  const [fileName, setFileName] = useState<string | null>(null);
  const [units, setUnits] = useState<ImportGuestUnit[]>([]);
  const [invalidRows, setInvalidRows] = useState<RowParseError[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [summary, setSummary] = useState<ImportSummary | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const hasPendingRequiredDecision = useMemo(
    () =>
      units.some(
        (unit) =>
          unit.matchStatus === 'name_only' &&
          unit.guestDecision === undefined &&
          unit.invitations.some((invitation) => invitation.status !== 'invalid'),
      ) ||
      units.some((unit) =>
        unit.invitations.some(
          (invitation) =>
            invitation.status === 'sync_available' &&
            invitation.selectedAction === undefined,
        ),
      ),
    [units],
  );

  function resetState() {
    setStep('upload');
    setFileName(null);
    setUnits([]);
    setInvalidRows([]);
    setSummary(null);
    setErrorMessage(null);
    setIsSubmitting(false);

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }

  function handleClose() {
    resetState();
    onClose();
  }

  async function handleFileSelected(file: File | null) {
    if (!file) {
      return;
    }

    setErrorMessage(null);

    try {
      const rawText = await file.text();
      const parsed = parseWeddingGuestCsv(rawText);
      const previewUnits = buildImportPreview(
        parsed.rows,
        guests,
        groups,
        invitations,
      );

      setFileName(file.name);
      setInvalidRows(parsed.errors);
      setUnits(previewUnits);
      setStep('preview');
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Không thể đọc file CSV này.',
      );
    }
  }

  function updateGuestDecision(unitKey: string, decision: ImportGuestDecision) {
    setUnits((current) =>
      current.map((unit) =>
        unit.unitKey === unitKey ? { ...unit, guestDecision: decision } : unit,
      ),
    );
  }

  function updateInvitationAction(
    unitKey: string,
    rowKey: string,
    action: ImportInvitationAction,
  ) {
    setUnits((current) =>
      current.map((unit) =>
        unit.unitKey === unitKey
          ? {
              ...unit,
              invitations: unit.invitations.map((invitation) =>
                invitation.rowKey === rowKey
                  ? { ...invitation, selectedAction: action }
                  : invitation,
              ),
            }
          : unit,
      ),
    );
  }

  function handleSelectAllNew() {
    setUnits((current) =>
      current.map((unit) => ({
        ...unit,
        guestDecision:
          unit.matchStatus === 'new' || unit.matchStatus === 'name_only'
            ? 'create_new'
            : unit.guestDecision,
      })),
    );
  }

  function handleSyncAllChanges() {
    setUnits((current) =>
      current.map((unit) => ({
        ...unit,
        guestDecision:
          unit.matchStatus === 'name_only'
            ? (unit.guestDecision ?? 'use_existing_sync')
            : unit.guestDecision,
        invitations: unit.invitations.map((invitation) =>
          invitation.status === 'sync_available'
            ? { ...invitation, selectedAction: 'sync' }
            : invitation,
        ),
      })),
    );
  }

  async function handleCommit() {
    if (!user) {
      return;
    }

    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      const nextSummary = await weddingGuestImportService.commitImport(
        plan,
        cloneUnits(units),
        user,
        currentMember,
      );

      setSummary(nextSummary);
      setStep('result');
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : 'Import khách mời thất bại.',
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-40 hidden items-center justify-center bg-slate-950/40 px-4 lg:flex">
      <input
        accept=".csv,text/csv"
        className="hidden"
        onChange={(event) =>
          handleFileSelected(event.target.files?.[0] ?? null)
        }
        ref={fileInputRef}
        type="file"
      />
      <button
        aria-label="Đóng import khách mời"
        className="absolute inset-0"
        onClick={handleClose}
        type="button"
      />
      <Dialog
        className="relative z-10 w-full max-w-5xl"
        description="Upload CSV, xem trước thay đổi theo guest và invitation, rồi xác nhận import."
        title="Import khách mời"
      >
        <div className="space-y-5">
          {errorMessage ? (
            <AuthFormMessage message={errorMessage} type="error" />
          ) : null}

          {step === 'upload' ? (
            <div className="space-y-4">
              <button
                className="flex min-h-[240px] w-full flex-col items-center justify-center gap-3 rounded-[28px] border-2 border-dashed border-slate-300 bg-slate-50 text-center"
                onClick={() => fileInputRef.current?.click()}
                type="button"
              >
                <Upload className="size-8 text-slate-500" />
                <div className="space-y-1">
                  <p className="text-base font-semibold text-slate-950">
                    Chọn file CSV khách mời
                  </p>
                  <p className="text-sm text-slate-500">
                    File cần đúng header theo tài liệu import/export guest wedding.
                  </p>
                </div>
              </button>
              <div className="flex justify-end">
                <Button onClick={handleClose} variant="ghost">
                  <X className="size-4" />
                  Đóng
                </Button>
              </div>
            </div>
          ) : null}

          {step === 'preview' ? (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-slate-50 px-4 py-3">
                <div className="flex items-center gap-3 text-sm text-slate-600">
                  <FileUp className="size-4" />
                  <span>{fileName}</span>
                </div>
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  variant="ghost"
                >
                  <RotateCcw className="size-4" />
                  Chọn file khác
                </Button>
              </div>

              <WeddingGuestImportPreviewTable
                invalidRows={invalidRows}
                onGuestDecisionChange={updateGuestDecision}
                onInvitationActionChange={updateInvitationAction}
                onSelectAllNew={handleSelectAllNew}
                onSyncAllChanges={handleSyncAllChanges}
                units={units}
              />

              <div className="flex items-center justify-between gap-3">
                <Button onClick={() => setStep('upload')} variant="ghost">
                  Quay lại
                </Button>
                <Button
                  disabled={isSubmitting || hasPendingRequiredDecision}
                  onClick={handleCommit}
                >
                  {isSubmitting ? 'Đang import...' : 'Xác nhận import'}
                </Button>
              </div>
            </div>
          ) : null}

          {step === 'result' && summary ? (
            <div className="space-y-4">
              <div className="rounded-[24px] bg-emerald-50 p-5">
                <p className="text-base font-semibold text-emerald-900">
                  Import hoàn tất
                </p>
                <div className="mt-3 grid gap-2 text-sm text-emerald-800 sm:grid-cols-2">
                  <p>Tạo mới guest: {summary.createdGuestCount}</p>
                  <p>Tạo mới invitation: {summary.createdInvitationCount}</p>
                  <p>Đồng bộ guest: {summary.syncedGuestCount}</p>
                  <p>Đồng bộ invitation: {summary.syncedInvitationCount}</p>
                  <p>Bỏ qua: {summary.skippedCount}</p>
                </div>
              </div>
              <div className="flex justify-end">
                <Button onClick={handleClose}>Hoàn tất</Button>
              </div>
            </div>
          ) : null}
        </div>
      </Dialog>
    </div>
  );
}
