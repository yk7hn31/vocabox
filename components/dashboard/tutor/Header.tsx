'use client';

import { m } from 'framer-motion';
import { Brand } from '@/components/Brand';
import { User } from '@/components/AppIcons';
import { logoutAction } from '@/app/actions/auth';
import { SubmitButton } from '@/components/SubmitButton';

export function Header({ username }: { username: string }) {
  return (
    <m.header className="tutor-header" initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
      <Brand compact />
      <nav aria-label="튜터 계정">
        <span className="tutor-account-pill">
          <span className="tutor-avatar"><User /></span>
          <span className="tutor-account-name">{username}</span>
        </span>
        <form action={logoutAction}><SubmitButton className="account-link" pendingText="로그아웃 중...">로그아웃</SubmitButton></form>
      </nav>
    </m.header>
  );
}
