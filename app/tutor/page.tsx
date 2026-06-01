import type { Metadata } from 'next';
import { TutorDashboard } from '@/components/dashboard/TutorDashboard';
import { requireUser } from '@/lib/server/auth';
import { getTutorDashboard } from '@/lib/server/data';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: '튜터 대시보드' };

export default async function TutorPage({ searchParams }: { searchParams: Promise<{ share?: string }> }) {
  const user = await requireUser('tutor');
  const data = await getTutorDashboard(user);
  const params = await searchParams;
  return <TutorDashboard data={data} sharedLink={params.share} />;
}
