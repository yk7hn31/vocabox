create extension if not exists pgcrypto;

create table public.users (
  id uuid primary key default gen_random_uuid(),
  role text not null check (role in ('tutor', 'tutee')),
  username text not null check (length(username) between 3 and 30),
  username_normalized text not null unique check (length(username_normalized) between 3 and 30),
  credential_hash text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.tutee_profiles (
  user_id uuid primary key references public.users(id) on delete cascade,
  tutor_id uuid not null references public.users(id) on delete restrict,
  display_name text not null check (length(btrim(display_name)) between 1 and 40),
  archived_at timestamptz,
  created_at timestamptz not null default now()
);

create index tutee_profiles_tutor_id_idx on public.tutee_profiles(tutor_id);

create table public.sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  token_hash text not null unique,
  expires_at timestamptz not null,
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);

create index sessions_user_id_idx on public.sessions(user_id);

create table public.tutee_invites (
  id uuid primary key default gen_random_uuid(),
  tutor_id uuid not null references public.users(id) on delete cascade,
  display_name text not null check (length(btrim(display_name)) between 1 and 40),
  token_hash text not null unique,
  expires_at timestamptz not null,
  accepted_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);

create index tutee_invites_tutor_id_idx on public.tutee_invites(tutor_id);

create table public.passcode_resets (
  id uuid primary key default gen_random_uuid(),
  tutee_id uuid not null references public.users(id) on delete cascade,
  tutor_id uuid not null references public.users(id) on delete cascade,
  token_hash text not null unique,
  expires_at timestamptz not null,
  consumed_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.login_throttles (
  ip_address text primary key,
  failure_count integer not null default 0,
  window_started_at timestamptz not null default now(),
  blocked_until timestamptz,
  updated_at timestamptz not null default now()
);

create table public.vocabulary_lists (
  id uuid primary key default gen_random_uuid(),
  tutor_id uuid not null references public.users(id) on delete cascade,
  title text not null check (length(btrim(title)) between 1 and 100),
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index vocabulary_lists_tutor_id_idx on public.vocabulary_lists(tutor_id);

create table public.vocabulary_entries (
  id uuid primary key default gen_random_uuid(),
  list_id uuid not null references public.vocabulary_lists(id) on delete cascade,
  position integer not null,
  word text not null check (length(btrim(word)) between 1 and 120),
  pos text not null default '' check (length(pos) <= 40),
  meanings text[] not null check (cardinality(meanings) between 1 and 10),
  unique (list_id, position)
);

create table public.assignments (
  id uuid primary key default gen_random_uuid(),
  tutor_id uuid not null references public.users(id) on delete cascade,
  tutee_id uuid not null references public.users(id) on delete cascade,
  source_list_id uuid references public.vocabulary_lists(id) on delete set null,
  title text not null check (length(btrim(title)) between 1 and 100),
  due_date date,
  archived_at timestamptz,
  created_at timestamptz not null default now()
);

create index assignments_tutor_id_idx on public.assignments(tutor_id);
create index assignments_tutee_id_idx on public.assignments(tutee_id);

create table public.assignment_entries (
  id uuid primary key default gen_random_uuid(),
  assignment_id uuid not null references public.assignments(id) on delete cascade,
  position integer not null,
  word text not null check (length(btrim(word)) between 1 and 120),
  pos text not null default '' check (length(pos) <= 40),
  meanings text[] not null check (cardinality(meanings) between 1 and 10),
  unique (assignment_id, position)
);

create table public.attempts (
  id uuid primary key default gen_random_uuid(),
  assignment_id uuid not null references public.assignments(id) on delete cascade,
  tutee_id uuid not null references public.users(id) on delete cascade,
  score integer not null,
  mcq_total integer not null check (mcq_total >= 0),
  percent integer not null check (percent between 0 and 100),
  duration_ms integer not null check (duration_ms >= 0),
  completes_assignment boolean not null,
  is_late boolean not null,
  completed_at timestamptz not null default now()
);

create index attempts_assignment_id_idx on public.attempts(assignment_id);
create index attempts_tutee_id_idx on public.attempts(tutee_id);

create table public.attempt_responses (
  id uuid primary key default gen_random_uuid(),
  attempt_id uuid not null references public.attempts(id) on delete cascade,
  assignment_entry_id uuid not null references public.assignment_entries(id) on delete cascade,
  question_type text not null check (question_type in ('mcq', 'multi', 'type')),
  user_answer text not null check (length(user_answer) <= 500),
  is_right boolean,
  created_at timestamptz not null default now()
);

create index attempt_responses_attempt_id_idx on public.attempt_responses(attempt_id);

alter table public.users enable row level security;
alter table public.tutee_profiles enable row level security;
alter table public.sessions enable row level security;
alter table public.tutee_invites enable row level security;
alter table public.passcode_resets enable row level security;
alter table public.login_throttles enable row level security;
alter table public.vocabulary_lists enable row level security;
alter table public.vocabulary_entries enable row level security;
alter table public.assignments enable row level security;
alter table public.assignment_entries enable row level security;
alter table public.attempts enable row level security;
alter table public.attempt_responses enable row level security;

comment on table public.login_throttles is
  'IP-only protection: ten failures in fifteen minutes blocks that IP for fifteen minutes. Rotating IP risk is accepted for v1.';
