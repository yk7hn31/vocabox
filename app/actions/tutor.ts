'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import type { WordItem } from '@/components/practice/types';
import { requireUser } from '@/lib/server/auth';
import { db } from '@/lib/server/db';
import { createToken, expiresAfterDays, hashToken } from '@/lib/server/security';

export interface TutorActionState { error?: string; message?: string }

function text(formData: FormData, key: string) {
  return String(formData.get(key) ?? '').trim();
}

function entriesFromForm(formData: FormData): WordItem[] | null {
  try {
    const entries = JSON.parse(text(formData, 'entries')) as WordItem[];
    if (!Array.isArray(entries) || entries.length < 1 || entries.length > 500) return null;
    const cleaned = entries.map(item => ({
      word: String(item.word ?? '').trim(),
      pos: String(item.pos ?? '').trim(),
      meanings: Array.isArray(item.meanings) ? item.meanings.map(value => String(value).trim()).filter(Boolean) : [],
    }));
    return cleaned.every(item =>
      item.word.length >= 1 &&
      item.word.length <= 120 &&
      item.pos.length <= 40 &&
      item.meanings.length >= 1 &&
      item.meanings.length <= 10 &&
      item.meanings.every(meaning => meaning.length <= 200)
    ) ? cleaned : null;
  } catch {
    return null;
  }
}

async function ownedTutee(tutorId: string, tuteeId: string) {
  const rows = await db()<{ id: string }[]>`
    select user_id as id from tutee_profiles where tutor_id = ${tutorId} and user_id = ${tuteeId} limit 1
  `;
  return Boolean(rows[0]);
}

async function activeOwnedTutee(tutorId: string, tuteeId: string) {
  const rows = await db()<{ id: string }[]>`
    select user_id as id from tutee_profiles
    where tutor_id = ${tutorId} and user_id = ${tuteeId} and archived_at is null limit 1
  `;
  return Boolean(rows[0]);
}

function dueDateFromForm(formData: FormData) {
  const value = text(formData, 'dueDate');
  if (!value) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return undefined;
  const date = new Date(`${value}T00:00:00Z`);
  return Number.isNaN(date.valueOf()) || date.toISOString().slice(0, 10) !== value ? undefined : value;
}

export async function createInviteAction(_: TutorActionState, formData: FormData): Promise<TutorActionState> {
  const tutor = await requireUser('tutor');
  const displayName = text(formData, 'displayName');
  if (!displayName || displayName.length > 40) return { error: '학습자 이름을 1-40자로 입력하세요.' };
  const token = createToken();
  await db()`
    insert into tutee_invites (tutor_id, display_name, token_hash, expires_at)
    values (${tutor.id}, ${displayName}, ${hashToken(token)}, ${expiresAfterDays(7)})
  `;
  redirect(`/tutor?share=${encodeURIComponent(`/auth?invite=${token}`)}`);
}

export async function revokeInviteAction(formData: FormData) {
  const tutor = await requireUser('tutor');
  await db()`update tutee_invites set revoked_at = now() where id = ${text(formData, 'inviteId')} and tutor_id = ${tutor.id} and accepted_at is null`;
  revalidatePath('/tutor');
}

export async function saveListAction(_: TutorActionState, formData: FormData): Promise<TutorActionState> {
  const tutor = await requireUser('tutor');
  const title = text(formData, 'title');
  const entries = entriesFromForm(formData);
  if (!title || title.length > 100) return { error: '단어장 제목은 1-100자로 입력하세요.' };
  if (!entries || entries.length < 1 || entries.length > 500) return { error: '단어는 1-500개 저장할 수 있고 각 단어/뜻 길이 제한을 지켜야 합니다.' };
  const listId = text(formData, 'listId');
  await db().begin(async sql => {
    let id = listId;
    if (id) {
      const result = await sql<{ id: string }[]>`
        update vocabulary_lists set title = ${title}, updated_at = now()
        where id = ${id} and tutor_id = ${tutor.id} returning id
      `;
      if (!result[0]) throw new Error('LIST_NOT_FOUND');
      await sql`delete from vocabulary_entries where list_id = ${id}`;
    } else {
      const created = await sql<{ id: string }[]>`
        insert into vocabulary_lists (tutor_id, title) values (${tutor.id}, ${title}) returning id
      `;
      id = created[0].id;
    }
    for (const [position, entry] of entries.entries()) {
      await sql`
        insert into vocabulary_entries (list_id, position, word, pos, meanings)
        values (${id}, ${position}, ${entry.word}, ${entry.pos}, ${entry.meanings})
      `;
    }
  }).catch(error => {
    if (error instanceof Error && error.message === 'LIST_NOT_FOUND') return;
    throw error;
  });
  revalidatePath('/tutor');
  return { message: '단어장을 저장했습니다.' };
}

