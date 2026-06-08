# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # start dev server (writes to .next-dev, not .next)
npm run build        # production build
npm run type-check   # tsc --noEmit (no test runner or linter configured)
```

There is no test suite. Type-checking is the primary correctness check.

## Architecture

**VocaBox** is a Korean vocabulary tutoring app. Tutors create vocabulary lists and assign them to tutees as practice or test sessions.

### Roles & routing

Two roles: `tutor` and `tutee`. Auth is custom session-based (httpOnly cookie → `sessions` table, token hashed with SHA-256, password hashed with argon2).

| Route | Purpose |
|-------|---------|
| `/auth` | Login / register / invite / passcode reset |
| `/onboarding` | Post-registration setup |
| `/tutor` | Tutor dashboard (manage tutees, lists, assignments) |
| `/tutee` | Tutee dashboard (view assignments) |
| `/tutee/assignments/[id]/practice` | Guided practice with lives & streak |
| `/tutee/assignments/[id]/test` | Timed test mode |
| `/tutee/assignments/[id]/flashcards` | Flashcard review |
| `/practice` | Standalone practice (unauthenticated, CSV upload) |

`requireUser(role?)` in `lib/server/auth.ts` guards all protected pages — it redirects to `/auth` or the correct dashboard if the role doesn't match.

### Server layer

All server-only code lives in `lib/server/`:
- `db.ts` — singleton `postgres` client, reads `DATABASE_URL`
- `auth.ts` — session CRUD, `currentUser()`, `requireUser()`
- `data.ts` — dashboard data fetchers (`getTutorDashboard`, `getTuteeDashboard`, `getActiveAssignment`, etc.)
- `security.ts` — token generation, hashing, session constants

Server Actions in `app/actions/`:
- `tutor.ts` — all tutor mutations (lists, assignments, invites, passcode resets, tutee management, self-check review)
- `attempt.ts` — `submitAttemptAction` (tutee submits completed session)
- `auth.ts` — login, register, OTP/passcode flows

### Domain models

`lib/models.ts` defines the shared TypeScript types (`CurrentUser`, `TutorDashboardData`, `TuteeDashboardData`, `SavedList`, `TutorTutee`, `TutorAssignment`, `TuteeAssignment`, etc.).

`components/practice/types.ts` defines practice-specific types (`WordItem`, `QuizItem`, `ResultEntry`, `PracticeSession`).

### Practice engine (client-side)

All practice state lives in `components/practice/session.ts` — a pure reducer `reducePracticeSession(session, action)`. Three question types:
- `mcq` — single-choice (word has 1 meaning)
- `multi` — multi-select (word has >1 meanings)
- `type` — free-text self-check (unscored unless tutor reviews it)

`preparation.ts` builds `QuizItem[]` from `WordItem[]` — groups repeated words, shuffles distractors, assigns question types. `summariseResults()` computes score/percent; **80% = assignment complete**.

`FlashcardApp`, `PracticeApp`, `TestApp`, `SavedPracticeApp` in `components/practice/` are the four entry-point components rendered by their respective pages.

### Styling

No Tailwind. CSS custom properties defined in `app/styles/tokens.css` (sourced from `DESIGN.md`). Feature CSS files are imported in `app/globals.css`. Key token families: `--color-*`, `--text-*`, `--spacing-*`, `--radius-*`, `--shadow-*`.

Design system: Geniestudio — light theme, `--color-midnight-ink` (`#181d27`) for primary buttons, `--color-sky-wash` (`#ebf5ff`) page background, `--radius-cards: 32px`, `--font-aeonik` for headings, `--font-geist` for body.

### Database

Postgres accessed directly via the `postgres` npm package (not Supabase client). Schema in `supabase/migrations/`. Core tables: `users`, `tutee_profiles`, `sessions`, `vocabulary_lists`, `vocabulary_entries`, `assignments`, `assignment_entries`, `attempts`, `attempt_responses`, `tutee_invites`, `passcode_resets`, `login_throttles`.

RLS is enabled on all tables; enforcement is done at the application layer in server actions (tutor ownership checks before every mutation).

### UI text

User-facing strings are in Korean. Error messages in server actions are Korean strings.
