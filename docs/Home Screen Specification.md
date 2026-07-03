17_HOME.md
Home Screen Specification

Version 1.0
Status: MVP

Purpose

The Home Screen is the emotional center of UNPLND.
Users should immediately feel inspired.
Never overwhelmed.
Never confused.
The Home Screen should answer one question:
"What do I want to do today?"

Primary Goal

Encourage users to create a plan.
Everything else is secondary.

Screen Hierarchy

Large Greeting
‚Üì
Weather Card
‚Üì
Primary CTA
‚Üì

                                                                         1
Continue Current Plan (if exists)
‚Üì
Quick Categories
‚Üì
Discover Inspiration
‚Üì
Recent Memories
‚Üì
Bottom Navigation

Scroll Behavior

Vertical only.
Smooth.
Natural.
Top greeting collapses slightly while scrolling.
Never hide important content.

Greeting

Dynamic.
Examples
Good morning, Jonas.
Ready for tonight?
Beautiful weather today.
Let's make today memorable.
Greeting depends on

                                                                         2
Time
Weather
Current Plan
Never repeat the same greeting too often.

Weather Card

Purpose
Influence recommendations.
Contains
Temperature
Condition
Sunset Time
Rain Chance
Small recommendation.
Example
Perfect weather for a sunset walk.
Tap
Generate around weather.

Primary CTA

Large centered button.
Text
Plan my evening
Always visible.
Highest visual priority.

                                                                         3
Only one primary CTA.

Continue Current Plan

Only shown when active.
Contains
Current Stop
Next Stop
ETA
Progress
Resume Button
Card expands when tapped.

Quick Categories

Horizontal scroll.
Categories
Ì†ºÌΩù Dinner
Ì†ºÌΩ∏ Drinks
Ì†ºÌæ≥ Activities
Ì†ºÌºÖ Sunset
Ì†ºÌøñ Beach
Ì†ºÌº≥ Nature
Ì†ºÌæâ Nightlife
‚òï Caf√©
Ì†ºÌæ¨ Movie Night
Each category opens Planner with presets.

                                                                         4
Inspiration Section

Purpose
Remove decision fatigue.
Contains
Trending
Seasonal
Nearby
Hidden Gems
Date Ideas
Rainy Day
Budget Friendly
Road Trips (Future)
Each card has
Image
Short Title
Reason
Generate Similar

Recent Memories

Last albums.
Horizontal cards.
Tap
‚Üì
Open Album.

                                                                         5
If empty
Show motivational empty state.

Empty State

Illustration
Headline
Let's plan your first unforgettable evening.
Button
Create First Plan
Never show an empty screen.

Search Shortcut

Small icon.
Top right.
Global Search.
Never dominate the interface.

Notifications Shortcut

Top right.
Only visible when notifications exist.
Badge small.
Never red.
Warm accent only.

                                                                         6
Dynamic Home

Changes throughout the day.
Morning
Coffee
Brunch
Walks
Afternoon
Activities
Shopping
Nature
Evening
Dinner
Bars
Sunset
Night
Cocktails
Clubs
Late Food
Users should feel the app understands the time.

Personalization

Future
Favorite cuisines.
Preferred transport.

                                                                         7
Budget habits.
Favorite moods.
Never ask directly.
Learn over time.

Layout

Maximum width
Comfortable.
Cards
Large.
Rounded.
Spacing
24px standard.
Everything breathes.

Loading

Skeletons.
Weather loads independently.
Home loads immediately.
Never block the screen.

Offline

Cached greeting.
Cached memories.
Cached categories.

                                                                         8
Planner disabled gracefully.

Error States

Weather unavailable
‚Üì
Hide card.
Recommendations unavailable
‚Üì
Show cached suggestions.
Never interrupt the user.

Animations

Greeting fades.
Weather slides.
Cards stagger.
CTA scales slightly.
Everything subtle.

Haptics

Category
‚Üì
Light
CTA
‚Üì
Medium

                                                                         9
Continue Plan
‚Üì
Selection

Accessibility

VoiceOver.
Large Text.
Reduce Motion.
High Contrast.
One-handed usage.

Analytics

home_open
cta_pressed
continue_plan
category_selected
memory_opened
weather_card_opened
search_opened
Only meaningful events.

Performance

Home visible
<500ms
Weather async.

                                                                        10
Images lazy.
Memory cached.
Always prioritize perceived speed.

Components Used

Header
WeatherCard
PrimaryButton
CategoryChip
InspirationCard
MemoryCard
BottomNavigation
Toast
LoadingSkeleton
Only reusable components.

DO NOT

Do NOT overload the Home Screen.
Do NOT show more than one primary CTA.
Do NOT display ads.
Do NOT autoplay videos.
Do NOT show endless feeds.
Do NOT imitate TikTok.
Home should feel calm.
Not addictive.

                                                                        11
Success Criteria

The user opens the app.
Within five seconds they should know:
What to do next.
Without thinking.
Without searching.
Without confusion.

Claude Instructions

The Home Screen is the heartbeat of UNPLND.
Every pixel should encourage the user to leave the couch and create a memory.
Never optimize for engagement.
Optimize for action.
The user should close the app because they are going outside.
That is success.
END OF 17_HOME.md

                                                                        12
