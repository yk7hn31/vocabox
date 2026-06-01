'use client';

import type { ButtonHTMLAttributes, ReactNode } from 'react';
import type { QuestionType } from './types';
import { Icon } from './Icon';

interface PrimaryActionProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  compact?: boolean;
  children: ReactNode;
}

export function PrimaryAction({ compact = false, children, type = 'button', ...props }: PrimaryActionProps) {
  return (
    <button
      {...props}
      type={type}
      className={`cta primary-action${compact ? ' primary-action--compact' : ''}`}
    >
      {children}
    </button>
  );
}

export function ContinueAction({ isLast, onClick }: { isLast: boolean; onClick: () => void }) {
  return (
    <PrimaryAction compact onClick={onClick}>
      {isLast ? '결과 보기' : '계속하기'}
      <Icon name="cr" size={13} color="var(--white)" />
    </PrimaryAction>
  );
}

export function RestartAction({ onClick, bottom = false }: { onClick: () => void; bottom?: boolean }) {
  return (
    <PrimaryAction onClick={onClick} style={bottom ? { marginTop: 20 } : undefined}>
      <Icon name="ccw" size={15} color="var(--white)" />
      다시 도전하기
    </PrimaryAction>
  );
}

export function QuestionTypeBadge({ type }: { type: QuestionType }) {
  return (
    <span className={`practice-badge practice-badge--${type}`}>
      {type === 'mcq' ? '객관식' : '셀프체크'}
    </span>
  );
}

export function PosBadge({ children }: { children: ReactNode }) {
  return <span className="practice-badge practice-badge--pos">{children}</span>;
}

export function WordSequenceBadge({ current, total }: { current: number; total: number }) {
  return <span className="practice-badge practice-badge--sequence">{current}/{total}</span>;
}
