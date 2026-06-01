'use client';

import { useRef, useState, type KeyboardEvent, type ClipboardEvent } from 'react';

interface OtpInputProps {
  name: string;
  length?: number;
  required?: boolean;
}

export function OtpInput({ name, length = 6, required }: OtpInputProps) {
  const [digits, setDigits] = useState<string[]>(Array(length).fill(''));
  const refs = useRef<Array<HTMLInputElement | null>>(Array(length).fill(null));

  const focus = (i: number) => refs.current[i]?.focus();

  const update = (i: number, raw: string) => {
    const d = raw.replace(/\D/g, '').slice(-1);
    setDigits(prev => { const n = [...prev]; n[i] = d; return n; });
    if (d && i < length - 1) focus(i + 1);
  };

  const handleKey = (i: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (digits[i]) {
        setDigits(prev => { const n = [...prev]; n[i] = ''; return n; });
      } else if (i > 0) {
        focus(i - 1);
      }
    } else if (e.key === 'ArrowLeft' && i > 0) {
      focus(i - 1);
    } else if (e.key === 'ArrowRight' && i < length - 1) {
      focus(i + 1);
    }
  };

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length);
    setDigits(prev => {
      const n = [...prev];
      for (let i = 0; i < text.length; i++) n[i] = text[i];
      return n;
    });
    focus(Math.min(text.length, length - 1));
  };

  return (
    <div className="otp-input">
      <input type="hidden" name={name} value={digits.join('')} required={required} />
      {digits.map((d, i) => (
        <input
          key={i}
          ref={el => { refs.current[i] = el; }}
          type="password"
          inputMode="numeric"
          maxLength={2}
          autoComplete="off"
          value={d}
          className={`otp-box${d ? ' has-value' : ''}`}
          aria-label={`${i + 1}번째 자리`}
          onChange={e => update(i, e.target.value)}
          onKeyDown={e => handleKey(i, e)}
          onPaste={handlePaste}
          onFocus={e => e.currentTarget.select()}
        />
      ))}
    </div>
  );
}
