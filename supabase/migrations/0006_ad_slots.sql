-- Aivora — ad slots
-- Lets an admin place ad code (e.g. AdSense/JS snippets) at any "position"
-- key used in the frontend (src/components/AdSlot.tsx). Positions are free
-- text chosen by the admin — there is no fixed enum — so the frontend simply
-- renders whatever active slots match the position string it asks for.
--
-- RLS:
--   ad_slots — SELECT public WHERE is_active = true (only enabled ad code is
--              ever exposed to visitors); INSERT/UPDATE/DELETE: service role
--              only (the API's requireAdmin() gate, same as every other
--              write in this project — never trusted from the client).

create table if not exists public.ad_slots (
  id uuid primary key default gen_random_uuid(),
  position text not null,
  code text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists ad_slots_position_idx on public.ad_slots (position);
create index if not exists ad_slots_active_idx on public.ad_slots (is_active) where is_active = true;

alter table public.ad_slots enable row level security;

drop policy if exists ad_slots_public_read_active on public.ad_slots;
create policy ad_slots_public_read_active on public.ad_slots
  for select using (is_active = true);

-- No public insert/update/delete policies are created — matching
-- 0005_remove_public_writes.sql, all writes go through the service-role
-- key used server-side by the /api routes after requireAdmin() succeeds.

-- Keep updated_at current on every update.
create or replace function public.set_ad_slots_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists ad_slots_set_updated_at on public.ad_slots;
create trigger ad_slots_set_updated_at
  before update on public.ad_slots
  for each row execute function public.set_ad_slots_updated_at();
