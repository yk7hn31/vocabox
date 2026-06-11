-- Remove the login throttle / brute-force protection.
-- Dropping the table also removes its RLS policies and comment.
drop table if exists public.login_throttles;
