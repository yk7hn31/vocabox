'use client';

import { m } from 'framer-motion';
import type { ResultSummary } from './session';
import { Icon } from './Icon';
import { PosBadge, QuestionTypeBadge, RestartAction } from './PracticeUI';

const resultItem = {
  hidden: { opacity: 0, y: 10 },
  visible: (index: number) => ({ opacity: 1, y: 0, transition: { duration: 0.2, delay: index * 0.04 } }),
};

interface ResultScreenProps {
  summary: ResultSummary;
  onRestart: () => void;
}

export function ResultScreen({ summary, onRestart }: ResultScreenProps) {
  const {
    history,
    mcqItems,
    wrongItems,
    score,
    mcqTotal,
    selfCheckTotal,
    percent,
    message,
  } = summary;

  return (
    <div style={{ maxWidth: 460, width: '100%' }}>
      <h2 className="sr-only">퀴즈 결과</h2>

      <m.div
        initial={{ opacity: 0, scale: 0.95, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.32, ease: [0.4, 0, 0.2, 1] }}
        style={{
          background: 'var(--card)',
          borderRadius: 32,
          padding: '36px 32px 28px',
          textAlign: 'center',
          boxShadow: 'var(--shadow)',
          marginBottom: 20,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 14 }}>
          <Icon name="award" size={40} color="var(--elec)" sw={1.5} />
        </div>
        <div style={{ fontFamily: "var(--font-pretendard)", fontSize: 52, fontWeight: 700, color: 'var(--obs)', letterSpacing: '-.04em', lineHeight: 1, marginBottom: 4 }}>
          {percent}<span style={{ fontSize: 22, fontWeight: 600 }}>점</span>
        </div>
        <p style={{ color: 'var(--pine)', fontSize: 16, fontWeight: 600, fontFamily: "var(--font-pretendard)", letterSpacing: '-.01em', marginBottom: 4 }}>
          {message}
        </p>
        <p style={{ color: 'var(--ash)', fontSize: 14, fontFamily: "var(--font-pretendard)", letterSpacing: '-.01em', marginBottom: 20 }}>
          채점 문항 <strong style={{ color: 'var(--obs)' }}>{score}/{mcqTotal}</strong> 정답
          {selfCheckTotal > 0 && <span style={{ color: 'var(--ash)' }}> / 셀프체크 {selfCheckTotal}개</span>}
        </p>
        <div style={{ display: 'flex', gap: 5, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 24 }}>
          {mcqItems.map((entry, index) => (
            <div
              key={index}
              style={{ width: 10, height: 10, borderRadius: 99, background: entry.isRight ? 'var(--elec)' : 'var(--coral-b)' }}
            />
          ))}
        </div>
        <RestartAction onClick={onRestart} />
      </m.div>

      {wrongItems.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--coral-b)', fontFamily: "var(--font-pretendard)", letterSpacing: '.05em', textTransform: 'uppercase', marginBottom: 8, paddingLeft: 4 }}>
            틀린 문제 ({wrongItems.length}개)
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {wrongItems.map((entry, index) => (
              <m.div
                key={index}
                custom={index}
                variants={resultItem}
                initial="hidden"
                animate="visible"
                style={{
                  background: 'var(--coral)',
                  border: '1.5px solid var(--coral-b)',
                  borderRadius: 14,
                  padding: '11px 14px',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 10,
                }}
              >
                <Icon name="x" size={14} color="var(--coral-b)" sw={2.5} />
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                    <span style={{ fontFamily: "var(--font-pretendard)", fontSize: 16, fontWeight: 700, color: 'var(--obs)', letterSpacing: '-.02em' }}>{entry.word}</span>
                    {entry.pos && <PosBadge>{entry.pos}</PosBadge>}
                  </div>
                  <p style={{ fontSize: 13, color: 'var(--pine)', fontFamily: "var(--font-pretendard)", lineHeight: 1.5 }}>
                    정답: <strong style={{ color: 'var(--obs)' }}>{entry.allMeanings.join(' / ')}</strong>
                  </p>
                  <p style={{ fontSize: 12, color: 'var(--ash)', fontFamily: "var(--font-pretendard)", marginTop: 1 }}>
                    내 답: {entry.userAnswer}
                  </p>
                </div>
              </m.div>
            ))}
          </div>
        </div>
      )}

      <div>
        <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--ash)', fontFamily: "var(--font-pretendard)", letterSpacing: '.05em', textTransform: 'uppercase', marginBottom: 8, paddingLeft: 4 }}>
          전체 풀이 내역
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {history.map((entry, index) => {
            const isScored = entry.qType !== 'type';
            const isRight = isScored && entry.isRight === true;
            const isWrong = isScored && entry.isRight === false;
            return (
              <m.div
                key={index}
                custom={index}
                variants={resultItem}
                initial="hidden"
                animate="visible"
                style={{
                  background: 'var(--card)',
                  border: `1.5px solid ${isRight ? 'var(--mint-b)' : isWrong ? 'var(--coral-b)' : 'var(--ghostly)'}`,
                  borderRadius: 14,
                  padding: '11px 14px',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 10,
                }}
              >
                <div style={{ paddingTop: 2 }}>
                  {isRight && <Icon name="check" size={14} color="var(--mint-b)" sw={2.5} />}
                  {isWrong && <Icon name="x" size={14} color="var(--coral-b)" sw={2.5} />}
                  {entry.qType === 'type' && <Icon name="pen" size={14} color="var(--deep-violet)" sw={2} />}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3, flexWrap: 'wrap' }}>
                    <span style={{ fontFamily: "var(--font-pretendard)", fontSize: 14, fontWeight: 700, color: 'var(--obs)', letterSpacing: '-.02em' }}>{entry.word}</span>
                    {entry.pos && <PosBadge>{entry.pos}</PosBadge>}
                    <QuestionTypeBadge type={entry.qType} />
                  </div>
                  <p style={{ fontSize: 13, color: 'var(--pine)', fontFamily: "var(--font-pretendard)", lineHeight: 1.5 }}>
                    정답: <strong style={{ color: 'var(--obs)' }}>{entry.allMeanings.join(' / ')}</strong>
                  </p>
                  {(isWrong || entry.qType === 'type') && entry.userAnswer && (
                    <p style={{ fontSize: 12, color: 'var(--ash)', fontFamily: "var(--font-pretendard)", marginTop: 1 }}>
                      내 답: {entry.userAnswer}
                    </p>
                  )}
                </div>
              </m.div>
            );
          })}
        </div>
      </div>

      <RestartAction onClick={onRestart} bottom />
    </div>
  );
}
