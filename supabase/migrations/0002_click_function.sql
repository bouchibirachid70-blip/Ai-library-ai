-- Aivora — atomic click counter
--
-- Avoid read-modify-write on tools.clicks_count. This function performs a
-- single UPDATE statement that increments the counter atomically. It runs
-- with SECURITY DEFINER so the public anon role can call it via RPC even
-- though tools has no public UPDATE policy.
--
-- Apply with:  psql -f supabase/migrations/0002_click_function.sql

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
   where id = p_tool_id;
end;
$$;

revoke all on function public.increment_tool_clicks(uuid) from public;
grant execute on function public.increment_tool_clicks(uuid) to anon, authenticated;
