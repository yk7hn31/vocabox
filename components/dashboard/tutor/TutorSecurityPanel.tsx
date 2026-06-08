'use client';

import { useActionState, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { changeTutorPasswordAction } from '@/app/actions/auth';
import { Lock, X } from '@/components/AppIcons';
import { SubmitButton } from '@/components/SubmitButton';

export function TutorSecurityPanel() {
  const [state, action] = useActionState(changeTutorPasswordAction, {});
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  return (
    <>
      <div className="action-card">
        <div className="action-card-top">
          <div className="action-card-icon"><Lock /></div>
          <div className="action-card-content">
            <h4>비밀번호 변경</h4>
            <p>계정 보안을 위해 정기적으로 비밀번호를 변경하세요.</p>
          </div>
        </div>
        <button className="action-card-btn" type="button" onClick={() => setOpen(true)}>
          변경하기
        </button>
      </div>

      {mounted && createPortal(
        <AnimatePresence>
          {open && (
            <div className="bottom-sheet-layer" role="dialog" aria-modal="true" aria-label="비밀번호 변경">
              <motion.button
                className="bottom-sheet-backdrop"
                type="button"
                onClick={() => setOpen(false)}
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
                <div className="csv-editor-header">
                  <div><h3>비밀번호 변경</h3></div>
                  <button className="csv-editor-close" type="button" onClick={() => setOpen(false)} aria-label="닫기"><X /></button>
                </div>
                <form action={action} className="vocab-sheet-form">
                  <div className="vocab-sheet-scroll settings-sheet-body">
                    <input className="settings-sheet-input" name="currentPassword" placeholder="현재 비밀번호" type="password" required />
                    <input className="settings-sheet-input" name="newPassword" placeholder="새 비밀번호 (12자 이상)" type="password" minLength={12} required />
                    {state.error && <p className="form-error">{state.error}</p>}
                  </div>
                  <div className="csv-editor-footer">
                    <SubmitButton className="cta primary-action" pendingText="변경 중...">비밀번호 변경</SubmitButton>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </>
  );
}
