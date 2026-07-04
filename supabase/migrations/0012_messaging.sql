-- UNPLND — messaging + groups (Phase 2 & 3). A unified conversation model powers both
-- 1:1 DMs (between accepted connections) and multi-user groups. Plans can be shared into a
-- chat as a message. IDEMPOTENT — safe to re-run. Run once in the Supabase SQL Editor.

-- ---------- tables ----------
create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  is_group boolean not null default false,
  title text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  last_message_at timestamptz not null default now()
);
alter table public.conversations enable row level security;

create table if not exists public.conversation_participants (
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (conversation_id, user_id)
);
alter table public.conversation_participants enable row level security;

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_id uuid not null references auth.users(id) on delete cascade,
  body text,
  shared_plan jsonb, -- optional { title, route, photo } plan card
  created_at timestamptz not null default now()
);
alter table public.messages enable row level security;

-- SECURITY DEFINER membership check — avoids RLS self-recursion on participants.
create or replace function public.is_conversation_participant(conv uuid, uid uuid)
returns boolean language sql security definer set search_path = public stable as $$
  select exists (
    select 1 from public.conversation_participants where conversation_id = conv and user_id = uid
  );
$$;

-- ---------- RLS ----------
drop policy if exists "conversations_read" on public.conversations;
create policy "conversations_read" on public.conversations for select
  using (public.is_conversation_participant(id, auth.uid()));
drop policy if exists "conversations_insert" on public.conversations;
create policy "conversations_insert" on public.conversations for insert
  with check (created_by = auth.uid());
drop policy if exists "conversations_update" on public.conversations;
create policy "conversations_update" on public.conversations for update
  using (public.is_conversation_participant(id, auth.uid()));

drop policy if exists "participants_read" on public.conversation_participants;
create policy "participants_read" on public.conversation_participants for select
  using (public.is_conversation_participant(conversation_id, auth.uid()));
drop policy if exists "participants_insert" on public.conversation_participants;
create policy "participants_insert" on public.conversation_participants for insert
  with check (
    user_id = auth.uid()
    or exists (select 1 from public.conversations c where c.id = conversation_id and c.created_by = auth.uid())
  );
drop policy if exists "participants_delete_self" on public.conversation_participants;
create policy "participants_delete_self" on public.conversation_participants for delete
  using (user_id = auth.uid());

drop policy if exists "messages_read" on public.messages;
create policy "messages_read" on public.messages for select
  using (public.is_conversation_participant(conversation_id, auth.uid()));
drop policy if exists "messages_insert" on public.messages;
create policy "messages_insert" on public.messages for insert
  with check (sender_id = auth.uid() and public.is_conversation_participant(conversation_id, auth.uid()));

create index if not exists messages_conv_idx on public.messages(conversation_id, created_at);
create index if not exists participants_user_idx on public.conversation_participants(user_id);

-- ---------- get-or-create a 1:1 DM (only between accepted connections) ----------
create or replace function public.get_or_create_dm(other uuid)
returns uuid language plpgsql security definer set search_path = public as $$
declare
  me uuid := auth.uid();
  conv uuid;
begin
  if me is null or other is null or me = other then
    raise exception 'invalid participants';
  end if;
  if not exists (
    select 1 from public.connections
    where status = 'accepted'
      and ((requester_id = me and addressee_id = other) or (requester_id = other and addressee_id = me))
  ) then
    raise exception 'not connected';
  end if;
  select c.id into conv
  from public.conversations c
  where c.is_group = false
    and exists (select 1 from public.conversation_participants p where p.conversation_id = c.id and p.user_id = me)
    and exists (select 1 from public.conversation_participants p where p.conversation_id = c.id and p.user_id = other)
    and (select count(*) from public.conversation_participants p where p.conversation_id = c.id) = 2
  limit 1;
  if conv is not null then
    return conv;
  end if;
  insert into public.conversations (is_group, created_by) values (false, me) returning id into conv;
  insert into public.conversation_participants (conversation_id, user_id) values (conv, me), (conv, other);
  return conv;
end; $$;
grant execute on function public.get_or_create_dm(uuid) to authenticated;

-- ---------- create a group with your accepted connections ----------
create or replace function public.create_group(title_in text, member_ids uuid[])
returns uuid language plpgsql security definer set search_path = public as $$
declare
  me uuid := auth.uid();
  conv uuid;
  m uuid;
begin
  if me is null then raise exception 'unauthorized'; end if;
  insert into public.conversations (is_group, title, created_by)
  values (true, coalesce(nullif(trim(title_in), ''), 'Gruppe'), me)
  returning id into conv;
  insert into public.conversation_participants (conversation_id, user_id) values (conv, me);
  foreach m in array coalesce(member_ids, '{}') loop
    if m <> me and exists (
      select 1 from public.connections where status = 'accepted'
        and ((requester_id = me and addressee_id = m) or (requester_id = m and addressee_id = me))
    ) then
      insert into public.conversation_participants (conversation_id, user_id) values (conv, m) on conflict do nothing;
    end if;
  end loop;
  return conv;
end; $$;
grant execute on function public.create_group(text, uuid[]) to authenticated;

-- keep conversations.last_message_at fresh for inbox ordering
create or replace function public.bump_conversation()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  update public.conversations set last_message_at = new.created_at where id = new.conversation_id;
  return null;
end; $$;
drop trigger if exists messages_bump on public.messages;
create trigger messages_bump after insert on public.messages
  for each row execute function public.bump_conversation();

-- ---------- realtime (idempotent) ----------
do $$ begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'messages'
  ) then
    alter publication supabase_realtime add table public.messages;
  end if;
end $$;
