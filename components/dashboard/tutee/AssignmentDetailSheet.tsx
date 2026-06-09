'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, m } from 'framer-motion';
import type { TuteeAssignment } from '@/lib/models';
import { X } from '@/components/AppIcons';
import { AssignmentDetail } from './AssignmentDetail';

export function AssignmentDetailSheet({ assignment, open, onClose }: { assignment: TuteeAssignment; open: boolean; onClose: () => void }) {
  const [query, setQuery] = useState('');
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  useEffect(() => {
    if (open) setQuery('');
  }, [assignment.id, open]);
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
        <div className="bottom-sheet-layer" role="dialog" aria-modal="true" aria-label={`${assignment.title} 상세`}>
          <m.button
            className="bottom-sheet-backdrop"
            type="button"
            onClick={onClose}
            aria-label="닫기"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          />
          <m.section
            className="bottom-sheet assignment-detail assignment-detail--sheet"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 280, mass: 0.9 }}
          >
            <div className="bottom-sheet-grabber" aria-hidden="true" />
            <button className="assigned-sheet-close" type="button" onClick={onClose} aria-label="닫기"><X /></button>
            <div className="bottom-sheet-scroll assignment-detail-scroll">
              <AssignmentDetail assignment={assignment} query={query} />
            </div>
            <div className="assignment-detail-search">
              <input
                aria-label={`${assignment.title} 단어 검색`}
                placeholder="이 단어장에서 검색"
                type="search"
                value={query}
                onChange={event => setQuery(event.target.value)}
              />
            </div>
          </m.section>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}
