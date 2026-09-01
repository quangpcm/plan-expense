import type { MetadataRoute } from 'next';

import { appConfig } from '@/config/app.config';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: appConfig.name,
    short_name: appConfig.name,
    description: appConfig.description,
    start_url: '/',
    display: 'standalone',
    background_color: '#f7f8fc',
    icons: [
      { src: '/icons/app/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icons/app/icon-512.png', sizes: '512x512', type: 'image/png' },
      {
        src: '/icons/app/icon-512-maskable.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
      { src: '/icons/app/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  };
}
