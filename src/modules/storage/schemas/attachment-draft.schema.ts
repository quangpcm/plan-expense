import { z } from 'zod';

import type { MediaAttachment } from '@/modules/storage/types/attachment';

export const attachmentDraftSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('existing'), id: z.string().min(1), attachment: z.custom<MediaAttachment>() }),
  z.object({ kind: z.literal('file'), id: z.string().min(1), file: z.instanceof(File) }),
  z.object({ kind: z.literal('url'), id: z.string().min(1), url: z.string().trim().url() }),
]);
