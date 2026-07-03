18_PLANNER.md
AI Planner Specification

Version 1.0
Status: MVP
Priority: CRITICAL

Purpose

The Planner is the heart of UNPLND.
Everything else exists to support it.
If the Planner feels magical,
UNPLND succeeds.
If the Planner feels like a form,
UNPLND fails.

Core Principle

Planning should feel like talking to a friend.
Never like filling out a questionnaire.
The user answers one question at a time.
The next question appears naturally.

Target Time

Entire planning process:
30‚Äì45 seconds
Maximum:

                                                                         1
60 seconds

Planner Flow

Home
‚Üì
Plan my evening
‚Üì
Mood
‚Üì
Group
‚Üì
Budget
‚Üì
Transportation
‚Üì
Available Time
‚Üì
Optional Preferences
‚Üì
Generate
‚Üì
AI Thinking
‚Üì
Route Reveal

                                                                         2
Progress

Top Progress Bar
Animated.
Minimal.
Shows progress only.
Never percentages.

Question Cards

Each question appears as an individual card.
Previous cards collapse.
Current question expands.
Completed answers remain visible.
Feels like a conversation history.

Question 1

Mood
Options
Ì†ºÌºÖ Relaxed
‚ù§Ô∏è Romantic
Ì†ºÌæâ Party
Ì†ºÌΩ∏ Drinks
Ì†ºÌΩù Food
Ì†ºÌº≥ Nature
Ì†ºÌæ≥ Activities

                                                                         3
Ì†ΩÌ∫ó Road Trip
Ì†ºÌøñ Beach
Ì†ºÌø† Stay In
Ì†ºÌæ® Culture
‚ú® Surprise Me
Only one selection.

Question 2

Group Size
Solo
2
3‚Äì4
5‚Äì8
9+
Changes recommendations immediately.

Question 3

Budget
Slider
0‚Ç¨
‚Üì
300‚Ç¨
Quick Chips
Free
20‚Ç¨

                                                                         4
50‚Ç¨
100‚Ç¨
Unlimited
Always visible.

Question 4

Transportation
Walking
Car
Bike
Public Transport
Uber / Taxi
Any
Planner must optimize accordingly.

Question 5

Available Time
Now
‚Üì
8 hours
Quick options
2h
3h
5h
Whole Evening

                                                                         5
Question 6

Optional Preferences
Indoor
Outdoor
Dog Friendly
Wheelchair Accessible
Quiet
Lively
Alcohol
No Alcohol
Hidden Gems
Local Favorites
Luxury
Student Friendly
Optional only.
Never required.

AI Context

Before generation collect:
Location
Time
Weather
Opening Hours
Budget

                                                                         6
Mood
Transport
Travel Time
Group Size
History
Favorites
Avoided Places
Current Events (Future)
Every parameter improves quality.

Generate Button

Text
Create my evening
Animation
Soft glow on ready.
Disabled until minimum inputs exist.

AI Thinking Screen

Never show a spinner.
Instead show progress.
Examples
Finding cozy restaurants...
Checking opening hours...
Looking for hidden gems...
Planning the perfect route...

                                                                         7
Almost ready...
Background
Animated map.
Moving route.
Warm colors.

Generated Route

Display as beautiful timeline.
Restaurant
‚Üì
Activity
‚Üì
Bar
‚Üì
Late Night Option
Each stop expandable.

Alternative Routes

Button
Show another idea
Never regenerate everything instantly.
Reuse existing information when possible.

Editing

Users can replace:

                                                                         8
Restaurant
Activity
Bar
Individual stop
Entire route
Without restarting.

Saving

Plans save automatically.
User may rename later.

Empty State

Never exists.
Planner always starts instantly.

Error Handling

AI timeout
‚Üì
Retry
No places
‚Üì
Increase radius
Everything closed
‚Üì
Suggest home experience

                                                                         9
Heavy rain
‚Üì
Indoor alternatives
Never leave users without a plan.

Offline

Planner unavailable.
Explain why.
Show recent plans.
Offer saved favorites.

Animations

Question enters
‚Üì
Fade + Slide
Answer selected
‚Üì
Card collapses
Next appears
Route
‚Üì
Draws itself
Feels alive.

                                                                        10
Haptics

Every answer
‚Üì
Selection
Generate
‚Üì
Medium
Route Ready
‚Üì
Success
Replace Stop
‚Üì
Light

Accessibility

VoiceOver.
Large Text.
Reduced Motion.
Color Blind Friendly.
One Hand Usage.

Analytics

planner_started
planner_completed

                                                                        11
planner_cancelled
route_generated
route_regenerated
stop_replaced
route_saved
Average generation time.
Only meaningful events.

Performance

Questions
Instant
Generation
Target
<8 seconds
Animations
60 FPS
Never freeze UI.

Acceptance Criteria

A new user should complete the planner without asking:
"What does this mean?"
Everything must feel obvious.
The planner should feel fun.
Not like work.

                                                                        12
DO NOT

Do NOT display long forms.
Do NOT ask unnecessary questions.
Do NOT ask everything at once.
Do NOT use dropdown menus.
Do NOT overload the screen.
Do NOT expose AI prompts.
Do NOT show technical language.
Do NOT make planning feel slow.

Golden Rule

The Planner is not a form.
It is a conversation.
If users smile while answering,
the Planner is working.

Claude Instructions

Protect the Planner.
Never simplify it into a traditional form.
Every interaction should feel premium.
Every answer should feel satisfying.
Users should finish planning excited to leave the house.
That is success.

END OF 18_PLANNER.md

                                                                        13
