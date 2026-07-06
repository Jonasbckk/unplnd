-- Group profile picture — creator-only, stored in the public avatars bucket.

alter table public.conversations add column if not exists avatar_url text;

create or replace function public.set_group_avatar(conv uuid, url text)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_group_creator(conv, auth.uid()) then raise exception 'not the group creator'; end if;
  update public.conversations set avatar_url = url where id = conv;
end; $$;
grant execute on function public.set_group_avatar(uuid, text) to authenticated;
