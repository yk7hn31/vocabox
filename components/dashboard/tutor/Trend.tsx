'use client';

import { motion } from 'framer-motion';
import type { TutorTutee } from '@/lib/models';

export function Trend({ student }: { student: TutorTutee }) {
  const values = student.assignments.flatMap(a => a.attempts).sort((a, b) => a.completedAt.localeCompare(b.completedAt)).slice(-4).map(item => item.percent);
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
