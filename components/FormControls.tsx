'use client';

import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';

// ── shared portal dropdown behaviour ──────────────────────────────────────

function useDropdown(
  open: boolean,
  setOpen: (v: boolean) => void,
  triggerRef: React.RefObject<HTMLElement | null>,
  dropdownRef: React.RefObject<HTMLElement | null>,
) {
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      const t = e.target as Node;
      if (!triggerRef.current?.contains(t) && !dropdownRef.current?.contains(t)) {
        setOpen(false);
      }
    };
    document.addEventListener('click', handler, true);
    const escape = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('keydown', escape);
    return () => {
      document.removeEventListener('click', handler, true);
      document.removeEventListener('keydown', escape);
    };
  }, [open, setOpen, triggerRef, dropdownRef]);
}

// ── viewport-aware positioning ─────────────────────────────────────────────

function calcPos(trigger: DOMRect, popupW: number, popupH: number) {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const gap = 4;
  const margin = 8;

  let top = trigger.bottom + gap;
  let left = trigger.left;

  if (top + popupH > vh - margin) top = trigger.top - popupH - gap;
  if (top < margin) top = margin;
  if (left + popupW > vw - margin) left = vw - popupW - margin;
  if (left < margin) left = margin;

  return { top, left };
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
  const [pos, setPos] = useState<{ top: number; left: number; minWidth: number } | null>(null);
  const [mounted, setMounted] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLUListElement>(null);

  useEffect(() => { setMounted(true); }, []);
  useDropdown(open, setOpen, triggerRef, dropdownRef);

  const selected = options.find(o => o.value === value);

  const toggle = () => {
    if (!open && triggerRef.current) {
      const r = triggerRef.current.getBoundingClientRect();
      const dropH = Math.min(options.length * 34 + 8, 220);
      const { top, left } = calcPos(r, Math.max(r.width, 180), dropH);
      setPos({ top, left, minWidth: r.width });
    }
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
        <ChevronDown className={`app-select-chevron${open ? ' is-open' : ''}`} />
      </button>
      {mounted && createPortal(
        <AnimatePresence>
          {open && pos && (
            <motion.ul
              ref={dropdownRef}
              className="app-select-dropdown"
              role="listbox"
              style={{ top: pos.top, left: pos.left, minWidth: pos.minWidth }}
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
                    <Check strokeWidth={2.5} width={13} height={13} />
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

const CAL_W = 256;
const CAL_H = 290;

interface AppDateInputProps {
  name: string;
  defaultValue?: string;
  placeholder?: string;
}

export function AppDateInput({ name, defaultValue = '', placeholder = '날짜 선택' }: AppDateInputProps) {
  const today = new Date();
  const [value, setValue] = useState(defaultValue);
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [mounted, setMounted] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const calendarRef = useRef<HTMLDivElement>(null);

  useEffect(() => { setMounted(true); }, []);
  useDropdown(open, setOpen, triggerRef, calendarRef);

  const toggle = () => {
    if (!open && triggerRef.current) {
      const r = triggerRef.current.getBoundingClientRect();
      setPos(calcPos(r, CAL_W, CAL_H));
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
        <span>{value ? formatKorean(value) : placeholder}</span>
      </button>
      {mounted && createPortal(
        <AnimatePresence>
          {open && pos && (
            <motion.div
              ref={calendarRef}
              className="app-calendar"
              role="dialog"
              aria-label="날짜 선택"
              style={{ top: pos.top, left: pos.left }}
              initial={{ opacity: 0, y: -6, scale: .97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -4, scale: .97 }}
              transition={{ duration: .15, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="app-calendar-nav">
                <button type="button" className="app-calendar-nav-btn" onClick={prevMonth} aria-label="이전 달">
                  <ChevronLeft width={14} height={14} />
                </button>
                <span className="app-calendar-month">{year}년 {month + 1}월</span>
                <button type="button" className="app-calendar-nav-btn" onClick={nextMonth} aria-label="다음 달">
                  <ChevronRight width={14} height={14} />
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

// ── AppNumberInput ──────────────────────────────────────────────────────────

interface AppNumberInputProps {
  name: string;
  min?: number;
  max?: number;
  step?: number;
  defaultValue?: number | string;
  placeholder?: string;
  required?: boolean;
}

export function AppNumberInput({
  name,
  min,
  max,
  step = 1,
  defaultValue = '',
  placeholder,
  required,
}: AppNumberInputProps) {
  const [value, setValue] = useState(String(defaultValue));

  const numVal = value === '' ? null : Number(value);

  const clamp = (n: number) => {
    let v = n;
    if (min !== undefined) v = Math.max(min, v);
    if (max !== undefined) v = Math.min(max, v);
    return v;
  };

  const decrement = () => {
    const base = numVal ?? (min ?? 0);
    setValue(String(clamp(base - step)));
  };

  const increment = () => {
    if (numVal === null) {
      setValue(String(clamp(min ?? 0)));
    } else {
      setValue(String(clamp(numVal + step)));
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    const sign = raw.startsWith('-') && (min === undefined || min < 0) ? '-' : '';
    setValue(sign + raw.replace(/\D/g, ''));
  };

  const handleBlur = () => {
    if (value === '') return;
    const n = Number(value);
    setValue(isNaN(n) ? '' : String(clamp(n)));
  };

  const canDecrement = numVal !== null && (min === undefined || numVal > min);
  const canIncrement = numVal === null
    ? max === undefined || (min ?? 0) <= max
    : max === undefined || numVal < max;

  return (
    <div className="app-number-input">
      <input type="hidden" name={name} value={value} />
      <button type="button" className="app-number-btn" onClick={decrement} disabled={!canDecrement} aria-label="감소">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" width="14" height="14" aria-hidden="true">
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      </button>
      <input
        type="text"
        inputMode="numeric"
        className="app-number-field"
        value={value}
        placeholder={placeholder}
        required={required}
        onChange={handleChange}
        onBlur={handleBlur}
        aria-label={name}
      />
      <button type="button" className="app-number-btn" onClick={increment} disabled={!canIncrement} aria-label="증가">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" width="14" height="14" aria-hidden="true">
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      </button>
    </div>
  );
}
