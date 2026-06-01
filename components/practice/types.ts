export interface WordItem {
  sourceEntryId?: string;
  word: string;
  pos: string;
  meanings: string[];
}

export type QuestionType = 'mcq' | 'multi' | 'type';

export interface QuizItem extends WordItem {
  correct: string;
  correctAnswers: string[];
  opts: string[];
  qType: QuestionType;
  wordIdx: number;   // 1-based entry index within same-word group
  wordTotal: number; // total entries for this word
}

export interface ResultEntry {
  responseId?: string;
  sourceEntryId?: string;
  word: string;
  pos: string;
  qType: QuestionType;
  correct: string;
  correctAnswers: string[];
  allMeanings: string[];
  userAnswer: string;
  isRight: boolean | null; // null = self-check (type), unscored
}
