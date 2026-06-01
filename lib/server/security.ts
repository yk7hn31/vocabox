import 'server-only';
import { createHash, randomBytes } from 'node:crypto';
import argon2 from 'argon2';

export const SESSION_COOKIE = 'vocabox_session';
export const SESSION_DAYS = 30;

export function normalizeUsername(username: string): string {
  return username.trim().toLowerCase();
}

export function validateUsername(username: string): string | null {
  const value = normalizeUsername(username);
  if (!/^[a-z0-9][a-z0-9._-]{2,29}$/.test(value)) {
    return '아이디는 영문 소문자, 숫자, ., _, - 조합 3-30자로 입력하세요.';
  }
  return null;
}

export function validateTutorPassword(password: string): string | null {
  return password.length >= 12 ? null : '튜터 비밀번호는 12자 이상이어야 합니다.';
}

export function validatePasscode(passcode: string): string | null {
  return /^\d{6}$/.test(passcode) ? null : '학습자 비밀번호는 숫자 6자리여야 합니다.';
}

export async function hashCredential(secret: string) {
  return argon2.hash(secret, { type: argon2.argon2id });
}

export async function verifyCredential(hash: string, secret: string) {
  try {
    return await argon2.verify(hash, secret);
  } catch {
    return false;
  }
}

export function createToken() {
  return randomBytes(32).toString('base64url');
}

export function hashToken(token: string) {
  const pepper = process.env.SESSION_HASH_SECRET;
  if (!pepper || pepper.length < 32) throw new Error('SESSION_HASH_SECRET must be at least 32 characters.');
  return createHash('sha256').update(`${pepper}:${token}`).digest('hex');
}

export function expiresAfterDays(days: number) {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
}
