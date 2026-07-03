# UNPLND — Core Experience Features

> Sources: 17_HOME, 18_PLANNER, 18A_AI_ORCHESTRATION_ENGINE, 18B_EXPERIENCE_ENGINE, 19_ROUTE, 19A_NAVIGATION_ENGINE, 21_DISCOVER, 26_EXPERIENCE_SCORING, 49_AI_PROMPT_LIBRARY. Constitution: technology invisible; never expose AI/prompts.

## HOME (17)
Vertical scroll: Greeting → Weather Card → Primary CTA "Plan my evening" → Continue Current Plan (only if active) → Quick Categories → Inspiration → Recent Memories → Bottom Nav.
- Greeting dynamic (time + weather + plan). Weather Card: temp, condition, sunset, rain chance + tip; tap → generate around weather.
- Continue Plan card: current stop, next stop, ETA, progress, resume.
- Quick Categories (open Planner with presets): Dinner, Drinks, Activities, Sunset, Beach, Nature, Nightlife, Café, Movie Night.
- Home visible <500ms; weather loads async; never block. Offline: cached greeting/memories/categories, planner disabled gracefully.
- ONE primary CTA. No ads, no autoplay, no endless feed. "Calm, not addictive."

## PLANNER (18) — SACRED, a conversation not a form
Flow: Home → "Plan my evening" → Mood → Group → Budget → Transport → Available Time → Optional Preferences → Generate → AI Thinking → Route Reveal.
- One question at a time; question cards; previous collapse, answers stay visible (chat history feel). Progress bar shows progress, never %. Haptic on each answer.
- Target 30–45s (max 60s). Generation <8s.
Six questions (verbatim options):
1. **Mood** (single): Relaxed, Romantic, Party, Drinks, Food, Nature, Activities, Road Trip, Beach, Stay In, Culture, Surprise Me.
2. **Group:** Solo, 2, 3–4, 5–8, 9+.
3. **Budget:** slider 0€→300€; chips Free, 20€, 50€, 100€, Unlimited.
4. **Transport:** Walking, Car, Bike, Public Transport, Uber/Taxi, Any.
5. **Available Time:** slider Now→8h; chips 2h, 3h, 5h, Whole Evening.
6. **Optional Preferences:** Indoor, Outdoor, Dog Friendly, Wheelchair Accessible, Quiet, Lively, Alcohol, No Alcohol, Hidden Gems, Local Favorites, Luxury, Student Friendly.
- Generate button "Create my evening", disabled until min inputs.
- AI Thinking: NEVER a spinner — progress messages ("Finding cozy restaurants…", "Checking opening hours…") over animated map.
- Route reveal: timeline, each stop expandable. "Show another idea" reuses info (don't fully regenerate). Edit/replace any stop without restart. Auto-save.
- Empty state "never exists." Errors always yield a fallback (retry, widen radius, home experience, indoor).

## AI ORCHESTRATION (18A) — invisible planner
Pipeline (keep layers separate): User Input → Validation → Context Builder → AI Request → Response Validator → Route Optimizer → Fallback → Final Route.
- Context builder enriches with nearby places, opening hours, travel times, weather, sunset, holidays, season, history. Never send raw input alone.
- Personality: a local friend, never ChatGPT, never explains reasoning, never mentions AI.
- Structure: Food → Activity → (Dessert) → Bar → Late Activity → End. Not every evening needs every stop.
- **Hard numeric rules:** Budget never exceeded, target **80–95%** (€50→€40–47). Walking ideal <10min, max 20min. Car <20min. Rain→indoor, Sunny→outdoor, Wind→no rooftop. Never recommend closed venues. Variety required (no Restaurant→Restaurant→Restaurant). Prefer hidden gems over chains.
- Group modes: Couple (romantic, sunset, cozy, slow), Friends (energy, activities, photos), Solo (museums, coffee, walks, quiet), Family (future).
- **Strict JSON output** (never markdown):
```json
{ "summary": "", "estimated_cost": 0, "estimated_duration": "", "weather_note": "",
  "route": [ { "type": "", "title": "", "reason": "", "estimated_time": "",
  "price": "", "coordinates": "", "alternative": "" } ] }
```
- Validation rejects: budget exceeded / closed / missing coords / impossible travel / missing alternatives / invalid JSON → auto-retry (Normal → widen radius → reduce constraints → manual edit).
- Never invent places/addresses/hours. Never prioritize sponsored over better. Perf: context <500ms, AI <6s, validation <300ms, total <8s. No valid route → home experiences.

## EXPERIENCE ENGINE (18B) — creates experiences not routes
Emotional timeline: Arrival → Comfort → Connection → Exploration → Peak Moment → Relaxation → Reflection.
Five rules: every stop needs a reason · avoid decision fatigue (UNPLND decides) · quality over quantity (3 great > 7 average) · build anticipation · respect energy/pacing.
Emotional modes: Relaxed, Romantic, Adventure, Party, Luxury, Student.
**Every evening must contain ≥1 Memory Moment** (sunset viewpoint, hidden street, lake, rooftop, live music, night skyline…). Story structure with warm ending (never end abruptly). Feeling Test: "I actually want to do this," not "That looks efficient."

## EXPERIENCE SCORING (26) — internal, users never see score
Overall 0–100: **≥80 present · 65–79 auto-improve · <65 regenerate.**
Weights (total 100%): Experience Flow **20** · Memory Potential **20** · Travel Efficiency **15** · Budget Accuracy **10** · Variety **10** · Atmosphere **10** · Weather Fit **5** · Timing **5** · Uniqueness **5**.
Walking grade: 0–10 excellent, 10–15 good, 15–20 acceptable, 20+ poor. Budget ideal 80–95%.
**Penalties:** closed venue −100 · over budget −40 · travel >30min −20 · no activity −15 · no memorable stop −15 · low-rated −10 · unsafe → reject.
**Bonuses:** Golden Hour +10 · Hidden Gem +8 · Exceptional View +8 · Live Event +6 · Walkable +5 · Perfect Weather +5 · Local Favorite +4 · Excellent Value +4.
Reject immediately: unsafe, impossible travel, closed, missing coords, missing alternatives, duplicate locations. Scoring <200ms. If <80 → improve weakest category → retry once → else regenerate.

## ROUTE SCREEN (19)
Layout: Sticky Header → Map → Experience Summary → Timeline → Stop Cards → Navigation CTA.
- Dynamic title (Tonight/Date Night/Summer Evening). Summary card: Mood, Cost, Duration, Distance, Weather, Walking Time, Experience Score. CTA "Start Evening" + "Edit Plan".
- Map: current position, all stops, route line, active/completed/alternative stops. Pinch/zoom/rotate/recenter.
- Timeline: chronological with clock times (18:30 Dinner → 20:15 Mini Golf → …). Story not checklist.
- Stop card: photo, title, category, address, distance, ETA, duration, price, open status, **"Why this place?"** (human reason, never "AI selected"), Navigate/Replace/Favorite/Expand. States: Upcoming/Current/Completed(faded)/Skipped.
- Replace stop → bottom sheet → 3 alternatives → replace (only that stop). Regenerate granular (entire/remaining/category/stop), keep completed.
- Completion → Congratulations → Create Memory Album → Share → Rate. Elegant, no confetti. Route opens <500ms.

## NAVIGATION ENGINE (19A) — "Evening Companion"
Evening flow: Start → Navigate → Arrival Detected → Stop Details → Enjoy → Suggest Next → Repeat → Completed → Album.
Status: Planning/Traveling/Arrived/Enjoying/Leaving/Navigating/Completed.
- Arrival detection via GPS/movement/speed/manual/confidence — only when confidence high. Arrival card: "Welcome to your first stop…" + I'm Here/Skip/Need Another Idea.
- During activity app goes quiet. Leaving reminder soft ("Ready for the next adventure?"). Never pressure.
- Controls: Skip (AI rebalances), Pause, Finish Early (still creates album).
- Map hand-off: Google Maps + Apple Maps (iOS); remember stop, detect return, resume.
- Privacy: location only during active evening; never background-track; never sell. Battery-adaptive GPS. Late night → prefer well-lit routes.

## DISCOVER (21) — inspire, don't entertain endlessly
Layout: Header → Search → Featured Collection (one hero) → Seasonal → Trending → Hidden Gems → Weekend → Nearby Collections → Nav.
- Search: natural-language, intent-based ("Cozy cafés", "Sunset spots").
- Trending ranked by popularity/ratings/completion/sharing (not clicks). Hidden Gems prioritize independents. Nearby radii **5 / 10 / 25 km**.
- Experience card: cover, title, short story, duration, budget, mood, Generate Similar, Save.
- "Surprise Me" → one experience, no setup. No infinite feed/autoplay. "Best Discover session is a short one."

## AI PROMPT LIBRARY (49) — INTERNAL ONLY
Templates: System Prompt, Planning Prompt, group prompts (Couple/Friends/Solo/Family), condition prompts (Rain/Summer/Budget/Hidden Gem), JSON Output Rules, Validation Prompt, Retry Prompt, Album Summary Prompt (2–4 sentences, warm), Notification Prompt (≤60 chars), Error Prompt.
Forbidden words (never surface): Algorithm, Optimization, AI Model, Neural Network, Machine Learning, Prompt, Token, Inference, Backend. Prompts versioned; never silently modify. Never invent places; never present uncertainty as fact.

## KEY DEPENDENCIES
Google Maps/Places (+Apple Maps iOS), Weather API (temp/condition/sunset/rain), AI service layer (strict JSON, provider-agnostic), Supabase persistence (plans/favorites/albums/history/avoided places).
