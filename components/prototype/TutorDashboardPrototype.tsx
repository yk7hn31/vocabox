'use client';

import { useActionState, useEffect, useMemo, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { motion, MotionConfig } from 'framer-motion';
import { Brand } from '@/components/Brand';
import type { SavedList, TutorAssignment, TutorDashboardData, TutorTutee } from '@/lib/models';
import type { WordItem } from '@/components/practice/types';
import { importVocabularyCsv } from '@/components/practice/preparation';
import { changeTutorPasswordAction, logoutAction } from '@/app/actions/auth';
import {
  createAssignmentAction,
  createInviteAction,
  createPasscodeResetAction,
  deleteAssignmentAction,
  deleteListAction,
  deleteTuteeAction,
  revokeInviteAction,
  saveListAction,
  toggleAssignmentArchiveAction,
  toggleListArchiveAction,
  toggleTuteeArchiveAction,
  updateAssignmentDueDateAction,
} from '@/app/actions/tutor';
import { Activity, AlertCircle, BookOpen, CheckCircle, Plus, Settings, User, X } from '@/components/prototype/FeatherIcons';

type TuteeStatus = 'attention' | 'steady' | 'excellent';
type TutorTab = 'students' | 'lists' | 'settings';

function latestAttempt(student: TutorTutee) {
  return student.assignments.flatMap(assignment => assignment.attempts).sort((a, b) => b.completedAt.localeCompare(a.completedAt))[0];
}

function statusOf(student: TutorTutee): TuteeStatus {
  const percent = latestAttempt(student)?.percent;
  if (student.archived || percent === undefined || percent < 70) return 'attention';
  return percent >= 90 ? 'excellent' : 'steady';
}

const statusLabel: Record<TuteeStatus, string> = { attention: '확인 필요', steady: '진행 중', excellent: '우수' };

function StatusBadge({ status }: { status: TuteeStatus }) {
  const icon = status === 'attention' ? <AlertCircle /> : status === 'steady' ? <Activity /> : <CheckCircle />;
  return <motion.span layout className={`status-pill status-pill--${status}`}>{icon}{statusLabel[status]}</motion.span>;
}

function Header({ username }: { username: string }) {
  return (
    <motion.header className="tutor-header" initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
      <Brand compact />
      <nav aria-label="튜터 계정">
        <span className="tutor-account-pill">
          <span className="tutor-avatar"><User /></span>
          <span className="tutor-account-name">{username}</span>
        </span>
        <form action={logoutAction}><button className="prototype-account-link" type="submit">로그아웃</button></form>
      </nav>
    </motion.header>
  );
}

function InvitePanel({ data, sharedLink }: { data: TutorDashboardData; sharedLink?: string }) {
  const [state, action, pending] = useActionState(createInviteAction, {});
  return (
    <section className="manage-card">
      <h2>학습자 초대</h2>
      {sharedLink && <div className="share-link"><strong>공유할 링크</strong><code>{sharedLink}</code></div>}
      <form className="compact-form" action={action}>
        <input name="displayName" placeholder="학습자 이름" required maxLength={40} />
        <button disabled={pending} type="submit">{pending ? '생성 중' : '초대 링크 만들기'}</button>
      </form>
      {state.error && <p className="form-error">{state.error}</p>}
      <div className="mini-list">
        {data.invites.slice(0, 4).map(invite => {
          const active = !invite.accepted && !invite.revoked && new Date(invite.expiresAt) > new Date();
          return (
            <div key={invite.id}>
              <span>{invite.displayName}</span>
              <small>{invite.accepted ? '가입 완료' : invite.revoked ? '취소됨' : active ? '대기 중' : '만료됨'}</small>
              {active && (
                <form action={revokeInviteAction}>
                  <input name="inviteId" type="hidden" value={invite.id} />
                  <button type="submit">취소</button>
                </form>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}

function TutorSecurityPanel() {
  const [state, action, pending] = useActionState(changeTutorPasswordAction, {});
  return (
    <section className="manage-card security-card">
      <h2>계정 보안</h2>
      <form className="compact-security-form" action={action}>
        <input name="currentPassword" placeholder="현재 비밀번호" type="password" required />
        <input name="newPassword" placeholder="새 비밀번호 (12자 이상)" type="password" minLength={12} required />
        {state.error && <p className="form-error">{state.error}</p>}
        <button disabled={pending} type="submit">비밀번호 변경</button>
      </form>
    </section>
  );
}

function ListComposer({ lists }: { lists: SavedList[] }) {
  const [state, action, pending] = useActionState(saveListAction, {});
  const [listId, setListId] = useState('');
  const [title, setTitle] = useState('');
  const [csvFileName, setCsvFileName] = useState('');
  const [entries, setEntries] = useState<WordItem[]>([]);
  const [error, setError] = useState('');
  const [sheetOpen, setSheetOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  const uploadCsv = (file?: File) => {
    if (!file) return;
    if (!file.name.toLowerCase().endsWith('.csv') && file.type && file.type !== 'text/csv') {
      setError('CSV 파일만 업로드할 수 있습니다.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const text = typeof reader.result === 'string' ? reader.result : '';
      setCsvFileName(file.name);
      const parsed = importVocabularyCsv(text);
      if (parsed.status === 'error') { setError(parsed.error); setEntries([]); }
      else { setEntries(parsed.items); setError(''); setSheetOpen(true); }
    };
    reader.onerror = () => setError('CSV 파일을 읽지 못했습니다.');
    reader.readAsText(file);
  };

  const edit = (list: SavedList) => {
    setListId(list.id);
    setTitle(list.title);
    setCsvFileName('');
    setEntries(list.entries);
    setError('');
    setSheetOpen(true);
  };

  return (
    <section className="manage-card list-composer">
      <h2>단어장</h2>
      <form action={action}>
        <input name="listId" type="hidden" value={listId} />
        <input name="entries" type="hidden" value={JSON.stringify(entries)} />
        <input name="title" value={title} onChange={event => setTitle(event.target.value)} placeholder="단어장 제목" maxLength={100} required />
        <label className="csv-upload-target">
          <input accept=".csv,text/csv" type="file" onChange={event => uploadCsv(event.target.files?.[0])} />
          <span>{csvFileName || 'CSV 파일 업로드'}</span>
          <small>{entries.length ? `${entries.length}개 단어 검토됨` : 'word,pos,meanings 형식'}</small>
        </label>
        {entries.length > 0 && (
          <div className="csv-entries-bar">
            <span>{entries.length}개 단어 준비됨</span>
            <button className="csv-entries-edit" type="button" onClick={() => setSheetOpen(true)}>편집하기</button>
          </div>
        )}
        {(error || state.error) && <p className="form-error">{error || state.error}</p>}
        {state.message && <p className="form-success">{state.message}</p>}
        <button disabled={pending || !entries.length} type="submit">{listId ? '변경 저장' : '단어장 저장'}</button>
      </form>
      <div className="mini-list">
        {lists.map(list => (
          <div key={list.id}>
            <span>{list.title} <small>{list.entries.length}개{list.archived ? ' · 보관됨' : ''}</small></span>
            <button type="button" onClick={() => edit(list)}>편집</button>
            <form action={toggleListArchiveAction}>
              <input name="listId" type="hidden" value={list.id} /><input name="restore" type="hidden" value={list.archived ? '1' : '0'} />
              <button type="submit">{list.archived ? '복원' : '보관'}</button>
            </form>
            <form action={deleteListAction} onSubmit={event => { if (!window.confirm('이 단어장을 삭제할까요? 기존 과제 기록은 유지됩니다.')) event.preventDefault(); }}>
              <input name="listId" type="hidden" value={list.id} /><button type="submit">삭제</button>
            </form>
          </div>
        ))}
      </div>

      {mounted && sheetOpen && createPortal(
        <div className="csv-editor-layer" role="dialog" aria-modal="true" aria-label="단어 편집">
          <button className="csv-editor-backdrop" type="button" onClick={() => setSheetOpen(false)} aria-label="닫기" />
          <div className="csv-editor-sheet">
            <div className="csv-editor-grabber" aria-hidden="true" />
            <div className="csv-editor-header">
              <div>
                <h3>단어 편집</h3>
                <span>{entries.length}개</span>
              </div>
              <button className="csv-editor-close" type="button" onClick={() => setSheetOpen(false)} aria-label="닫기">
                <X />
              </button>
            </div>
            <div className="csv-editor-scroll">
              <div className="csv-editor-table-wrap">
                <table className="csv-editor-table">
                  <thead>
                    <tr>
                      <th scope="col">단어</th>
                      <th scope="col">품사</th>
                      <th scope="col">뜻 (;로 구분)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {entries.map((entry, index) => (
                      <tr key={index}>
                        <td>
                          <input
                            maxLength={120}
                            value={entry.word}
                            onChange={event => setEntries(current => current.map((item, i) => i === index ? { ...item, word: event.target.value } : item))}
                            aria-label={`단어 ${index + 1}`}
                          />
                        </td>
                        <td>
                          <input
                            maxLength={40}
                            value={entry.pos}
                            onChange={event => setEntries(current => current.map((item, i) => i === index ? { ...item, pos: event.target.value } : item))}
                            aria-label={`품사 ${index + 1}`}
                          />
                        </td>
                        <td>
                          <input
                            value={entry.meanings.join(';')}
                            onChange={event => setEntries(current => current.map((item, i) => i === index ? { ...item, meanings: event.target.value.split(';').map(v => v.trim()).filter(Boolean) } : item))}
                            aria-label={`뜻 ${index + 1}`}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="csv-editor-footer">
              <button className="cta primary-action" type="button" onClick={() => setSheetOpen(false)}>
                편집 완료
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </section>
  );
}

function Trend({ student }: { student: TutorTutee }) {
  const values = student.assignments.flatMap(assignment => assignment.attempts).sort((a, b) => a.completedAt.localeCompare(b.completedAt)).slice(-4).map(item => item.percent);
  return (
    <div className="trend-card">
      <div><strong>최근 정확도</strong><span>완료한 학습 {values.length}회</span></div>
      <div className="trend-bars">
        {(values.length ? values : [0]).map((value, index) => (
          <motion.span key={index} initial={{ height: 0 }} animate={{ height: `${Math.max(value, 4)}%` }}><small>{value}</small></motion.span>
        ))}
      </div>
    </div>
  );
}

function StudentDetail({ student, lists }: { student: TutorTutee; lists: SavedList[] }) {
  const [assignState, assignAction, assigning] = useActionState(createAssignmentAction, {});
  const attempts = student.assignments.flatMap(assignment => assignment.attempts);
  const latest = latestAttempt(student);
  const wrongWords = latest?.responses.filter(item => item.isRight === false).map(item => item.word) ?? [];
  return (
    <motion.section
      layout
      key={student.id}
      className="student-detail"
      initial={{ opacity: 0, y: 10, scale: .99 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: .22, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="detail-heading">
        <div><p>@{student.username}{student.archived ? ' · 읽기 전용' : ''}</p><h2>{student.displayName}</h2></div>
        <StatusBadge status={statusOf(student)} />
      </div>
      <div className="detail-metrics">
        <article><strong>{latest?.percent ?? 0}%</strong><span>최근 정확도</span></article>
        <article><strong>{attempts.length}</strong><span>완료 세션</span></article>
        <article><strong>{student.assignments.length}</strong><span>과제</span></article>
        <article><strong>{student.archived ? '보관' : '활성'}</strong><span>계정 상태</span></article>
      </div>
      <Trend student={student} />
      <div className="coach-panel live-coach-panel">
        <div><p>최근 오답</p><div className="weak-words">{wrongWords.length ? wrongWords.slice(0, 5).map(word => <span key={word}>{word}</span>) : <span>없음</span>}</div></div>
        {!student.archived && (
          <form className="assignment-form" action={assignAction}>
            <input name="tuteeId" type="hidden" value={student.id} />
            <p className="assignment-form-title">새 과제</p>
            <div className="assignment-fields">
              <label>
                <span>단어장</span>
                <select name="listId" required defaultValue="">
                  <option value="" disabled>단어장 선택</option>
                  {lists.filter(list => !list.archived).map(list => <option key={list.id} value={list.id}>{list.title}</option>)}
                </select>
              </label>
              <label>
                <span>마감일</span>
                <input name="dueDate" type="date" />
              </label>
            </div>
            <button className="assignment-submit" disabled={assigning} type="submit"><Plus />배정</button>
            {assignState.error && <p className="form-error">{assignState.error}</p>}
          </form>
        )}
        <div className="record-actions student-account-actions">
          <form action={toggleTuteeArchiveAction}>
            <input name="tuteeId" type="hidden" value={student.id} /><input name="restore" type="hidden" value={student.archived ? '1' : '0'} />
            <button type="submit">{student.archived ? '학습자 복원' : '학습자 보관'}</button>
          </form>
          <form action={createPasscodeResetAction}>
            <input name="tuteeId" type="hidden" value={student.id} /><button type="submit">비밀번호 재설정 링크</button>
          </form>
          <form action={deleteTuteeAction} onSubmit={event => { if (!window.confirm('학습자와 모든 학습 기록을 영구 삭제할까요?')) event.preventDefault(); }}>
            <input name="tuteeId" type="hidden" value={student.id} /><button className="danger" type="submit">영구 삭제</button>
          </form>
        </div>
      </div>
      <section className="assignment-records">
        <h3>과제 및 결과</h3>
        {student.assignments.map(assignment => <AssignmentRecord key={assignment.id} assignment={assignment} />)}
        {!student.assignments.length && <p>배정된 과제가 없습니다.</p>}
      </section>
    </motion.section>
  );
}

function AssignmentRecord({ assignment }: { assignment: TutorAssignment }) {
  const best = Math.max(0, ...assignment.attempts.map(item => item.percent));
  const latest = assignment.attempts[0];
  return (
    <article className="assignment-record">
      <div className="assignment-record-header">
        <div><strong>{assignment.title}{assignment.archived ? ' · 보관됨' : ''}</strong><span>최근 {latest?.percent ?? '-'}% · 최고 {best}% · {best >= 80 ? '완료' : '진행 중'} · 시도 {assignment.attempts.length}회</span></div>
      </div>
      <form className="assignment-due-form" action={updateAssignmentDueDateAction}>
        <input name="assignmentId" type="hidden" value={assignment.id} />
        <label><span>마감일</span><input name="dueDate" type="date" defaultValue={assignment.dueDate ?? ''} /></label>
        <button type="submit">저장</button>
      </form>
      <div className="record-actions">
        <form action={toggleAssignmentArchiveAction}>
          <input name="assignmentId" type="hidden" value={assignment.id} /><input name="restore" type="hidden" value={assignment.archived ? '1' : '0'} />
          <button type="submit">{assignment.archived ? '복원' : '보관'}</button>
        </form>
        <form action={deleteAssignmentAction} onSubmit={event => { if (!window.confirm('과제와 모든 결과를 영구 삭제할까요?')) event.preventDefault(); }}>
          <input name="assignmentId" type="hidden" value={assignment.id} /><button className="danger" type="submit">삭제</button>
        </form>
      </div>
      {assignment.attempts.map(attempt => (
        <details key={attempt.id}>
          <summary>
            {new Date(attempt.completedAt).toLocaleString('ko-KR')} · {attempt.score}/{attempt.mcqTotal} ({attempt.percent}%)
            {' · '}{Math.max(1, Math.round(attempt.durationMs / 60000))}분{attempt.late ? ' · 지각' : ''}
          </summary>
          {attempt.responses.filter(item => item.isRight === false || item.qType === 'type').map((response, index) => (
            <p key={index}>{response.qType === 'type' ? '셀프체크' : '오답'} · {response.word}: {response.userAnswer} / {response.allMeanings.join(', ')}</p>
          ))}
        </details>
      ))}
    </article>
  );
}

export function TutorDashboardPrototype({ data, sharedLink }: { data: TutorDashboardData; sharedLink?: string }) {
  const [selectedId, setSelectedId] = useState(data.tutees[0]?.id ?? '');
  const [activeTab, setActiveTab] = useState<TutorTab>('students');
  const selected = useMemo(() => data.tutees.find(tutee => tutee.id === selectedId) ?? data.tutees[0], [data.tutees, selectedId]);
  const attention = data.tutees.filter(student => statusOf(student) === 'attention');
  const progressing = data.tutees.filter(student => statusOf(student) !== 'attention');
  const tabs: Array<{ id: TutorTab; label: string; count?: number; icon: ReactNode }> = [
    { id: 'students', label: '학습자', count: data.tutees.length, icon: <User /> },
    { id: 'lists', label: '단어장', count: data.lists.length, icon: <BookOpen /> },
    { id: 'settings', label: '설정', icon: <Settings /> },
  ];

  return (
    <MotionConfig reducedMotion="user">
      <div className="tutor-page tutor-b">
        <Header username={data.user.username} />
        <motion.main initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <div className="dashboard-title"><div><p className="auth-kicker">TUTOR WORKSPACE</p><h1>학습자와 단어장 관리</h1></div></div>
          <div className="tutor-tabs" role="tablist" aria-label="튜터 대시보드">
            {tabs.map(tab => (
              <button
                aria-controls={`tutor-panel-${tab.id}`}
                aria-selected={activeTab === tab.id}
                className={activeTab === tab.id ? 'is-active' : ''}
                id={`tutor-tab-${tab.id}`}
                key={tab.id}
                role="tab"
                type="button"
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.icon}
                <span>{tab.label}</span>
                {tab.count !== undefined && <b>{tab.count}</b>}
              </button>
            ))}
          </div>
          <section
            aria-labelledby="tutor-tab-students"
            className="tutor-tab-panel tutor-tab-panel--students"
            hidden={activeTab !== 'students'}
            id="tutor-panel-students"
            role="tabpanel"
          >
            <div className="coach-board">
              <section className="queue-column queue-column--care">
                <h2>먼저 확인 <b>{attention.length}</b></h2>
                {attention.map(student => (
                  <motion.button layout className={selected?.id === student.id ? 'is-selected' : ''} key={student.id} type="button" whileTap={{ scale: .985 }} onClick={() => setSelectedId(student.id)}>
                    <StatusBadge status={statusOf(student)} /><strong>{student.displayName} <small>@{student.username}</small></strong>
                    <p>최근 정확도 {latestAttempt(student)?.percent ?? '-'}%</p>
                  </motion.button>
                ))}
                {!attention.length && <p className="empty-list-copy">확인할 학습자가 없습니다.</p>}
              </section>
              <section className="queue-column">
                <h2>잘 진행 중 <b>{progressing.length}</b></h2>
                {progressing.map(student => (
                  <motion.button layout className={selected?.id === student.id ? 'is-selected' : ''} key={student.id} type="button" whileTap={{ scale: .985 }} onClick={() => setSelectedId(student.id)}>
                    <StatusBadge status={statusOf(student)} /><strong>{student.displayName}</strong><p>최근 정확도 {latestAttempt(student)?.percent ?? '-'}%</p>
                  </motion.button>
                ))}
                {!progressing.length && <p className="empty-list-copy">진행 중인 학습자가 없습니다.</p>}
              </section>
              {selected ? <StudentDetail student={selected} lists={data.lists} /> : <section className="student-detail empty-detail">초대 링크를 만들어 첫 학습자를 추가하세요.</section>}
            </div>
          </section>
          <section
            aria-labelledby="tutor-tab-lists"
            className="tutor-tab-panel"
            hidden={activeTab !== 'lists'}
            id="tutor-panel-lists"
            role="tabpanel"
          >
            <ListComposer lists={data.lists} />
          </section>
          <section
            aria-labelledby="tutor-tab-settings"
            className="tutor-tab-panel"
            hidden={activeTab !== 'settings'}
            id="tutor-panel-settings"
            role="tabpanel"
          >
            <InvitePanel data={data} sharedLink={sharedLink} />
            <TutorSecurityPanel />
          </section>
        </motion.main>
      </div>
    </MotionConfig>
  );
}
