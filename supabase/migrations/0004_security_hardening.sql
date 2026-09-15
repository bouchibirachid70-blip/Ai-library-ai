-- Aivora — security hardening (additive, idempotent)
--
-- This migration tightens two click-tracking surfaces WITHOUT touching data:
--   1. The atomic increment function now only increments APPROVED tools, so a
--      pending/rejected/draft tool's counter cannot be inflated by anyone
--      calling the public RPC directly with the anon key.
--   2. The public INSERT policy on `clicks` now requires the referenced tool to
--      exist and be approved, closing the same gap for direct anon inserts.
--
-- All statements use CREATE OR REPLACE / DROP IF EXISTS so re-running is safe.
-- No tables, columns, or rows are dropped.

-- 1) Tighten the atomic click counter to approved tools only.
create or replace function public.increment_tool_clicks(p_tool_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.tools
     set clicks_count = coalesce(clicks_count, 0) + 1,
         updated_at = now()
   where id = p_tool_id
     and status = 'approved';
end;
$$;

revoke all on function public.increment_tool_clicks(uuid) from public;
grant execute on function public.increment_tool_clicks(uuid) to anon, authenticated;

-- 2) Restrict public click inserts to approved tools. The API uses the
--    service-role client (bypasses RLS) and already enforces this in code;
--    this policy hardens direct anon-key access to the database.
drop policy if exists clicks_public_insert on public.clicks;
create policy clicks_public_insert on public.clicks
  for insert with check (
    exists (
      select 1 from public.tools t
      where t.id = clicks.tool_id and t.status = 'approved'
    )
  );
