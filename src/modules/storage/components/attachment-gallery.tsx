'use client';

import { useMemo, useState } from 'react';
import { FileText } from 'lucide-react';

import type { MediaAttachment } from '@/modules/storage/types/attachment';
import { resolveAttachmentUrl } from '@/modules/storage/utils/public-url';
import { PhotoPreview } from '@/shared/components/ui/photo-preview';

type AttachmentGalleryProps = {
  attachments: MediaAttachment[];
  emptyLabel?: string;
};

export function AttachmentGallery({ attachments, emptyLabel }: AttachmentGalleryProps) {
  const [previewIndex, setPreviewIndex] = useState<number | null>(null);

  const images = useMemo(
    () =>
      attachments
        .filter((attachment) => attachment.mimeType.startsWith('image/'))
        .map((attachment) => ({
          id: attachment.id,
          url: resolveAttachmentUrl(attachment),
          alt: attachment.fileName,
        })),
    [attachments],
  );

  if (attachments.length === 0) {
    return emptyLabel ? <p className="text-sm text-[var(--color-text-secondary)]">{emptyLabel}</p> : null;
  }

  return (
    <>
      <div className="grid grid-cols-3 gap-2">
        {attachments.map((attachment) => {
          const url = resolveAttachmentUrl(attachment);

          if (attachment.mimeType.startsWith('image/')) {
            const imageIndex = images.findIndex((image) => image.id === attachment.id);

            return (
              <button
                key={attachment.id}
                className="block overflow-hidden rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-default)]"
                onClick={() => setPreviewIndex(imageIndex)}
                type="button"
              >
                {/* eslint-disable-next-line @next/next/no-img-element -- external R2/user-provided URL, next/image domain not configured */}
                <img src={url} alt={attachment.fileName} className="aspect-square w-full object-cover" />
              </button>
            );
          }

          return (
            <a
              key={attachment.id}
              href={url}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-default)] px-4 py-3 text-sm text-[var(--color-text-secondary)]"
            >
              <FileText className="size-4 shrink-0 text-[var(--color-text-muted)]" />
              <span className="truncate">{attachment.fileName}</span>
            </a>
          );
        })}
      </div>

      {previewIndex != null ? (
        <PhotoPreview items={images} initialIndex={previewIndex} onClose={() => setPreviewIndex(null)} />
      ) : null}
    </>
  );
}
