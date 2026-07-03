# UNPLND — Synthesis: Memories, Social, Profile, Settings & Notifications

> Condensed from: `Memory Album Specification.md` (CRITICAL/MVP), `27_SOCIAL_VISION.md` (Future/V2+), `22_PROFILE.md` (HIGH/MVP), `23_SETTINGS.md` (MEDIUM/MVP), `33_NOTIFICATIONS.md` (HIGH/MVP).

## 1. MEMORY ALBUM (CRITICAL / MVP)
**Philosophy:** the album is the *emotional reward* for completing an experience. "Do not build a photo gallery. Build a memory." Feels like opening an old photo box years later.

**Auto-generated fields:** Title, Date, City, Weather, Route, Visited places, Timeline, Photos (user-selected, NOT auto), Cover image (auto), Estimated distance, Duration, Mood (drives color accents).

**Cover:** cover photo, date, city, mood color, minimal typography, warm paper texture — "like a printed postcard."

**Timeline:** chronological stops, e.g. `18:30 Dinner ↓ 20:15 Mini Golf ↓ 22:10 Cocktails ↓ 23:45 Night Walk`.

**Weather Card:** temp, condition, sunset time, small illustration. e.g. "22°C • Clear Sky / A perfect summer evening."

**Route Map:** simplified, completed route only (NOT turn-by-turn), soft connecting line — visual storytelling.

**Memory Notes (optional):** headline, description, funny moment, quote, inside joke, journal entry.

**Mood (single-select, drives accents):** ❤️ Romantic, Relaxed, Party, ☕ Cozy, Adventure, Luxury. *(some emoji corrupted in source — labels authoritative)*

**Memory Moments (badges):** Best View, Hidden Gem, Golden Hour, Most Laughed, Best Food, Late Night.

**Statistics (optional):** Distance, Time, Budget, Stops, Photos, Walking — RULE: never dominate; emotion first, data second.

**Creation:** auto-suggested after evening ends → Create now / Create later / Discard. Never forced. Fully editable.

**Detail screen order:** Cover → Timeline → Photos → Weather Card → Route Map → Memory Notes → Memory Moments → Statistics.

**Photos:** user chooses; never upload without consent; future = on-device suggestions.

**Sharing:** Story / Image / Link / PDF(future). Private by default. Location precision reduced when shared publicly. Photos never shared automatically.

**Search:** City, Mood, Date, People(future), Season, Activity, Restaurant. **Favorites** appear at top.

**Visual:** scrapbooks/polaroids/travel journals/vintage paper. Never imitate Instagram; never heavy filters.

**Empty state:** "Your memories are waiting." / "Complete your first evening to create your first album." / CTA "Plan Tonight".

**Animation:** cover expands → pages slide → photos appear → timeline fades. **Haptics:** open=Light, favorite=Selection, share=Light, created=Success.

**Offline:** albums available offline; photos cached; metadata local; sync when online.

**Analytics:** album_created, album_opened, album_shared, album_favorited, album_deleted, memory_note_added.

**Golden rule:** "People don't collect photos. They collect moments."

## 2. SOCIAL VISION (FUTURE / V2+ — NOT MVP)
Social strengthens real-world relationships, never replaces them. Principles: real-world first, privacy first, **friends over followers**, experiences over content.
- **Friends:** add via username, QR, contacts(optional), invite link. Never require public profiles.
- **Collaborative/Group planning:** host invites → members vote on Mood/Budget/Time/Transport → AI balances → everyone gets same route.
- **Shared Albums:** multi-contributor, private by default, optional comments.
- **Chat:** coordinate an evening only — not a messaging app. No channels/communities.
- **Temporary live location:** only during active evening, auto-ends. No continuous tracking.
- **Adventure Feed:** private, friends-only, chronological. No algorithm, no endless feed.
- **Safety:** block, report, leave shared album, remove self, delete own content.
- Social stays **free** — never paywall collaboration.
- **DO NOT:** follower counts, influencers, endless feeds, reward popularity, imitate Instagram/Snapchat.
- Claude rule: "If a feature increases screen time without improving real-life experiences, it does not belong in UNPLND."

