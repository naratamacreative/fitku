-- FitKu: Dexie -> Supabase migration, initial schema.
-- Approved architecture: see docs/FITKU_DEVELOPMENT_LOG.md, "Migrasi Dexie -> Supabase" entry.
-- Apply via the Supabase SQL Editor (dashboard) or `supabase db push` if the project is CLI-linked.

-- ==== ENUM TYPES ====
create type gender_t as enum ('male', 'female');
create type goal_t as enum ('lose_weight', 'gain_muscle', 'maintain');
create type activity_level_t as enum ('sedentary','light','moderate','active','very_active');
create type meals_per_day_t as enum ('1-2','3','4-5','6+');
create type food_category_t as enum ('nasi_karbo','lauk','sayur','gorengan','sup_kuah','camilan','minuman');
create type meal_type_t as enum ('breakfast','lunch','dinner','snack');
create type exercise_category_t as enum ('walk','run','cycle','weights','other');
create type food_report_reason_t as enum ('wrong_name','wrong_nutrition','wrong_serving','duplicate','other');
create type subscription_plan_t as enum ('free','pro_monthly','pro_annual','pro_lifetime');
create type subscription_state_t as enum ('active','expired','none');

-- ==== 1. profiles ====
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  gender gender_t not null,
  age smallint not null check (age > 0 and age < 120),
  height_cm smallint not null check (height_cm > 0),
  weight_kg numeric(5,1) not null check (weight_kg > 0),
  goal goal_t not null,
  motivation text not null default '',
  target_weight_kg numeric(5,1) not null,
  activity_level activity_level_t not null,
  meals_per_day meals_per_day_t not null,
  target_calories smallint not null,
  target_protein smallint not null,
  target_carbs smallint not null,
  target_fat smallint not null,
  last_adaptive_target_applied_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ==== 2. foods (shared catalog, read-only for clients) ====
create table public.foods (
  id text primary key,
  name text not null,
  category food_category_t not null,
  serving_label text not null,
  serving_grams smallint not null,
  calories smallint not null,
  protein numeric(5,1) not null,
  carbs numeric(5,1) not null,
  fat numeric(5,1) not null,
  region text
);
create index foods_category_idx on public.foods (category);

-- ==== 3. food_logs ====
create table public.food_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  food_id text references public.foods(id),
  log_date date not null,
  servings numeric(5,2) not null default 1,
  calories smallint not null,
  protein numeric(5,1) not null,
  carbs numeric(5,1) not null,
  fat numeric(5,1) not null,
  food_name text not null,
  meal_type meal_type_t,
  created_at timestamptz not null default now()
);
create index food_logs_user_date_idx on public.food_logs (user_id, log_date);

-- ==== 4. weight_entries (no unique(user_id, entry_date) — matches current behavior) ====
create table public.weight_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  entry_date date not null,
  weight_kg numeric(5,1) not null,
  note text,
  created_at timestamptz not null default now()
);
create index weight_entries_user_date_idx on public.weight_entries (user_id, entry_date);

-- ==== 5. hydration_logs ====
create table public.hydration_logs (
  user_id uuid not null references auth.users(id) on delete cascade,
  log_date date not null,
  glasses smallint not null default 0 check (glasses >= 0 and glasses <= 40),
  primary key (user_id, log_date)
);

-- ==== 6. daily_notes ====
create table public.daily_notes (
  user_id uuid not null references auth.users(id) on delete cascade,
  log_date date not null,
  note_text text not null default '',
  updated_at timestamptz not null default now(),
  primary key (user_id, log_date)
);

-- ==== 7. exercise_logs ====
create table public.exercise_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  log_date date not null,
  category exercise_category_t not null,
  duration_min smallint not null,
  calories_burned smallint not null,
  note text,
  created_at timestamptz not null default now()
);
create index exercise_logs_user_date_idx on public.exercise_logs (user_id, log_date);

-- ==== 8. my_foods ====
create table public.my_foods (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  serving_label text not null,
  serving_grams smallint not null,
  calories smallint not null,
  protein numeric(5,1) not null,
  carbs numeric(5,1) not null,
  fat numeric(5,1) not null,
  created_at timestamptz not null default now()
);
create index my_foods_user_idx on public.my_foods (user_id);

-- ==== 9. food_reports ====
create table public.food_reports (
  user_id uuid not null references auth.users(id) on delete cascade,
  food_id text not null references public.foods(id),
  reasons food_report_reason_t[] not null,
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, food_id)
);

-- ==== 10. subscription_status ====
create table public.subscription_status (
  user_id uuid primary key references auth.users(id) on delete cascade,
  plan subscription_plan_t not null default 'free',
  status subscription_state_t not null default 'none',
  started_at timestamptz,
  expires_at timestamptz,
  trial_used boolean not null default false
);

-- ==== ROW LEVEL SECURITY ====
alter table public.profiles enable row level security;
alter table public.foods enable row level security;
alter table public.food_logs enable row level security;
alter table public.weight_entries enable row level security;
alter table public.hydration_logs enable row level security;
alter table public.daily_notes enable row level security;
alter table public.exercise_logs enable row level security;
alter table public.my_foods enable row level security;
alter table public.food_reports enable row level security;
alter table public.subscription_status enable row level security;

create policy "own profile only" on public.profiles
  for all using (auth.uid() = id) with check (auth.uid() = id);

create policy "anyone can read the shared catalog" on public.foods
  for select using (true);
-- No insert/update/delete policy on foods for client roles — the catalog is
-- populated only via migration/seed (service_role), never from the app.

create policy "own rows only" on public.food_logs
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own rows only" on public.weight_entries
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own rows only" on public.hydration_logs
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own rows only" on public.daily_notes
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own rows only" on public.exercise_logs
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own rows only" on public.my_foods
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own rows only" on public.food_reports
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own rows only" on public.subscription_status
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
