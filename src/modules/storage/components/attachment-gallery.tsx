'use client';

import { useMemo, useState } from 'react';
import { FileText } from 'lucide-react';

import type { MediaAttachment } from '@/modules/storage/types/attachment';
import { resolveAttachmentUrl } from '@/modules/storage/utils/public-url';
import { cn } from '@/shared/utils/cn';
import { PhotoPreview } from '@/shared/components/ui/photo-preview';

type AttachmentGalleryProps = {
  attachments: MediaAttachment[];
  size?: 'sm' | 'md';
  emptyLabel?: string;
};

export function AttachmentGallery({ attachments, size = 'md', emptyLabel }: AttachmentGalleryProps) {
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
    return emptyLabel ? <p className="text-sm text-slate-600">{emptyLabel}</p> : null;
  }

  return (
    <>
      <div className={cn(size === 'sm' ? 'flex flex-wrap gap-2' : 'grid grid-cols-3 gap-2')}>
        {attachments.map((attachment) => {
          const url = resolveAttachmentUrl(attachment);

          if (attachment.mimeType.startsWith('image/')) {
            const imageIndex = images.findIndex((image) => image.id === attachment.id);

            return (
              <button
                key={attachment.id}
                className={cn(
                  'block shrink-0 overflow-hidden border border-slate-200 bg-white',
                  size === 'sm' ? 'size-10 rounded-[var(--radius-ds-sm)] md:size-14' : 'aspect-square w-full rounded-2xl',
                )}
                onClick={() => setPreviewIndex(imageIndex)}
                type="button"
              >
                {/* eslint-disable-next-line @next/next/no-img-element -- external R2/user-provided URL, next/image domain not configured */}
                <img src={url} alt={attachment.fileName} className="size-full object-cover" />
              </button>
            );
          }

          return (
            <a
              key={attachment.id}
              href={url}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700"
            >
              <FileText className="size-4 shrink-0 text-slate-400" />
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
