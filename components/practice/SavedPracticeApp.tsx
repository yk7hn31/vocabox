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

export function SavedPracticeApp({ assignmentId, title, questions }: { assignmentId: string; title: string; questions: QuizItem[] }) {
  const router = useRouter();
  const [session, dispatch] = useReducer(reducePracticeSession, INITIAL_PRACTICE_SESSION);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const startedAt = useRef(Date.now());
  const persisted = useRef(false);

  useEffect(() => {
    dispatch({ type: 'start', questions });
    startedAt.current = Date.now();
  }, [questions]);

  useEffect(() => {
    if (session.screen !== 'result' || persisted.current) return;
    persisted.current = true;
    setSaving(true);
    void submitAttemptAction({
      assignmentId,
      durationMs: Date.now() - startedAt.current,
      responses: session.history,
    }).then(result => { setSaving(false); setSaveMessage(result.error ?? '학습 결과를 저장했습니다.'); });
  }, [assignmentId, session.history, session.screen]);

  const quiz = toQuizView(session);

  return (
    <div className="practice-page">
      <header className="practice-header">
        <Brand compact />
        <Link className="practice-back" href="/tutee">{title} · 대시보드</Link>
      </header>
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
                  onExit={() => router.push('/tutee')}
                  onSelectOption={answer => dispatch({ type: 'select-answer', answer })}
                  onType={answer => dispatch({ type: 'type-answer', answer })}
                  onSubmit={() => dispatch({ type: 'submit-answer' })}
                  onContinue={() => dispatch({ type: 'continue' })}
                />
              )}
              {session.screen === 'result' && (
                <>
                  <ResultScreen summary={summariseResults(session.history)} onRestart={() => {
                    persisted.current = false;
                    startedAt.current = Date.now();
                    setSaveMessage('');
                    dispatch({ type: 'start', questions });
                  }} />
                  {saving && <p className="practice-save-message">결과 저장 중...</p>}
                  {!saving && saveMessage && <p className="practice-save-message">{saveMessage}</p>}
                </>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
