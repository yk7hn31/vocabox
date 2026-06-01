'use client';

import { useActionState } from 'react';
import Link from 'next/link';
import { motion, MotionConfig } from 'framer-motion';
import { Brand } from '@/components/Brand';
import { Check } from '@/components/prototype/FeatherIcons';
import { OtpInput } from '@/components/OtpInput';
import {
  acceptInviteAction,
  completePasscodeResetAction,
  loginAction,
  tutorRegisterAction,
} from '@/app/actions/auth';

type AuthFlow = 'login' | 'tutor-register' | 'invite' | 'reset' | 'reset-complete';

interface AuthPrototypeProps {
  flow?: AuthFlow;
  token?: string;
  displayName?: string;
  valid?: boolean;
}

function Success({ title, body }: { title: string; body: string }) {
  return (
    <section className="auth-success">
      <span><Check /></span>
      <h2>{title}</h2>
      <p>{body}</p>
      <Link className="auth-primary" href="/auth">로그인하기</Link>
    </section>
  );
}

export function AuthPrototype({ flow = 'login', token = '', displayName, valid = true }: AuthPrototypeProps) {
  const action = flow === 'tutor-register'
    ? tutorRegisterAction
    : flow === 'invite'
      ? acceptInviteAction
      : flow === 'reset'
        ? completePasscodeResetAction
        : loginAction;
  const [state, formAction, pending] = useActionState(action, {});
  const register = flow === 'tutor-register';
  const invited = flow === 'invite';
  const reset = flow === 'reset';
  const heading = invited ? `${displayName ?? '학습자'} 계정 만들기` : reset ? '비밀번호 재설정' : register ? '튜터 회원가입' : '로그인';

  return (
    <MotionConfig reducedMotion="user">
      <div className="auth-page auth-a">
        <motion.header className="auth-header" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.28 }}>
          <Brand compact /><Link href="/">홈으로</Link>
        </motion.header>
        <main className="auth-centered">
          <div className="auth-column">
            <motion.div
              className="auth-card"
              initial={{ opacity: 0, y: 18, scale: 0.985 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            >
              {flow === 'reset-complete' ? (
                <Success title="비밀번호가 변경되었어요" body="새 비밀번호로 학습자 계정에 로그인하세요." />
              ) : (
                <>
                  {!invited && !reset && (
                    <div className="auth-tabs" aria-label="로그인 또는 튜터 회원가입">
                      <Link className={flow === 'login' ? 'is-selected' : ''} href="/auth">로그인</Link>
                      <Link className={register ? 'is-selected' : ''} href="/auth?role=tutor&mode=register">튜터 회원가입</Link>
                    </div>
                  )}
                  <h1>{heading}</h1>
                  <p className="auth-lead">
                    {invited
                      ? '튜터 초대를 수락하고 사용할 아이디와 숫자 비밀번호를 선택하세요.'
                      : reset
                        ? `${displayName ?? '학습자'}님의 새 숫자 비밀번호를 입력하세요.`
                        : register
                          ? '학습자를 코칭할 튜터 계정을 만들어보세요.'
                          : '아이디로 학습 공간에 접속하세요.'}
                  </p>
                  {!valid ? (
                    <p className="auth-error">링크가 만료되었거나 이미 사용되었습니다.</p>
                  ) : (
                    <form className="auth-form" action={formAction} style={{ marginTop: 16 }}>
                      {(invited || reset) && <input name="token" type="hidden" value={token} />}
                      {!reset && (
                        <label>
                          아이디
                          <input autoComplete="username" name="username" required placeholder="아이디" />
                        </label>
                      )}
                      <label>
                        {register ? '비밀번호' : invited || reset ? '숫자 비밀번호 (6자리)' : '비밀번호'}
                        {(invited || reset) ? (
                          <OtpInput name="secret" required />
                        ) : (
                          <input
                            autoComplete={register ? 'new-password' : 'current-password'}
                            minLength={register ? 12 : undefined}
                            name="secret"
                            placeholder={register ? '12자 이상' : '비밀번호'}
                            required
                            type="password"
                          />
                        )}
                      </label>
                      {state.error && <p className="auth-error">{state.error}</p>}
                      <button className="auth-primary" disabled={pending} type="submit">
                        {pending ? '처리 중...' : reset ? '비밀번호 변경' : invited ? '계정 만들기' : register ? '튜터 계정 만들기' : '로그인'}
                      </button>
                    </form>
                  )}
                </>
              )}
            </motion.div>
            {!invited && !reset && flow !== 'reset-complete' && (
              <div className="auth-role-switch">
                {register ? (
                  <Link href="/auth">이미 계정이 있나요? <strong>로그인하기</strong></Link>
                ) : (
                  <p>학습자 회원가입은 튜터가 공유한 초대 링크에서 시작합니다.</p>
                )}
              </div>
            )}
          </div>
        </main>
      </div>
    </MotionConfig>
  );
}
