import type { Metadata } from 'next';
import { OnboardingPage } from '@/components/OnboardingPage';
import { currentUser } from '@/lib/server/auth';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: '시작하기' };

export default async function ExplicitOnboardingPage() {
  const user = await currentUser();

  return <OnboardingPage user={user} />;
}
