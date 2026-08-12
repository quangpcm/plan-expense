import { FileText } from 'lucide-react';

import type { MediaAttachment } from '@/modules/storage/types/attachment';
import { resolveAttachmentUrl } from '@/modules/storage/utils/public-url';
import { cn } from '@/shared/utils/cn';

type AttachmentGalleryProps = {
  attachments: MediaAttachment[];
  size?: 'sm' | 'md';
  emptyLabel?: string;
};

export function AttachmentGallery({ attachments, size = 'md', emptyLabel }: AttachmentGalleryProps) {
  if (attachments.length === 0) {
    return emptyLabel ? <p className="text-sm text-slate-600">{emptyLabel}</p> : null;
  }

  return (
    <div className={cn('grid', size === 'sm' ? 'grid-cols-4 gap-2' : 'grid-cols-3 gap-2')}>
      {attachments.map((attachment) => {
        const url = resolveAttachmentUrl(attachment);

        return attachment.mimeType.startsWith('image/') ? (
          <a
            key={attachment.id}
            href={url}
            target="_blank"
            rel="noreferrer"
            className="block overflow-hidden rounded-2xl border border-slate-200 bg-white"
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- external R2/user-provided URL, next/image domain not configured */}
            <img src={url} alt={attachment.fileName} className="aspect-square w-full object-cover" />
          </a>
        ) : (
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
  );
}
