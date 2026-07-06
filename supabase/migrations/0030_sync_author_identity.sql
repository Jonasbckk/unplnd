-- 0030: Published plans always show the author's CURRENT name + avatar.
--
-- published_plans stores author_name/author_avatar as a snapshot taken at publish time,
-- so changing your profile picture left old plans showing the old photo forever.
-- Fix: a trigger keeps the denormalized copies in sync whenever the profile changes,
-- plus a one-time backfill so existing plans reflect the live profile immediately.

create or replace function public.sync_published_author_identity()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.published_plans
     set author_name   = coalesce(new.display_name, author_name),
         author_avatar = new.photo_url
   where author_id = new.id;
  return new;
end;
$$;

drop trigger if exists trg_sync_published_author on public.profiles;
create trigger trg_sync_published_author
after update of display_name, photo_url on public.profiles
for each row
when (
  old.display_name is distinct from new.display_name
  or old.photo_url is distinct from new.photo_url
)
execute function public.sync_published_author_identity();

-- One-time backfill: existing published plans adopt the live profile identity.
update public.published_plans pp
   set author_name   = coalesce(p.display_name, pp.author_name),
       author_avatar = p.photo_url
  from public.profiles p
 where p.id = pp.author_id;
