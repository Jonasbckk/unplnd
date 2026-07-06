-- Voice messages — a message can carry an audio recording (stored in the chat-media bucket,
-- same private/participant-only storage rules as photos).

alter table public.messages add column if not exists audio_path text;
alter table public.messages add column if not exists audio_duration int; -- seconds
