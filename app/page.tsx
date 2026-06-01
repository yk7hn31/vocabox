import { redirect } from 'next/navigation';
import { OnboardingPage } from '@/components/OnboardingPage';
import { currentUser, dashboardPathFor } from '@/lib/server/auth';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const user = await currentUser();
  if (user) redirect(dashboardPathFor(user));

  return <OnboardingPage />;
}
