import { notFound } from 'next/navigation';
import { SavedPracticeApp } from '@/components/practice/SavedPracticeApp';
import { prepareAssignedQuestionSet } from '@/components/practice/preparation';
import { requireUser } from '@/lib/server/auth';
import { getActiveAssignment } from '@/lib/server/data';

export const dynamic = 'force-dynamic';

export default async function SavedAssignmentPracticePage({ params }: { params: Promise<{ assignmentId: string }> }) {
  const user = await requireUser('tutee');
  const { assignmentId } = await params;
  const assignment = await getActiveAssignment(user, assignmentId);
  if (!assignment) notFound();
  return (
    <SavedPracticeApp
      assignmentId={assignment.id}
      title={assignment.title}
      questions={prepareAssignedQuestionSet(assignment.entries)}
    />
  );
}
