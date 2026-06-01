import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'VocaBox',
    short_name: 'VocaBox',
    description: '나만의 단어장을 퀴즈로 바꾸는 단어 학습 앱',
    start_url: '/',
    display: 'standalone',
    background_color: '#ebf5ff',
    theme_color: '#181d27',
    lang: 'ko',
    icons: [
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  };
}
