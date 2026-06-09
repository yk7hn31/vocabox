'use client';

import { useActionState, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, m } from 'framer-motion';
import type { TutorDashboardData } from '@/lib/models';
import { createInviteAction, revokeInviteAction } from '@/app/actions/tutor';
import { Send, X } from '@/components/AppIcons';
import { SubmitButton } from '@/components/SubmitButton';

export function InvitePanel({ data, sharedLink }: { data: TutorDashboardData; sharedLink?: string }) {
  const [state, action, pending] = useActionState(createInviteAction, {});
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  const activeLink = state.shareLink ?? sharedLink;

  return (
    <>
      <div className="action-card">
        <div className="action-card-top">
          <div className="action-card-icon"><Send /></div>
          <div className="action-card-content">
            <h4>학습자 초대</h4>
            <p>초대 링크를 생성해 새 학습자를 추가하세요.</p>
          </div>
        </div>
        <button className="action-card-btn" type="button" onClick={() => setOpen(true)}>
          초대 링크 만들기
        </button>
      </div>

      {mounted && createPortal(
        <AnimatePresence>
          {open && (
            <div className="bottom-sheet-layer" role="dialog" aria-modal="true" aria-label="학습자 초대">
              <m.button
                className="bottom-sheet-backdrop"
                type="button"
                onClick={() => setOpen(false)}
                aria-label="닫기"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              />
              <m.div
                className="bottom-sheet"
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{ type: 'spring', damping: 30, stiffness: 280, mass: 0.9 }}
              >
                <div className="bottom-sheet-grabber" aria-hidden="true" />
                <div className="csv-editor-header">
                  <div><h3>학습자 초대</h3></div>
                  <button className="csv-editor-close" type="button" onClick={() => setOpen(false)} aria-label="닫기"><X /></button>
                </div>
                <div className="csv-editor-scroll">
                  <div className="settings-sheet-body">
                    {activeLink && (
                      <div className="share-link">
                        <strong>공유할 링크</strong>
                        <code>{activeLink}</code>
                      </div>
                    )}
                    <form action={action} className="invite-sheet-form">
                      <input className="settings-sheet-input" name="displayName" placeholder="학습자 이름" required maxLength={40} />
                      <button className="action-card-btn" disabled={pending} type="submit">
                        {pending ? '생성 중...' : '초대 링크 만들기'}
                      </button>
                      {state.error && <p className="form-error">{state.error}</p>}
                    </form>
                    {data.invites.length > 0 && (
                      <div className="invite-sheet-list">
                        <p className="invite-sheet-list-label">최근 초대</p>
                        {data.invites.slice(0, 4).map(invite => {
                          const active = !invite.accepted && !invite.revoked && new Date(invite.expiresAt) > new Date();
                          const statusLabel = invite.accepted ? '가입 완료' : invite.revoked ? '취소됨' : active ? '대기 중' : '만료됨';
                          const statusMod = invite.accepted ? 'done' : invite.revoked ? 'revoked' : active ? 'pending' : 'expired';
                          return (
                            <div key={invite.id} className="invite-sheet-item">
                              <strong>{invite.displayName}</strong>
                              <span className={`invite-status invite-status--${statusMod}`}>{statusLabel}</span>
                              {active && (
                                <form action={revokeInviteAction}>
                                  <input name="inviteId" type="hidden" value={invite.id} />
                                  <SubmitButton className="invite-revoke-btn">취소</SubmitButton>
                                </form>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </m.div>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </>
  );
}
