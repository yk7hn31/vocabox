import type { TuteeAssignment } from '@/lib/models';
import { ChevronDown } from '@/components/AppIcons';
import { bestPercent, dueLabel, responseStatus, searchText, wordStatus } from './utils';

export function AssignmentDetail({ assignment, query }: { assignment: TuteeAssignment; query: string }) {
  const normalizedQuery = searchText(query);
  const words = normalizedQuery
    ? assignment.entries.filter(word => searchText(`${word.word} ${word.pos} ${word.meanings.join(' ')}`).includes(normalizedQuery))
    : assignment.entries;
  return (
    <>
      <div className="assignment-detail-header">
        <div><h2>{assignment.title}</h2><p>{assignment.entries.length}개 단어 · {dueLabel(assignment.dueDate)}</p></div>
        <span className={`assignment-mode-badge assignment-mode-badge--${assignment.mode}`}>{assignment.mode === 'test' ? '시험' : '학습'}</span>
      </div>
      <div className="session-preview assignment-detail-metrics">
        <article><strong>{assignment.attempts.length}</strong><span>시도</span></article>
        <article><strong>{bestPercent(assignment)}%</strong><span>최고 점수</span></article>
        <article><strong>{assignment.complete ? '완료' : '진행'}</strong><span>80점 기준</span></article>
      </div>
      <div className="assignment-detail-section">
        <div className="assignment-detail-section-heading"><h3>단어</h3>{query && <span>{words.length}/{assignment.entries.length}개</span>}</div>
        {words.length ? (
          <div className="assignment-word-list">
            {words.map(word => {
              const status = wordStatus(assignment, word.sourceEntryId);
              return (
                <div key={word.sourceEntryId}>
                  <div>
                    <div className="word-title-line">
                      <strong>{word.word}</strong>
                      <small className={`word-status word-status--${status.value}`}>{status.label}</small>
                    </div>
                    <span>{word.meanings.join(' / ')}</span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : <p className="assignment-empty-note">검색 결과가 없습니다.</p>}
      </div>
      <div className="assignment-detail-section">
        <h3>기록</h3>
        <div className="attempt-history">
          {assignment.attempts.map(attempt => {
            const reviewItems = attempt.responses.filter(item => item.isRight === false || item.qType === 'type');
            return (
              <details key={attempt.id}>
                <summary>
                  <span><strong>{attempt.percent}점</strong><small>{new Date(attempt.completedAt).toLocaleDateString('ko-KR')}</small></span>
                  <em>{attempt.score}/{attempt.mcqTotal}</em>
                  {attempt.late && <b>지각</b>}
                  <ChevronDown />
                </summary>
                {reviewItems.map((item, index) => {
                  const status = responseStatus(item);
                  return (
                    <p key={index}>
                      <span className={`attempt-review-badge attempt-review-badge--${status.value}`}>{status.label}</span>
                      <strong>{item.word}</strong>
                      <small>{item.userAnswer} / {item.allMeanings.join(' / ')}</small>
                    </p>
                  );
                })}
                {!reviewItems.length && <p className="attempt-history-empty">남긴 복습 항목이 없습니다.</p>}
              </details>
            );
          })}
          {!assignment.attempts.length && <p>아직 완료한 학습이 없습니다.</p>}
        </div>
      </div>
    </>
  );
}