export async function toggleListArchiveAction(formData: FormData) {
  const tutor = await requireUser('tutor');
  const restore = text(formData, 'restore') === '1';
  await db()`
    update vocabulary_lists set archived_at = ${restore ? null : new Date()}, updated_at = now()
    where id = ${text(formData, 'listId')} and tutor_id = ${tutor.id}
  `;
  revalidatePath('/tutor');
}

export async function deleteListAction(formData: FormData) {
  const tutor = await requireUser('tutor');
  await db()`delete from vocabulary_lists where id = ${text(formData, 'listId')} and tutor_id = ${tutor.id}`;
  revalidatePath('/tutor');
}

export async function createAssignmentAction(_: TutorActionState, formData: FormData): Promise<TutorActionState> {
  const tutor = await requireUser('tutor');
  const tuteeId = text(formData, 'tuteeId');
  const listId = text(formData, 'listId');
  const dueDate = dueDateFromForm(formData);
  if (dueDate === undefined) return { error: '올바른 마감 날짜를 입력하세요.' };
  if (!(await activeOwnedTutee(tutor.id, tuteeId))) return { error: '활성 학습자를 선택하세요.' };
  const result = await db().begin(async sql => {
    const lists = await sql<{ id: string; title: string }[]>`
      select id, title from vocabulary_lists
      where id = ${listId} and tutor_id = ${tutor.id} and archived_at is null
    `;
    const list = lists[0];
    if (!list) return false;
    const created = await sql<{ id: string }[]>`
      insert into assignments (tutor_id, tutee_id, source_list_id, title, due_date)
      values (${tutor.id}, ${tuteeId}, ${list.id}, ${list.title}, ${dueDate}) returning id
    `;
    await sql`
      insert into assignment_entries (assignment_id, position, word, pos, meanings)
      select ${created[0].id}, position, word, pos, meanings from vocabulary_entries
      where list_id = ${list.id} order by position
    `;
    return true;
  });
  if (!result) return { error: '활성 단어장을 선택하세요.' };
  revalidatePath('/tutor');
  revalidatePath('/tutee');
  return { message: '새 과제를 배정했습니다.' };
}

export async function updateAssignmentDueDateAction(formData: FormData) {
  const tutor = await requireUser('tutor');
  const dueDate = dueDateFromForm(formData);
  if (dueDate === undefined) return;
  await db()`
    update assignments set due_date = ${dueDate}
    where id = ${text(formData, 'assignmentId')} and tutor_id = ${tutor.id}
  `;
  revalidatePath('/tutor');
  revalidatePath('/tutee');
}

export async function toggleAssignmentArchiveAction(formData: FormData) {
  const tutor = await requireUser('tutor');
  await db()`
    update assignments set archived_at = ${text(formData, 'restore') === '1' ? null : new Date()}
    where id = ${text(formData, 'assignmentId')} and tutor_id = ${tutor.id}
  `;
  revalidatePath('/tutor');
  revalidatePath('/tutee');
}

export async function deleteAssignmentAction(formData: FormData) {
  const tutor = await requireUser('tutor');
  await db()`delete from assignments where id = ${text(formData, 'assignmentId')} and tutor_id = ${tutor.id}`;
  revalidatePath('/tutor');
  revalidatePath('/tutee');
}

export async function toggleTuteeArchiveAction(formData: FormData) {
  const tutor = await requireUser('tutor');
  const tuteeId = text(formData, 'tuteeId');
  await db()`
    update tutee_profiles set archived_at = ${text(formData, 'restore') === '1' ? null : new Date()}
    where user_id = ${tuteeId} and tutor_id = ${tutor.id}
  `;
  revalidatePath('/tutor');
  revalidatePath('/tutee');
}

export async function deleteTuteeAction(formData: FormData) {
  const tutor = await requireUser('tutor');
  const tuteeId = text(formData, 'tuteeId');
  if (!(await ownedTutee(tutor.id, tuteeId))) return;
  await db()`delete from users where id = ${tuteeId} and role = 'tutee'`;
  revalidatePath('/tutor');
}

export async function createPasscodeResetAction(formData: FormData) {
  const tutor = await requireUser('tutor');
  const tuteeId = text(formData, 'tuteeId');
  if (!(await ownedTutee(tutor.id, tuteeId))) return;
  const token = createToken();
  await db().begin(async sql => {
    await sql`update passcode_resets set revoked_at = now() where tutee_id = ${tuteeId} and consumed_at is null and revoked_at is null`;
    await sql`
      insert into passcode_resets (tutee_id, tutor_id, token_hash, expires_at)
      values (${tuteeId}, ${tutor.id}, ${hashToken(token)}, ${expiresAfterDays(1)})
    `;
  });
  redirect(`/tutor?share=${encodeURIComponent(`/auth?reset=${token}`)}`);
}
