-- Plan RSVPs — friend groups decide an evening together.
-- Each shared-plan message in a chat can collect "in"/"out" from the conversation's participants.

create table if not exists public.plan_rsvps (
  message_id uuid not null references public.messages(id) on delete cascade,
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  status text not null check (status in ('in', 'out')),
  created_at timestamptz not null default now(),
  primary key (message_id, user_id)
);

create index if not exists plan_rsvps_conversation_idx on public.plan_rsvps (conversation_id);

alter table public.plan_rsvps enable row level security;

-- Read: anyone in the conversation sees the tally (reuses the existing SECURITY DEFINER helper).
drop policy if exists plan_rsvps_select on public.plan_rsvps;
create policy plan_rsvps_select on public.plan_rsvps for select
  using (public.is_conversation_participant(conversation_id, auth.uid()));

-- Write only your own RSVP, and only in a conversation you belong to.
drop policy if exists plan_rsvps_insert on public.plan_rsvps;
create policy plan_rsvps_insert on public.plan_rsvps for insert
  with check (user_id = auth.uid() and public.is_conversation_participant(conversation_id, auth.uid()));

drop policy if exists plan_rsvps_update on public.plan_rsvps;
create policy plan_rsvps_update on public.plan_rsvps for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists plan_rsvps_delete on public.plan_rsvps;
create policy plan_rsvps_delete on public.plan_rsvps for delete
  using (user_id = auth.uid());

-- Live tally in the chat (idempotent — safe to re-run).
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'plan_rsvps'
  ) then
    alter publication supabase_realtime add table public.plan_rsvps;
  end if;
end $$;
