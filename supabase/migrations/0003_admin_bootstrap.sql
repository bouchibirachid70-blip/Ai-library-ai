-- Aivora — admin bootstrap helper
--
-- To grant an existing Supabase user admin powers, look up their UUID in the
-- Supabase Auth dashboard and run:
--
--   insert into public.admin_users (user_id, role)
--   values ('00000000-0000-0000-0000-000000000000', 'admin');
--
-- Replace the UUID with the target user's id from auth.users.

select 'Run the insert above with a real user UUID from auth.users' as note;
