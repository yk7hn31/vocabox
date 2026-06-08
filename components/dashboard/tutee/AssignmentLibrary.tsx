import type { TuteeAssignment } from '@/lib/models';
import { dueLabel, latestPercent } from './utils';

export function AssignmentLibrary({ assignments, selectedId, onSelect }: { assignments: TuteeAssignment[]; selectedId: string; onSelect: (value: TuteeAssignment) => void }) {
  return (
    <section className="assignment-library">
      <div className="assignment-library-title"><h2>배정된 단어장</h2><span>{assignments.length}개</span></div>
      {assignments.map(assignment => {
        const latest = latestPercent(assignment);
        return (
          <button className={assignment.id === selectedId ? 'is-selected' : ''} key={assignment.id} type="button" onClick={() => onSelect(assignment)}>
            <div><strong>{assignment.title}</strong><small>{dueLabel(assignment.dueDate)}</small></div>
            <span>{latest}%</span><i aria-label={`${latest}% 점수`}><b style={{ width: `${latest}%` }} /></i>
          </button>
        );
      })}
    </section>
  );
}
