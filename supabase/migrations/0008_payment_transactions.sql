-- FitKu: payment transactions table for Midtrans integration
-- Tracks all payment attempts, snap tokens, status transitions, and audit logs.

create table public.payment_transactions (
  id uuid primary key default gen_random_uuid(),
  order_id text unique not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  plan subscription_plan_t not null,
  gross_amount integer not null,
  status text not null default 'pending', -- 'pending', 'settlement', 'expire', 'cancel', 'deny'
  payment_type text,
  transaction_id text,
  snap_token text,
  payload jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index payment_transactions_user_id_idx on public.payment_transactions (user_id);
create index payment_transactions_order_id_idx on public.payment_transactions (order_id);

-- Enable RLS
alter table public.payment_transactions enable row level security;

-- Users can view their own transactions
create policy "users can view own transactions" on public.payment_transactions
  for select using (auth.uid() = user_id);

-- Close the client-side privilege escalation loophole on subscription_status:
-- authenticated users may only SELECT their subscription row.
-- Inserts/updates are restricted to backend service_role (e.g. Midtrans webhook handler).
drop policy if exists "own rows only" on public.subscription_status;
create policy "own rows only select" on public.subscription_status
  for select using (auth.uid() = user_id);
