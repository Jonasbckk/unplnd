# UNPLND — Product, Vision, Scope & Navigation

> Sources: 00_VISION (=UNPLND Product Vision.md), 01_MISSION, 03_PERSONAS (=UNPLND User Personas.md), 10_PRD, 11_USER_FLOW, 12_INFORMATION_ARCHITECTURE, 13_MVP_SCOPE, 16_ONBOARDING, 42_ROADMAP_V2, 50_FOUNDER_VISION, README (=UNPLND OS README.md), CLAUDE (=UNPLND Operating Instructions.md).

## Mission & Vision
- "Plan less. Live more." Answer "What should we do today?" with a complete optimized evening in seconds; kill decision fatigue.
- North Star: the first answer to "What should we do?" becomes "Open UNPLND."
- Vision: the operating system for free time. Creates experiences, not recommendations. Founders: Jonas Becker, Flavio Ciraci.
- Every plan should feel "my best friend planned this," never "an algorithm generated this."
- 5 pillars: Planning · Navigation · Memories · Friends · Discovery.

## Personas (6) — primary audience 18–30
1. Weekend Friend Group (18–28) — decision fatigue → full evening <1 min.
2. The Couple (18–35) — dates feel same → every date feels different.
3. The Traveler (18–40) — tourist traps → feels like a local.
4. Last-Minute Planner (16–35) — no time → planning <30s.
5. Memory Collector (18–35) — photos lost → every evening a revisitable memory.
6. Budget Explorer (16–30) — everything expensive → great evenings under €20/€50.
Rule: every feature must name which persona benefits + which problem it solves, else don't build. NOT for: business/corporate/enterprise/travel-agency use.

## Information Architecture — 5 tabs (HARD CAP)
**Home · Discover · Planner · Albums · Profile**
- Home: greeting, weather, continue plan, quick planner, trending, recommended, premium banner.
- Discover: search, categories, trending, seasonal, nearby, collections.
- Planner: mood, budget, group, transport, time, preferences, generate, route.
- Albums: albums, favorites, shared(future), statistics, map memories, search.
- Profile: avatar, stats, premium, favorites, settings, privacy, support, logout.
Global: BottomNav, Toast, LoadingOverlay, ErrorOverlay, NetworkBanner, LocationPermission, PremiumModal.
One global search across restaurants/activities/bars/events/saved/albums. Nav depth: keep ≤3 visible levels + sheets (resolve 3-vs-4 conflict → treat sheets as overlays, not a nav level). One primary action per screen; no dead ends.

## MVP Scope (13) — the acceptance bar
Core loop: **Download → Create account → Generate a complete evening → Navigate it → Automatically receive a memory album.**
INCLUDED: Auth (Email + Apple + Google, guest optional local), Onboarding, Home, AI Planner, Route + Google Maps hand-off, Timeline, Memory Albums, Favorites, Discover, Profile, Settings, Premium, Notifications.
EXCLUDED → V2: Chat, friend requests, groups, voting, public profiles, comments, likes, leaderboards, shared albums, collaborative/live planning, AI chat companion, travel/road-trip modes, challenges, achievements, marketplace, business dashboard, creator program, widgets, Apple Watch, Wear OS, desktop, web.
**Definition of Done (per feature):** UI finished · UX polished · animations · haptics · accessibility · error handling · offline behavior · analytics events · unit tests · integration tests. Missing one = not done. No placeholder/"coming soon"/fake buttons.

## Onboarding (16) — reach Home <60s, target 85% completion
Splash (1–2s animated logo, no buttons) → Welcome → Problem → Solution → Mini Interactive Demo (fake, no real API) → Permissions (explain-then-ask: Location, Notifications) → Authentication → Home.
- Progress = three dots (never "Step 2 of 14"). CTAs: Continue, Generate Demo, Get Started (never Next/Submit). Warm golden-hour backgrounds, no stock photos. Haptics on selections. Skip → Auth. Don't ask preferences/food/hobbies.

## Key User Flows (11)
- Returning user: Launch → Splash → Auto Login → Home (<2s).
- Planner: Mood → Group → Budget → Transport → Time → Preferences → Generate → Loading → Plan → Accept → Navigate. (Note: PRD swaps Budget/Group order — use Planner doc: Mood→Group→Budget.)
- Memory: Complete evening → Ask to Save → Create Album → Import Photos → Cover/Map/Timeline/Weather → Save → Share.
- Notification → deep-link to correct screen (never Home first).
- Error → friendly message → retry (never stack traces, never blame user). Exit → save state → restore instantly (never lose progress).

## Screen Inventory (MVP)
Auth/Onboarding: Splash, Welcome, Problem, Solution, Mini Demo, Location Permission, Notification Permission, Sign Up/Auth, Create Profile.
Tabs: Home, Discover, Planner, Albums, Profile.
Planner: Mood, Group, Budget, Transport, Available Time, Preferences, AI Thinking, Generated Route.
Route: Interactive Map, Timeline, Stop Detail, Navigation hand-off, Completion/Congratulations.
Albums: Albums list, Album Detail, Create Album, Map Memories, Statistics, Search.
Discover: Discover, Collection Detail, Search, Results, Filters.
Favorites: Favorites, Collection, Save Place sheet.
Profile: Profile, Statistics, Premium (comparison/pricing/purchase/confirmation), Settings + sub-screens (Notifications, Privacy, Appearance, Language, Delete Account, Support).
Global overlays: Toast, LoadingOverlay, ErrorOverlay, NetworkBanner, OfflineScreen, PremiumModal, Empty states (NoAlbums/NoFavorites/NoPlans).

## KPIs / Performance
Plan creation <60s · completion rate 70% · album share rate 30% · weekly retention 40% · crash-free 99.9%. Cold launch <2s · generate plan <8s · transitions <300ms · animations 60 FPS (target 120). Home <500ms · Albums <400ms · Profile <300ms. Scale to 1M users without redesign.

## Governance (README + CLAUDE.md)
- The docs are the ONLY source of truth. If a feature isn't documented, it doesn't exist. Never invent/remove/simplify/redesign/rename without instruction.
- Priority on conflict: Feature markdown → Design System → PRD → README → CLAUDE.md; more specific wins. (Overarching: 99_CONSTITUTION is highest.)
- Never become an attention company / addictive social network / vanity-metrics platform. Trust over growth. If revenue vs better experience → choose better experience.

## Roadmap V2+ (42)
Phase 2 Social: friends, shared planning, shared albums, temporary live location, invitations, collaborative memories, private feed. Later: Adventure Packs (premium curated), Memory Map, Adventure Recap, Couple/Group/Travel/Road-Trip modes, local events, reservations, AI personalization, wearables, widgets, desktop, voice. Rejected forever: endless feeds, follower economy, public likes, influencer system, streak pressure, loot boxes, aggressive monetization.
