'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, ChevronLeft, ChevronRight, RotateCcw } from '@/components/AppIcons';
import type { WordItem } from './types';

type Flashcard = WordItem & { flashcardId: string };

function cardId(entry: WordItem, index: number) {
  return entry.sourceEntryId ?? `${entry.word}-${index}`;
}

function shuffleCards(cards: Flashcard[]) {
  const result = [...cards];
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export function FlashcardApp({ title, entries }: { title: string; entries: WordItem[] }) {
  const baseCards = useMemo<Flashcard[]>(
    () => entries.map((entry, index) => ({ ...entry, flashcardId: cardId(entry, index) })),
    [entries]
  );
  const [cards, setCards] = useState(baseCards);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [knownIds, setKnownIds] = useState<Set<string>>(() => new Set());
  const current = cards[index];
  const known = current ? knownIds.has(current.flashcardId) : false;
  const progress = cards.length ? Math.round(((index + 1) / cards.length) * 100) : 0;

  useEffect(() => {
    setCards(baseCards);
    setIndex(0);
    setFlipped(false);
    setKnownIds(new Set());
  }, [baseCards]);

  const goTo = useCallback((nextIndex: number) => {
    setIndex(Math.min(Math.max(nextIndex, 0), cards.length - 1));
    setFlipped(false);
  }, [cards.length]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) return;
      if (event.key === ' ') {
        event.preventDefault();
        setFlipped(value => !value);
      }
      if (event.key === 'ArrowLeft') goTo(index - 1);
      if (event.key === 'ArrowRight') goTo(index + 1);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [goTo, index]);

  const toggleKnown = () => {
    if (!current) return;
    setKnownIds(previous => {
      const next = new Set(previous);
      if (next.has(current.flashcardId)) next.delete(current.flashcardId);
      else next.add(current.flashcardId);
      return next;
    });
  };

  const resetShuffle = () => {
    setCards(shuffleCards(baseCards));
    setIndex(0);
    setFlipped(false);
    setKnownIds(new Set());
  };

  return (
    <div className="practice-page">
      <header className="practice-header">
        <Link className="practice-dashboard-back" href="/tutee"><ChevronLeft />대시보드</Link>
        <span className="practice-context">{title}</span>
      </header>
      <div className="practice-frame">
        <main className="flashcard-shell" aria-label={`${title} 플래쉬카드`}>
          <section className="flashcard-status" aria-label="암기 진행률">
            <div>
              <strong>{index + 1}/{cards.length}</strong>
              <span>{knownIds.size}개 암기</span>
            </div>
            <i aria-hidden="true"><b style={{ width: `${progress}%` }} /></i>
          </section>

          <AnimatePresence mode="wait">
            {current && (
              <motion.button
                aria-label={flipped ? `${current.word} 뜻 숨기기` : `${current.word} 뜻 보기`}
                className={`flashcard${flipped ? ' is-flipped' : ''}${known ? ' is-known' : ''}`}
                key={current.flashcardId}
                type="button"
                onClick={() => setFlipped(value => !value)}
                initial={{ opacity: 0, y: 18, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -12, scale: 0.98 }}
                transition={{ duration: 0.22 }}
              >
                <span className="flashcard-face flashcard-front">
                  <small>{current.pos || '단어'}</small>
                  <strong>{current.word}</strong>
                  {current.meanings.length > 1 && <em>뜻 {current.meanings.length}개</em>}
                </span>
                <span className="flashcard-face flashcard-back">
                  <small>{current.word}</small>
                  <strong>{current.meanings.join(' / ')}</strong>
                </span>
              </motion.button>
            )}
          </AnimatePresence>

          <div className="flashcard-actions">
            <button type="button" onClick={() => goTo(index - 1)} disabled={index === 0} aria-label="이전 카드">
              <ChevronLeft />이전
            </button>
            <button className={known ? 'is-active' : ''} type="button" onClick={toggleKnown}>
              <Check />암기
            </button>
            <button type="button" onClick={() => goTo(index + 1)} disabled={index >= cards.length - 1} aria-label="다음 카드">
              다음<ChevronRight />
            </button>
          </div>

          <button className="flashcard-reset" type="button" onClick={resetShuffle}>
            <RotateCcw />다시 섞기
          </button>
        </main>
      </div>
    </div>
  );
}
