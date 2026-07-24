-- 0038: friends can join a live evening (27_SOCIAL_VISION "Group Planning"; Constitution Rule 14 —
-- every social feature must help people MEET IN REAL LIFE).
--
-- The evening already lives server-side: plans(owner_id, status='active', route jsonb). What was
-- missing: the stop-by-stop progress, and a way for ACCEPTED CONNECTIONS to see a friend's live
-- evening — so they can actually come to where you are right now.
--
-- Privacy: only accepted connections (both directions) can read, only while the evening is ACTIVE,
-- and only via this narrow RPC — the plans table itself stays owner-only. When the evening ends
-- (status flips to completed), friends see nothing.

alter table public.plans
  add column if not exists progress jsonb;

create or replace function public.get_live_evening(target uuid)
returns table (
  plan_id uuid,
  summary text,
  mood text,
  route jsonb,
  progress jsonb,
  started_at timestamptz
)
language sql
security definer
set search_path = public
stable
as $$
  select p.id, p.summary, p.mood, p.route, p.progress, p.created_at
  from public.plans p
  where p.owner_id = target
    and p.status = 'active'
    and (
      target = auth.uid()
      or exists (
        select 1 from public.connections c
        where c.status = 'accepted'
          and ((c.requester_id = auth.uid() and c.addressee_id = target)
            or (c.addressee_id = auth.uid() and c.requester_id = target))
      )
    )
  order by p.created_at desc
  limit 1;
$$;

grant execute on function public.get_live_evening(uuid) to authenticated;
