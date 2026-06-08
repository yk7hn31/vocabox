'use client';

import { useActionState, useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type { SavedList, TutorAssignment, TutorTutee } from '@/lib/models';
import type { ResultEntry } from '@/components/practice/types';
import {
  createAssignmentAction,
  createPasscodeResetAction,
  deleteAssignmentAction,
  deleteTuteeAction,
  reviewSelfCheckResponseAction,
  toggleAssignmentArchiveAction,
  toggleTuteeArchiveAction,
  updateAssignmentDueDateAction,
} from '@/app/actions/tutor';
import { AppCheckbox } from '@/components/AppCheckbox';
import { Archive, Check, CheckCircle, ChevronRight, Clock, Plus, RefreshCw, Trash2, X } from '@/components/AppIcons';
import { AppDateInput, AppNumberInput } from '@/components/FormControls';
import { SubmitButton } from '@/components/SubmitButton';
import { StatusBadge } from './StatusBadge';
import { latestAttempt, statusOf } from './status';
import type { SheetTab } from './types';
import { Trend } from './Trend';

function ReviewResponseLine({ response }: { response: ResultEntry }) {
  const isSelfCheck = response.qType === 'type';
  const statusLabel = response.isRight === null ? '채점 대기' : response.isRight ? '정답 처리됨' : '오답 처리됨';

  return (
    <div className="response-line">
      <div className="response-line-top">
        <span className={`response-line-badge ${isSelfCheck ? 'response-line-badge--selfcheck' : 'response-line-badge--wrong'}`}>
          {isSelfCheck ? '셀프체크' : '오답'}
        </span>
        {isSelfCheck && (
          <span className={`response-line-status ${response.isRight === true ? 'response-line-status--correct' : response.isRight === false ? 'response-line-status--wrong' : ''}`}>
            {statusLabel}
          </span>
        )}
      </div>
      <p className="response-line-word">{response.word}</p>
      <div className="response-line-answers">
        <div className="response-line-row">
          <span className="response-line-label">학생 답변</span>
          <span className="response-line-value">{response.userAnswer}</span>
        </div>
        <div className="response-line-row">
          <span className="response-line-label">정답</span>
          <span className="response-line-value response-line-value--correct">{response.allMeanings.join(', ')}</span>
        </div>
      </div>
      {isSelfCheck && response.responseId && (
        <div className="response-line-review">
          <form action={reviewSelfCheckResponseAction}>
            <input name="responseId" type="hidden" value={response.responseId} />
            <input name="isRight" type="hidden" value="1" />
            <SubmitButton className={`response-review-btn${response.isRight === true ? ' is-active' : ''}`}>
              {response.isRight === true ? <><Check />정답 유지</> : '정답'}
            </SubmitButton>
          </form>
          <form action={reviewSelfCheckResponseAction}>
            <input name="responseId" type="hidden" value={response.responseId} />
            <input name="isRight" type="hidden" value="0" />
            <SubmitButton className={`response-review-btn response-review-btn--wrong${response.isRight === false ? ' is-active' : ''}`}>
              {response.isRight === false ? <><Check />오답 유지</> : '오답'}
            </SubmitButton>
          </form>
        </div>
      )}
    </div>
  );
}

type AssignmentSheetTab = 'results' | 'due' | 'manage';

function scoreLevel(percent: number) {
  if (percent >= 80) return 'high';
  if (percent >= 50) return 'mid';
  return 'low';
}

function AssignmentRecord({ assignment, onOpen }: { assignment: TutorAssignment; onOpen: () => void }) {
  const best = Math.max(0, ...assignment.attempts.map(item => item.percent));
  const latest = assignment.attempts[0];
  return (
    <button className="assignment-record" type="button" onClick={onOpen} aria-haspopup="dialog">
      <div className="assignment-record-header">
        <div>
          <p className="assignment-record-title">
            <strong>{assignment.title}{assignment.archived ? ' · 보관됨' : ''}</strong>
            <span className={`assignment-mode-badge assignment-mode-badge--${assignment.mode}`}>{assignment.mode === 'test' ? '시험' : '학습'}</span>
          </p>
          <span className="assignment-record-meta">최근 {latest?.percent ?? '-'}% · 최고 {best}% · {best >= 80 ? '완료' : '진행 중'} · 시도 {assignment.attempts.length}회</span>
        </div>
      </div>
      <span className="assignment-record-foot">
        {assignment.dueDate ? `마감 ${new Date(assignment.dueDate).toLocaleDateString('ko-KR')}` : '마감일 없음'}
      </span>
    </button>
  );
}

function AssignmentManagementSheet({
  activeTab,
  assignment,
  onClose,
  onTabChange,
  onOpenAttempt,
}: {
  activeTab: AssignmentSheetTab;
  assignment: TutorAssignment;
  onClose: () => void;
  onTabChange: (tab: AssignmentSheetTab) => void;
  onOpenAttempt: (attemptId: string) => void;
}) {
  const best = Math.max(0, ...assignment.attempts.map(item => item.percent));
  const latest = assignment.attempts[0];
  const tabs: Array<{ id: AssignmentSheetTab; label: string }> = [
    { id: 'results', label: '결과' },
    { id: 'due', label: '마감일' },
    { id: 'manage', label: '관리' },
  ];

  return (
    <div className="assignment-create-layer assignment-manage-layer" role="dialog" aria-modal="true" aria-label={`${assignment.title} 과제 설정`}>
      <motion.button
        className="assignment-create-backdrop"
        type="button"
        onClick={onClose}
        aria-label="과제 설정 닫기"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.16 }}
      />
      <motion.div
        className="bottom-sheet bottom-sheet--wide assignment-create-sheet assignment-manage-sheet"
        initial={{ y: '100%', opacity: 0.92 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: '100%', opacity: 0.92 }}
        transition={{ type: 'spring', damping: 30, stiffness: 300, mass: 0.8 }}
      >
        <div className="bottom-sheet-grabber" aria-hidden="true" />
        <div className="tutee-sheet-header assignment-create-header">
          <div className="tutee-sheet-identity">
            <p className="tutee-sheet-username">
              {assignment.mode === 'test' ? '시험 과제' : '학습 과제'} · 최고 {best}% · 최근 {latest?.percent ?? '-'}%
            </p>
            <h2 className="tutee-sheet-name">{assignment.title}</h2>
          </div>
          <button type="button" className="assignment-create-close" onClick={onClose} aria-label="닫기"><X /></button>
        </div>

        <div className="tutee-sheet-tabs assignment-sheet-tabs" role="tablist" aria-label="과제 설정 탭">
          {tabs.map(tab => (
            <button
              key={tab.id}
              role="tab"
              type="button"
              aria-selected={activeTab === tab.id}
              className={activeTab === tab.id ? 'is-active' : ''}
              onClick={() => onTabChange(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="bottom-sheet-scroll assignment-manage-scroll">
          {activeTab === 'results' && (
            <section className="assignment-sheet-panel">
              {assignment.attempts.map(attempt => (
                <div className="attempt-card" key={attempt.id}>
                  <div className="attempt-card-header">
                    <div className="attempt-card-meta">
                      <span className="attempt-card-date">
                        {new Date(attempt.completedAt).toLocaleDateString('ko-KR')}
                      </span>
                      <div className="attempt-card-stats">
                        <span>{attempt.score}/{attempt.mcqTotal}문제</span>
                        <span>{Math.max(1, Math.round(attempt.durationMs / 60000))}분 소요</span>
                        {attempt.late && <span style={{ color: 'var(--coral-b)' }}>지각</span>}
                      </div>
                    </div>
                    <div className="attempt-card-right">
                      <span className={`attempt-score attempt-score--${scoreLevel(attempt.percent)}`}>
                        {attempt.percent}%
                      </span>
                      <button
                        className="attempt-detail-btn"
                        type="button"
                        onClick={() => onOpenAttempt(attempt.id)}
                      >
                        상세 보기<ChevronRight />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              {!assignment.attempts.length && <p className="empty-detail">아직 제출된 결과가 없습니다.</p>}
            </section>
          )}

          {activeTab === 'due' && (
            <section className="assignment-sheet-panel">
              <div className="due-date-card">
                <div className="due-date-card-header">
                  <div className="due-date-card-icon"><Clock /></div>
                  <div>
                    <h4>마감일 설정</h4>
                    <span className="due-date-card-status">
                      {assignment.dueDate
                        ? `현재 마감일: ${new Date(assignment.dueDate).toLocaleDateString('ko-KR')}`
                        : '마감일이 설정되지 않았습니다'}
                    </span>
                  </div>
                </div>
                <form className="assignment-due-form" action={updateAssignmentDueDateAction} style={{ gridTemplateColumns: '1fr' }}>
                  <input name="assignmentId" type="hidden" value={assignment.id} />
                  <label><span>마감일</span><AppDateInput name="dueDate" defaultValue={assignment.dueDate ?? ''} /></label>
                  <SubmitButton className="due-date-card-save">저장</SubmitButton>
                </form>
              </div>
            </section>
          )}

          {activeTab === 'manage' && (
            <section className="assignment-sheet-panel">
              <div className="action-card">
                <div className="action-card-top">
                  <div className="action-card-icon"><Archive /></div>
                  <div className="action-card-content">
                    <h4>{assignment.archived ? '과제 복원' : '과제 보관'}</h4>
                    <p>
                      {assignment.archived
                        ? '복원하면 다시 학습자에게 표시됩니다.'
                        : '보관하면 학습자에게 표시되지 않습니다.'}
                    </p>
                  </div>
                </div>
                <form action={toggleAssignmentArchiveAction}>
                  <input name="assignmentId" type="hidden" value={assignment.id} />
                  <input name="restore" type="hidden" value={assignment.archived ? '1' : '0'} />
                  <SubmitButton className="action-card-btn">{assignment.archived ? '복원' : '보관'}</SubmitButton>
                </form>
              </div>

              <div className="action-card action-card--danger">
                <div className="action-card-top">
                  <div className="action-card-icon"><Trash2 /></div>
                  <div className="action-card-content">
                    <h4>과제 삭제</h4>
                    <p>과제와 모든 결과를 영구 삭제합니다. 이 작업은 되돌릴 수 없습니다.</p>
                  </div>
                </div>
                <form action={deleteAssignmentAction} onSubmit={event => { if (!window.confirm('과제와 모든 결과를 영구 삭제할까요?')) event.preventDefault(); }}>
                  <input name="assignmentId" type="hidden" value={assignment.id} />
                  <SubmitButton className="action-card-btn action-card-btn--danger">삭제</SubmitButton>
                </form>
              </div>
            </section>
          )}
        </div>
      </motion.div>
    </div>
  );
}

export function StudentSheet({ student, lists, onClose }: { student: TutorTutee; lists: SavedList[]; onClose: () => void }) {
  const [activeTab, setActiveTab] = useState<SheetTab>('overview');
  const [assignState, assignAction, assigning] = useActionState(createAssignmentAction, {});
  const [assignMode, setAssignMode] = useState<'practice' | 'test'>('practice');
  const [assignmentSheetOpen, setAssignmentSheetOpen] = useState(false);
  const [selectedAssignmentId, setSelectedAssignmentId] = useState<string | null>(null);
  const [assignmentDetailTab, setAssignmentDetailTab] = useState<AssignmentSheetTab>('results');
  const [selectedAttemptId, setSelectedAttemptId] = useState<string | null>(null);
  const [selectedListIds, setSelectedListIds] = useState<string[]>([]);
  const activeLists = useMemo(() => lists.filter(list => !list.archived), [lists]);
  const selectedAssignment = useMemo(
    () => student.assignments.find(assignment => assignment.id === selectedAssignmentId) ?? null,
    [selectedAssignmentId, student.assignments]
  );
  const selectedAttemptForDetail = useMemo(
    () => selectedAssignment?.attempts.find(a => a.id === selectedAttemptId) ?? null,
    [selectedAssignment, selectedAttemptId]
  );
  const attempts = student.assignments.flatMap(a => a.attempts);
  const latest = latestAttempt(student);
  const wrongWords = latest?.responses.filter(r => r.isRight === false).map(r => r.word) ?? [];

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (selectedAttemptId) setSelectedAttemptId(null);
      else if (selectedAssignmentId) setSelectedAssignmentId(null);
      else if (assignmentSheetOpen) setAssignmentSheetOpen(false);
      else onClose();
    };
    const before = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handler);
    return () => { document.body.style.overflow = before; window.removeEventListener('keydown', handler); };
  }, [assignmentSheetOpen, onClose, selectedAssignmentId, selectedAttemptId]);

  useEffect(() => {
    setSelectedListIds(current => current.filter(id => activeLists.some(list => list.id === id)));
  }, [activeLists]);

  useEffect(() => {
    if (assignState.message) {
      setAssignmentSheetOpen(false);
      setSelectedListIds([]);
    }
  }, [assignState.message]);

  useEffect(() => {
    if (activeTab !== 'assignments' || student.archived) setAssignmentSheetOpen(false);
  }, [activeTab, student.archived]);

  useEffect(() => {
    if (activeTab !== 'assignments') {
      setSelectedAssignmentId(null);
      setSelectedAttemptId(null);
    }
  }, [activeTab]);

  useEffect(() => {
    if (selectedAssignmentId && !selectedAssignment) {
      setSelectedAssignmentId(null);
      setSelectedAttemptId(null);
    }
  }, [selectedAssignment, selectedAssignmentId]);

  useEffect(() => {
    if (!selectedAssignmentId) setSelectedAttemptId(null);
  }, [selectedAssignmentId]);

  const toggleListSelection = (listId: string) => {
    setSelectedListIds(current => current.includes(listId) ? current.filter(id => id !== listId) : [...current, listId]);
  };

  const tabs: Array<{ id: SheetTab; label: string }> = [
    { id: 'overview', label: '개요' },
    { id: 'assignments', label: '과제' },
    { id: 'account', label: '계정' },
  ];

  return (
    <div className="bottom-sheet-layer" role="dialog" aria-modal="true" aria-label={`${student.displayName} 상세 정보`}>
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
        className="bottom-sheet bottom-sheet--wide"
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 30, stiffness: 280, mass: 0.9 }}
      >
        <div className="bottom-sheet-grabber" aria-hidden="true" />
        <div className="tutee-sheet-header">
          <div className="tutee-sheet-identity">
            <p className="tutee-sheet-username">@{student.username}{student.archived ? ' · 읽기 전용' : ''}</p>
            <h2 className="tutee-sheet-name">{student.displayName}</h2>
          </div>
          <div className="tutee-sheet-header-right">
            <StatusBadge status={statusOf(student)} />
            <button type="button" className="tutee-sheet-close" onClick={onClose} aria-label="닫기"><X /></button>
          </div>
        </div>

        <div className="tutee-sheet-tabs" role="tablist" aria-label="학습자 정보 탭">
          {tabs.map(tab => (
            <button
              key={tab.id}
              role="tab"
              type="button"
              aria-selected={activeTab === tab.id}
              className={activeTab === tab.id ? 'is-active' : ''}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="bottom-sheet-scroll">
          {activeTab === 'overview' && (
            <div className="tutee-sheet-section">
              <div className="detail-metrics">
                <article><strong>{latest?.percent ?? 0}%</strong><span>최근 정확도</span></article>
                <article><strong>{attempts.length}</strong><span>완료 세션</span></article>
                <article><strong>{student.assignments.length}</strong><span>과제</span></article>
                <article><strong>{student.archived ? '보관' : '활성'}</strong><span>계정 상태</span></article>
              </div>
              <Trend student={student} />
              <div className="coach-panel" style={{ marginTop: 14 }}>
                <div>
                  <p>최근 오답</p>
                  <div className="weak-words">
                    {wrongWords.length ? wrongWords.slice(0, 8).map(word => <span key={word}>{word}</span>) : <span>없음</span>}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'assignments' && (
            <div className="tutee-sheet-section">
              <section className="assignment-records">
                <h3>과제 및 결과</h3>
                {student.assignments.map(assignment => (
                  <AssignmentRecord
                    key={assignment.id}
                    assignment={assignment}
                    onOpen={() => {
                      setAssignmentSheetOpen(false);
                      setAssignmentDetailTab('results');
                      setSelectedAssignmentId(assignment.id);
                    }}
                  />
                ))}
                {!student.assignments.length && <p style={{ color: 'var(--pine)', fontSize: 13 }}>배정된 과제가 없습니다.</p>}
              </section>
            </div>
          )}

          {activeTab === 'account' && (
            <section className="assignment-sheet-panel">
              <div className="action-card">
                <div className="action-card-top">
                  <div className="action-card-icon"><Archive /></div>
                  <div className="action-card-content">
                    <h4>{student.archived ? '학습자 복원' : '학습자 보관'}</h4>
                    <p>
                      {student.archived
                        ? '복원하면 다시 과제를 받을 수 있습니다.'
                        : '보관하면 학습자가 새 학습을 제출할 수 없습니다.'}
                    </p>
                  </div>
                </div>
                <form action={toggleTuteeArchiveAction}>
                  <input name="tuteeId" type="hidden" value={student.id} />
                  <input name="restore" type="hidden" value={student.archived ? '1' : '0'} />
                  <SubmitButton className="action-card-btn">{student.archived ? '복원' : '보관'}</SubmitButton>
                </form>
              </div>

              <div className="action-card">
                <div className="action-card-top">
                  <div className="action-card-icon"><RefreshCw /></div>
                  <div className="action-card-content">
                    <h4>비밀번호 재설정</h4>
                    <p>학습자에게 공유할 일회용 재설정 링크를 생성합니다.</p>
                  </div>
                </div>
                <form action={createPasscodeResetAction}>
                  <input name="tuteeId" type="hidden" value={student.id} />
                  <SubmitButton className="action-card-btn" pendingText="링크 생성 중...">링크 생성</SubmitButton>
                </form>
              </div>

              <div className="action-card action-card--danger">
                <div className="action-card-top">
                  <div className="action-card-icon"><Trash2 /></div>
                  <div className="action-card-content">
                    <h4>학습자 삭제</h4>
                    <p>학습자와 모든 학습 기록을 영구 삭제합니다. 이 작업은 되돌릴 수 없습니다.</p>
                  </div>
                </div>
                <form action={deleteTuteeAction} onSubmit={event => { if (!window.confirm('학습자와 모든 학습 기록을 영구 삭제할까요?')) event.preventDefault(); }}>
                  <input name="tuteeId" type="hidden" value={student.id} />
                  <SubmitButton className="action-card-btn action-card-btn--danger">삭제</SubmitButton>
                </form>
              </div>
            </section>
          )}
        </div>
        {activeTab === 'assignments' && !student.archived && (
          <div className="assignment-sticky-actions">
            {assignState.message && <p className="form-success">{assignState.message}</p>}
            <button className="new-assignment-sticky-button" type="button" onClick={() => { setSelectedAssignmentId(null); setAssignmentSheetOpen(true); }}>
              <Plus />새 과제
            </button>
          </div>
        )}
      </motion.div>
      <AnimatePresence>
        {selectedAssignment && (
          <AssignmentManagementSheet
            key="assignment-manage"
            activeTab={assignmentDetailTab}
            assignment={selectedAssignment}
            onClose={() => setSelectedAssignmentId(null)}
            onTabChange={setAssignmentDetailTab}
            onOpenAttempt={setSelectedAttemptId}
          />
        )}
        {selectedAttemptForDetail && (
          <div key="attempt-detail" className="attempt-detail-layer" role="dialog" aria-modal="true" aria-label="시도 상세">
            <motion.button
              className="attempt-detail-backdrop"
              type="button"
              onClick={() => setSelectedAttemptId(null)}
              aria-label="상세 닫기"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.14 }}
            />
            <motion.div
              className="bottom-sheet--wide attempt-detail-sheet"
              initial={{ y: '100%', opacity: 0.92 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: '100%', opacity: 0.92 }}
              transition={{ type: 'spring', damping: 30, stiffness: 320, mass: 0.7 }}
            >
              <div className="bottom-sheet-grabber" aria-hidden="true" />
              <div className="attempt-detail-header">
                <div>
                  <p className="attempt-detail-kicker">
                    {new Date(selectedAttemptForDetail.completedAt).toLocaleDateString('ko-KR')}
                  </p>
                  <h3 className="attempt-detail-title">
                    {selectedAssignment?.title} · 결과보기
                  </h3>
                </div>
                <button type="button" className="attempt-detail-close" onClick={() => setSelectedAttemptId(null)} aria-label="닫기"><X /></button>
              </div>
              <div className="attempt-detail-scroll">
                <div className="attempt-detail-summary">
                  <div className="attempt-detail-stat">
                    <span className={`attempt-score attempt-score--${scoreLevel(selectedAttemptForDetail.percent)}`}>{selectedAttemptForDetail.percent}%</span>
                    <span>정확도</span>
                  </div>
                  <div className="attempt-detail-stat">
                    <strong>{Math.max(1, Math.round(selectedAttemptForDetail.durationMs / 60000))}분</strong>
                    <span>소요 시간</span>
                  </div>
                  <div className="attempt-detail-stat">
                    <strong>{selectedAttemptForDetail.responses.filter(item => item.isRight === false || item.qType === 'type').length}개</strong>
                    <span>검토</span>
                  </div>
                </div>
                {selectedAttemptForDetail.responses.filter(item => item.isRight === false || item.qType === 'type').map((response, index) => (
                  <div className="attempt-response-card" key={index}>
                    <ReviewResponseLine response={response} />
                  </div>
                ))}
                {selectedAttemptForDetail.responses.filter(item => item.isRight === false || item.qType === 'type').length === 0 && (
                  <div className="attempt-detail-empty">
                    <CheckCircle />
                    <p>모든 문제를 정답 처리했습니다.</p>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
        {assignmentSheetOpen && (
          <div key="assignment-create" className="assignment-create-layer" role="dialog" aria-modal="true" aria-label="새 과제 배정">
            <motion.button
              className="assignment-create-backdrop"
              type="button"
              onClick={() => setAssignmentSheetOpen(false)}
              aria-label="새 과제 닫기"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.16 }}
            />
            <motion.div
              className="bottom-sheet bottom-sheet--wide assignment-create-sheet"
              initial={{ y: '100%', opacity: 0.92 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: '100%', opacity: 0.92 }}
              transition={{ type: 'spring', damping: 30, stiffness: 300, mass: 0.8 }}
            >
              <div className="bottom-sheet-grabber" aria-hidden="true" />
              <div className="tutee-sheet-header assignment-create-header">
                <div className="tutee-sheet-identity">
                  <p className="tutee-sheet-username">@{student.username}</p>
                  <h2 className="tutee-sheet-name">새 과제</h2>
                </div>
                <button type="button" className="assignment-create-close" onClick={() => setAssignmentSheetOpen(false)} aria-label="닫기"><X /></button>
              </div>
              <form className="bottom-sheet-scroll assignment-form assignment-create-form" action={assignAction}>
                <input name="tuteeId" type="hidden" value={student.id} />
                <input name="mode" type="hidden" value={assignMode} />
                <div className="assign-mode-toggle">
                  <button type="button" className={assignMode === 'practice' ? 'is-active' : ''} onClick={() => setAssignMode('practice')}>학습</button>
                  <button type="button" className={assignMode === 'test' ? 'is-active' : ''} onClick={() => setAssignMode('test')}>시험</button>
                </div>
                <div className="assignment-fields">
                  <div className="assignment-field-group">
                    <span>단어장</span>
                    <div className="assignment-list-picker" role="group" aria-label="배정할 단어장">
                      {activeLists.map(list => {
                        const selected = selectedListIds.includes(list.id);
                        return (
                          <AppCheckbox
                            checked={selected}
                            className={`assignment-list-option${selected ? ' is-selected' : ''}`}
                            description={`${list.entries.length}개 단어`}
                            key={list.id}
                            label={list.title}
                            name="listId"
                            onChange={() => toggleListSelection(list.id)}
                            value={list.id}
                          />
                        );
                      })}
                      {!activeLists.length && <p>활성 단어장이 없습니다.</p>}
                    </div>
                  </div>
                  <label>
                    <span>마감일</span>
                    <AppDateInput name="dueDate" />
                  </label>
                  {assignMode === 'test' && (
                    <label>
                      <span>시험 시간 (분)</span>
                      <AppNumberInput name="timeLimitMinutes" min={1} max={180} placeholder="예: 20" required />
                    </label>
                  )}
                </div>
                <button className="assignment-submit" disabled={assigning || selectedListIds.length === 0} type="submit">
                  <Plus />{selectedListIds.length > 1 ? `${selectedListIds.length}개 배정` : '배정'}
                </button>
                {assignState.error && <p className="form-error">{assignState.error}</p>}
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
