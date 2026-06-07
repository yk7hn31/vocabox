'use server';

import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { createSession, requireUser, revokeCurrentSession, revokeUserSessions } from '@/lib/server/auth';
import { db } from '@/lib/server/db';
import {
  createToken,
  expiresAfterDays,
  hashCredential,
  hashToken,
  normalizeUsername,
  validatePasscode,
  validateTutorPassword,
  validateUsername,
  verifyCredential,
} from '@/lib/server/security';

export interface AuthState { error?: string }
export interface UsernameState { role?: 'tutor' | 'tutee'; username?: string; error?: string }

function text(formData: FormData, name: string) {
  return String(formData.get(name) ?? '').trim();
}

async function requestIp() {
  const values = await headers();
  return values.get('x-forwarded-for')?.split(',')[0]?.trim() || values.get('x-real-ip') || 'unknown';
}

async function blockedIp(ip: string) {
  const rows = await db()<{ blocked_until: Date | null }[]>`
    select blocked_until from login_throttles where ip_address = ${ip} limit 1
  `;
  return Boolean(rows[0]?.blocked_until && rows[0].blocked_until > new Date());
}

async function failLogin(ip: string) {
  await db()`
    insert into login_throttles (ip_address, failure_count, window_started_at, blocked_until, updated_at)
    values (${ip}, 1, now(), null, now())
    on conflict (ip_address) do update set
      failure_count = case
        when login_throttles.window_started_at < now() - interval '15 minutes' then 1
        else login_throttles.failure_count + 1 end,
      window_started_at = case
        when login_throttles.window_started_at < now() - interval '15 minutes' then now()
        else login_throttles.window_started_at end,
      blocked_until = case
        when login_throttles.window_started_at >= now() - interval '15 minutes'
          and login_throttles.failure_count + 1 >= 10 then now() + interval '15 minutes'
        else null end,
      updated_at = now()
  `;
}

export async function lookupUsernameAction(_: UsernameState, formData: FormData): Promise<UsernameState> {
  const ip = await requestIp();
  if (await blockedIp(ip)) return { error: '로그인 시도가 많습니다. 15분 후 다시 시도하세요.' };
  const username = normalizeUsername(text(formData, 'username'));
  if (!username) return { error: '아이디를 입력하세요.' };
  const rows = await db()<{ role: string }[]>`
    select role from users where username_normalized = ${username} limit 1
  `;
  if (!rows[0]) {
    await failLogin(ip);
    return { error: '등록된 아이디가 없습니다.' };
  }
  return { role: rows[0].role as 'tutor' | 'tutee', username };
}

export async function loginAction(_: AuthState, formData: FormData): Promise<AuthState> {
  const ip = await requestIp();
  if (await blockedIp(ip)) return { error: '로그인 시도가 많습니다. 15분 후 다시 시도하세요.' };
  const username = normalizeUsername(text(formData, 'username'));
  const secret = String(formData.get('secret') ?? '');
  const rows = await db()<{ id: string; role: 'tutor' | 'tutee'; credential_hash: string }[]>`
    select id, role, credential_hash from users where username_normalized = ${username} limit 1
  `;
  const account = rows[0];
  if (!account || !(await verifyCredential(account.credential_hash, secret))) {
    await failLogin(ip);
    return { error: '아이디 또는 비밀번호를 확인하세요.' };
  }
  await db()`delete from login_throttles where ip_address = ${ip}`;
  await createSession(account.id);
  redirect(account.role === 'tutor' ? '/tutor' : '/tutee');
}

export async function tutorRegisterAction(_: AuthState, formData: FormData): Promise<AuthState> {
  const username = text(formData, 'username');
  const password = String(formData.get('secret') ?? '');
  const issue = validateUsername(username) ?? validateTutorPassword(password);
  if (issue) return { error: issue };
  try {
    const rows = await db()<{ id: string }[]>`
      insert into users (role, username, username_normalized, credential_hash)
      values ('tutor', ${normalizeUsername(username)}, ${normalizeUsername(username)}, ${await hashCredential(password)})
      returning id
    `;
    await createSession(rows[0].id);
  } catch (error) {
    if (typeof error === 'object' && error && 'code' in error && error.code === '23505') return { error: '이미 사용 중인 아이디입니다.' };
    throw error;
  }
  redirect('/tutor');
}

