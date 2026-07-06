-- Meeting point — a message can carry a shared location { lat, lng, label }.

alter table public.messages add column if not exists location jsonb;
