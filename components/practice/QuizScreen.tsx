'use client';

import { useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type { QuizView } from './session';
import { Icon } from './Icon';
import {
  ContinueAction,
  PosBadge,
  PrimaryAction,
  QuestionTypeBadge,
  WordSequenceBadge,
} from './PracticeUI';

interface QuizScreenProps {
  quiz: QuizView;
  onExit: () => void;
  onSelectOption: (answer: string) => void;
  onType: (answer: string) => void;
  onSubmit: () => void;
  onContinue: () => void;
}

export function QuizScreen({
  quiz,
  onExit,
  onSelectOption,
  onType,
  onSubmit,
  onContinue,
}: QuizScreenProps) {
  const {
    item,
    index,
    total,
    phase,
    selectedAnswer,
    typedAnswer,
    lives,
    maxLives,
    streak,
    isLast,
  } = quiz;
  const answered = phase === 'answered';
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (item.qType === 'type' && !answered) inputRef.current?.focus();
  }, [index, answered, item.qType]);

  const optionStyle = (option: string) => {
    if (phase === 'selected' && option === selectedAnswer) {
      return { bg: 'rgba(0,105,224,.08)', border: 'var(--elec)', color: 'var(--obs)', opacity: 1 };
    }
    if (!answered) return { bg: 'var(--card)', border: 'var(--ghostly)', color: 'var(--obs)', opacity: 1 };
    if (option === item.correct) return { bg: 'var(--mint)', border: 'var(--mint-b)', color: 'var(--obs)', opacity: 1 };
    if (option === selectedAnswer) return { bg: 'var(--coral)', border: 'var(--coral-b)', color: 'var(--obs)', opacity: 1 };
    return { bg: 'var(--card)', border: 'var(--ghostly)', color: 'var(--ash)', opacity: 0.4 };
  };

  const mcqCorrect = selectedAnswer === item.correct;

  return (
    <div style={{ width: '100%', maxWidth: 460 }}>
      <h2 className="sr-only">퀴즈 {index + 1}번째 문제</h2>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
        <button
          type="button"
          onClick={onExit}
          aria-label="학습 종료하고 준비 화면으로 돌아가기"
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px 6px', display: 'flex', alignItems: 'center' }}
        >
          <Icon name="x" size={18} color="var(--ash)" />
        </button>
        <div
          role="progressbar"
          aria-label="학습 진행률"
          aria-valuemin={0}
          aria-valuemax={total}
          aria-valuenow={index + 1}
          style={{ flex: 1, height: 8, background: 'var(--ghostly)', borderRadius: 99, overflow: 'hidden' }}
        >
          <div style={{ height: '100%', width: `${((index + 1) / total) * 100}%`, background: 'var(--elec)', borderRadius: 99, transition: 'width .5s ease' }} />
        </div>
        <div style={{
          fontFamily: "var(--font-pretendard)",
          fontSize: 14,
          fontWeight: 600,
          color: lives <= 1 ? 'var(--coral-b)' : 'var(--obs)',
          letterSpacing: '-.01em',
          minWidth: 30,
          textAlign: 'right',
          transition: 'color .3s',
        }} aria-label={`남은 기회 ${lives}개`}>
          {lives}/{maxLives}
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 11 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--ash)', fontFamily: "var(--font-pretendard)", letterSpacing: '-.01em' }}>
          {index + 1} / {total}
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <QuestionTypeBadge type={item.qType} />
          {streak >= 2 && (
            <span style={{ background: '#fffaeb', border: '1px solid #fcd34d', borderRadius: 99, padding: '2px 9px', fontSize: 13, fontWeight: 600, color: '#92400e', fontFamily: "var(--font-pretendard)", display: 'flex', alignItems: 'center', gap: 4 }}>
              <Icon name="zap" size={11} color="#92400e" sw={2} />{streak} 연속
            </span>
          )}
        </div>
      </div>

      <p style={{ color: 'var(--pine)', fontSize: 14, fontWeight: 500, letterSpacing: '-.01em', marginBottom: 11, fontFamily: "var(--font-pretendard)" }}>
        다음 단어의 뜻은?
      </p>

      <AnimatePresence mode="wait">
        <motion.div
          key={index}
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -24 }}
          transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
        >
          <div style={{ background: 'var(--card)', borderRadius: 32, padding: '30px 36px 22px', boxShadow: 'var(--shadow)', marginBottom: 14, textAlign: 'center' }}>
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8, marginBottom: item.pos ? 13 : 10 }}>
              {item.pos && <PosBadge>{item.pos}</PosBadge>}
              {item.wordTotal > 1 && <WordSequenceBadge current={item.wordIdx} total={item.wordTotal} />}
            </div>
            <div style={{ fontFamily: "var(--font-pretendard)", fontSize: 38, fontWeight: 700, color: 'var(--obs)', letterSpacing: '-.04em', lineHeight: 1.06 }}>
              {item.word}
            </div>
            {item.qType === 'type' && item.meanings.length > 1 && (
              <div style={{ marginTop: 8, fontSize: 12, color: 'var(--ash)', fontFamily: "var(--font-pretendard)" }}>
                뜻이 {item.meanings.length}개 - 어떤 뜻이든 입력
              </div>
            )}
          </div>

          {item.qType === 'mcq' && (
            <>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
                {item.opts.map((option, optionIndex) => {
                  const style = optionStyle(option);
                  return (
                    <button
                      key={`${index}${option}`}
                      type="button"
                      className="opt"
                      disabled={answered}
                      onClick={() => onSelectOption(option)}
                      style={{
                        background: style.bg,
                        borderWidth: 2,
                        borderColor: style.border,
                        borderRadius: 13,
                        padding: '13px 16px',
                        fontSize: 14,
                        fontWeight: 500,
                        letterSpacing: '-.01em',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        color: style.color,
                        opacity: style.opacity,
                        cursor: answered ? 'default' : 'pointer',
                        animation: 'slideUp .28s ease both',
                        animationDelay: `${optionIndex * 0.07}s`,
                        transition: 'background .15s, border-color .15s',
                      }}
                    >
                      <span>{option}</span>
                      {answered && option === item.correct && <Icon name="check" size={15} color="var(--mint-b)" />}
                      {answered && option === selectedAnswer && option !== item.correct && <Icon name="x" size={15} color="var(--coral-b)" />}
                      {phase === 'selected' && option === selectedAnswer && (
                        <span style={{ width: 8, height: 8, borderRadius: 99, background: 'var(--elec)' }} />
                      )}
                    </button>
                  );
                })}
              </div>

              {phase === 'selected' && (
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.16 }}
                  style={{ marginBottom: 12 }}
                >
                  <PrimaryAction onClick={onSubmit}>제출</PrimaryAction>
                </motion.div>
              )}
            </>
          )}

          {item.qType === 'type' && (
            <div style={{ marginBottom: 12 }}>
              <div style={{ position: 'relative', marginBottom: 8 }}>
                <label className="sr-only" htmlFor="typed-answer">한국어 뜻 입력</label>
                <input
                  id="typed-answer"
                  ref={inputRef}
                  value={typedAnswer}
                  disabled={answered}
                  onChange={event => onType(event.target.value)}
                  onKeyDown={event => event.key === 'Enter' && !answered && typedAnswer.trim() && onSubmit()}
                  placeholder="한국어 뜻을 입력하세요"
                  style={{
                    width: '100%',
                    background: 'var(--card)',
                    border: '2px solid var(--ghostly)',
                    borderRadius: 13,
                    padding: '14px 16px',
                    fontSize: 15,
                    fontWeight: 500,
                    color: answered ? 'var(--ash)' : 'var(--obs)',
                    fontFamily: "var(--font-pretendard)",
                    letterSpacing: '-.01em',
                    transition: 'color .2s',
                  }}
                />
              </div>
              {!answered && (
                <PrimaryAction onClick={onSubmit} disabled={!typedAnswer.trim()}>
                  확인
                </PrimaryAction>
              )}
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      <AnimatePresence>
        {answered && (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
          >
            {item.qType === 'mcq' ? (
              <div style={{
                background: mcqCorrect ? 'var(--mint)' : 'var(--coral)',
                border: `1.5px solid ${mcqCorrect ? 'var(--mint-b)' : 'var(--coral-b)'}`,
                borderRadius: 18,
                padding: '14px 17px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 12,
              }}>
                <div>
                  <p style={{ fontWeight: 700, fontSize: 14, color: mcqCorrect ? 'var(--mint-t)' : 'var(--coral-b)', fontFamily: "var(--font-pretendard)", letterSpacing: '-.01em', marginBottom: 3 }}>
                    {mcqCorrect ? '정답이에요!' : '틀렸어요'}
                  </p>
                  {(!mcqCorrect || item.meanings.length > 1) && (
                    <p style={{ fontSize: 13, color: 'var(--pine)', fontFamily: "var(--font-pretendard)", lineHeight: 1.5 }}>
                      {mcqCorrect ? '모든 뜻: ' : '정답: '}
                      <strong style={{ color: 'var(--obs)' }}>{item.meanings.join(' / ')}</strong>
                    </p>
                  )}
                </div>
                <ContinueAction isLast={isLast} onClick={onContinue} />
              </div>
            ) : (
              <div style={{
                background: 'var(--card)',
                border: '1.5px solid var(--ghostly)',
                borderRadius: 18,
                padding: '14px 17px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 12,
              }}>
                <div>
                  <p style={{ fontWeight: 600, fontSize: 13, color: 'var(--deep-violet)', fontFamily: "var(--font-pretendard)", letterSpacing: '-.01em', marginBottom: 4 }}>
                    셀프체크 - 채점 없음
                  </p>
                  <p style={{ fontSize: 13, color: 'var(--pine)', fontFamily: "var(--font-pretendard)", lineHeight: 1.5 }}>
                    정답: <strong style={{ color: 'var(--obs)' }}>{item.meanings.join(' / ')}</strong>
                  </p>
                  {typedAnswer && (
                    <p style={{ fontSize: 12, color: 'var(--ash)', fontFamily: "var(--font-pretendard)", marginTop: 2 }}>
                      내 답: {typedAnswer}
                    </p>
                  )}
                </div>
                <ContinueAction isLast={isLast} onClick={onContinue} />
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
