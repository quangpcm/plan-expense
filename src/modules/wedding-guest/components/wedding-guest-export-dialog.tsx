'use client';

import { useMemo, useState } from 'react';
import { Download, X } from 'lucide-react';

import { buildWeddingGuestCsvFileContent } from '@/modules/wedding-guest/utils/wedding-guest-csv-export';
import type { GuestInvitationDocument } from '@/modules/wedding-guest/types/guest-invitation';
import type { WeddingGuestGroupDocument } from '@/modules/wedding-guest/types/wedding-guest-group';
import type { WeddingGuestDocument } from '@/modules/wedding-guest/types/wedding-guest';
import { Button } from '@/shared/components/ui/button';
import { DropdownSelect } from '@/shared/components/ui/dropdown-select';
import { ResponsiveModal } from '@/shared/components/ui/responsive-modal';

type WeddingGuestExportDialogProps = {
  open: boolean;
  groups: WeddingGuestGroupDocument[];
  guests: WeddingGuestDocument[];
  invitations: GuestInvitationDocument[];
  onClose: () => void;
};

export function WeddingGuestExportDialog({
  open,
  groups,
  guests,
  invitations,
  onClose,
}: WeddingGuestExportDialogProps) {
  const [selectedGroupId, setSelectedGroupId] = useState('all');

  const groupOptions = useMemo(
    () => [
      { value: 'all', label: 'Tất cả nhóm' },
      ...groups.map((group) => ({ value: group.id, label: group.name })),
    ],
    [groups],
  );

  function handleDownload() {
    const content = buildWeddingGuestCsvFileContent(
      guests,
      groups,
      invitations,
      selectedGroupId === 'all' ? undefined : { groupId: selectedGroupId },
    );
    const blob = new Blob([content], {
      type: 'text/csv;charset=utf-8;',
    });
    const groupName =
      selectedGroupId === 'all'
        ? 'tat-ca-nhom'
        : (groups.find((group) => group.id === selectedGroupId)?.name ?? 'nhom')
            .toLowerCase()
            .replace(/\s+/g, '-');
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    link.href = url;
    link.download = `wedding-guests-${groupName}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    onClose();
  }

  return (
    <ResponsiveModal
      description="Chọn xuất toàn bộ hoặc riêng một nhóm khách rồi tải xuống CSV."
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          onClose();
        }
      }}
      open={open}
      size="sm"
      title="Export khách mời"
    >
      <div className="space-y-5">
        <div className="space-y-1.5">
          <p className="text-sm font-medium text-slate-700">Phạm vi export</p>
          <DropdownSelect
            onValueChange={setSelectedGroupId}
            options={groupOptions}
            value={selectedGroupId}
          />
        </div>

        <div className="flex items-center justify-end gap-3">
          <Button onClick={onClose} variant="ghost">
            <X className="size-4" />
            Đóng
          </Button>
          <Button onClick={handleDownload}>
            <Download className="size-4" />
            Tải xuống
          </Button>
        </div>
      </div>
    </ResponsiveModal>
  );
}
