-- =============================================================================
-- Friends app — initial schema + RLS policies
-- Created: 2026-06-27 (captured from hosted Supabase project during audit)
-- =============================================================================
-- This migration documents the schema that already exists in the hosted project.
-- Apply it to a fresh Supabase project to reproduce the full setup.
-- If you alter tables, add a new dated migration file rather than editing this one.
-- =============================================================================

-- ─── Tables ──────────────────────────────────────────────────────────────────

create table if not exists public.users (
  id          uuid primary key default gen_random_uuid(),
  auth_id     uuid not null unique references auth.users(id) on delete cascade,
  email       text,
  name        text,
  created_at  timestamptz not null default now()
);

create table if not exists public.people (
  id                       uuid primary key default gen_random_uuid(),
  user_id                  uuid not null references auth.users(id) on delete cascade,
  first_name               text not null,
  last_name                text not null default '',
  photo                    text,                         -- URL / future storage key
  type                     text not null check (type in ('friend', 'network')),
  cadence_tier             text not null check (cadence_tier in ('close_friend', 'keep_warm', 'dont_lose_touch', 'active')),
  where_from               text,
  birthday                 date,                         -- stored as YYYY-MM-DD
  nudge_interaction_type   text not null default 'text'
                             check (nudge_interaction_type in ('call', 'facetime', 'text', 'email', 'in_person')),
  phone                    text,
  email                    text,
  -- Denormalised columns updated after each logged interaction (kept in sync by app code):
  last_interaction_date    date,
  last_interaction_note    text,
  date_added               date not null default current_date,
  created_at               timestamptz not null default now()
);

create table if not exists public.interactions (
  id                   uuid primary key default gen_random_uuid(),
  user_id              uuid not null references auth.users(id) on delete cascade,
  person_id            uuid not null references public.people(id) on delete cascade,
  date_of_interaction  date not null,
  date_logged          date not null default current_date,
  type                 text not null check (type in ('call', 'facetime', 'text', 'email', 'in_person')),
  notes                text,
  created_at           timestamptz not null default now()
);

-- ─── Indexes ─────────────────────────────────────────────────────────────────

-- Fast roster loads per user, sorted by overdue (app orders by last_interaction_date client-side)
create index if not exists idx_people_user_id on public.people(user_id);
-- Fast interaction history per person
create index if not exists idx_interactions_person_id on public.interactions(person_id);
-- Fast stats aggregation per user
create index if not exists idx_interactions_user_id on public.interactions(user_id);

-- ─── Row-Level Security ───────────────────────────────────────────────────────
-- Each table is locked to the authenticated user's own rows.
-- Without these policies, the anon key gives anyone read/write access to all rows.

alter table public.users       enable row level security;
alter table public.people      enable row level security;
alter table public.interactions enable row level security;

-- users: each user can only see and manage their own profile row
create policy "users: own row only"
  on public.users for all
  using  (auth_id = auth.uid())
  with check (auth_id = auth.uid());

-- people: full CRUD scoped to the owning user
create policy "people: own rows only"
  on public.people for all
  using  (user_id = auth.uid())
  with check (user_id = auth.uid());

-- interactions: full CRUD scoped to the owning user
create policy "interactions: own rows only"
  on public.interactions for all
  using  (user_id = auth.uid())
  with check (user_id = auth.uid());

-- ─── Notes for launch ────────────────────────────────────────────────────────
-- 1. While DEV_USER_ID is hardcoded in lib/supabase.js the app bypasses auth
--    and these policies only fire when a real JWT is present. Verify policies
--    are active by checking the Supabase dashboard: Table Editor → RLS.
-- 2. Replace DEV_USER_ID with auth.uid() in every hook/component before launch.
-- 3. The `users` table insert in contexts/auth.tsx fires on SIGNED_IN and
--    populates auth_id, email, name — this matches the schema above.
