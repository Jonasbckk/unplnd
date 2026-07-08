# UNPLND — Build Charter (read this first, every session)

> **Starting a session / picking up work?** Read `HANDOFF.md` in the repo root first — it holds the current project state, what was done last, and what's still open. (Claude Code sessions don't sync across machines, so `HANDOFF.md` + `git log` are how a new session — or a new teammate — gets caught up.)

UNPLND — "Plan less. Live more." A premium consumer mobile app that plans an unforgettable evening with friends in seconds (conversational AI Planner → route + navigation → automatic Memory Album), then gets out of the way so people live real life. Founders: Jonas Becker, Flavio Ciraci.

## 0. Source of truth & reading order
1. `docs/99_CLAUDE_CONSTITUTION.md` — **highest authority, immutable.**
2. This `CLAUDE.md` — build charter (stack + resolved decisions).
3. `docs/_synthesis/00–05` — condensed, faithful synthesis of all 50 docs (read these to get oriented fast).
4. `docs/*.md` — the full bible (50 docs). **Before implementing any feature, re-read its specific doc(s) in full.**

Doc priority on conflict: **Constitution → Brand Guidelines → Design System → Component Library → Copywriting → PRD → Feature specs → Engineering → Roadmap.** More specific wins. If a feature isn't documented, it doesn't exist — never invent, remove, or silently redesign; ask.

## 1. The mission is non-negotiable (Constitution, condensed)
Real life first (help users *leave* the app). Quality over quantity. Emotion over efficiency. Trust is sacred — no dark patterns, no fake urgency, never sell data. Technology is invisible — **never mention AI/algorithms/prompts to users.** The Planner is a conversation, not a form. Albums are emotional artifacts, not galleries. Social supports real meetings — no vanity metrics. Every screen needs a purpose + a moment of delight. Accessibility & dark mode are mandatory, never optional. Build for years.

## 2. Tech stack (LOCKED — overrides the docs' Flutter/Firebase)
The bible was written for Flutter+Firebase; the founder deliberately chose **React Native + Expo + Supabase** (Windows dev + iOS mandatory via EAS, no Mac needed; Supabase fits social/relational data + RLS privacy). Translate the docs' Flutter/Firebase *intent* to:

| Concern | Docs (intent) | We build with |
|---|---|---|
| Framework | Flutter/Dart | **React Native + Expo (TypeScript)** |
| Routing | GoRouter | **Expo Router** (file-based; deep links, auth guards) |
| Server state | — | **TanStack Query** |
| Client/UI state | Riverpod | **Zustand** (predictable, testable, minimal global state) |
| Backend | Firebase | **Supabase** (Postgres, Auth, Storage, Edge Functions, Realtime) |
| Authorization | Firestore Rules | **Postgres Row Level Security** on every table |
| DB | Firestore (NoSQL) | **Postgres** (relational; route/stops = jsonb for MVP) |
| Serverless | Cloud Functions | **Supabase Edge Functions (Deno)** — hold all secrets |
| Auth | Firebase Auth | **Supabase Auth** (Apple, Google, Email; +client/server password complexity) |
| Push | FCM | **Expo Notifications** + local notifications |
| Offline | Firestore cache | **Custom sync layer**: SQLite/MMKV + mutation outbox + LWW |
| Secure store | flutter_secure_storage | **Expo SecureStore** |
| Networking | Dio | supabase-js + fetch |
| Maps | Google Maps SDK | **Google Maps/Places** (via `react-native-maps`); keys held server-side in Edge Functions |
| AI | provider-agnostic | AI **service layer** in an Edge Function; strict JSON; provider swappable |
| Analytics/Crash | Firebase Analytics/Crashlytics | **PostHog/Amplitude + Sentry** |
| IAP | — | **RevenueCat** → webhook → Edge Function → `profiles.premium` |
| CI/CD | GitHub Actions + Firebase deploy | GitHub Actions + **EAS Build/Submit** + Supabase migrations |

Never add a technology not implied here without approval.

## 3. Proposed project structure (feature-first)
```
/app                      # Expo Router routes (thin; delegate to features)
/src
  /theme                  # design tokens: colors, typography, spacing, radii, motion, haptics
  /components/ui          # shared design-system components (Button, Card, BottomSheet, …)
  /features/<feature>     # onboarding, home, planner, route, albums, discover, profile, settings, auth
      /components /hooks /api /store /types  (per feature, isolated)
  /lib                    # supabase client, maps, weather, ai service layer, notifications, offline sync
  /providers              # app-wide providers (query client, theme, auth, connectivity)
  /utils
/assets                   # images, icons, illustrations, fonts, brand
/supabase                 # migrations/ + functions/ (Edge Functions)
```

## 4. Resolved spec conflicts (defaults — see synthesis for detail)
- Design tokens: colors/type/motion from `06`/`07`/`09`; **radii & component dims from `08_COMPONENTS`** (Card 28, Sheet 32, Primary Button 20); spacing = 05 superset (4,8,12,16,24,32,40,48,64,80,96).
- Body text `#3A2F2A`, headings/nav Coffee Brown `#6D4C41`. Motion ceiling 600ms; tap 120/180ms. Max ONE emoji per message. Icons: rounded outlined, consistent stroke.
- Planner step order: **Mood → Group → Budget → Transport → Time → Preferences** (Planner doc wins over PRD).
- Nav: 5 tabs (Home·Discover·Planner·Albums·Profile), keep ≤3 visible levels + sheets as overlays.
- Route/Stop persistence: **jsonb on `plans` for MVP** (mirrors AI JSON), normalize later if needed.
- **Location: NO silent city fallback** (founder decision 2026-07-03). If permission is denied/unavailable, planning is blocked with a friendly explain+enable state — never plan for a default city.

## 5. Definition of Done (every feature)
UI finished · UX polished · animations · haptics · **dark mode** · accessibility (VoiceOver, Dynamic Type, Reduce Motion, ≥44×44) · error handling · offline behavior defined · analytics events · unit + integration/component tests. No placeholders, no "coming soon", no fake buttons, no dead code, no exposed AI/errors. Reuse components before building new ones ("Screens are temporary. Components are forever.").

## 6. Working method (from the founder's prompt)
Before a feature: read its doc(s) → explain the plan → flag architectural concerns → suggest improvements → ask only if a critical decision needs it; otherwise continue autonomously. If you find a better solution than the docs, don't silently replace — explain why + trade-offs + migration impact, then ask. Optimize for product quality, maintainability, scalability, user trust, and memorable real-world experiences — not speed of development.

## 7. Open items (non-blocking for foundation)
Premium **price is undefined in the docs** (decide before launch). `/collections` entity needs a field spec. App Check has no Supabase 1:1 (App Attest/Play Integrity later). Google Maps / Weather / AI provider / Supabase / Apple Developer accounts + keys needed before the Planner runs live.
