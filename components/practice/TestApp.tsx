'use client';

import { useEffect, useReducer, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { Brand } from '@/components/Brand';
import { submitAttemptAction } from '@/app/actions/attempt';
import type { QuizItem } from './types';
import { QuizScreen } from './QuizScreen';
import { ResultScreen } from './ResultScreen';
import { INITIAL_PRACTICE_SESSION, reducePracticeSession, summariseResults, toQuizView } from './session';

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function TestApp({ assignmentId, title, questions, timeLimitMinutes }: {
  assignmentId: string;
  title: string;
  questions: QuizItem[];
  timeLimitMinutes: number;
}) {
  const router = useRouter();
  const [session, dispatch] = useReducer(reducePracticeSession, INITIAL_PRACTICE_SESSION);
  const [timeLeft, setTimeLeft] = useState(timeLimitMinutes * 60);
  const [timedOut, setTimedOut] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const startedAt = useRef(Date.now());
  const persisted = useRef(false);

  useEffect(() => {
    dispatch({ type: 'start', questions });
    startedAt.current = Date.now();
  }, [questions]);

  useEffect(() => {
    if (session.screen === 'result' || timedOut) return;
    const interval = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          setTimedOut(true);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [session.screen, timedOut]);

  useEffect(() => {
    if (!timedOut) return;
    const id = setTimeout(() => router.push('/tutee'), 2000);
    return () => clearTimeout(id);
  }, [timedOut, router]);

  useEffect(() => {
    if (session.screen !== 'result' || persisted.current) return;
    persisted.current = true;
    void submitAttemptAction({
      assignmentId,
      durationMs: Date.now() - startedAt.current,
      responses: session.history,
    }).then(result => setSaveMessage(result.error ?? ''));
  }, [assignmentId, session.history, session.screen]);

  const quiz = toQuizView(session);
  const urgent = timeLeft <= 60 && !timedOut;

  return (
    <div className="practice-page">
      <header className="practice-header">
        <Brand compact />
        {!timedOut && (
          <div
            className={`test-timer${urgent ? ' test-timer--urgent' : ''}`}
            aria-live="polite"
            aria-label={`남은 시간 ${formatTime(timeLeft)}`}
          >
            {formatTime(timeLeft)}
          </div>
        )}
        <Link className="practice-back" href="/tutee">{title} · 대시보드</Link>
      </header>

      {timedOut && (
        <div className="test-timeout-overlay" aria-live="assertive">
          <p>시간이 초과됐습니다</p>
        </div>
      )}

      <div className="practice-frame">
        <div style={{ width: '100%', maxWidth: 460, display: 'flex', justifyContent: 'center' }}>
          <AnimatePresence mode="wait">
            <motion.div
              key={session.screen}
              style={{ width: '100%', display: 'flex', justifyContent: 'center', flexDirection: 'column', gap: 12 }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -14 }}
              transition={{ duration: 0.28 }}
            >
              {quiz && (
                <QuizScreen
                  quiz={quiz}
                  testMode
                  onExit={() => router.push('/tutee')}
                  onSelectOption={answer => dispatch({ type: 'test-submit', answer })}
                  onType={() => {}}
                  onSubmit={() => {}}
                  onContinue={() => {}}
                />
              )}
              {session.screen === 'result' && (
                <>
                  <ResultScreen summary={summariseResults(session.history)} onRestart={() => router.push('/tutee')} />
                  {saveMessage && <p className="practice-save-message">{saveMessage}</p>}
                </>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
