import type { TuteeAssignment } from '@/lib/models';

export function dueLabel(value: string | null) {
  return value ? `${value}까지` : '마감 없음';
}

export function wordStatus(assignment: TuteeAssignment, entryId?: string) {
  const hadWrongAttempt = assignment.attempts.some(attempt =>
    attempt.responses.some(item => item.sourceEntryId === entryId && item.isRight === false)
  );
  if (hadWrongAttempt) return { value: 'wrong', label: '오답 기록' };
  if (assignment.complete) return { value: 'done', label: '완료' };
  return { value: 'new', label: '신규' };
}

export function latestPercent(assignment: TuteeAssignment) {
  return assignment.attempts[0]?.percent ?? 0;
}

export function bestPercent(assignment: TuteeAssignment) {
  return Math.max(0, ...assignment.attempts.map(attempt => attempt.percent));
}

export function responseStatus(item: TuteeAssignment['attempts'][number]['responses'][number]) {
  if (item.qType !== 'type') return { label: '오답', value: 'wrong' };
  if (item.isRight === null) return { label: '채점 대기', value: 'pending' };
  return item.isRight ? { label: '정답 처리', value: 'correct' } : { label: '오답 처리', value: 'wrong' };
}

export function searchText(value: string) {
  return value.trim().toLocaleLowerCase('ko-KR');
}
