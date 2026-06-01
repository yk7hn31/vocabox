'use client';

import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';

// ── shared portal dropdown behaviour ──────────────────────────────────────

function useDropdown(open: boolean, setOpen: (v: boolean) => void, triggerRef: React.RefObject<HTMLElement | null>) {
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (!triggerRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('click', handler, true);
    const escape = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('keydown', escape);
    return () => {
      document.removeEventListener('click', handler, true);
      document.removeEventListener('keydown', escape);
    };
  }, [open, setOpen, triggerRef]);
}

// ── AppSelect ──────────────────────────────────────────────────────────────

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface AppSelectProps {
  name: string;
  options: SelectOption[];
  placeholder?: string;
  defaultValue?: string;
  required?: boolean;
}

export function AppSelect({ name, options, placeholder = '선택', defaultValue = '', required }: AppSelectProps) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(defaultValue);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const [mounted, setMounted] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => { setMounted(true); }, []);
  useDropdown(open, setOpen, triggerRef);

  const selected = options.find(o => o.value === value);

  const toggle = () => {
    if (!open && triggerRef.current) setRect(triggerRef.current.getBoundingClientRect());
    setOpen(v => !v);
  };

  return (
    <>
      <input type="hidden" name={name} value={value} required={required} />
      <button
        ref={triggerRef}
        type="button"
        className={`app-select-trigger${!selected ? ' app-select-trigger--empty' : ''}`}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={toggle}
      >
        <span>{selected?.label ?? placeholder}</span>
        <svg className={`app-select-chevron${open ? ' is-open' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>
      {mounted && createPortal(
        <AnimatePresence>
          {open && rect && (
            <motion.ul
              className="app-select-dropdown"
              role="listbox"
              style={{ top: rect.bottom + 4, left: rect.left, minWidth: rect.width }}
              initial={{ opacity: 0, y: -6, scale: .97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -4, scale: .97 }}
              transition={{ duration: .14, ease: [0.22, 1, 0.36, 1] }}
            >
              {options.map(opt => (
                <li
                  key={opt.value}
                  role="option"
                  aria-selected={opt.value === value}
                  aria-disabled={opt.disabled}
                  className={`app-select-option${opt.value === value ? ' is-selected' : ''}${opt.disabled ? ' is-disabled' : ''}`}
                  onClick={() => { if (!opt.disabled) { setValue(opt.value); setOpen(false); } }}
                >
                  <span>{opt.label}</span>
                  {opt.value === value && (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="13" height="13" aria-hidden="true">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </li>
              ))}
            </motion.ul>
          )}
        </AnimatePresence>,
        document.body
      )}
    </>
  );
}

// ── AppDateInput ────────────────────────────────────────────────────────────

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

function toDateStr(y: number, m: number, d: number) {
  return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

function formatKorean(iso: string) {
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  return `${y}년 ${parseInt(m, 10)}월 ${parseInt(d, 10)}일`;
}

interface AppDateInputProps {
  name: string;
  defaultValue?: string;
  placeholder?: string;
}

export function AppDateInput({ name, defaultValue = '', placeholder = '날짜 선택' }: AppDateInputProps) {
  const today = new Date();
  const [value, setValue] = useState(defaultValue);
  const [open, setOpen] = useState(false);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [mounted, setMounted] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => { setMounted(true); }, []);
  useDropdown(open, setOpen, triggerRef);

  const toggle = () => {
    if (!open) {
      if (triggerRef.current) setRect(triggerRef.current.getBoundingClientRect());
      if (value) {
        const [y, m] = value.split('-').map(Number);
        setYear(y); setMonth(m - 1);
      } else {
        setYear(today.getFullYear()); setMonth(today.getMonth());
      }
    }
    setOpen(v => !v);
  };

  const prevMonth = () => { if (month === 0) { setYear(y => y - 1); setMonth(11); } else setMonth(m => m - 1); };
  const nextMonth = () => { if (month === 11) { setYear(y => y + 1); setMonth(0); } else setMonth(m => m + 1); };

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const todayStr = toDateStr(today.getFullYear(), today.getMonth(), today.getDate());

  return (
    <>
      <input type="hidden" name={name} value={value} />
      <button
        ref={triggerRef}
        type="button"
        className={`app-date-trigger${!value ? ' app-date-trigger--empty' : ''}`}
        onClick={toggle}
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        <svg className="app-date-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <rect x="3" y="4" width="18" height="18" rx="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
        <span>{value ? formatKorean(value) : placeholder}</span>
      </button>
      {mounted && createPortal(
        <AnimatePresence>
          {open && rect && (
            <motion.div
              className="app-calendar"
              role="dialog"
              aria-label="날짜 선택"
              style={{ top: rect.bottom + 4, left: rect.left }}
              initial={{ opacity: 0, y: -6, scale: .97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -4, scale: .97 }}
              transition={{ duration: .15, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="app-calendar-nav">
                <button type="button" className="app-calendar-nav-btn" onClick={prevMonth} aria-label="이전 달">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="14" height="14"><polyline points="15 18 9 12 15 6" /></svg>
                </button>
                <span className="app-calendar-month">{year}년 {month + 1}월</span>
                <button type="button" className="app-calendar-nav-btn" onClick={nextMonth} aria-label="다음 달">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="14" height="14"><polyline points="9 18 15 12 9 6" /></svg>
                </button>
              </div>
              <div className="app-calendar-weekdays">
                {WEEKDAYS.map(d => <span key={d}>{d}</span>)}
              </div>
              <div className="app-calendar-grid">
                {Array.from({ length: firstDay }, (_, i) => <span key={`pad-${i}`} aria-hidden="true" />)}
                {Array.from({ length: daysInMonth }, (_, i) => {
                  const day = i + 1;
                  const iso = toDateStr(year, month, day);
                  const sel = iso === value;
                  const isToday = iso === todayStr;
                  return (
                    <button
                      key={day}
                      type="button"
                      className={`app-calendar-day${sel ? ' is-selected' : ''}${isToday && !sel ? ' is-today' : ''}`}
                      onClick={() => { setValue(iso); setOpen(false); }}
                      aria-label={formatKorean(iso)}
                      aria-pressed={sel}
                    >
                      {day}
                    </button>
                  );
                })}
              </div>
              {value && (
                <div className="app-calendar-footer">
                  <button type="button" className="app-calendar-clear" onClick={() => { setValue(''); setOpen(false); }}>
                    날짜 지우기
                  </button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </>
  );
}
