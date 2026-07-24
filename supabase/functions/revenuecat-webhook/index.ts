// UNPLND — RevenueCat webhook → profiles.premium (the server truth behind usePremium).
// RevenueCat calls this on every entitlement change, so premium survives reinstalls,
// cross-device logins and refunds without the app ever holding a secret.
//
// Deploy (MUST skip JWT verification — RevenueCat is not a Supabase user):
//   npx supabase functions deploy revenuecat-webhook --no-verify-jwt
// Secrets (Dashboard → Edge Functions → Secrets, or `npx supabase secrets set`):
//   REVENUECAT_WEBHOOK_SECRET=<long random string>
// RevenueCat (dashboard → Project → Integrations → Webhooks):
//   URL   = https://<project-ref>.supabase.co/functions/v1/revenuecat-webhook
//   Authorization header value = the same secret, verbatim.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

/**
 * EXPIRATION events are per-SUBSCRIPTION, but a user can hold several purchases (the paywall
 * sells monthly, yearly AND lifetime). Before clearing premium we ask RevenueCat whether ANY
 * entitlement is still active — otherwise a lapsed old monthly would wrongly strip a lifetime
 * buyer. Needs the optional REVENUECAT_API_KEY secret (sk_…); without it we clear on
 * EXPIRATION as before (correct for the common single-subscription case).
 */
async function hasActiveEntitlement(userId: string): Promise<boolean> {
  const key = Deno.env.get('REVENUECAT_API_KEY');
  if (!key) return false;
  try {
    const res = await fetch(`https://api.revenuecat.com/v1/subscribers/${encodeURIComponent(userId)}`, {
      headers: { Authorization: `Bearer ${key}` },
    });
    if (!res.ok) return false;
    const data = await res.json();
    const entitlements = data?.subscriber?.entitlements ?? {};
    const now = Date.now();
    return Object.values(entitlements).some((e) => {
      const expires = (e as { expires_date?: string | null }).expires_date;
      return expires == null || new Date(expires).getTime() > now;
    });
  } catch {
    return false;
  }
}

// The app configures Purchases with appUserID = the Supabase auth user id, so events
// normally carry a UUID. A purchase made before login shows up under RevenueCat's
// anonymous id instead — then the real user is somewhere in `aliases`.
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function userIdOf(event: { app_user_id?: string; aliases?: string[] }): string | null {
  if (event.app_user_id && UUID.test(event.app_user_id)) return event.app_user_id;
  return (event.aliases ?? []).find((a) => UUID.test(a)) ?? null;
}

// Which way an event moves the switch. Deliberately conservative:
// - CANCELLATION only turns auto-renew off — the user stays premium until EXPIRATION.
// - BILLING_ISSUE opens a grace period — RevenueCat sends EXPIRATION when it's truly over.
const GRANTS = new Set([
  'INITIAL_PURCHASE',
  'RENEWAL',
  'UNCANCELLATION',
  'PRODUCT_CHANGE',
  'NON_RENEWING_PURCHASE',
  'SUBSCRIPTION_EXTENDED',
]);

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return Response.json({ error: 'method_not_allowed' }, { status: 405 });
  }

  const secret = Deno.env.get('REVENUECAT_WEBHOOK_SECRET');
  if (!secret || req.headers.get('Authorization') !== secret) {
    return Response.json({ error: 'unauthorized' }, { status: 401 });
  }

  let event: {
    type?: string;
    app_user_id?: string;
    aliases?: string[];
    transferred_from?: string[];
    transferred_to?: string[];
  };
  try {
    event = (await req.json())?.event ?? {};
  } catch {
    return Response.json({ error: 'bad_request' }, { status: 400 });
  }

  const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

  const setPremium = async (ids: string[], premium: boolean) => {
    const valid = ids.filter((id) => UUID.test(id));
    if (valid.length === 0) return;
    const { error } = await admin.from('profiles').update({ premium }).in('id', valid);
    if (error) throw error;
  };

  try {
    switch (event.type) {
      case 'TEST':
        // The dashboard's "send test event" button — prove the wiring, touch nothing.
        return Response.json({ ok: true, test: true });

      case 'TRANSFER':
        // Entitlement moved between accounts (e.g. same Apple ID, new UNPLND account).
        await setPremium(event.transferred_from ?? [], false);
        await setPremium(event.transferred_to ?? [], true);
        return Response.json({ ok: true });

      case 'EXPIRATION': {
        const userId = userIdOf(event);
        if (userId && !(await hasActiveEntitlement(userId))) {
          await setPremium([userId], false);
        }
        return Response.json({ ok: true });
      }

      default: {
        if (!GRANTS.has(event.type ?? '')) {
          // CANCELLATION, BILLING_ISSUE, unknown future types: acknowledged, no state change.
          return Response.json({ ok: true, ignored: event.type ?? 'unknown' });
        }
        const userId = userIdOf(event);
        if (!userId) {
          // Anonymous purchase with no aliased account yet — RevenueCat re-sends via
          // TRANSFER once the user logs in, and restorePurchases covers the client side.
          return Response.json({ ok: true, ignored: 'no_user' });
        }
        await setPremium([userId], true);
        return Response.json({ ok: true });
      }
    }
  } catch {
    // Non-2xx makes RevenueCat retry with backoff — exactly what we want on a DB hiccup.
    return Response.json({ error: 'update_failed' }, { status: 500 });
  }
});
