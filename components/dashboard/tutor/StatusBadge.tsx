import { Activity, AlertCircle, CheckCircle } from '@/components/AppIcons';
import type { TuteeStatus } from './types';
import { statusLabel } from './status';

export function StatusBadge({ status }: { status: TuteeStatus }) {
  const icon = status === 'attention' ? <AlertCircle /> : status === 'steady' ? <Activity /> : <CheckCircle />;
  return <span className={`status-pill status-pill--${status}`}>{icon}{statusLabel[status]}</span>;
}
