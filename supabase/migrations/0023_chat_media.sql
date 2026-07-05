-- Photos in chat — a message can carry an image stored in the private chat-media bucket.
-- Path convention: {conversation_id}/{file}, so the first folder segment is the conversation.

alter table public.messages add column if not exists image_path text;

-- Bucket is created in the dashboard (private); this keeps migrations self-describing / idempotent.
insert into storage.buckets (id, name, public)
values ('chat-media', 'chat-media', false)
on conflict (id) do nothing;

-- Only conversation participants may read or upload the images (reuses is_conversation_participant).
drop policy if exists chat_media_read on storage.objects;
create policy chat_media_read on storage.objects for select to authenticated
  using (
    bucket_id = 'chat-media'
    and public.is_conversation_participant(((storage.foldername(name))[1])::uuid, auth.uid())
  );

drop policy if exists chat_media_insert on storage.objects;
create policy chat_media_insert on storage.objects for insert to authenticated
  with check (
    bucket_id = 'chat-media'
    and public.is_conversation_participant(((storage.foldername(name))[1])::uuid, auth.uid())
  );

drop policy if exists chat_media_delete on storage.objects;
create policy chat_media_delete on storage.objects for delete to authenticated
  using (
    bucket_id = 'chat-media'
    and owner = auth.uid()
  );
