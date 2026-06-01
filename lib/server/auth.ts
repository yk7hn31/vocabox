import 'server-only';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import type { CurrentUser, UserRole } from '@/lib/models';
import { db } from './db';
import { createToken, expiresAfterDays, hashToken, SESSION_COOKIE, SESSION_DAYS } from './security';

interface SessionUserRow {
  id: string;
  role: UserRole;
  username: string;
  display_name: string | null;
  archived_at: Date | null;
}

export async function createSession(userId: string) {
  const token = createToken();
  const expiresAt = expiresAfterDays(SESSION_DAYS);
  await db()`insert into sessions (user_id, token_hash, expires_at) values (${userId}, ${hashToken(token)}, ${expiresAt})`;
  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    expires: expiresAt,
    path: '/',
  });
}

export async function revokeCurrentSession() {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) await db()`update sessions set revoked_at = now() where token_hash = ${hashToken(token)} and revoked_at is null`;
  jar.delete(SESSION_COOKIE);
}

export async function revokeUserSessions(userId: string) {
  await db()`update sessions set revoked_at = now() where user_id = ${userId} and revoked_at is null`;
}

export async function currentUser(): Promise<CurrentUser | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const rows = await db()<SessionUserRow[]>`
    select u.id, u.role, u.username, tp.display_name, tp.archived_at
    from sessions s
    join users u on u.id = s.user_id
    left join tutee_profiles tp on tp.user_id = u.id
    where s.token_hash = ${hashToken(token)}
      and s.revoked_at is null
      and s.expires_at > now()
    limit 1
  `;
  const row = rows[0];
  if (!row) return null;
  return {
    id: row.id,
    role: row.role,
    username: row.username,
    displayName: row.display_name ?? undefined,
    archived: Boolean(row.archived_at),
  };
}

export function dashboardPathFor(user: Pick<CurrentUser, 'role'>) {
  return user.role === 'tutor' ? '/tutor' : '/tutee';
}

export async function requireUser(role?: UserRole) {
  const user = await currentUser();
  if (!user) redirect('/auth');
  if (role && user.role !== role) redirect(dashboardPathFor(user));
  return user;
}
