'use client';

import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import type { TuteeAssignment } from '@/lib/models';
import { ArrowRight, BookOpen, RefreshCw } from '@/components/AppIcons';
import { StudyAssignmentSelect } from '@/components/dashboard/StudyAssignmentSelect';
import { wordStatus } from './utils';

export function FocusPanel({
  assignment,
  assignments,
  readOnly,
  openWords,
  onSelectAssignment,
}: {
  assignment: TuteeAssignment;
  assignments: TuteeAssignment[];
  readOnly: boolean;
  openWords: () => void;
  onSelectAssignment: (value: TuteeAssignment) => void;
}) {
  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.section className="tutee-focus" key={assignment.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
        <h2>튜터가 배정한 단어</h2>
        <p className="tutee-focus-description">목록을 미리 보고, 준비되면 혼합형 퀴즈를 시작하세요.</p>
        <StudyAssignmentSelect assignments={assignments} selectedId={assignment.id} onSelect={onSelectAssignment} />
        <div className="word-preview">
          {assignment.entries.slice(0, 4).map(word => {
            const status = wordStatus(assignment, word.sourceEntryId);
            return (
              <div key={word.sourceEntryId}>
                <div className="word-title-line">
                  <strong>{word.word}</strong>
                  <small className={`word-status word-status--${status.value}`}>{status.label}</small>
                </div>
                <span>{word.meanings.join(' / ')}</span>
              </div>
            );
          })}
          {assignment.entries.length > 4 && (
            <div className="word-preview-more">외 {assignment.entries.length - 4}개</div>
          )}
        </div>
        <button className="tutee-secondary-action" type="button" onClick={openWords}><BookOpen />배정 단어 전체 보기</button>
        {!readOnly && (
          <>
            <Link
              className="tutee-start-action"
              href={`/tutee/assignments/${assignment.id}/${assignment.mode === 'test' ? 'test' : 'practice'}`}
            >
              {assignment.mode === 'test' ? '시험 시작하기' : '학습 시작하기'} <ArrowRight />
            </Link>
            {assignment.mode === 'practice' && (
              <Link
                className="tutee-flashcard-action"
                href={`/tutee/assignments/${assignment.id}/flashcards`}
              >
                플래쉬카드로 암기하기 <RefreshCw />
              </Link>
            )}
          </>
        )}
        {readOnly && <p className="read-only-note">보관된 계정입니다. 이전 기록만 볼 수 있습니다.</p>}
      </motion.section>
    </AnimatePresence>
  );
}
