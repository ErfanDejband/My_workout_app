-- Workout Tracker — initial schema + RLS
-- Implements docs/Project/src/structure.md §3.
-- Every user-data table is protected by Row Level Security scoped to auth.uid().

-- 3.1 profiles ---------------------------------------------------------------
create table if not exists public.profiles (
  id                 uuid primary key references auth.users(id) on delete cascade,
  goal               text,
  sex                text,
  age                int,
  height_cm          numeric,
  weight_kg          numeric,
  days_per_week      int,
  session_minutes    int,
  experience         text,
  equipment          text,
  limitations        text,
  locale             text default 'en',
  unit_system        text default 'metric',
  preferred_provider text,
  created_at         timestamptz default now(),
  updated_at         timestamptz default now()
);

-- 3.2 ai_credentials (encrypted at rest) -------------------------------------
create table if not exists public.ai_credentials (
  user_id      uuid references auth.users(id) on delete cascade,
  provider     text not null,
  token_cipher text not null,
  token_iv     text not null,
  token_tag    text not null,
  created_at   timestamptz default now(),
  primary key (user_id, provider)
);

-- 3.3 plans (raw + parsed) ---------------------------------------------------
create table if not exists public.plans (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid references auth.users(id) on delete cascade,
  source       text,
  raw_response text,
  parsed       jsonb,
  is_active    boolean default true,
  created_at   timestamptz default now()
);

-- 3.4 plan_days --------------------------------------------------------------
create table if not exists public.plan_days (
  id                uuid primary key default gen_random_uuid(),
  plan_id           uuid references public.plans(id) on delete cascade,
  user_id           uuid references auth.users(id) on delete cascade,
  day_index         int,
  title             text,
  type              text,
  focus             text[],
  estimated_minutes int
);

-- 3.5 plan_exercises ---------------------------------------------------------
create table if not exists public.plan_exercises (
  id             uuid primary key default gen_random_uuid(),
  plan_day_id    uuid references public.plan_days(id) on delete cascade,
  user_id        uuid references auth.users(id) on delete cascade,
  ord            int,
  name           text,
  canonical_id   text,
  primary_muscle text,
  sets           int,
  reps           text,
  rest_sec       int,
  how_to         text,
  notes          text,
  library_id     text
);

-- 3.6 completions ------------------------------------------------------------
create table if not exists public.completions (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid references auth.users(id) on delete cascade,
  plan_exercise_id uuid references public.plan_exercises(id) on delete cascade,
  date             date not null,
  done             boolean default true,
  done_at          timestamptz default now(),
  unique (plan_exercise_id, date)
);

-- Row Level Security ---------------------------------------------------------
alter table public.profiles       enable row level security;
alter table public.ai_credentials enable row level security;
alter table public.plans          enable row level security;
alter table public.plan_days      enable row level security;
alter table public.plan_exercises enable row level security;
alter table public.completions    enable row level security;

-- profiles: row is keyed by the user's own id
create policy "profiles_self" on public.profiles
  for all using (auth.uid() = id) with check (auth.uid() = id);

-- all other tables: row is owned via user_id
create policy "ai_credentials_self" on public.ai_credentials
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "plans_self" on public.plans
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "plan_days_self" on public.plan_days
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "plan_exercises_self" on public.plan_exercises
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "completions_self" on public.completions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Auto-create a profile row when a new auth user signs up -------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id) values (new.id)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
