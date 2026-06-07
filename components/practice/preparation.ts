import type { QuestionType, QuizItem, WordItem } from './types';

type RandomSource = () => number;
type PreparedEntry = { item: WordItem; wordIdx: number; wordTotal: number };

export type VocabularyImport =
  | { status: 'ready'; items: WordItem[] }
  | { status: 'error'; error: string };

const FALLBACK_DISTRACTORS = ['없다', '있다', '하다', '되다', '보다', '주다', '오다', '가다'];
const SINGLE_CHOICE_OPTION_COUNT = 4;
const MULTI_CHOICE_OPTION_COUNT = 6;

// Source of truth for the 8 main POS codes shown in the UI
const POS_CODE_ENTRIES = [
  { code: 'n',     label: '명사' },
  { code: 'adj',   label: '형용사' },
  { code: 'v',     label: '동사' },
  { code: 'adv',   label: '부사' },
  { code: 'prep',  label: '전치사' },
  { code: 'conj',  label: '접속사' },
  { code: 'pron',  label: '대명사' },
  { code: 'interj', label: '감탄사' },
] as const;

export const POS_CODE_HINTS: readonly { code: string; label: string }[] = POS_CODE_ENTRIES;

const POS_ALIASES: Record<string, string> = {
  // Derive short-code aliases from canonical list
  ...Object.fromEntries(POS_CODE_ENTRIES.map(({ code, label }) => [code, label])),
  // Extended English aliases (Korean values fall back to trimmed input via ??)
  noun: '명사',
  adjective: '형용사',
  verb: '동사',
  adverb: '부사',
  preposition: '전치사',
  conjunction: '접속사',
  pronoun: '대명사',
  interjection: '감탄사',
  det: '한정사',
  determiner: '한정사',
  art: '관사',
  article: '관사',
  aux: '조동사',
  auxiliary: '조동사',
  num: '수사',
  numeral: '수사',
  phrase: '구',
  phr: '구',
  idiom: '숙어',
};

export function normalizePartOfSpeech(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return '';

  return POS_ALIASES[trimmed.toLowerCase().replace(/\.$/, '')] ?? trimmed;
}

function shuffle<T>(items: T[], random: RandomSource): T[] {
  const result = [...items];

  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }

  return result;
}

function unique(values: string[]): string[] {
  return [...new Set(values)];
}

function parseRow(line: string): string[] {
  const columns: string[] = [];
  let cell = '';
  let quoted = false;

  for (const char of line) {
    if (char === '"') quoted = !quoted;
    else if (char === ',' && !quoted) {
      columns.push(cell.trim());
      cell = '';
    } else cell += char;
  }

  return [...columns, cell.trim()];
}

export function importVocabularyCsv(text: string): VocabularyImport {
  const rows = text.trim().split(/\r?\n/).filter(row => row.trim());
  if (rows.length < 2) return { status: 'error', error: '데이터가 부족합니다 (최소 2줄 필요)' };

  const header = parseRow(rows[0]).map(value => value.toLowerCase().replace(/"/g, '').trim());
  const wordIndex = header.indexOf('word');
  const posIndex = header.indexOf('pos');
  const meaningIndex = header.findIndex(value => value === 'meanings' || value === 'meaning');
  if (wordIndex < 0 || meaningIndex < 0) return { status: 'error', error: '"word"와 "meanings" 컬럼이 필요해요' };

  const items = rows.slice(1).flatMap(row => {
    const columns = parseRow(row);
    const word = (columns[wordIndex] || '').trim();
    const pos = posIndex >= 0 ? normalizePartOfSpeech(columns[posIndex] || '') : '';
    const rawMeanings = (columns[meaningIndex] || '').replace(/^"|"$/g, '').trim();
    const meanings = rawMeanings.split(';').map(meaning => meaning.trim()).filter(Boolean);

    return word && meanings.length ? [{ word, pos, meanings }] : [];
  });

  return items.length ? { status: 'ready', items } : { status: 'error', error: '파싱된 단어가 없습니다' };
}

export function prepareQuestionSet(items: WordItem[], random: RandomSource = Math.random): QuizItem[] {
  return prepareQuestions(items, random, false, false);
}

export function prepareAssignedQuestionSet(items: WordItem[], random: RandomSource = Math.random): QuizItem[] {
  return prepareQuestions(items, random, true, false);
}

export function prepareTestQuestionSet(items: WordItem[], random: RandomSource = Math.random): QuizItem[] {
  return prepareQuestions(items, random, true, true);
}

function prepareQuestions(items: WordItem[], random: RandomSource, assigned: boolean, testMode: boolean): QuizItem[] {
  const meaningPool = unique(items.flatMap(item => item.meanings));
  const groups = new Map<string, WordItem[]>();

  items.forEach(item => {
    const key = item.word.toLowerCase();
    const group = groups.get(key) ?? [];
    groups.set(key, [...group, item]);
  });

  const ordered: PreparedEntry[] = shuffle([...groups.values()], random).flatMap(group => {
    const shuffledGroup = shuffle(group, random);
    return shuffledGroup.map((item, index) => ({
      item,
      wordIdx: index + 1,
      wordTotal: shuffledGroup.length,
    }));
  });
  const prompted = ordered.map(entry => ({
    entry,
    qType: entry.item.meanings.length > 1
      ? 'multi' as const
      : testMode
      ? 'mcq' as const
      : (random() < 0.4 ? 'type' : 'mcq') as QuestionType,
  }));
  const shuffledPrompted = assigned ? shuffle(prompted, random) : prompted;

  return shuffledPrompted.map(({ entry, qType }) => {
    const { item, wordIdx, wordTotal } = entry;
    const correct = item.meanings[0];
    const correctAnswers = item.meanings;
    const optionCount = qType === 'multi'
      ? Math.max(MULTI_CHOICE_OPTION_COUNT, correctAnswers.length)
      : SINGLE_CHOICE_OPTION_COUNT;
    const distractors = shuffle(meaningPool.filter(meaning => !correctAnswers.includes(meaning)), random).slice(0, optionCount - correctAnswers.length);
    let fallbackIndex = 0;

    while (correctAnswers.length + distractors.length < optionCount) {
      const fallback = FALLBACK_DISTRACTORS[fallbackIndex % FALLBACK_DISTRACTORS.length];
      fallbackIndex += 1;
      if (!distractors.includes(fallback) && !correctAnswers.includes(fallback)) distractors.push(fallback);
    }

    return {
      ...item,
      correct,
      correctAnswers,
      opts: shuffle([...correctAnswers, ...distractors], random),
      qType,
      wordIdx,
      wordTotal,
    };
  });
}

export const SAMPLE_VOCABULARY = `word,pos,meanings
ubiquitous,adj,어디에나 있는
ephemeral,adj,일시적인
ambiguous,adj,모호한
eloquent,adj,웅변적인
resilient,adj,회복력 있는
run,v,달리다;운영하다;작동하다
run,n,달리기;연속
bank,n,은행;강둑
novel,adj,새로운;참신한
novel,n,소설`;
