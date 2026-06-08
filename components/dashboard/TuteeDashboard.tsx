'use client';

import { useMemo, useState, type ReactNode } from 'react';
import { motion, MotionConfig } from 'framer-motion';
import type { TuteeDashboardData } from '@/lib/models';
import { Award, BookOpen, Clipboard, Settings } from '@/components/AppIcons';
import { AssignmentDetailSheet } from '@/components/dashboard/tutee/AssignmentDetailSheet';
import { AssignmentLibrary } from '@/components/dashboard/tutee/AssignmentLibrary';
import { AssignedWordsSheet } from '@/components/dashboard/tutee/AssignedWordsSheet';
import { FocusPanel } from '@/components/dashboard/tutee/FocusPanel';
import { Header } from '@/components/dashboard/tutee/Header';
import { SecurityPanel } from '@/components/dashboard/tutee/SecurityPanel';
import type { TuteeTab } from '@/components/dashboard/tutee/types';

export function TuteeDashboard({ data }: { data: TuteeDashboardData }) {
  const assignments = data.assignments.filter(item => !item.archived);
  const [activeTab, setActiveTab] = useState<TuteeTab>('study');
  const [selectedId, setSelectedId] = useState(assignments[0]?.id ?? '');
  const [open, setOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailAssignmentId, setDetailAssignmentId] = useState('');
  const selected = useMemo(() => assignments.find(item => item.id === selectedId) ?? assignments[0], [assignments, selectedId]);
  const detailAssignment = useMemo(() => assignments.find(item => item.id === detailAssignmentId), [assignments, detailAssignmentId]);
  const completed = assignments.filter(item => item.complete).length;
  const attemptCount = assignments.reduce((sum, item) => sum + item.attempts.length, 0);
  const tabs: Array<{ id: TuteeTab; label: string; icon: ReactNode }> = [
    { id: 'study', label: '학습', icon: <Clipboard /> },
    { id: 'words', label: '단어장', icon: <BookOpen /> },
    { id: 'settings', label: '설정', icon: <Settings /> },
  ];

  return (
    <MotionConfig reducedMotion="user">
      <div className="tutee-page">
        <Header username={data.user.username} />
        <motion.main className="tutee-main" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <section className="tutee-welcome">
            <div><h1>오늘도 한 세트 해볼까요?</h1><p>@{data.tutorUsername} 튜터가 보낸 과제를 확인하세요.</p></div>
            <div className="streak-card">
              <span className="streak-card-icon"><Award /></span>
              <div className="streak-card-copy"><strong>{completed}/{assignments.length}</strong><span>완료 과제</span></div>
              <small>{attemptCount}회 학습 기록</small>
            </div>
          </section>
          <section
            aria-labelledby="tutee-tab-study"
            className="tutee-tab-panel"
            hidden={activeTab !== 'study'}
            id="tutee-panel-study"
            role="tabpanel"
          >
            {selected ? (
              <FocusPanel
                assignment={selected}
                assignments={assignments}
                readOnly={data.user.archived}
                openWords={() => setOpen(true)}
                onSelectAssignment={assignment => setSelectedId(assignment.id)}
              />
            ) : <section className="tutee-focus empty-detail">현재 배정된 단어장이 없습니다.</section>}
          </section>
          <section
            aria-labelledby="tutee-tab-words"
            className="tutee-tab-panel"
            hidden={activeTab !== 'words'}
            id="tutee-panel-words"
            role="tabpanel"
          >
            {selected ? (
              <AssignmentLibrary
                assignments={assignments}
                selectedId={detailAssignmentId}
                onSelect={assignment => { setDetailAssignmentId(assignment.id); setDetailOpen(true); }}
              />
            ) : <section className="assignment-library empty-detail">현재 배정된 단어장이 없습니다.</section>}
          </section>
          <section
            aria-labelledby="tutee-tab-settings"
            className="tutee-tab-panel"
            hidden={activeTab !== 'settings'}
            id="tutee-panel-settings"
            role="tabpanel"
          >
            <SecurityPanel />
          </section>
        </motion.main>
        <div className="tutee-tabs" role="tablist" aria-label="학습자 대시보드">
          {tabs.map(tab => (
            <button
              aria-controls={`tutee-panel-${tab.id}`}
              aria-selected={activeTab === tab.id}
              className={activeTab === tab.id ? 'is-active' : ''}
              id={`tutee-tab-${tab.id}`}
              key={tab.id}
              role="tab"
              type="button"
              onClick={() => setActiveTab(tab.id)}
            >
              <span className="nav-indicator">{tab.icon}</span>
              <span className="nav-label">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>
      {selected && <AssignedWordsSheet assignments={assignments} selected={selected} open={open} onClose={() => setOpen(false)} />}
      {detailAssignment && <AssignmentDetailSheet assignment={detailAssignment} open={detailOpen} onClose={() => setDetailOpen(false)} />}
    </MotionConfig>
  );
}
