import type { QuizItem, ResultEntry } from './types';

export type PracticeScreen = 'upload' | 'quiz' | 'result';
export type QuestionPhase = 'answering' | 'selected' | 'answered';

export interface PracticeSession {
  screen: PracticeScreen;
  questions: QuizItem[];
  index: number;
  phase: QuestionPhase;
  selectedAnswer: string | null;
  typedAnswer: string;
  lives: number;
  streak: number;
  history: ResultEntry[];
}

export interface QuizView {
  item: QuizItem;
  index: number;
  total: number;
  phase: QuestionPhase;
  selectedAnswer: string | null;
  typedAnswer: string;
  lives: number;
  maxLives: number;
  streak: number;
  isLast: boolean;
}

export interface ResultSummary {
  history: ResultEntry[];
  mcqItems: ResultEntry[];
  wrongItems: ResultEntry[];
  score: number;
  mcqTotal: number;
  selfCheckTotal: number;
  percent: number;
  message: string;
}

export type PracticeAction =
  | { type: 'start'; questions: QuizItem[] }
  | { type: 'select-answer'; answer: string }
  | { type: 'type-answer'; answer: string }
  | { type: 'submit-answer' }
  | { type: 'continue' }
  | { type: 'exit' };

export const MAX_LIVES = 5;

export const INITIAL_PRACTICE_SESSION: PracticeSession = {
  screen: 'upload',
  questions: [],
  index: 0,
  phase: 'answering',
  selectedAnswer: null,
  typedAnswer: '',
  lives: MAX_LIVES,
  streak: 0,
  history: [],
};

function activeQuestion(session: PracticeSession): QuizItem | undefined {
  return session.questions[session.index];
}

function toAttempt(question: QuizItem, answer: string, isRight: boolean | null): ResultEntry {
  return {
    sourceEntryId: question.sourceEntryId,
    word: question.word,
    pos: question.pos,
    qType: question.qType,
    correct: question.correct,
    allMeanings: question.meanings,
    userAnswer: answer,
    isRight,
  };
}

export function reducePracticeSession(session: PracticeSession, action: PracticeAction): PracticeSession {
  const question = activeQuestion(session);

  switch (action.type) {
    case 'start':
      if (!action.questions.length) return INITIAL_PRACTICE_SESSION;
      return {
        ...INITIAL_PRACTICE_SESSION,
        screen: 'quiz',
        questions: action.questions,
      };
    case 'select-answer':
      if (!question || question.qType !== 'mcq' || session.phase === 'answered') return session;
      return { ...session, selectedAnswer: action.answer, phase: 'selected' };
    case 'type-answer':
      if (!question || question.qType !== 'type' || session.phase === 'answered') return session;
      return { ...session, typedAnswer: action.answer };
    case 'submit-answer': {
      if (!question || session.phase === 'answered') return session;

      if (question.qType === 'mcq') {
        if (session.phase !== 'selected' || !session.selectedAnswer) return session;
        const isRight = session.selectedAnswer === question.correct;
        return {
          ...session,
          phase: 'answered',
          lives: isRight ? session.lives : Math.max(0, session.lives - 1),
          streak: isRight ? session.streak + 1 : 0,
          history: [...session.history, toAttempt(question, session.selectedAnswer, isRight)],
        };
      }

      if (!session.typedAnswer.trim()) return session;
      return {
        ...session,
        phase: 'answered',
        history: [...session.history, toAttempt(question, session.typedAnswer, null)],
      };
    }
    case 'continue':
      if (session.phase !== 'answered') return session;
      if (session.index + 1 >= session.questions.length) return { ...session, screen: 'result' };
      return {
        ...session,
        index: session.index + 1,
        phase: 'answering',
        selectedAnswer: null,
        typedAnswer: '',
      };
    case 'exit':
      return INITIAL_PRACTICE_SESSION;
  }
}

export function toQuizView(session: PracticeSession): QuizView | null {
  const item = activeQuestion(session);
  if (session.screen !== 'quiz' || !item) return null;

  return {
    item,
    index: session.index,
    total: session.questions.length,
    phase: session.phase,
    selectedAnswer: session.selectedAnswer,
    typedAnswer: session.typedAnswer,
    lives: session.lives,
    maxLives: MAX_LIVES,
    streak: session.streak,
    isLast: session.index + 1 >= session.questions.length,
  };
}

export function summariseResults(history: ResultEntry[]): ResultSummary {
  const mcqItems = history.filter(entry => entry.qType === 'mcq');
  const wrongItems = mcqItems.filter(entry => entry.isRight === false);
  const score = mcqItems.filter(entry => entry.isRight === true).length;
  const mcqTotal = mcqItems.length;
  const percent = mcqTotal ? Math.round((score / mcqTotal) * 100) : 0;
  const message = percent === 100 ? '완벽해요!' : percent >= 80 ? '잘했어요' : percent >= 60 ? '좋아요' : '다시 해봐요';

  return {
    history,
    mcqItems,
    wrongItems,
    score,
    mcqTotal,
    selfCheckTotal: history.length - mcqTotal,
    percent,
    message,
  };
}
