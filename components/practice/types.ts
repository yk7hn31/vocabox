export interface WordItem {
  sourceEntryId?: string;
  word: string;
  pos: string;
  meanings: string[];
}

export type QuestionType = 'mcq' | 'type';

export interface QuizItem extends WordItem {
  correct: string;
  opts: string[];
  qType: QuestionType;
  wordIdx: number;   // 1-based index within same-word group
  wordTotal: number; // total questions for this word
}

export interface ResultEntry {
  sourceEntryId?: string;
  word: string;
  pos: string;
  qType: QuestionType;
  correct: string;
  allMeanings: string[];
  userAnswer: string;
  isRight: boolean | null; // null = self-check (type), unscored
}
