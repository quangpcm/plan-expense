'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Camera, Link2, Plus, X } from 'lucide-react';

import type { AttachmentDraft } from '@/modules/storage/types/attachment';
import { compressImageFile } from '@/modules/storage/utils/compress-image';
import { resolveAttachmentUrl } from '@/modules/storage/utils/public-url';
import { MEDIA_MAX_COUNT } from '@/modules/storage/utils/validate-media';
import { BottomSheet } from '@/shared/components/ui/bottom-sheet';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';

type AttachmentPickerProps = {
  value: AttachmentDraft[];
  onChange: (next: AttachmentDraft[]) => void;
  maxCount?: number;
  disabled?: boolean;
  label?: string;
};

function resolveDraftPreviewUrl(draft: AttachmentDraft, objectUrls: Record<string, string>): string {
  if (draft.kind === 'existing') {
    return resolveAttachmentUrl(draft.attachment);
  }

  if (draft.kind === 'url') {
    return draft.url;
  }

  return objectUrls[draft.id] ?? '';
}

export function AttachmentPicker({
  value,
  onChange,
  maxCount = MEDIA_MAX_COUNT,
  disabled = false,
  label = 'Thêm hình ảnh',
}: AttachmentPickerProps) {
  const [sheetMode, setSheetMode] = useState<'closed' | 'choose' | 'url'>('closed');
  const [urlValue, setUrlValue] = useState('');
  const [urlError, setUrlError] = useState<string | null>(null);
  const [isProcessingFiles, setIsProcessingFiles] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const objectUrls = useMemo(() => {
    const created: Record<string, string> = {};

    for (const draft of value) {
      if (draft.kind === 'file') {
        created[draft.id] = URL.createObjectURL(draft.file);
      }
    }

    return created;
  }, [value]);

  useEffect(() => {
    return () => {
      for (const objectUrl of Object.values(objectUrls)) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [objectUrls]);

  function closeSheet() {
    setSheetMode('closed');
    setUrlValue('');
    setUrlError(null);
  }

  async function handleFilesSelected(files: FileList | null) {
    if (!files || files.length === 0) {
      return;
    }

    const remaining = Math.max(maxCount - value.length, 0);
    const selectedFiles = Array.from(files).slice(0, remaining);

    closeSheet();
    setIsProcessingFiles(true);

    try {
      const compressedFiles = await Promise.all(selectedFiles.map(compressImageFile));
      const nextDrafts: AttachmentDraft[] = compressedFiles.map((file) => ({
        kind: 'file',
        id: crypto.randomUUID(),
        file,
      }));

      onChange([...value, ...nextDrafts]);
    } finally {
      setIsProcessingFiles(false);

      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }

  function handleAddUrl() {
    const trimmed = urlValue.trim();

    try {
      new URL(trimmed);
    } catch {
      setUrlError('Đường dẫn không hợp lệ.');
      return;
    }

    onChange([...value, { kind: 'url', id: crypto.randomUUID(), url: trimmed }]);
    closeSheet();
  }

  function handleRemove(id: string) {
    onChange(value.filter((draft) => draft.id !== id));
  }

  const canAddMore = value.length < maxCount;

  return (
    <div className="space-y-2">
      <input
        accept="image/*"
        className="hidden"
        multiple
        onChange={(event) => handleFilesSelected(event.target.files)}
        ref={fileInputRef}
        type="file"
      />

      {value.length === 0 ? (
        <button
          className="flex w-full flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-[#c2c6d8] bg-[#f7f9fb] py-8 text-center disabled:opacity-60"
          disabled={disabled || isProcessingFiles}
          onClick={() => setSheetMode('choose')}
          type="button"
        >
          <Camera className="size-6 text-[#727687]" />
          <span className="text-sm text-[#727687]">{isProcessingFiles ? 'Đang xử lý ảnh...' : label}</span>
        </button>
      ) : (
        <div className="grid grid-cols-3 gap-2">
          {value.map((draft) => (
            <div
              className="relative aspect-square overflow-hidden rounded-2xl border border-slate-200 bg-white"
              key={draft.id}
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- local object URL / external URL preview, not a static asset */}
              <img
                alt=""
                className="size-full object-cover"
                src={resolveDraftPreviewUrl(draft, objectUrls)}
              />
              {!disabled ? (
                <button
                  aria-label="Xóa ảnh"
                  className="absolute top-1 right-1 flex size-6 items-center justify-center rounded-full bg-slate-950/60 text-white"
                  onClick={() => handleRemove(draft.id)}
                  type="button"
                >
                  <X className="size-3.5" />
                </button>
              ) : null}
            </div>
          ))}
          {canAddMore && !disabled ? (
            <button
              className="flex aspect-square items-center justify-center rounded-2xl border-2 border-dashed border-[#c2c6d8] bg-[#f7f9fb] text-[#727687] disabled:opacity-60"
              disabled={isProcessingFiles}
              onClick={() => setSheetMode('choose')}
              type="button"
            >
              <Plus className="size-5" />
            </button>
          ) : null}
        </div>
      )}

      <BottomSheet
        onClose={closeSheet}
        open={sheetMode !== 'closed'}
        title={sheetMode === 'url' ? 'Nhập URL ảnh' : 'Thêm hình ảnh'}
      >
        {sheetMode === 'url' ? (
          <div className="space-y-3">
            <Input
              autoFocus
              onChange={(event) => {
                setUrlValue(event.target.value);
                setUrlError(null);
              }}
              placeholder="https://..."
              type="url"
              value={urlValue}
            />
            {urlError ? <p className="text-sm text-rose-600">{urlError}</p> : null}
            <div className="flex items-center justify-end gap-2">
              <Button onClick={() => setSheetMode('choose')} type="button" variant="ghost">
                Quay lại
              </Button>
              <Button onClick={handleAddUrl} type="button">
                Thêm
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid gap-2">
            <button
              className="flex min-h-11 items-center gap-3 rounded-2xl border border-[#c2c6d8] bg-white px-4 py-2 text-sm text-[#191c1e]"
              onClick={() => fileInputRef.current?.click()}
              type="button"
            >
              <Camera className="size-4 text-[#727687]" />
              Thư viện / Chụp ảnh
            </button>
            <button
              className="flex min-h-11 items-center gap-3 rounded-2xl border border-[#c2c6d8] bg-white px-4 py-2 text-sm text-[#191c1e]"
              onClick={() => setSheetMode('url')}
              type="button"
            >
              <Link2 className="size-4 text-[#727687]" />
              Nhập URL ảnh
            </button>
          </div>
        )}
      </BottomSheet>
    </div>
  );
}