## 3. PROFILE (HIGH / MVP)
"Not an account page — the user's personal story." Celebrates moments, not followers.
**Layout order:** Header → Adventure Summary → Statistics → Memory Map → Recent Albums → Favorites → Achievements(Future) → Settings → Logout.
- **Header:** picture, display name, member since, premium badge, edit profile.
- **Adventure Summary (hero card):** e.g. "42 Evenings Planned / 18 Memories Created / 6 Cities Explored / 248 km Walked / €740 Saved Under Budget."
- **Statistics:** favorite mood, favorite activity, avg budget, avg evening length, most visited city, favorite restaurant category, **current streak**.
- **Memory Map:** interactive, clusters memories, tap marker → album.
- **Recent Albums:** horizontal scroll, newest first.
- **Favorites:** saved places, collections, routes.
- **Premium section:** only if not premium, elegant, never aggressive.
- **No level/XP/points system** — only Current Streak + per-album Memory Moments. Achievements/Badges/Challenges = Future.
**Empty state:** "Your story starts tonight." / "Plan your first evening and begin your adventure." / CTA "Plan My Evening".
**Perf:** profile <300ms; albums cached; map lazy; stats precomputed.
**DO NOT:** follower/like counts, encourage comparison, become a social network. "Profile exists for reflection, not validation."

## 4. SETTINGS (MEDIUM / MVP)
"The best settings page is the one users almost never need." Sensible defaults; customize only where it adds value.
**Order:** Profile → Appearance → Notifications → Privacy → Location → Language → Support → Legal → Account.
- **Appearance:** Light / Dark / System. Instant preview, no restart.
- **Notifications toggles:** Master; Evening Reminders; Album Ready; Weather Changes; New Features; Marketing (OFF by default).
- **Privacy:** Location Access, Photo Access, Analytics, Personalization, Data Export, Delete Account (each with short explanation).
- **Location:** Always / While Using / Never + status + link to system settings.
- **Language:** English, Deutsch now; Future: Français, Español, Italiano, Polski, Português. No restart.
- **Support:** Help Center, Contact, Report Bug, Suggest Feature, Privacy Policy, Terms, Rate.
- **Legal:** Privacy, Terms, Licenses, Open Source, Version, Build.
- **Account:** Email, Connected Providers, Password, Premium Status, Logout, Delete Account.
- **Premium:** current plan, manage subscription, restore purchases, upgrade — never hide subscription management.
- **Feature Preferences (optional):** auto-create albums, weather-based suggestions, memory reminders, reduce animations.
**Haptics:** toggle=Selection, logout=Medium, delete account=Warning.
**DO NOT:** expose technical settings, overwhelm, require restart, bury privacy controls. "Works beautifully out of the box."

## 5. NOTIFICATIONS (HIGH / MVP)
Every notification must answer: **Why now? Why this user? What value?** "Silence is better than a useless notification."
**Categories:** Planning, Evening, Albums, Weather, Friends(Future), System, Premium.
- **Planning:** evening about to start; never multiple reminders. "Your evening starts in one hour. Ready to go?" → Continue Plan.
- **Evening:** live, only if useful. "Time for your next stop." / "Beautiful sunset in 20 minutes."
- **Albums:** one notification only, never remind again. "Your memory album is ready." → Open Album.
- **Weather:** only meaningful changes. "Rain expected in 30 minutes. Indoor alternative available."
- **Friends (Future):** invitations, shared album, friend joined. No social spam.
- **System:** rare only.
- **Premium:** major features only, max 1/month, opt-in.
**Smart timing:** never during sleep, driving, active use, meetings(future).
**Quiet hours default 22:30–08:00** (customizable).
**Deep links:** every notification opens the correct screen, never Home unnecessarily.
**Delivery split:** Local (offline: upcoming evening, next stop, album/offline reminders) vs Push (backend events, shared albums, invites, major updates — needs push service).
**Copy:** human only. Bad (forbidden): "COME BACK NOW!", "LIMITED OFFER!", "Don't miss out!".
**Analytics:** notification_sent/opened/dismissed, deep_link_opened. Never optimize for open rates alone.
**DO NOT:** daily engagement reminders, fake urgency, spam, FOMO, irrelevant promos.

## 6. KEY GAPS / DECISIONS
1. Corrupted emoji in source for several moods/moments/reactions — labels authoritative, confirm exact emoji later.
2. Mood = single-select enum per album, aggregable for profile "favorite mood".
3. Three distinct badge concepts (Memory Moments MVP; Achievements/Badges/Challenges Future) — no XP/levels.
4. Photo consent vs future Shared Albums — shared upload IS the consent act.
5. Notification toggle labels differ between Settings and Notifications docs — reconcile into one canonical list; Friend toggle = Future.
6. Social V2+ but referenced as "(Future)" in MVP docs — build data model forward-compatible, not implemented.
7. Album Statistics (per-album) vs Profile Statistics (lifetime) — both needed, different scope.
8. Weather + sunset-time provider needed (not named).
