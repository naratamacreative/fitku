-- FitKu: "Tanya Admin" support assistant — bug/report tickets and reply feedback.
-- Additive only: no changes to any existing table/policy from 0001_init.sql or 0002_seed_foods.sql.
-- Apply via the Supabase SQL Editor (dashboard) or `supabase db push` if the project is CLI-linked.

create type support_ticket_urgency_t as enum ('low', 'medium', 'high');
create type support_ticket_status_t as enum ('open', 'acknowledged', 'resolved');

-- ==== support_tickets ====
-- Written only by the /api/support-chat Edge Function via the service_role key (same trust
-- model as api/chat.ts already uses: userId is trusted from the request body, no verified JWT
-- in this Edge Function today). No insert/update policy for client roles, same convention as
-- `public.foods` in 0001_init.sql (service_role writes only). A "own rows only" select policy
-- is included so a future "riwayat laporan saya" screen can read it without a new migration.
create table public.support_tickets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  feature_area text not null,
  description text not null,
  steps_before text,
  error_message text,
  urgency support_ticket_urgency_t not null default 'low',
  conversation_summary text not null,
  status support_ticket_status_t not null default 'open',
  telegram_notified boolean not null default false,
  created_at timestamptz not null default now()
);
create index support_tickets_user_idx on public.support_tickets (user_id);
create index support_tickets_status_idx on public.support_tickets (status);

alter table public.support_tickets enable row level security;
create policy "own rows only, read only" on public.support_tickets
  for select using (auth.uid() = user_id);

-- ==== support_feedback ====
-- 👍/👎 on individual AI replies. Written directly by the client (unlike support_tickets),
-- since it carries no sensitive content — same "own rows only" read/write convention already
-- used for food_logs/weight_entries/etc. in 0001_init.sql.
create table public.support_feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  helpful boolean not null,
  question text not null,
  created_at timestamptz not null default now()
);
create index support_feedback_user_idx on public.support_feedback (user_id);

alter table public.support_feedback enable row level security;
create policy "own rows only" on public.support_feedback
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
