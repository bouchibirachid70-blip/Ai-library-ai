-- Aivora — production hardening: remove direct public writes (additive, idempotent)
--
-- Rationale: every public write in Aivora goes through the serverless API
-- (/api/submissions, /api/contact, /api/click), which enforces validation,
-- rate limiting, and status invariants. The anon-key INSERT policies on
-- `submissions`, `contact_messages`, and `clicks` therefore serve no
-- legitimate purpose — they only let an attacker bypass the API's rate
-- limiting and validation by calling Supabase directly with the public
-- anon key. We DROP those policies. The service-role client used by the
-- API bypasses RLS, so the API keeps working.
--
-- This is a policy-only change. No tables, columns, or rows are affected.
-- Public SELECT/UPDATE/DELETE on these tables remain blocked (RLS still on,
-- no policies for those commands => deny by default).

-- submissions: public may no longer insert directly. (API forces status='pending'.)
drop policy if exists submissions_public_insert on public.submissions;

-- contact_messages: public may no longer insert directly.
drop policy if exists contact_messages_public_insert on public.contact_messages;

-- clicks: the tighter approved-tool policy added in 0004 is also removed;
-- ALL click writes now flow exclusively through /api/click (service role),
-- which validates the tool exists & is approved and applies rate limiting.
drop policy if exists clicks_public_insert on public.clicks;
