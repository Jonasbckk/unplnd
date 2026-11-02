-- UNPLND — welche Migrationen sind in der Datenbank wirklich angewendet?
-- Im Supabase-Dashboard → SQL Editor einfügen und ausführen. Nur lesend, ändert nichts.
-- Jede Zeile muss applied = true zeigen. Bei false: die genannte Migration (und alle danach)
-- in Reihenfolge aus supabase/migrations/ ausführen.

select * from (values
  ('0028 ops_metrics',              to_regprocedure('public.ops_metrics()') is not null),
  ('0030 sync author trigger',      exists (select 1 from pg_trigger where tgname = 'trg_sync_published_author')),
  ('0031 plans.place_ids',          exists (select 1 from information_schema.columns
                                            where table_schema = 'public' and column_name = 'place_ids')),
  ('0034 album_highlights',         to_regclass('public.album_highlights') is not null),
  ('0035 album_highlights.title',   exists (select 1 from information_schema.columns
                                            where table_schema = 'public' and table_name = 'album_highlights'
                                              and column_name = 'title')),
  ('0036 live_locations',           to_regclass('public.live_locations') is not null),
  ('0037 verify_level ratchet',     exists (select 1 from pg_trigger where tgname = 'trg_ratchet_verify_level')),
  ('0038 plans.progress',           exists (select 1 from information_schema.columns
                                            where table_schema = 'public' and table_name = 'plans'
                                              and column_name = 'progress')),
  ('0038 get_live_evening',         to_regprocedure('public.get_live_evening(uuid)') is not null),
  ('0039 entitlement guard UPDATE', exists (select 1 from pg_trigger where tgname = 'trg_protect_entitlements')),
  ('0039 entitlement guard INSERT', exists (select 1 from pg_trigger where tgname = 'trg_protect_entitlements_insert')),
  ('0040 profiles.is_creator',      exists (select 1 from information_schema.columns
                                            where table_schema = 'public' and table_name = 'profiles'
                                              and column_name = 'is_creator')),
  ('0040 guard covers is_creator',  coalesce((select prosrc like '%is_creator%' from pg_proc
                                              where proname = 'protect_entitlement_columns' limit 1), false)),
  ('0040 creator_applications',     to_regclass('public.creator_applications') is not null),
  ('0040 review RPC',               to_regprocedure('public.review_creator_application(uuid, boolean)') is not null)
) as t(migration, applied);

-- Bonus-Check Sicherheitslücke: Wer hat aktuell premium / is_founder / is_creator?
-- Vor 0039 konnte sich jeder selbst freischalten — unerwartete Einträge hier prüfen.
select id, display_name, premium, is_founder,
       (to_jsonb(p) ->> 'is_creator')::boolean as is_creator
from public.profiles p
where premium or is_founder or coalesce((to_jsonb(p) ->> 'is_creator')::boolean, false)
order by is_founder desc, premium desc;
