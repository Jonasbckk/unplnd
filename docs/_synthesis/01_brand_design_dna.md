# UNPLND — Brand & Design DNA (exact tokens)

> Sources: 02_VALUES, 04_BRAND, 48_BRAND_GUIDELINES, 45_DESIGN_SYSTEM, 05 (=UNPLND Design System.md), 06_COLORS, 07_TYPOGRAPHY, 08_COMPONENTS, 46_COMPONENT_LIBRARY, 09_ANIMATIONS, 24_DELIGHT_SYSTEM, 47_COPYWRITING (=UNPLND Copywriting Guide.md).
> Naming in source is Flutter (`snake_case.dart`, PascalCase components) — translate to RN/Expo conventions.

## Brand
- Tagline/motto: **"Plan less. Live more."** · "Build memories. Not metrics."
- Lifestyle brand, NOT a tech company. Technology invisible; the evening is the product; the AI is never the product.
- Personality: a 24-year-old friend — confident, relaxed, funny, adventurous, warm, reliable, emotionally intelligent. Never arrogant/loud/cringe/"startup bro"/childish.
- Keywords: Warm, Cozy, Premium, Modern, Organic, Authentic, Minimal, Friendly, Smart, Optimistic, Human.
- Inspiration: Apple, Airbnb, Spotify, Notion/Linear, Arc. Avoid: Material Design, corporate, sharp edges, neon, gaming/crypto, Bootstrap.
- Golden rule: every decision must answer "Does this help people create meaningful real-world memories?"

## COLORS (authoritative = 06_COLORS)
Named palette:
| Role | Name | HEX |
|---|---|---|
| Primary | Terracotta | `#C97B63` |
| Primary background | Warm Cream | `#F9F4EF` |
| Primary text/headings | Coffee Brown | `#6D4C41` |
| Secondary surface | Soft Beige | `#E7D3C8` |
| Floating surface | Warm White | `#FFFDFC` |
| Accent | Sunset Orange | `#E88C5A` |
| Accent nature | Olive | `#7A8F63` |
| Accent water | Ocean Blue | `#6D9DC5` |

Semantic: Success `#6FAE75` · Warning `#F2B84B` · Error `#D96C6C` (never aggressive red) · Info `#7AAEDB`.

**Light mode tokens:** Background `#F9F4EF` · Surface `#FFFDFC` · Card `#FFFFFF` · Text primary `#3A2F2A` · Text secondary `#766C65` · Divider `#ECE5DE`.
**Dark mode tokens:** Background `#171412` · Primary surface `#211D1A` · Secondary surface `#2A2522` · Card `#302A26` · Text primary `#F8F3EF` · Text secondary `#BDB2AA` · Divider `#403833` · Primary accent `#D48A71`.
Dark mode = custom warm palette, NOT inverted; never pure black.

Rules: shadows never black — warm-tinted, opacity **6–12%**, soft large blur. Color ratio **70% neutral / 20% surfaces / 8% accent / 2% status**. Gradients only subtle (Cream→Terracotta, Beige→Warm White, Sunset→Soft Orange); no neon/rainbow. Maps muted. "Warm always wins." Never system blue / Material colors.

## TYPOGRAPHY (authoritative = 07_TYPOGRAPHY)
Fonts: iOS **SF Pro Display/Text**; Android **Inter**; never mix.
Weights: Light 300, Regular 400, Medium 500, Semibold 600, Bold 700. Never ExtraBold/Black.
Type scale (size / weight / line-height):
| Style | Size | Weight | LH |
|---|---|---|---|
| Display Large | 40 | Bold | 46 |
| Display Medium | 34 | Bold | 40 |
| Heading 1 | 30 | Semibold | 36 |
| Heading 2 | 24 | Semibold | 30 |
| Heading 3 | 20 | Medium | 26 |
| Body Large | 17 | Regular | 26 |
| Body | 16 | Regular | 24 |
| Small | 14 | Regular | 20 |
| Caption | 12 (min) | — | — |
Buttons: Primary 17 Semibold, Secondary 16 Medium. Never uppercase. Sentence case. Left-aligned default (center only for Welcome/Success). Prices `€20` never "20 EUR". Max ONE emoji per message.

## SPACING / RADIUS / GRID
- Spacing base 8px. Adopt superset scale: **4, 8, 12, 16, 24, 32, 40, 48, 64, 80, 96**. Never arbitrary values.
- **Radius (follow 08_COMPONENTS as build-ready):** Small 12 · Medium 18 · Large 24 · **Card 28** · Primary Button 20 · Secondary Button 18 · **Bottom Sheet 32** · Modal 32 · Avatar/Icon button 999 (circular).
- Grid: 4-col mobile, generous margins, "UI should breathe." Every screen = 1 primary action, 1 focus, 1 goal.

## MOTION (authoritative = 09_ANIMATIONS)
Durations: instant 50ms · tap 120ms (release 180ms, scale 0.97) · card expand 250ms · screen transition 300ms · modal 260ms · bottom sheet 300ms · toast 220ms · success 450ms · **never exceed 600ms** (standard UI target ≤300ms). Empty-state stagger 80ms.
Easing: default Ease Out; entrance Ease-Out-Cubic; exit Ease-In; spring only when physical. Never bounce/elastic/flip/rotate.
Transitions: push=slide from right, pop=slide right, modal=fade+slide up, sheet=slide up, dismiss=slide down.
Signature moments: first generated route, album opening, completing an evening. Success = scale+fade+haptic (never confetti). Error = tiny shake + one vibration (never flash red). Respect Reduce Motion (fade fallback). 60 FPS min, target 120.

