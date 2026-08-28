-- Midtrans payment integration: real server-verified entitlement.
--
-- Before this migration, "own rows only" on subscription_status let any
-- authenticated client INSERT/UPDATE their own row directly — i.e. any user could
-- open devtools and grant themselves Premium for free (subscriptionRepository.activate()
-- did exactly this, by design, as a V1 mock). This migration closes that hole: clients
-- can only ever SELECT their own subscription_status row now. The only writer left is
-- the Midtrans notification webhook (api/midtrans/notification.ts), which runs with the
-- service_role key (bypasses RLS entirely) and only writes after verifying the Midtrans
-- signature server-side.

drop policy "own rows only" on public.subscription_status;

create policy "read own subscription only" on public.subscription_status
  for select using (auth.uid() = user_id);
-- No insert/update/delete policy for authenticated/anon — service_role (used only by
-- the notification webhook) bypasses RLS and is the sole writer.

-- ==== payment_transactions ====
-- One row per Midtrans transaction attempt. order_id is generated server-side at
-- creation (api/midtrans/create-transaction.ts) and is what correlates the async
-- notification webhook back to a user + plan — Midtrans always echoes back the exact
-- order_id it was given, and the notification's signature (SHA-512 of
-- order_id+status_code+gross_amount+ServerKey) proves it's genuinely from Midtrans, so
-- trusting our own previously-stored order_id->user_id/plan mapping here is safe.
create type payment_status_t as enum (
  'pending', 'settlement', 'capture', 'deny', 'cancel', 'expire', 'failure'
);

create table public.payment_transactions (
  order_id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  plan subscription_plan_t not null,
  gross_amount integer not null,
  status payment_status_t not null default 'pending',
  midtrans_transaction_id text,
  payment_type text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index payment_transactions_user_id_idx on public.payment_transactions(user_id);

alter table public.payment_transactions enable row level security;

create policy "read own transactions only" on public.payment_transactions
  for select using (auth.uid() = user_id);
-- No insert/update/delete policy for authenticated/anon — both
-- api/midtrans/create-transaction.ts (insert, after verifying the caller's JWT
-- server-side) and api/midtrans/notification.ts (update, after verifying the Midtrans
-- signature) use service_role and bypass RLS. The client only ever reads.
