-- Aivora — initial schema
-- This migration is provided for self-hosted deployments. The Design Arena
-- Supabase instance has these tables created via the project bootstrap tools.
--
-- Tables:
--   categories, tools, submissions, articles, clicks, admin_users, contact_messages
--
-- All tables enable RLS. Policies:
--   categories    — SELECT public
--   tools         — SELECT public WHERE status='approved'
--   articles      — SELECT public WHERE published=true
--   submissions   — INSERT public (status must be 'pending'), no SELECT public
--   clicks        — INSERT public, no SELECT public
--   contact_messages — INSERT public, no SELECT public
--   admin_users   — no public access (service role only)
--
-- Admin authorization happens server-side: API routes look up admin_users
-- using the service role key after verifying the Supabase JWT.

create extension if not exists "pgcrypto";

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  icon text,
  description text,
  created_at timestamptz not null default now()
);

create table if not exists public.tools (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text not null,
  website_url text not null,
  category_id uuid references public.categories(id) on delete set null,
  pricing text not null default 'Free' check (pricing in ('Free','Freemium','Paid','Contact')),
  logo_url text,
  rating numeric default 0 check (rating >= 0 and rating <= 5),
  clicks_count integer not null default 0,
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  featured boolean not null default false,
  tags jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists tools_status_idx on public.tools (status);
create index if not exists tools_category_idx on public.tools (category_id);
create index if not exists tools_featured_idx on public.tools (featured) where featured = true;
create index if not exists tools_pricing_idx on public.tools (pricing);
create index if not exists tools_clicks_idx on public.tools (clicks_count desc);

create table if not exists public.submissions (
  id uuid primary key default gen_random_uuid(),
  tool_name text not null,
  website_url text not null,
  description text not null,
  submitter_email text not null,
  category_id uuid references public.categories(id) on delete set null,
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  notes text,
  created_at timestamptz not null default now()
);
create index if not exists submissions_status_idx on public.submissions (status);

create table if not exists public.articles (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  excerpt text,
  content text not null,
  cover_image text,
  author text not null,
  published boolean not null default false,
  tags jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists articles_published_idx on public.articles (published);

create table if not exists public.clicks (
  id uuid primary key default gen_random_uuid(),
  tool_id uuid not null references public.tools(id) on delete cascade,
  clicked_at timestamptz not null default now(),
  referrer text,
  ip_hash text
);
create index if not exists clicks_tool_idx on public.clicks (tool_id);
create index if not exists clicks_clicked_at_idx on public.clicks (clicked_at desc);

create table if not exists public.admin_users (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique,
  role text not null default 'admin',
  created_at timestamptz not null default now()
);

create table if not exists public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  subject text,
  message text not null,
  created_at timestamptz not null default now()
);

-- Row-level security
alter table public.categories enable row level security;
alter table public.tools enable row level security;
alter table public.submissions enable row level security;
alter table public.articles enable row level security;
alter table public.clicks enable row level security;
alter table public.admin_users enable row level security;
alter table public.contact_messages enable row level security;

-- Public read policies
drop policy if exists categories_public_read on public.categories;
create policy categories_public_read on public.categories for select using (true);

drop policy if exists tools_public_read_approved on public.tools;
create policy tools_public_read_approved on public.tools for select using (status = 'approved');

drop policy if exists articles_public_read_published on public.articles;
create policy articles_public_read_published on public.articles for select using (published = true);

-- Public insert policies
drop policy if exists submissions_public_insert on public.submissions;
create policy submissions_public_insert on public.submissions
  for insert with check (status = 'pending');

drop policy if exists clicks_public_insert on public.clicks;
create policy clicks_public_insert on public.clicks for insert with check (true);

drop policy if exists contact_messages_public_insert on public.contact_messages;
create policy contact_messages_public_insert on public.contact_messages
  for insert with check (true);
