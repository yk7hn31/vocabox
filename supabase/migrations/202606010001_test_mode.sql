alter table public.assignments
  add column mode text not null default 'practice' check (mode in ('practice', 'test')),
  add column time_limit_minutes integer check (time_limit_minutes is null or (time_limit_minutes between 1 and 180));
