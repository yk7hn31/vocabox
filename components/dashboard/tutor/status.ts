import type { TutorTutee } from '@/lib/models';
import type { TuteeStatus } from './types';

export function latestAttempt(student: TutorTutee) {
  return student.assignments.flatMap(a => a.attempts).sort((a, b) => b.completedAt.localeCompare(a.completedAt))[0];
}

export function statusOf(student: TutorTutee): TuteeStatus {
  const percent = latestAttempt(student)?.percent;
  if (student.archived || percent === undefined || percent < 70) return 'attention';
  return percent >= 90 ? 'excellent' : 'steady';
}

export const statusLabel: Record<TuteeStatus, string> = {
  attention: '확인 필요',
  steady: '진행 중',
  excellent: '우수',
};
