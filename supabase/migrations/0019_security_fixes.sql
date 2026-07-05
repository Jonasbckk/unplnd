-- UNPLND — security review fixes (2026-07-05). Run in the Supabase SQL Editor. Idempotent.
--
-- [HIGH] conversation_participants: the insert policy allowed ANY authenticated user to add
--   THEMSELVES (user_id = auth.uid()) to ANY conversation by id. is_conversation_participant then
--   trusts that row, so an attacker could read any private DM / group chat. No app flow needs this
--   branch — DMs and groups are created only through the SECURITY DEFINER functions
--   get_or_create_dm / create_group (which bypass RLS and enforce their own checks). We keep just
--   the conversation-creator path, closing the hole.
--
-- [LOW / hardening] plan_stars was world-readable (using (true)), exposing which user starred which
--   published plan. The app only ever reads the caller's OWN stars; public counts live in the
--   denormalized published_plans.star_count. Restrict SELECT to the caller's own rows.

drop policy if exists "participants_insert" on public.conversation_participants;
create policy "participants_insert" on public.conversation_participants for insert
  with check (
    exists (
      select 1 from public.conversations c
      where c.id = conversation_id and c.created_by = auth.uid()
    )
  );

drop policy if exists "plan_stars_read" on public.plan_stars;
create policy "plan_stars_read" on public.plan_stars for select
  using (user_id = auth.uid());
