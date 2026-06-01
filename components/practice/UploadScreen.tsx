'use client';

import { useState, useRef } from 'react';
import type { QuizItem, WordItem } from './types';
import { Icon } from './Icon';
import { PrimaryAction } from './PracticeUI';
import { importVocabularyCsv, POS_CODE_HINTS, prepareQuestionSet, SAMPLE_VOCABULARY } from './preparation';

interface UploadScreenProps {
  onStart: (items: QuizItem[]) => void;
}

export function UploadScreen({ onStart }: UploadScreenProps) {
  const [err, setErr] = useState('');
  const [fname, setFname] = useState('');
  const [items, setItems] = useState<WordItem[] | null>(null);
  const [drag, setDrag] = useState(false);
  const ref = useRef<HTMLInputElement>(null);

  const load = (txt: string) => {
    const result = importVocabularyCsv(txt);
    if (result.status === 'error') { setErr(result.error); setItems(null); }
    else { setItems(result.items); setErr(''); }
  };

  const loadFile = (f: File | null | undefined) => {
    if (!f) return;
    setFname(f.name);
    const rd = new FileReader();
    rd.onload = (e) => load(e.target?.result as string);
    rd.readAsText(f);
  };

  return (
    <div className="setup-card" style={{ maxWidth: 460, width: '100%' }}>
      <h2 className="sr-only">VocaBox 학습 시작 화면</h2>

      <div style={{ textAlign: 'center', marginBottom: 22 }}>
        <div style={{ fontFamily: "var(--font-pretendard)", fontSize: 26, fontWeight: 700, color: 'var(--obs)', letterSpacing: '-.04em', marginBottom: 5 }}>
          나만의 단어로 시작
        </div>
        <p style={{ color: 'var(--pine)', fontSize: 14, fontFamily: "var(--font-pretendard)", letterSpacing: '-.01em' }}>
          CSV 단어장을 올리거나 샘플로 VocaBox를 체험하세요
        </p>
      </div>

      {/* Drop zone */}
      <div
        className="upload-zone"
        role="button"
        tabIndex={0}
        aria-label="CSV 단어장 파일 업로드"
        onDrop={(e) => { e.preventDefault(); setDrag(false); loadFile(e.dataTransfer.files[0]); }}
        onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        onClick={() => ref.current?.click()}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            ref.current?.click();
          }
        }}
        style={{
          background: items ? 'rgba(0,105,224,.04)' : 'var(--card)',
          border: `2px dashed ${drag || items ? 'var(--elec)' : 'var(--ghostly)'}`,
          borderRadius: 20,
          padding: '24px 20px',
          textAlign: 'center',
          cursor: 'pointer',
          marginBottom: 10,
          transition: 'border-color .2s, background .2s',
        }}
      >
        <input ref={ref} type="file" accept=".csv,.txt" style={{ display: 'none' }} onChange={(e) => loadFile(e.target.files?.[0])} />
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 9 }}>
          <Icon name={items ? 'file' : 'cup'} size={28} color={items ? 'var(--elec)' : 'var(--ash)'} sw={1.5} />
        </div>
        {items
          ? <p style={{ color: 'var(--elec)', fontSize: 14, fontWeight: 600, fontFamily: "var(--font-pretendard)", letterSpacing: '-.01em' }}>
              {fname} — {items.length}개 항목 로드됨
            </p>
          : <p style={{ color: 'var(--pine)', fontSize: 14, fontFamily: "var(--font-pretendard)", letterSpacing: '-.01em' }}>
              CSV 드래그 또는 클릭해서 업로드
            </p>
        }
        {err && (
          <p style={{ color: 'var(--coral-b)', fontSize: 13, marginTop: 6, fontFamily: "var(--font-pretendard)" }}>
            {err}
          </p>
        )}
      </div>

      {/* Format hint */}
      <div style={{ background: 'var(--ghostly)', borderRadius: 10, padding: '10px 13px', marginBottom: 13, display: 'flex', gap: 8, alignItems: 'flex-start' }}>
        <div style={{ marginTop: 1 }}><Icon name="info" size={13} color="var(--elec)" /></div>
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: 12, color: 'var(--pine)', fontFamily: "var(--font-pretendard)", lineHeight: 1.55, marginBottom: 8 }}>
            형식: <code style={{ background: 'rgba(0,0,0,.07)', borderRadius: 4, padding: '1px 5px', fontSize: 10 }}>word,pos,meanings</code>
            {' '}— 뜻이 여러 개면 세미콜론(;)으로 구분.{' '}
            <code style={{ background: 'rgba(0,0,0,.07)', borderRadius: 4, padding: '1px 5px', fontSize: 10 }}>pos</code> 컬럼은 선택사항.
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }} aria-label="품사 코드 예시">
            {POS_CODE_HINTS.map(({ code, label }) => (
              <span
                key={code}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  background: 'var(--card)',
                  border: '1px solid rgba(0,105,224,.14)',
                  borderRadius: 99,
                  color: 'var(--pine)',
                  fontFamily: "var(--font-pretendard)",
                  fontSize: 11,
                  fontWeight: 600,
                  padding: '3px 7px',
                }}
              >
                <code style={{ color: 'var(--elec)', fontSize: 10, fontWeight: 700 }}>{code}</code>
                {label}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Sample button */}
      <button
        type="button"
        onClick={() => { load(SAMPLE_VOCABULARY); setFname('vocabox-sample.csv'); }}
        style={{
          width: '100%',
          background: 'none',
          border: '1.5px solid var(--ghostly)',
          borderRadius: 12,
          padding: '11px',
          fontSize: 14,
          fontWeight: 500,
          color: 'var(--pine)',
          cursor: 'pointer',
          fontFamily: "var(--font-pretendard)",
          letterSpacing: '-.01em',
          marginBottom: 18,
          transition: 'border-color .2s, color .2s',
        }}
      >
        샘플 데이터로 시작하기
      </button>

      {/* Mode info */}
      <div style={{ background: 'var(--card)', border: '1.5px solid var(--ghostly)', borderRadius: 12, padding: '11px 14px', marginBottom: 18 }}>
        <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--elec)', fontFamily: "var(--font-pretendard)", letterSpacing: '-.01em', marginBottom: 3 }}>
          퀴즈 방식 안내
        </p>
        <p style={{ fontSize: 12, color: 'var(--pine)', fontFamily: "var(--font-pretendard)", lineHeight: 1.55 }}>
          뜻이 하나면 객관식 또는 셀프체크 중 하나가 나오고, 뜻이 여러 개면 복수선택 문제로 출제됩니다.
        </p>
      </div>

      {/* Start button */}
      <PrimaryAction
        disabled={!items}
        onClick={() => items && onStart(prepareQuestionSet(items))}
      >
        학습 시작하기
        {items && <Icon name="cr" size={15} color="var(--white)" />}
      </PrimaryAction>
    </div>
  );
}
