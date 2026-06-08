'use client';

import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion, MotionConfig } from 'framer-motion';
import type { TutorDashboardData } from '@/lib/models';
import { BookOpen, Settings, User } from '@/components/AppIcons';
import { Header } from '@/components/dashboard/tutor/Header';
import { InvitePanel } from '@/components/dashboard/tutor/InvitePanel';
import { ListComposer } from '@/components/dashboard/tutor/ListComposer';
import { StatusBadge } from '@/components/dashboard/tutor/StatusBadge';
import { StudentSheet } from '@/components/dashboard/tutor/StudentSheet';
import { TutorSecurityPanel } from '@/components/dashboard/tutor/TutorSecurityPanel';
import { latestAttempt, statusOf } from '@/components/dashboard/tutor/status';
import type { TutorTab } from '@/components/dashboard/tutor/types';

export function TutorDashboard({ data, sharedLink }: { data: TutorDashboardData; sharedLink?: string }) {
  const [sheetStudentId, setSheetStudentId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TutorTab>('students');
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  const sheetStudent = useMemo(() => data.tutees.find(t => t.id === sheetStudentId) ?? null, [data.tutees, sheetStudentId]);
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
          <section className="tutee-welcome tutor-welcome">
            <div><h1>오늘 학습 흐름을 확인해볼까요?</h1><p>학습자 상태와 단어장을 한 곳에서 관리하세요.</p></div>
          </section>
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
                  <motion.button layout key={student.id} type="button" whileTap={{ scale: .985 }} onClick={() => setSheetStudentId(student.id)}>
                    <StatusBadge status={statusOf(student)} /><strong>{student.displayName} <small>@{student.username}</small></strong>
                    <p>최근 정확도 {latestAttempt(student)?.percent ?? '-'}%</p>
                  </motion.button>
                ))}
                {!attention.length && <p className="empty-list-copy">확인할 학습자가 없습니다.</p>}
              </section>
              <section className="queue-column">
                <h2>잘 진행 중 <b>{progressing.length}</b></h2>
                {progressing.map(student => (
                  <motion.button layout key={student.id} type="button" whileTap={{ scale: .985 }} onClick={() => setSheetStudentId(student.id)}>
                    <StatusBadge status={statusOf(student)} /><strong>{student.displayName} <small>@{student.username}</small></strong><p>최근 정확도 {latestAttempt(student)?.percent ?? '-'}%</p>
                  </motion.button>
                ))}
                {!progressing.length && <p className="empty-list-copy">진행 중인 학습자가 없습니다.</p>}
              </section>
            </div>
            {!data.tutees.length && (
              <p className="empty-list-copy" style={{ padding: '12px 4px' }}>초대 링크를 만들어 첫 학습자를 추가하세요.</p>
            )}
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
              <span className="nav-indicator">{tab.icon}</span>
              <span className="nav-label">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {mounted && createPortal(
        <AnimatePresence>
          {sheetStudent && (
            <StudentSheet
              key={sheetStudent.id}
              student={sheetStudent}
              lists={data.lists}
              onClose={() => setSheetStudentId(null)}
            />
          )}
        </AnimatePresence>,
        document.body
      )}
    </MotionConfig>
  );
}