## HAPTICS
Selection→Light · Primary action→Medium · Success/Album created→Success · Warning→Firm · Error→Error · Favorite→Light. Never vibrate constantly; every buzz has meaning.

## COMPONENT LIBRARY (46 + 08)
Every component defines: Purpose, Props, States, Loading, Error, Accessibility, Animation, Haptics, Analytics — else incomplete. All support Light/Dark/Dynamic Type/Accessibility/Loading/Disabled/Error/Press animation.
- **PrimaryButton:** height 56, radius 20, padding 24×16, small shadow, 17 Semibold. States: Default/Pressed/Loading/Disabled/Success/Error. ONLY ONE per screen.
- **SecondaryButton:** height 52, radius 18, no shadow. Also: TextButton, DangerButton, LoadingButton, IconButton (48×48, icons 24, radius 999), FAB (rare).
- **Cards:** radius 28, padding 24, soft warm shadow. Named: Restaurant, Activity/Experience, Memory, Profile, AIRecommendation, Weather, Plan, Album, Category, Premium, Collection, Statistics, Featured, Recommendation.
- **Planner:** MoodSelector/MoodChip, BudgetSlider (€0–500+, presets €20/€50/€100/Unlimited), GroupSizeSelector (Solo/2/3–4/5–8/9+), TransportSelector, PreferenceChip, PlannerProgress, QuestionCard, RoutePreview, GenerateButton.
- **Inputs:** SearchField, TextField, PasswordField, Dropdown, SegmentedControl, Date/TimePicker, Switch, Checkbox, RadioOption, ChipSelector. Large, comfortable.
- **Overlays:** BottomSheet (radius 32, blur, swipe/tap-outside/close, half & full height), Modal (rare), Toast (from bottom, auto-dismiss 3s). Dialogs: Confirmation/Delete/Permission/Error/Premium.
- **Feedback/States:** Snackbar, ErrorCard, SuccessCard, WarningCard, OfflineBanner, LoadingOverlay, EmptyState. Skeletons preferred over spinners (Album/Plan/Card/List/Profile/Weather). EmptyState = Illustration + Headline + Description + CTA; never "No Data."
- **Nav:** BottomNavigationBar (max 5 tabs, persistent: Home·Discover·Planner·Albums·Profile), TopNavigationBar (native iOS blur, large titles), BackButton, SearchButton, ProfileAvatar, NotificationButton.
- **Timeline:** Timeline, TimelineItem, CurrentStopCard, CompletedStopCard, UpcomingStopCard, ProgressIndicator, ETAWidget.
- **Album:** AlbumCover, PhotoCard, MemoryNote, TimelineSection, WeatherBadge, MapPreview, MemoryMomentBadge, ShareButton.
- **Motion helpers (reusable):** FadeIn, SlideUp, ScaleIn, RouteDrawAnimation, AlbumOpenAnimation.
- Icons: rounded outlined, consistent stroke, never emoji-as-icons, never mixed styles. Illustrations: soft/warm/minimal/human, central library, no stock.
- Mandate: "Screens are temporary. Components are forever." Reuse before build; no one-off UI; new component needs approval + library entry.

## ACCESSIBILITY (mandatory)
WCAG AA min (prefer AAA), Dynamic Type, VoiceOver, Reduce Motion, min touch target 44×44. "Accessibility is premium." Every screen supports dark mode — no exceptions.

## VOICE & COPY (47)
Address user as **You / your evening / your memories**. Never Customer/User/Consumer.
Love words: Adventure, Evening, Memory, Moment, Explore, Together, Discover, Favorite, Sunset, Cozy, Hidden gem.
Never say: AI, Algorithm, Machine Learning, Neural Network, Optimize, Engagement, Conversion, Platform, Powered by AI, Revolutionary, Cutting-edge.
Buttons: "Plan my evening", "Start tonight", "Save memory", "Show another idea", "Continue" — never Submit/Execute/Generate/Process.
Errors: "Something went wrong. Let's try that again." / "Looks like you're offline…" — never HTTP codes.
Empty: "Your next memory starts here." Loading: "Finding hidden places…", "Planning something special…". Sentence case, no ALL CAPS, no !!!.
Copy golden rule: "Would a real person naturally say this?" If not, rewrite.

## DELIGHT (24)
Every screen ≥1 subtle moment of delight; mature/premium, never gimmicky. Rotating greetings, time/weather/seasonal messages (always positive), milestones (10/25/50/100/250/500 evenings → unique illustration + small animation), firsts, memory callbacks ("One year ago today…"), Golden Hour Mode card. Sounds default OFF. Never confetti/flashing/fake urgency. Success feeling: "I don't know why… but I love opening this app."

## KEY CONFLICTS RESOLVED (defaults)
- Two design-system docs (45 vs 05). Colors/type/motion → dedicated docs (06/07/09). Radii & component dims → **08_COMPONENTS**. Spacing → 05 superset.
- Primary body text `#3A2F2A`; headings/nav Coffee Brown `#6D4C41`.
- Motion ceiling **600ms** (09 wins over 45's 500ms); tap 120/180ms.
- Emoji: max **one** per message (stricter typography rule).
- Icons: "rounded outlined, consistent stroke."
