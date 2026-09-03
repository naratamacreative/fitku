-- FitKu: add 'dev_test' as an internal-only subscription plan value.
--
-- Context: pro_annual/pro_lifetime plan ids were kept stable when pricing was relabeled
-- to a 3-tier scheme (see paywall.triggers.ts PRO_PLANS), but their sold duration ("3
-- Bulan" / "12 Bulan") didn't match what subscriptionRepository.ts's expiryFor() actually
-- enforced (1 YEAR / never). That's fixed in application code alongside this migration.
--
-- 'dev_test' exists so pre-launch test/admin accounts can be granted permanent Pro access
-- (expires_at = NULL) WITHOUT reusing 'pro_lifetime' — reusing it would mean any future fix
-- to the real "12 Bulan" paid tier's duration also changes what test accounts get, and vice
-- versa. Never sold, never offered in Premium.tsx's plan picker (PRO_PLANS), never written by
-- app code (see subscriptionRepository.ts activate() — only reachable via the plans users can
-- actually select).
--
-- NOTE: run this as its own statement/transaction, separate from anything that reads the
-- new enum value (e.g. the UPDATE below) — Postgres does not allow using a newly added enum
-- value within the same transaction that added it.

alter type subscription_plan_t add value if not exists 'dev_test';
