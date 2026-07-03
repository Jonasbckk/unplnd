# UNPLND — Engineering, Data, Security, Monetization & Launch

> Sources: 29_DATABASE_SCHEMA, 30_API_SPEC, 15_AUTH, 31_SECURITY, 32_OFFLINE_MODE, 28_ANALYTICS, 25_MONETIZATION, 40_CI_CD, 43_LAUNCH_CHECKLIST, 41_APP_STORE (=UNPLND Launch & App Store Strategy.md).
> Docs written for Flutter+Firebase; we build Expo+Supabase. **[ADAPT]** = Firebase→Supabase change.

## DATA MODEL (29)
Root entities (Firestore collections → Postgres tables):
- **users** → `profiles` (PK = auth.users.id UUID): displayName, photoURL(→Storage), premium, language, theme, locationPermission, notificationPermission, favoriteMoods[], favoriteCategories[], settings(jsonb). Keep lightweight. Email stays in auth.users.
- **user stats** → `user_stats` (1:1 or jsonb): plansCreated, plansCompleted, albumsCreated, albumsShared, citiesVisited, favoriteMood, favoriteBudget, totalDistance, totalWalkTime. Precompute via triggers/scheduled function.
- **plans** → `plans` (owner_id FK): status, createdAt, completedAt, route, budget, duration, weather, experienceScore, mood, transport, participants, summary. **route/stops → jsonb (MVP default) OR routes+stops tables (relational).**
  - Route obj: routeId, stops[], totalDistance, totalTime, estimatedCost, createdByAI, version.
  - Stop obj: stopId, placeId, title, category, coordinates(→PostGIS point), arrivalTime, duration, estimatedPrice, status, memoryMoment, alternativePlaces[].
- **albums** → `albums` (owner_id, plan_id FK): title, coverPhoto, city, date, weather, mood, photos, timeline(jsonb), shared(bool), favorite(bool). Photos → `album_photos` (album_id FK): photoId, storagePath(→Storage), caption, takenAt, coordinates. **Never store binaries in DB.**
- **favorites** → **`favorites` join table** (user_id, entity_type enum[place/collection/album/route], entity_id). (NoSQL arrays → relational join.)
- **discover** → `discover_items` (section enum). Backend-managed, public read.
- **notifications** → `notifications` (user_id FK): title, body, type, read, deepLink, expiresAt.
- **feedback** → `feedback` (user_id FK): type, message, appVersion, status.
- **app_config** → `app_config` (single row): minimumVersion, maintenanceMode, featureFlags(jsonb), seasonalTheme, **premiumConfig(jsonb)**.
- **collections** (root) → **GAP: never given fields in docs — needs spec.**
- Future (V2 reserved): friends, groups, shared_albums, messages, year_recaps, adventure_maps, events.

**Mandatory data rules:** UUID PKs (never sequential, never expose internal IDs) · server timestamps only (timestamptz default now(); never trust client) · always paginate (keyset), never unlimited · every row has an owner, enforced by RLS not client · LWW conflict resolution (MVP) · migrations (SQL) replace per-doc schemaVersion · move media to Storage.

## API (30) → [ADAPT] Supabase
- Secret-holding / AI / multi-step endpoints → **Edge Functions (Deno)**: `plans/generate`, `plans/{id}/regenerate` (modes: entire_route/remaining_route/single_stop/category), `plans/{id}/replace-stop`, `plans/{id}/complete`, `albums/create`, `albums/{id}/share`, `weather` (cache 15min), `places/nearby` (holds Google key).
- Simple owned CRUD → **PostgREST + RLS**: GET/PATCH/DELETE plans & albums, favorites add/remove, feedback, complete-stop (server timestamp).
- Search → Postgres FTS (tsvector/pg_trgm) now, semantic later.
- Error envelope (mandatory): `{ "error": { "code","message","retryable" } }`; codes: AUTH_REQUIRED, PERMISSION_DENIED, VALIDATION_FAILED, PLAN_GENERATION_FAILED, NO_VALID_ROUTE, RATE_LIMITED, NETWORK_ERROR, SERVER_ERROR. Never stack traces.
- Version under `/v1`. Validate every input server-side. Targets: standard <300ms, plan gen <8s, album <5s, search <500ms. Log request id/user id/latency/error code only.

