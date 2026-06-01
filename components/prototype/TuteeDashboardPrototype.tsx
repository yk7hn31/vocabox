'use client';

import { useActionState, useEffect, useMemo, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { AnimatePresence, motion, MotionConfig } from 'framer-motion';
import { Brand } from '@/components/Brand';
import type { TuteeAssignment, TuteeDashboardData } from '@/lib/models';
import { changeTuteePasscodeAction, logoutAction } from '@/app/actions/auth';
import { ArrowRight, Award, BookOpen, CheckSquare, ChevronDown, Clipboard, Settings, User, X } from '@/components/prototype/FeatherIcons';

type LearningMode = 'assigned' | 'history';
type TuteeTab = 'study' | 'words' | 'history' | 'settings';

function dueLabel(value: string | null) {
  return value ? `${value}까지` : '마감 없음';
}

function Header({ username }: { username: string }) {
  return (
    <motion.header className="tutee-header" initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
      <Brand compact />
      <nav aria-label="학습자 계정">
        <span className="tutor-account-pill">
          <span className="tutee-avatar"><User /></span>
          <span className="tutor-account-name">@{username}</span>
        </span>
        <form action={logoutAction}><button className="prototype-account-link" type="submit">로그아웃</button></form>
      </nav>
    </motion.header>
  );
}

function wordStatus(assignment: TuteeAssignment, entryId?: string) {
  const response = assignment.attempts[0]?.responses.find(item => item.sourceEntryId === entryId && item.qType === 'mcq');
  if (response?.isRight === false) return { value: 'review', label: '복습' };
  if (assignment.complete) return { value: 'done', label: '완료' };
  return { value: 'new', label: '신규' };
}

function FocusPanel({ assignment, mode, readOnly, openWords }: { assignment: TuteeAssignment; mode: LearningMode; readOnly: boolean; openWords: () => void }) {
  const best = Math.max(0, ...assignment.attempts.map(attempt => attempt.percent));
  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.section className="tutee-focus" key={`${mode}-${assignment.id}`} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
        {mode === 'assigned' ? (
          <>
            <p className="auth-kicker">ASSIGNED WORDS</p>
            <h2>튜터가 배정한 단어</h2>
            <p className="tutee-focus-description">목록을 미리 보고, 준비되면 혼합형 퀴즈를 시작하세요.</p>
            <div className="assigned-set-heading">
              <div>
                <strong>{assignment.title}</strong>
                <span className={`assignment-mode-badge assignment-mode-badge--${assignment.mode}`}>{assignment.mode === 'test' ? '시험' : '학습'}</span>
                <span>{dueLabel(assignment.dueDate)}</span>
              </div>
              <small>{assignment.entries.length}개</small>
            </div>
            <div className="word-preview">
              {assignment.entries.slice(0, 4).map(word => {
                const status = wordStatus(assignment, word.sourceEntryId);
                return (
                  <div key={word.sourceEntryId}>
                    <strong>{word.word}</strong><span>{word.meanings.join(' / ')}</span>
                    <small className={`word-status word-status--${status.value}`}>{status.label}</small>
                  </div>
                );
              })}
            </div>
            <button className="tutee-secondary-action" type="button" onClick={openWords}><BookOpen />배정 단어 전체 보기</button>
            {!readOnly && (
              <Link
                className="tutee-start-action"
                href={`/tutee/assignments/${assignment.id}/${assignment.mode === 'test' ? 'test' : 'practice'}`}
              >
                {assignment.mode === 'test' ? '시험 시작하기' : '학습 시작하기'} <ArrowRight />
              </Link>
            )}
            {readOnly && <p className="read-only-note">보관된 계정입니다. 이전 기록만 볼 수 있습니다.</p>}
          </>
        ) : (
          <>
            <p className="auth-kicker">ATTEMPT HISTORY</p>
            <h2>{assignment.title} 결과</h2>
            <div className="session-preview">
              <article><strong>{assignment.attempts.length}</strong><span>시도</span></article>
              <article><strong>{best}%</strong><span>최고 점수</span></article>
              <article><strong>{assignment.complete ? '완료' : '진행'}</strong><span>80점 기준</span></article>
            </div>
            <div className="attempt-history">
              {assignment.attempts.map(attempt => (
                <details key={attempt.id}>
                  <summary>{new Date(attempt.completedAt).toLocaleDateString('ko-KR')} · {attempt.percent}점{attempt.late ? ' · 지각' : ''}</summary>
                  {attempt.responses.filter(item => item.isRight === false || item.qType === 'type').map((item, index) => (
                    <p key={index}>{item.qType === 'type' ? '셀프체크' : '오답'} · {item.word}: {item.userAnswer} / {item.allMeanings.join(' / ')}</p>
                  ))}
                </details>
              ))}
              {!assignment.attempts.length && <p>아직 완료한 학습이 없습니다.</p>}
            </div>
          </>
        )}
      </motion.section>
    </AnimatePresence>
  );
}

