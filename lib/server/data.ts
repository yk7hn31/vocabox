import 'server-only';
import type {
  CurrentUser,
  PendingInvite,
  SavedList,
  TuteeAssignment,
  TuteeDashboardData,
  TutorAssignment,
  TutorAttempt,
  TutorDashboardData,
  TutorTutee,
} from '@/lib/models';
import type { ResultEntry, WordItem } from '@/components/practice/types';
import { db } from './db';

interface ListRow { id: string; title: string; archived_at: Date | null }
interface EntryRow { id: string; parent_id: string; word: string; pos: string; meanings: string[] }
interface TuteeRow { id: string; username: string; display_name: string; archived_at: Date | null }
interface AssignmentRow { id: string; tutee_id: string; title: string; due_date: string | null; archived_at: Date | null; mode: string; time_limit_minutes: number | null }
interface AttemptRow {
  id: string; assignment_id: string; score: number; mcq_total: number; percent: number;
  duration_ms: number; completed_at: Date; is_late: boolean;
}
interface ResponseRow {
  attempt_id: string; assignment_entry_id: string; question_type: 'mcq' | 'type';
  user_answer: string; is_right: boolean | null; word: string; pos: string; meanings: string[];
}

function entriesFor(parentId: string, rows: EntryRow[]): WordItem[] {
  return rows.filter(row => row.parent_id === parentId).map(row => ({
    sourceEntryId: row.id,
    word: row.word,
    pos: row.pos,
    meanings: row.meanings,
  }));
}

function responsesFor(attemptId: string, rows: ResponseRow[]): ResultEntry[] {
  return rows.filter(row => row.attempt_id === attemptId).map(row => ({
    sourceEntryId: row.assignment_entry_id,
    word: row.word,
    pos: row.pos,
    qType: row.question_type,
    correct: row.meanings[0],
    allMeanings: row.meanings,
    userAnswer: row.user_answer,
    isRight: row.is_right,
  }));
}

function attemptsFor(assignmentId: string, attempts: AttemptRow[], responses: ResponseRow[]): TutorAttempt[] {
  return attempts.filter(row => row.assignment_id === assignmentId).map(row => ({
    id: row.id,
    score: row.score,
    mcqTotal: row.mcq_total,
    percent: row.percent,
    durationMs: row.duration_ms,
    completedAt: row.completed_at.toISOString(),
    late: row.is_late,
    responses: responsesFor(row.id, responses),
  }));
}

async function readAssignments(tuteeIds: string[]) {
  if (!tuteeIds.length) return { assignments: [] as AssignmentRow[], entries: [] as EntryRow[], attempts: [] as AttemptRow[], responses: [] as ResponseRow[] };
  const sql = db();
  const assignments = await sql<AssignmentRow[]>`
    select id, tutee_id, title, due_date::text, archived_at, mode, time_limit_minutes
    from assignments where tutee_id in ${sql(tuteeIds)}
    order by created_at desc
  `;
  const ids = assignments.map(item => item.id);
  if (!ids.length) return { assignments, entries: [], attempts: [], responses: [] };
  const entries = await sql<EntryRow[]>`
    select id, assignment_id as parent_id, word, pos, meanings
    from assignment_entries where assignment_id in ${sql(ids)} order by position
  `;
  const attempts = await sql<AttemptRow[]>`
    select id, assignment_id, score, mcq_total, percent, duration_ms, completed_at, is_late
    from attempts where assignment_id in ${sql(ids)} order by completed_at desc
  `;
  const attemptIds = attempts.map(item => item.id);
  const responses = attemptIds.length ? await sql<ResponseRow[]>`
    select r.attempt_id, r.assignment_entry_id, r.question_type, r.user_answer, r.is_right,
      e.word, e.pos, e.meanings
    from attempt_responses r join assignment_entries e on e.id = r.assignment_entry_id
    where r.attempt_id in ${sql(attemptIds)} order by r.created_at
  ` : [];
  return { assignments, entries, attempts, responses };
}

