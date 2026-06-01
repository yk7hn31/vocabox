# VocaBox Authentication Notes

VocaBox uses server-managed authentication rather than Supabase Auth. Supabase
Postgres is contacted only from Next.js server code using `DATABASE_URL`; RLS
is enabled without browser policies.

## Required Deployment Configuration

- Set `DATABASE_URL` to server-only Supabase Postgres connection credentials.
- Set `SESSION_HASH_SECRET` to random secret of at least 32 characters.
- Apply migrations in `supabase/migrations` before enabling account routes.
- Terminate HTTPS before production traffic so secure session cookies work.

## Accepted V1 Risk

Tutees authenticate using six-digit passcodes. Login blocks one IP address for
15 minutes after 10 failures, but does not lock accounts. An attacker rotating
IP addresses can still guess tutee passcodes on public deployments. Stronger
account-level throttling or second-factor protection should precede broader use.
