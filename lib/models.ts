import type { ResultEntry, WordItem } from '@/components/practice/types';

export type UserRole = 'tutor' | 'tutee';

export interface CurrentUser {
  id: string;
  role: UserRole;
  username: string;
  displayName?: string;
  archived: boolean;
}

export interface SavedList {
  id: string;
  title: string;
  archived: boolean;
  entries: WordItem[];
}

export interface TutorAttempt {
  id: string;
  score: number;
  mcqTotal: number;
  percent: number;
  durationMs: number;
  completedAt: string;
  late: boolean;
  responses: ResultEntry[];
}

export interface TutorAssignment {
  id: string;
  title: string;
  dueDate: string | null;
  archived: boolean;
  entries: WordItem[];
  attempts: TutorAttempt[];
}

export interface TutorTutee {
  id: string;
  username: string;
  displayName: string;
  archived: boolean;
  assignments: TutorAssignment[];
}

export interface PendingInvite {
  id: string;
  displayName: string;
  expiresAt: string;
  revoked: boolean;
  accepted: boolean;
}

export interface TutorDashboardData {
  user: CurrentUser;
  tutees: TutorTutee[];
  lists: SavedList[];
  invites: PendingInvite[];
}

export interface TuteeAssignment {
  id: string;
  title: string;
  dueDate: string | null;
  archived: boolean;
  complete: boolean;
  entries: WordItem[];
  attempts: TutorAttempt[];
}

export interface TuteeDashboardData {
  user: CurrentUser;
  tutorUsername: string;
  assignments: TuteeAssignment[];
}
