'use client';

import Link from 'next/link';
import { useEffect, useReducer, useRef } from 'react';
import type { ReactNode } from 'react';
import { AnimatePresence, m } from 'framer-motion';
import { Brand } from '@/components/Brand';
import { UploadScreen } from './UploadScreen';
import { QuizScreen } from './QuizScreen';
import { ResultScreen } from './ResultScreen';
import { importVocabularyCsv, prepareQuestionSet, SAMPLE_VOCABULARY } from './preparation';
import {
  INITIAL_PRACTICE_SESSION,
  reducePracticeSession,
  summariseResults,
  toQuizView,
} from './session';

interface PracticeAppProps {
  startWithSample?: boolean;
}

export function PracticeApp({ startWithSample = false }: PracticeAppProps) {
  const [session, dispatch] = useReducer(reducePracticeSession, INITIAL_PRACTICE_SESSION);
  const demoStarted = useRef(false);

  useEffect(() => {
    if (!startWithSample || demoStarted.current) return;

    demoStarted.current = true;
    const result = importVocabularyCsv(SAMPLE_VOCABULARY);
    if (result.status === 'ready') {
      dispatch({ type: 'start', questions: prepareQuestionSet(result.items) });
    }
  }, [startWithSample]);

  const content = (): ReactNode => {
    if (session.screen === 'upload') {
      return <UploadScreen onStart={questions => dispatch({ type: 'start', questions })} />;
    }

    if (session.screen === 'result') {
      return (
        <ResultScreen
          summary={summariseResults(session.history)}
          onRestart={() => dispatch({ type: 'exit' })}
        />
      );
    }

    const quiz = toQuizView(session);
    if (!quiz) return null;

    return (
      <QuizScreen
        quiz={quiz}
        onExit={() => dispatch({ type: 'exit' })}
        onSelectOption={answer => dispatch({ type: 'select-answer', answer })}
        onToggleOption={answer => dispatch({ type: 'toggle-answer', answer })}
        onType={answer => dispatch({ type: 'type-answer', answer })}
        onSubmit={() => dispatch({ type: 'submit-answer' })}
        onContinue={() => dispatch({ type: 'continue' })}
      />
    );
  };

  return (
    <div className="practice-page">
      <header className="practice-header">
        <Brand compact />
        <Link className="practice-back" href="/">서비스 소개</Link>
      </header>
      <div className="practice-frame">
        <div style={{ width: '100%', maxWidth: 460, display: 'flex', justifyContent: 'center' }}>
          <AnimatePresence mode="wait">
            <m.div
              key={session.screen}
              style={{ width: '100%', display: 'flex', justifyContent: 'center' }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -14 }}
              transition={{ duration: 0.28, ease: [0.4, 0, 0.2, 1] }}
            >
              {content()}
            </m.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
