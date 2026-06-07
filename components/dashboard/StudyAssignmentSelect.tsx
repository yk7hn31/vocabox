'use client';

import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from 'react';
import type { TuteeAssignment } from '@/lib/models';
import { Check, ChevronDown } from '@/components/AppIcons';

interface StudyAssignmentSelectProps {
  assignments: TuteeAssignment[];
  selectedId: string;
  onSelect: (assignment: TuteeAssignment) => void;
}

function dueLabel(value: string | null) {
  return value ? `${value}까지` : '마감 없음';
}

function latestPercent(assignment: TuteeAssignment) {
  return assignment.attempts[0]?.percent ?? 0;
}

export function StudyAssignmentSelect({ assignments, selectedId, onSelect }: StudyAssignmentSelectProps) {
  const labelId = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const selected = useMemo(() => assignments.find(item => item.id === selectedId) ?? assignments[0], [assignments, selectedId]);
  const [open, setOpen] = useState(false);
  const [activeId, setActiveId] = useState(selected?.id ?? '');

  useEffect(() => {
    if (!open) return;
    setActiveId(selected?.id ?? assignments[0]?.id ?? '');
    requestAnimationFrame(() => listRef.current?.focus());
    const close = (event: MouseEvent) => {
      const target = event.target as Node;
      if (!triggerRef.current?.contains(target) && !listRef.current?.contains(target)) setOpen(false);
    };
    const escape = (event: KeyboardEvent) => { if (event.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', escape);
    return () => {
      document.removeEventListener('mousedown', close);
      document.removeEventListener('keydown', escape);
    };
  }, [assignments, open, selected]);

  if (!selected || assignments.length <= 1) return null;

  const activeIndex = Math.max(0, assignments.findIndex(item => item.id === activeId));
  const choose = (assignment: TuteeAssignment) => {
    onSelect(assignment);
    setOpen(false);
    triggerRef.current?.focus();
  };
  const move = (direction: 1 | -1) => {
    const next = (activeIndex + direction + assignments.length) % assignments.length;
    setActiveId(assignments[next].id);
  };
  const onTriggerKeyDown = (event: ReactKeyboardEvent<HTMLButtonElement>) => {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      setOpen(true);
      move(event.key === 'ArrowDown' ? 1 : -1);
    }
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      if (open) choose(assignments[activeIndex]);
      else setOpen(true);
    }
  };
  const onListKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      move(event.key === 'ArrowDown' ? 1 : -1);
    }
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      choose(assignments[activeIndex]);
    }
    if (event.key === 'Escape') {
      event.preventDefault();
      setOpen(false);
      triggerRef.current?.focus();
    }
  };

  return (
    <div className="study-assignment-select">
      <div className="sr-only" id={labelId}>학습할 단어장</div>
      <button
        ref={triggerRef}
        type="button"
        className="study-assignment-select-trigger"
        aria-controls={`${labelId}-listbox`}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-labelledby={labelId}
        onClick={() => setOpen(value => !value)}
        onKeyDown={onTriggerKeyDown}
      >
        <span className="study-assignment-select-value">
          <span className="study-assignment-select-title">
            <strong>{selected.title}</strong>
            <span className={`assignment-mode-badge assignment-mode-badge--${selected.mode}`}>{selected.mode === 'test' ? '시험' : '학습'}</span>
          </span>
          <small>{dueLabel(selected.dueDate)} · 최근 {latestPercent(selected)}%</small>
        </span>
        <span className="study-assignment-select-meta">
          <small>{selected.entries.length}개</small>
          <ChevronDown className={open ? 'is-open' : ''} />
        </span>
      </button>
      {open && (
        <div
          ref={listRef}
          className="study-assignment-select-content"
          id={`${labelId}-listbox`}
          role="listbox"
          tabIndex={-1}
          aria-labelledby={labelId}
          aria-activedescendant={`${labelId}-${activeId}`}
          onKeyDown={onListKeyDown}
        >
          {assignments.map(item => {
            const isSelected = item.id === selected.id;
            const isActive = item.id === activeId;
            return (
              <div
                id={`${labelId}-${item.id}`}
                className={`study-assignment-select-option${isSelected ? ' is-selected' : ''}${isActive ? ' is-active' : ''}`}
                key={item.id}
                role="option"
                aria-selected={isSelected}
                onMouseEnter={() => setActiveId(item.id)}
                onClick={() => choose(item)}
              >
                <span className="study-assignment-select-option-copy">
                  <strong>{item.title}</strong>
                  <small>{item.entries.length}개 · {dueLabel(item.dueDate)} · {latestPercent(item)}%</small>
                </span>
                <span className={`assignment-mode-badge assignment-mode-badge--${item.mode}`}>{item.mode === 'test' ? '시험' : '학습'}</span>
                {isSelected && <Check />}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
