-- UNPLND 0039 — entitlement columns are server truth, not user preferences.
--
-- The profiles_update_own RLS policy (0001) lets a user update their own row — with no
-- column restriction. That meant any signed-in client could run
--   supabase.from('profiles').update({ premium: true })
-- and grant itself Premium (and worse, is_founder → ops metrics + founder unlocks).
-- Docs: 25_MONETIZATION "gate premium server-side", 31_SECURITY.
--
-- Fix: a BEFORE UPDATE trigger that silently keeps the old values unless the change comes
-- through the service role (Edge Functions: revenuecat-webhook) or the SQL editor
-- (postgres — set-founders.sql, premium-preview.sql keep working unchanged).
-- Silent revert, not an error: the client UI never legitimately writes these columns, and a
-- probing client learns nothing.
--
-- verify_level is NOT guarded here: it has its own ratchet trigger (0037) and is written by
-- the client on purpose (earned levels sync up, never down).

-- INVOKER semantics on purpose (no `security definer`!): inside a definer function
-- current_user would always be the OWNER ('postgres') and the clamp would never fire.
-- As invoker, current_user is the REQUEST role for direct client queries
-- ('authenticated'/'anon' → clamped), 'service_role' for Edge Functions, and 'postgres'
-- inside our own SECURITY DEFINER RPCs and the SQL editor (→ pass).
-- (Deliberately not auth.jwt(): the JWT claims survive into definer functions and
-- would block our own RPCs.)
create or replace function public.protect_entitlement_columns()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if current_user in ('authenticated', 'anon') then
    if tg_op = 'UPDATE' then
      new.premium := old.premium;
      new.is_founder := old.is_founder;
    else
      -- profiles_insert_own exists, so close the upsert/insert door too.
      new.premium := false;
      new.is_founder := false;
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_protect_entitlements on public.profiles;
create trigger trg_protect_entitlements
  before update of premium, is_founder on public.profiles
  for each row
  execute function public.protect_entitlement_columns();

drop trigger if exists trg_protect_entitlements_insert on public.profiles;
create trigger trg_protect_entitlements_insert
  before insert on public.profiles
  for each row
  execute function public.protect_entitlement_columns();
