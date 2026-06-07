import { notFound } from 'next/navigation';
import { FlashcardApp } from '@/components/practice/FlashcardApp';
import { requireUser } from '@/lib/server/auth';
import { getActiveAssignment } from '@/lib/server/data';

export const dynamic = 'force-dynamic';

export default async function AssignmentFlashcardsPage({ params }: { params: Promise<{ assignmentId: string }> }) {
  const user = await requireUser('tutee');
  const { assignmentId } = await params;
  const assignment = await getActiveAssignment(user, assignmentId);
  if (!assignment || assignment.mode !== 'practice') notFound();
  return <FlashcardApp title={assignment.title} entries={assignment.entries} />;
}
