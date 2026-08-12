import { getEnv } from '@/config/env';

export function getMediaPublicUrl(storagePath: string): string {
  const baseUrl = getEnv().NEXT_PUBLIC_R2_PUBLIC_BASE_URL ?? '';

  return `${baseUrl.replace(/\/$/, '')}/${storagePath}`;
}