## AUTH (15) → [ADAPT] Supabase Auth
Methods (priority): **Apple (iOS), Google, Email+Password**. Future: Passkeys, Phone, Magic Link.
- Splash restores session <2s. Password: min 8 + upper/lower/number/special, **live validation** — **[ADAPT] Supabase only enforces min length → add client + Edge Function/DB check.**
- Forgot password never reveals if email exists (Supabase-aligned). Email verification gates *sensitive actions*, not exploration.
- Guest mode → Supabase anonymous sign-in; cannot create albums/sync/premium.
- Session: silent JWT refresh; persist in **Expo SecureStore**. Logout clears tokens, keeps theme/language/a11y.
- **Delete account → service-role Edge Function** (auth.admin.deleteUser) + ON DELETE CASCADE + Storage cleanup + analytics anonymize. GDPR real deletion.
- Never ask birthday/gender/interests at auth. Map Supabase errors to friendly copy.

## SECURITY (31) → [ADAPT] RLS
- Principles: least privilege, server-side validation, encrypted transport, secure storage, no secrets in client, privacy by default, user control.
- **Enable RLS on every table.** Ownership: `USING (owner_id = auth.uid())` + `WITH CHECK`. Shared albums via `album_shares` table policy. **Storage RLS** on path prefix = auth.uid(); shared exception.
- Secrets in **Edge Function env**, never in Expo bundle. Service-role key server-only. (Anon key ships public — safe only because RLS.)
- Location: only during active planning/evening; never background-track; never sell; reduce precision in shared content.
- Photos: never auto-upload/analyze/share; never expose metadata by default.
- Data minimization: don't collect gender/birthday/contacts/precise history unless a feature needs it.
- GDPR: export + real deletion + consent. Rate-limit AI gen/search/feedback/album/auth → **[ADAPT] Edge Function counters** (Supabase only rate-limits auth). **App Check → [ADAPT] App Attest/Play Integrity or documented GAP (no 1:1).**
- HTTPS only; no sensitive data in URLs. Never log passwords/tokens/photos/notes/raw prompts.

## OFFLINE (32) → [ADAPT] BIGGEST GAP: build custom sync layer
Online-first (need net): AI planning, Discover, Search, Weather, Nearby, Partner content.
Offline-first (must work): **Albums, Favorites, Current route, Completed routes, Settings, Profile, Memory timeline.**
Active evening must survive connection loss: continue navigation/timeline/stop-completion, store locally, sync silently.
Cache: current route, last 20 albums, favorites, recent plans, settings, profile.
**[ADAPT]** Firestore's automatic offline doesn't exist in Supabase → build: local store (**SQLite/MMKV**), **mutation outbox** (favorite/album-edit/stop-complete/profile-update replayed on reconnect), **LWW via updated_at**, NetInfo for Online/Limited/Offline/Syncing, Expo FileSystem photo cache + Storage upload queue, map-tile cache w/ simplified fallback. Offline copy: "You're offline. Your memories are still available." Target <200ms offline load. Never block albums, never lose actions, never show technical errors.

## ANALYTICS (28) → [ADAPT] PostHog/Amplitude + Sentry (no Firebase)
North Star = **Completed Evenings**. Secondary: albums created/revisited, plans generated, routes started/completed, hidden gems, cities, avg route score, premium conversion, retention (D1/7/30/90). NEVER optimize: screen time, session length, notification opens, feed views, follower count.
Event format `feature_action`. Canonical union: planner_started/completed, route_opened, album_shared, favorite_added, premium_purchased, auth_screen_view, login_started/success/failed, register_started/success, logout, account_deleted, offline_mode_entered, offline_sync_started/completed, offline_conflict, cache_hit/miss. Props: mood, budget range, group size, transport, generation time, route score — no PII. Never store message/photo/location/passwords/notes. A/B ok on onboarding/copy/animations/premium/planner — never on privacy/security/core.

