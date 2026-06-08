'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import type { TuteeAssignment } from '@/lib/models';
import { ChevronDown, X } from '@/components/AppIcons';
import { dueLabel } from './utils';

export function AssignedWordsSheet({ assignments, selected, open, onClose }: { assignments: TuteeAssignment[]; selected: TuteeAssignment; open: boolean; onClose: () => void }) {
  const [expandedIds, setExpandedIds] = useState([selected.id]);
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  useEffect(() => {
    if (!open) return;
    const before = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const close = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose(); };
    window.addEventListener('keydown', close);
    return () => { document.body.style.overflow = before; window.removeEventListener('keydown', close); };
  }, [onClose, open]);
  if (!mounted) return null;
  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="bottom-sheet-layer" role="dialog" aria-modal="true" aria-label="배정된 단어">
          <motion.button
            className="bottom-sheet-backdrop"
            type="button"
            onClick={onClose}
            aria-label="닫기"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          />
          <motion.div
            className="bottom-sheet"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 280, mass: 0.9 }}
          >
            <div className="bottom-sheet-grabber" aria-hidden="true" />
            <button className="assigned-sheet-close" type="button" onClick={onClose} aria-label="닫기"><X /></button>
            <header className="assigned-sheet-header"><h2>튜터가 배정한 단어</h2><p>단어장 {assignments.length}개 · 총 {assignments.reduce((sum, item) => sum + item.entries.length, 0)}개</p></header>
            <div className="bottom-sheet-scroll assigned-sheet-scroll">
              {assignments.map(assignment => {
                const expanded = expandedIds.includes(assignment.id);
                return (
                  <section className={`assigned-sheet-group${assignment.id === selected.id ? ' is-selected' : ''}`} key={assignment.id}>
                    <button className="assigned-group-heading" type="button" onClick={() => setExpandedIds(current => expanded ? current.filter(id => id !== assignment.id) : [...current, assignment.id])}>
                      <div><h3>{assignment.title}</h3><p>{dueLabel(assignment.dueDate)}</p></div>
                      <div className="assigned-group-meta"><span>{assignment.entries.length}개</span><ChevronDown className={expanded ? 'is-expanded' : ''} /></div>
                    </button>
                    {expanded && <div className="assigned-word-grid">{assignment.entries.map(word => <div className="assigned-word-row" key={word.sourceEntryId}><div><strong>{word.word}</strong><span>{word.meanings.join(' / ')}</span></div></div>)}</div>}
                  </section>
                );
              })}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}
