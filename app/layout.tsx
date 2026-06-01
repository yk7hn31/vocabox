import type { Metadata } from 'next';
import 'pretendard/dist/web/variable/pretendardvariable-dynamic-subset.css';
import './globals.css';

export const metadata: Metadata = {
  applicationName: 'VocaBox',
  title: {
    default: 'VocaBox | 기억에 남는 단어 학습',
    template: '%s | VocaBox',
  },
  description: 'CSV 단어장을 업로드하고 객관식과 셀프체크 퀴즈로 바로 복습하는 단어 학습 앱, VocaBox.',
  keywords: ['VocaBox', '단어 학습', '영어 단어장', 'vocabulary quiz', 'CSV 단어장'],
  icons: {
    icon: [
      { url: '/icon-192.png', type: 'image/png', sizes: '192x192' },
      { url: '/icon-512.png', type: 'image/png', sizes: '512x512' },
    ],
    apple: [{ url: '/apple-touch-icon.png', type: 'image/png', sizes: '180x180' }],
  },
  openGraph: {
    title: 'VocaBox | 기억에 남는 단어 학습',
    description: '나만의 단어장을 퀴즈로 바꾸고, 놓친 단어까지 바로 복습하세요.',
    siteName: 'VocaBox',
    locale: 'ko_KR',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
