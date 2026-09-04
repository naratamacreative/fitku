-- FitKu: tier the shared `foods` catalog into 'core' (free/trial-visible, the existing
-- 193 items) and 'pro' (Pro-paid-only, ~2,700 new items seeded in 0006_seed_pro_foods.sql).
--
-- Existing rows all become 'core' automatically via the column default when the NOT
-- NULL column is added — no separate backfill statement needed.
--
-- This is the first function-based RLS policy (and first `security definer` function)
-- in this schema — every prior policy (0001_init.sql, 0003_support.sql) is a plain
-- column comparison. is_pro_user() mirrors isProUser() in api/chat.ts and
-- isPaidActive() in src/domain/entitlement.ts: it checks subscription_status directly,
-- NOT the client-side trial window in entitlement.ts, so trial users do NOT get the
-- expanded catalog — same precedent as AI Coach being gated to paid-only. All three
-- copies (this function, api/chat.ts, entitlement.ts) must be kept in sync manually.

create type food_tier_t as enum ('core', 'pro');

alter table public.foods add column tier food_tier_t not null default 'core';
create index foods_tier_idx on public.foods (tier);

create or replace function public.is_pro_user()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.subscription_status s
    where s.user_id = auth.uid()
      and s.plan <> 'free'
      and s.status = 'active'
      and (s.expires_at is null or s.expires_at > now())
  );
$$;

revoke all on function public.is_pro_user() from public;
grant execute on function public.is_pro_user() to authenticated, anon;

drop policy "anyone can read the shared catalog" on public.foods;
create policy "core catalog readable by anyone, pro catalog by pro users" on public.foods
  for select using (tier = 'core' or public.is_pro_user());
