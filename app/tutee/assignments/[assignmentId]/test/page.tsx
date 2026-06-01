import { notFound } from 'next/navigation';
import { TestApp } from '@/components/practice/TestApp';
import { prepareTestQuestionSet } from '@/components/practice/preparation';
import { requireUser } from '@/lib/server/auth';
import { getActiveAssignment } from '@/lib/server/data';

export const dynamic = 'force-dynamic';

export default async function AssignmentTestPage({ params }: { params: Promise<{ assignmentId: string }> }) {
  const user = await requireUser('tutee');
  const { assignmentId } = await params;
  const assignment = await getActiveAssignment(user, assignmentId);
  if (!assignment || assignment.mode !== 'test' || !assignment.timeLimitMinutes) notFound();
  return (
    <TestApp
      assignmentId={assignment.id}
      title={assignment.title}
      questions={prepareTestQuestionSet(assignment.entries)}
      timeLimitMinutes={assignment.timeLimitMinutes}
    />
  );
}