function AssignmentLibrary({ assignments, selected, onSelect }: { assignments: TuteeAssignment[]; selected: TuteeAssignment; onSelect: (value: TuteeAssignment) => void }) {
  return (
    <section className="assignment-library">
      <div className="assignment-library-title"><h2>배정된 단어장</h2><span>{assignments.length}개</span></div>
      {assignments.map(assignment => {
        const latest = assignment.attempts[0]?.percent ?? 0;
        return (
          <button className={assignment.id === selected.id ? 'is-selected' : ''} key={assignment.id} type="button" onClick={() => onSelect(assignment)}>
            <div><strong>{assignment.title}</strong><small>{dueLabel(assignment.dueDate)}</small></div>
            <span>{latest}%</span><i aria-label={`${latest}% 점수`}><b style={{ width: `${latest}%` }} /></i>
          </button>
        );
      })}
    </section>
  );
}

function AssignedWordsSheet({ assignments, selected, open, onClose }: { assignments: TuteeAssignment[]; selected: TuteeAssignment; open: boolean; onClose: () => void }) {
  const [expandedIds, setExpandedIds] = useState([selected.id]);
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  useEffect(() => {
    if (!open) return;
    const before = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const close = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose(); };
    window.addEventListener('keydown', close);
    return () => { document.body.style.overflow = before; window.removeEventListener('keydown', close); };
  }, [onClose, open]);
  if (!mounted) return null;
  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="bottom-sheet-layer" role="dialog" aria-modal="true" aria-label="배정된 단어">
          <motion.button
            className="bottom-sheet-backdrop"
            type="button"
            onClick={onClose}
            aria-label="닫기"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          />
          <motion.div
            className="bottom-sheet"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 280, mass: 0.9 }}
          >
            <div className="bottom-sheet-grabber" aria-hidden="true" />
            <button className="assigned-sheet-close" type="button" onClick={onClose} aria-label="닫기"><X /></button>
            <header className="assigned-sheet-header"><h2>튜터가 배정한 단어</h2><p>단어장 {assignments.length}개 · 총 {assignments.reduce((sum, item) => sum + item.entries.length, 0)}개</p></header>
            <div className="bottom-sheet-scroll assigned-sheet-scroll">
              {assignments.map(assignment => {
                const expanded = expandedIds.includes(assignment.id);
                return (
                  <section className={`assigned-sheet-group${assignment.id === selected.id ? ' is-selected' : ''}`} key={assignment.id}>
                    <button className="assigned-group-heading" type="button" onClick={() => setExpandedIds(current => expanded ? current.filter(id => id !== assignment.id) : [...current, assignment.id])}>
                      <div><h3>{assignment.title}</h3><p>{dueLabel(assignment.dueDate)}</p></div>
                      <div className="assigned-group-meta"><span>{assignment.entries.length}개</span><ChevronDown className={expanded ? 'is-expanded' : ''} /></div>
                    </button>
                    {expanded && <div className="assigned-word-grid">{assignment.entries.map(word => <div className="assigned-word-row" key={word.sourceEntryId}><div><strong>{word.word}</strong><span>{word.meanings.join(' / ')}</span></div></div>)}</div>}
                  </section>
                );
              })}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}

function SecurityPanel() {
  const [state, action, pending] = useActionState(changeTuteePasscodeAction, {});
  return (
    <section className="manage-card tutee-security">
      <h2>숫자 비밀번호 변경</h2>
      <form className="compact-security-form" action={action}>
        <input name="currentPasscode" inputMode="numeric" pattern="[0-9]{6}" maxLength={6} placeholder="현재 6자리" type="password" required />
        <input name="newPasscode" inputMode="numeric" pattern="[0-9]{6}" maxLength={6} placeholder="새 6자리" type="password" required />
        {state.error && <p className="form-error">{state.error}</p>}
        <button disabled={pending} type="submit">변경 후 다시 로그인</button>
      </form>
    </section>
  );
}

