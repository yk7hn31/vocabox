'use client';

import { motion } from 'framer-motion';
import { logoutAction } from '@/app/actions/auth';
import { Brand } from '@/components/Brand';
import { User } from '@/components/AppIcons';
import { SubmitButton } from '@/components/SubmitButton';

export function Header({ username }: { username: string }) {
  return (
    <motion.header className="tutee-header" initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
      <Brand compact />
      <nav aria-label="학습자 계정">
        <span className="tutor-account-pill">
          <span className="tutee-avatar"><User /></span>
          <span className="tutor-account-name">@{username}</span>
        </span>
        <form action={logoutAction}><SubmitButton className="account-link" pendingText="로그아웃 중...">로그아웃</SubmitButton></form>
      </nav>
    </motion.header>
  );
}
