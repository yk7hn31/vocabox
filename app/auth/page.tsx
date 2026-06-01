import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { AuthView } from '@/components/auth/AuthView';
import { currentUser, dashboardPathFor } from '@/lib/server/auth';
import { getPublicInvite, getPublicReset } from '@/lib/server/data';
import { hashToken } from '@/lib/server/security';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: '로그인' };

interface AuthPageProps {
  searchParams: Promise<{ mode?: string; role?: string; invite?: string; reset?: string }>;
}

export default async function AuthPage({ searchParams }: AuthPageProps) {
  const params = await searchParams;
  if (params.invite) {
    const invite = await getPublicInvite(hashToken(params.invite));
    return <AuthView key={`invite-${params.invite}`} flow="invite" token={params.invite} displayName={invite?.displayName} valid={Boolean(invite)} />;
  }
  if (params.reset && params.reset !== 'done') {
    const reset = await getPublicReset(hashToken(params.reset));
    return <AuthView key={`reset-${params.reset}`} flow="reset" token={params.reset} displayName={reset?.displayName} valid={Boolean(reset)} />;
  }
  if (params.reset === 'done') return <AuthView key="reset-complete" flow="reset-complete" />;
  const user = await currentUser();
  if (user) redirect(dashboardPathFor(user));
  const flow = params.mode === 'register' && params.role === 'tutor' ? 'tutor-register' : 'login';
  return <AuthView key={flow} flow={flow} />;
}