## MONETIZATION (25)
Single subscription = **UNPLND Premium** (Monthly + Yearly, annual encouraged). **Core stays free**: create plans, generate routes, navigate, create albums, save favorites, use Discover. Premium: unlimited AI gens, advanced filters, multiple alternatives, priority gen, exclusive collections, premium album themes, extended history, early access.
Free soft limit example: **5 AI plans/week** then wait or upgrade. **Albums always unlimited — never lock memories.** Paywall only after first successful evening, never on launch.
**⚠️ PRICE GAP: no price is stated anywhere in the docs** (the prompt's "€4.99/month" is NOT in the bible). Must be decided; store in `app_config.premiumConfig`.
No ads of any kind. No fake urgency, no hidden cancellation, no dark patterns. **[ADAPT]** IAP via App Store/Play billing (RevenueCat recommended; expo-in-app-purchases deprecated) → webhook → Edge Function → set `profiles.premium`. Gate premium server-side.

## CI/CD (40) → [ADAPT]
GitHub + GitHub Actions + branch protection. Branches: main (prod), develop, feature/*, hotfix/*, release/*. Never commit to main. PR needs: passing CI, build, ≥1 review, description. Commits: feat/fix/refactor/docs/style/test.
Quality gates [ADAPT]: flutter analyze→**ESLint+tsc**, dart format→**Prettier**, flutter test→**Jest+RN Testing Library**, build→**EAS Build**. Release: tag → build iOS+Android → TestFlight + Play Internal → **manual approval** → prod. Secrets in GitHub Secrets. Semantic versioning. Dev/Staging/Prod separate. Daily DB backup ([ADAPT] Supabase backups). Deploy target [ADAPT]: Firebase → **Supabase migrations + Edge Function deploy**.

## LAUNCH (43 + 41)
Release only if: no critical bugs, core feels premium, mission intact. Founder sign-off (Jonas + Flavio).
Checklist groups: Product, Design (DS respected, dark/light, all states), Performance, Accessibility (touch ≥44×44), Offline, Security (**RLS tested** [ADAPT], secrets removed, HTTPS, rate limits, account deletion), Privacy (policy+terms published, GDPR export/delete), Analytics, Notifications (**Expo push** [ADAPT], quiet hours 22:30–08:00), AI (validation, budget, hours, no hallucination), Backend, Testing, App Store + Play assets, Legal, Marketing, Support, Monitoring (Sentry [ADAPT]).
Positioning: category **Lifestyle** (secondary Travel). Name UNPLND. Subtitle "Plan less. Live more." Keywords: Evening Planner, Date Ideas, Things To Do, Weekend, Adventure, Friends, Couples, Travel, Memories, Hidden Gems, Experiences. Icon works at 48px, no text, dark-mode ready. Screenshots order: Home→Planner→Route→Album→Discover→Profile. Preview video 20–30s, music only. Ask rating only after a completed evening/album. Soft launch: **Germany, Switzerland, Austria** (opt. Portugal). Privacy-first / no ads / no data selling messaging.

## CRITICAL GAPS TO RESOLVE
1. **Premium price undefined** (decide before launch; not blocking for build).
2. `/collections` root entity has no field spec.
3. **App Check** has no Supabase equivalent (App Attest/Play Integrity or accept gap).
4. **Firestore offline → must be hand-built** (biggest engineering delta).
5. Analytics/crash re-sourced to PostHog + Sentry.
6. FCM → Expo push everywhere.
7. Rate limiting must be built in Edge Functions.
8. Password complexity enforced client + server (Supabase min-length only).
9. Route/Stop storage: **jsonb (MVP default)** vs relational tables.
10. Error envelope normalization over PostgREST.
