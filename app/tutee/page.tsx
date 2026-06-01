import type { Metadata } from 'next';
import { TuteeDashboard } from '@/components/dashboard/TuteeDashboard';
import { requireUser } from '@/lib/server/auth';
import { getTuteeDashboard } from '@/lib/server/data';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: '학습자 대시보드' };

export default async function TuteePage() {
  const user = await requireUser('tutee');
  return <TuteeDashboard data={await getTuteeDashboard(user)} />;
}
