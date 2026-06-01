import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { AuthPrototype } from '@/components/prototype/AuthPrototype';
import { currentUser } from '@/lib/server/auth';
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
    return <AuthPrototype key={`invite-${params.invite}`} flow="invite" token={params.invite} displayName={invite?.displayName} valid={Boolean(invite)} />;
  }
  if (params.reset && params.reset !== 'done') {
    const reset = await getPublicReset(hashToken(params.reset));
    return <AuthPrototype key={`reset-${params.reset}`} flow="reset" token={params.reset} displayName={reset?.displayName} valid={Boolean(reset)} />;
  }
  if (params.reset === 'done') return <AuthPrototype key="reset-complete" flow="reset-complete" />;
  const user = await currentUser();
  if (user) redirect(user.role === 'tutor' ? '/tutor' : '/tutee');
  const flow = params.mode === 'register' && params.role === 'tutor' ? 'tutor-register' : 'login';
  return <AuthPrototype key={flow} flow={flow} />;
}
