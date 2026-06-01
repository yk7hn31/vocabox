import type { Metadata } from 'next';
import { PracticeApp } from '@/components/practice';

export const metadata: Metadata = {
  title: '단어 학습',
  description: 'VocaBox에서 단어장을 업로드하고 바로 퀴즈를 시작하세요.',
};

interface PracticePageProps {
  searchParams: Promise<{ demo?: string | string[] }>;
}

export default async function PracticePage({ searchParams }: PracticePageProps) {
  const params = await searchParams;

  return <PracticeApp startWithSample={params.demo === '1'} />;
}