export async function getTutorDashboard(user: CurrentUser): Promise<TutorDashboardData> {
  const sql = db();
  const tuteeRows = await sql<TuteeRow[]>`
    select u.id, u.username, tp.display_name, tp.archived_at
    from tutee_profiles tp join users u on u.id = tp.user_id
    where tp.tutor_id = ${user.id} order by tp.created_at desc
  `;
  const listRows = await sql<ListRow[]>`
    select id, title, archived_at from vocabulary_lists
    where tutor_id = ${user.id} order by created_at desc
  `;
  const listIds = listRows.map(item => item.id);
  const listEntries = listIds.length ? await sql<EntryRow[]>`
    select id, list_id as parent_id, word, pos, meanings
    from vocabulary_entries where list_id in ${sql(listIds)} order by position
  ` : [];
  const inviteRows = await sql<{ id: string; display_name: string; expires_at: Date; revoked_at: Date | null; accepted_at: Date | null }[]>`
    select id, display_name, expires_at, revoked_at, accepted_at
    from tutee_invites where tutor_id = ${user.id} order by created_at desc limit 20
  `;
  const related = await readAssignments(tuteeRows.map(item => item.id));

  const tutees: TutorTutee[] = tuteeRows.map(row => ({
    id: row.id,
    username: row.username,
    displayName: row.display_name,
    archived: Boolean(row.archived_at),
    assignments: related.assignments.filter(item => item.tutee_id === row.id).map((assignment): TutorAssignment => ({
      id: assignment.id,
      title: assignment.title,
      dueDate: assignment.due_date,
      archived: Boolean(assignment.archived_at),
      mode: assignment.mode as 'practice' | 'test',
      timeLimitMinutes: assignment.time_limit_minutes,
      entries: entriesFor(assignment.id, related.entries),
      attempts: attemptsFor(assignment.id, related.attempts, related.responses),
    })),
  }));

  const lists: SavedList[] = listRows.map(row => ({
    id: row.id,
    title: row.title,
    archived: Boolean(row.archived_at),
    entries: entriesFor(row.id, listEntries),
  }));
  const invites: PendingInvite[] = inviteRows.map(row => ({
    id: row.id,
    displayName: row.display_name,
    expiresAt: row.expires_at.toISOString(),
    revoked: Boolean(row.revoked_at),
    accepted: Boolean(row.accepted_at),
  }));
  return { user, tutees, lists, invites };
}

export async function getTuteeDashboard(user: CurrentUser): Promise<TuteeDashboardData> {
  const sql = db();
  const tutors = await sql<{ username: string }[]>`
    select tutor.username from tutee_profiles tp join users tutor on tutor.id = tp.tutor_id
    where tp.user_id = ${user.id} limit 1
  `;
  const related = await readAssignments([user.id]);
  const assignments: TuteeAssignment[] = related.assignments.map(assignment => {
    const attempts = attemptsFor(assignment.id, related.attempts, related.responses);
    return {
      id: assignment.id,
      title: assignment.title,
      dueDate: assignment.due_date,
      archived: Boolean(assignment.archived_at),
      complete: attempts.some(attempt => attempt.percent >= 80),
      mode: assignment.mode as 'practice' | 'test',
      timeLimitMinutes: assignment.time_limit_minutes,
      entries: entriesFor(assignment.id, related.entries),
      attempts,
    };
  });
  return { user, tutorUsername: tutors[0]?.username ?? '', assignments };
}

export async function getPublicInvite(tokenHash: string) {
  const rows = await db()<{
    id: string; display_name: string; expires_at: Date; accepted_at: Date | null; revoked_at: Date | null;
  }[]>`
    select id, display_name, expires_at, accepted_at, revoked_at
    from tutee_invites where token_hash = ${tokenHash} limit 1
  `;
  const row = rows[0];
  if (!row || row.accepted_at || row.revoked_at || row.expires_at <= new Date()) return null;
  return { id: row.id, displayName: row.display_name };
}

export async function getPublicReset(tokenHash: string) {
  const rows = await db()<{
    id: string; expires_at: Date; consumed_at: Date | null; revoked_at: Date | null; display_name: string;
  }[]>`
    select r.id, r.expires_at, r.consumed_at, r.revoked_at, tp.display_name
    from passcode_resets r join tutee_profiles tp on tp.user_id = r.tutee_id
    where r.token_hash = ${tokenHash} limit 1
  `;
  const row = rows[0];
  if (!row || row.consumed_at || row.revoked_at || row.expires_at <= new Date()) return null;
  return { id: row.id, displayName: row.display_name };
}

export async function getActiveAssignment(user: CurrentUser, assignmentId: string) {
  const rows = await db()<AssignmentRow[]>`
    select a.id, a.tutee_id, a.title, a.due_date::text, a.archived_at, a.mode, a.time_limit_minutes
    from assignments a
    where a.id = ${assignmentId} and a.tutee_id = ${user.id} and a.archived_at is null
    limit 1
  `;
  const assignment = rows[0];
  if (!assignment || user.archived) return null;
  const entries = await db()<EntryRow[]>`
    select id, assignment_id as parent_id, word, pos, meanings
    from assignment_entries where assignment_id = ${assignment.id} order by position
  `;
  return {
    ...assignment,
    mode: assignment.mode as 'practice' | 'test',
    timeLimitMinutes: assignment.time_limit_minutes,
    entries: entriesFor(assignment.id, entries),
  };
}
