'use server';

import { revalidatePath } from 'next/cache';
import type { ResultEntry } from '@/components/practice/types';
import { requireUser } from '@/lib/server/auth';
import { db } from '@/lib/server/db';

export interface AttemptSubmission {
  assignmentId: string;
  durationMs: number;
  responses: ResultEntry[];
}

function dateInKorea(date: Date) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Seoul' }).format(date);
}

function selectedMeanings(answer: string) {
  return answer.split(' / ').map(value => value.trim()).filter(Boolean);
}

function sameAnswers(left: string[], right: string[]): boolean {
  if (left.length !== right.length) return false;
  const rightSet = new Set(right);
  return left.every(answer => rightSet.has(answer));
}

function isRightResponse(response: ResultEntry, meanings: string[]) {
  if (response.qType === 'mcq') return response.userAnswer === meanings[0];
  if (response.qType === 'multi') return sameAnswers(selectedMeanings(response.userAnswer), meanings);
  return null;
}

export async function submitAttemptAction(submission: AttemptSubmission) {
  const tutee = await requireUser('tutee');
  if (tutee.archived) return { error: '보관된 계정은 새 학습을 제출할 수 없습니다.' };
  const sql = db();
  const assignments = await sql<{ id: string; due_date: string | null }[]>`
    select id, due_date::text from assignments
    where id = ${submission.assignmentId} and tutee_id = ${tutee.id} and archived_at is null
  `;
  const assignment = assignments[0];
  if (!assignment) return { error: '학습 가능한 과제가 아닙니다.' };
  const entries = await sql<{ id: string; meanings: string[] }[]>`
    select id, meanings from assignment_entries where assignment_id = ${assignment.id}
  `;
  const entryById = new Map(entries.map(entry => [entry.id, entry]));
  const scoredByEntry = new Map<string, ResultEntry>();
  const typedByEntry = new Map<string, ResultEntry>();
  for (const response of submission.responses) {
    if (!response.sourceEntryId || !entryById.has(response.sourceEntryId) || response.userAnswer.length > 500) continue;
    const entry = entryById.get(response.sourceEntryId)!;
    if (response.qType === 'mcq' && entry.meanings.length === 1) {
      if (!scoredByEntry.has(response.sourceEntryId)) scoredByEntry.set(response.sourceEntryId, response);
    } else if (response.qType === 'multi' && entry.meanings.length > 1) {
      if (!scoredByEntry.has(response.sourceEntryId)) scoredByEntry.set(response.sourceEntryId, response);
    } else if (response.qType === 'type' && !typedByEntry.has(response.sourceEntryId)) {
      typedByEntry.set(response.sourceEntryId, response);
    }
  }
  const coveredEntryIds = new Set([...typedByEntry.keys(), ...scoredByEntry.keys()]);
  if (coveredEntryIds.size !== entries.length) return { error: '완료된 응답이 부족합니다.' };
  const validResponses = [...typedByEntry.values(), ...scoredByEntry.values()];
  const scoredResponses = [...scoredByEntry.entries()];
  const score = scoredResponses.filter(([entryId, response]) => isRightResponse(response, entryById.get(entryId)!.meanings)).length;
  const scoredTotal = scoredResponses.length;
  const percent = scoredTotal ? Math.round((score / scoredTotal) * 100) : 0;
  const late = Boolean(assignment.due_date && dateInKorea(new Date()) > assignment.due_date);
  await sql.begin(async tx => {
    const attempts = await tx<{ id: string }[]>`
      insert into attempts (assignment_id, tutee_id, score, mcq_total, percent, duration_ms, completes_assignment, is_late)
      values (${assignment.id}, ${tutee.id}, ${score}, ${scoredTotal}, ${percent}, ${Math.min(86400000, Math.max(0, Math.round(submission.durationMs)))}, ${percent >= 80}, ${late})
      returning id
    `;
    for (const response of validResponses) {
      const entry = entryById.get(response.sourceEntryId!);
      const isRight = entry ? isRightResponse(response, entry.meanings) : null;
      await tx`
        insert into attempt_responses (attempt_id, assignment_entry_id, question_type, user_answer, is_right)
        values (${attempts[0].id}, ${response.sourceEntryId!}, ${response.qType}, ${response.userAnswer}, ${isRight})
      `;
    }
  });
  revalidatePath('/tutee');
  revalidatePath('/tutor');
  return { success: true, percent };
}