export async function acceptInviteAction(_: AuthState, formData: FormData): Promise<AuthState> {
  const token = text(formData, 'token');
  const username = text(formData, 'username');
  const passcode = String(formData.get('secret') ?? '');
  const issue = validateUsername(username) ?? validatePasscode(passcode);
  if (issue) return { error: issue };
  let newUserId = '';
  try {
    await db().begin(async sql => {
      const invites = await sql<{ id: string; tutor_id: string }[]>`
        select id, tutor_id from tutee_invites
        where token_hash = ${hashToken(token)} and accepted_at is null and revoked_at is null and expires_at > now()
        for update
      `;
      const invite = invites[0];
      if (!invite) throw new Error('INVITE_INVALID');
      const users = await sql<{ id: string }[]>`
        insert into users (role, username, username_normalized, credential_hash)
        values ('tutee', ${normalizeUsername(username)}, ${normalizeUsername(username)}, ${await hashCredential(passcode)})
        returning id
      `;
      newUserId = users[0].id;
      await sql`
        insert into tutee_profiles (user_id, tutor_id, display_name)
        select ${newUserId}, tutor_id, display_name from tutee_invites where id = ${invite.id}
      `;
      await sql`update tutee_invites set accepted_at = now() where id = ${invite.id}`;
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'INVITE_INVALID') return { error: '초대 링크가 만료되었거나 이미 사용되었습니다.' };
    if (typeof error === 'object' && error && 'code' in error && error.code === '23505') return { error: '이미 사용 중인 아이디입니다.' };
    throw error;
  }
  await createSession(newUserId);
  redirect('/tutee');
}

export async function completePasscodeResetAction(_: AuthState, formData: FormData): Promise<AuthState> {
  const token = text(formData, 'token');
  const passcode = String(formData.get('secret') ?? '');
  const issue = validatePasscode(passcode);
  if (issue) return { error: issue };
  let tuteeId = '';
  await db().begin(async sql => {
    const resets = await sql<{ id: string; tutee_id: string }[]>`
      select id, tutee_id from passcode_resets
      where token_hash = ${hashToken(token)} and consumed_at is null and revoked_at is null and expires_at > now()
      for update
    `;
    const reset = resets[0];
    if (!reset) throw new Error('RESET_INVALID');
    tuteeId = reset.tutee_id;
    await sql`update users set credential_hash = ${await hashCredential(passcode)}, updated_at = now() where id = ${tuteeId}`;
    await sql`update passcode_resets set consumed_at = now() where id = ${reset.id}`;
    await sql`update sessions set revoked_at = now() where user_id = ${tuteeId} and revoked_at is null`;
  }).catch(error => {
    if (error instanceof Error && error.message === 'RESET_INVALID') return;
    throw error;
  });
  if (!tuteeId) return { error: '재설정 링크가 만료되었거나 이미 사용되었습니다.' };
  redirect('/auth?reset=done');
}

export async function logoutAction() {
  await revokeCurrentSession();
  redirect('/auth');
}

export async function changeTutorPasswordAction(_: AuthState, formData: FormData): Promise<AuthState> {
  const tutor = await requireUser('tutor');
  const current = String(formData.get('currentPassword') ?? '');
  const next = String(formData.get('newPassword') ?? '');
  const issue = validateTutorPassword(next);
  if (issue) return { error: issue };
  const rows = await db()<{ credential_hash: string }[]>`select credential_hash from users where id = ${tutor.id}`;
  if (!(await verifyCredential(rows[0].credential_hash, current))) return { error: '현재 비밀번호가 맞지 않습니다.' };
  await db()`update users set credential_hash = ${await hashCredential(next)}, updated_at = now() where id = ${tutor.id}`;
  await revokeUserSessions(tutor.id);
  revalidatePath('/tutor');
  redirect('/auth');
}

export async function changeTuteePasscodeAction(_: AuthState, formData: FormData): Promise<AuthState> {
  const tutee = await requireUser('tutee');
  const current = String(formData.get('currentPasscode') ?? '');
  const next = String(formData.get('newPasscode') ?? '');
  const issue = validatePasscode(next);
  if (issue) return { error: issue };
  const rows = await db()<{ credential_hash: string }[]>`select credential_hash from users where id = ${tutee.id}`;
  if (!(await verifyCredential(rows[0].credential_hash, current))) return { error: '현재 숫자 비밀번호가 맞지 않습니다.' };
  await db()`update users set credential_hash = ${await hashCredential(next)}, updated_at = now() where id = ${tutee.id}`;
  await revokeUserSessions(tutee.id);
  redirect('/auth');
}