export function TuteeDashboardPrototype({ data }: { data: TuteeDashboardData }) {
  const assignments = data.assignments.filter(item => !item.archived);
  const [activeTab, setActiveTab] = useState<TuteeTab>('study');
  const [selectedId, setSelectedId] = useState(assignments[0]?.id ?? '');
  const [open, setOpen] = useState(false);
  const selected = useMemo(() => assignments.find(item => item.id === selectedId) ?? assignments[0], [assignments, selectedId]);
  const completed = assignments.filter(item => item.complete).length;
  const attemptCount = assignments.reduce((sum, item) => sum + item.attempts.length, 0);
  const tabs: Array<{ id: TuteeTab; label: string; count?: number; icon: ReactNode }> = [
    { id: 'study', label: '학습', count: assignments.length, icon: <Clipboard /> },
    { id: 'words', label: '단어장', count: assignments.reduce((sum, item) => sum + item.entries.length, 0), icon: <BookOpen /> },
    { id: 'history', label: '기록', count: attemptCount, icon: <CheckSquare /> },
    { id: 'settings', label: '설정', icon: <Settings /> },
  ];

  return (
    <MotionConfig reducedMotion="user">
      <div className="tutee-page">
        <Header username={data.user.username} />
        <motion.main className="tutee-main" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <section className="tutee-welcome">
            <div><p className="auth-kicker">HELLO, {data.user.displayName}</p><h1>오늘도 한 세트 해볼까요?</h1><p>@{data.tutorUsername} 튜터가 보낸 과제를 확인하세요.</p></div>
            <div className="streak-card"><strong><Award />{completed}개</strong><span>완료 과제</span><small>80점 이상 완료</small></div>
          </section>
          <div className="tutee-tabs" role="tablist" aria-label="학습자 대시보드">
            {tabs.map(tab => (
              <button
                aria-controls={`tutee-panel-${tab.id}`}
                aria-selected={activeTab === tab.id}
                className={activeTab === tab.id ? 'is-active' : ''}
                id={`tutee-tab-${tab.id}`}
                key={tab.id}
                role="tab"
                type="button"
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.icon}
                <span>{tab.label}</span>
                {tab.count !== undefined && <b>{tab.count}</b>}
              </button>
            ))}
          </div>
          <section
            aria-labelledby="tutee-tab-study"
            className="tutee-tab-panel"
            hidden={activeTab !== 'study'}
            id="tutee-panel-study"
            role="tabpanel"
          >
            {selected ? <FocusPanel assignment={selected} mode="assigned" readOnly={data.user.archived} openWords={() => setOpen(true)} /> : <section className="tutee-focus empty-detail">현재 배정된 단어장이 없습니다.</section>}
          </section>
          <section
            aria-labelledby="tutee-tab-words"
            className="tutee-tab-panel"
            hidden={activeTab !== 'words'}
            id="tutee-panel-words"
            role="tabpanel"
          >
            {selected ? <AssignmentLibrary assignments={assignments} selected={selected} onSelect={assignment => setSelectedId(assignment.id)} /> : <section className="assignment-library empty-detail">현재 배정된 단어장이 없습니다.</section>}
          </section>
          <section
            aria-labelledby="tutee-tab-history"
            className="tutee-tab-panel"
            hidden={activeTab !== 'history'}
            id="tutee-panel-history"
            role="tabpanel"
          >
            {selected ? <FocusPanel assignment={selected} mode="history" readOnly={data.user.archived} openWords={() => setOpen(true)} /> : <section className="tutee-focus empty-detail">아직 완료한 학습이 없습니다.</section>}
          </section>
          <section
            aria-labelledby="tutee-tab-settings"
            className="tutee-tab-panel"
            hidden={activeTab !== 'settings'}
            id="tutee-panel-settings"
            role="tabpanel"
          >
            <SecurityPanel />
          </section>
        </motion.main>
      </div>
      {selected && <AssignedWordsSheet assignments={assignments} selected={selected} open={open} onClose={() => setOpen(false)} />}
    </MotionConfig>
  );
}
