-- FitKu: add 'partner_grant' as a dedicated subscription plan id for comped access
-- given to influencers/partners/ambassadors as part of a business relationship
-- (not a real payment, and not an internal dev/test account).
--
-- Kept separate from 'dev_test' (see 0004_dev_test_plan.sql) so influencer/partner
-- grants never get mixed into internal testing data, and vice versa — reporting on
-- "how many free Pro months have we given away to partners" stays clean. Never sold,
-- never offered in Premium.tsx's plan picker (PRO_PLANS), never written by app code —
-- only reachable via a manual grant (see subscriptionRepository.ts's expiryFor(),
-- which does NOT special-case this plan: durations for partner grants are set
-- explicitly per-grant via `expires_at` at insert time, not derived from the plan id).
--
-- NOTE: run this as its own statement/transaction, separate from anything that reads
-- the new enum value — Postgres does not allow using a newly added enum value within
-- the same transaction that added it (see 0004_dev_test_plan.sql for the same note).

alter type subscription_plan_t add value if not exists 'partner_grant';
