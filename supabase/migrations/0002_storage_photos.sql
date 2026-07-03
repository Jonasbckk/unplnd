-- UNPLND — private photo storage for memory albums (Memory Album Spec: photos never public by default).
-- Run once in the Supabase SQL Editor.

insert into storage.buckets (id, name, public)
values ('photos', 'photos', false)
on conflict (id) do nothing;

-- Owner-only access; path convention: {user_id}/{album_id}/{file}.jpg
create policy "photos_owner_select" on storage.objects for select
  using (bucket_id = 'photos' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "photos_owner_insert" on storage.objects for insert
  with check (bucket_id = 'photos' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "photos_owner_delete" on storage.objects for delete
  using (bucket_id = 'photos' and auth.uid()::text = (storage.foldername(name))[1]);
