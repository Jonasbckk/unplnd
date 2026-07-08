-- 0031: remember which venues were suggested, to avoid repeating them.
--
-- plan_generations already records every successful plan (for the daily limit). We extend it
-- with the venue place_ids of that plan, so the generate-plan Edge Function can exclude a
-- user's recently-suggested spots and keep plans feeling fresh (founder: "immer die gleichen").
-- Service-role writes only; the existing owner-read RLS policy still applies.

alter table public.plan_generations
  add column if not exists place_ids text[] not null default '{}';
