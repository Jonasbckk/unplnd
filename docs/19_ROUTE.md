19_ROUTE.md
Route Experience Specification

Version 1.0
Priority: CRITICAL
Status: MVP

Purpose

The Route Screen is where planning becomes reality.
This screen transforms an AI recommendation into an actual experience.
Users should immediately want to leave the house.
The route should feel exciting before it even begins.

Core Goal

Show the entire evening in one beautiful, understandable timeline.
Never overwhelm.
Never confuse.
Everything should answer:
"What happens next?"

Primary Layout

Sticky Header
↓
Interactive Map
↓

                                                                         1
Experience Summary
↓
Timeline
↓
Stop Cards
↓
Navigation CTA
↓
Bottom Safe Area

Header

Contains
Back
Share
Favorite
More
Dynamic Title
Examples
Tonight
Date Night
Summer Evening
Rainy Escape
Never use generic titles.

                                                                         2
Experience Summary Card

Purpose
Give the user confidence.
Contains
Mood
Estimated Cost
Estimated Duration
Travel Distance
Weather
Walking Time
Experience Score
Primary CTA
Start Evening
Secondary CTA
Edit Plan

Interactive Map

Shows
Current Position
All Stops
Connecting Route
Estimated Travel
Active Stop
Completed Stops

                                                                         3
Alternative Stops
Supports
Pinch
Zoom
Rotate
Recenter
Never overload with controls.

Timeline

Vertical.
Chronological.
Animated.
Every stop appears as one connected journey.
Examples
18:30
↓
Dinner
↓
20:15
↓
Mini Golf
↓
22:30
↓
Cocktail Bar

                                                                         4
↓
23:45
↓
Night Walk
Timeline should feel like a story.
Not a checklist.

Stop Card

Every stop contains
Large Photo
Title
Category
Address
Distance
ETA
Estimated Duration
Price
Opening Status
Short Description
Why this place?
Navigate
Replace Stop
Favorite
Expand
Every card should answer:

                                                                         5
Why am I going here?

Why This Place

Every recommendation must include a human explanation.
Examples
Perfect for sunset.
Known for homemade pasta.
Quiet atmosphere for conversations.
Amazing city views after dark.
Great value within your budget.
Never say:
AI selected this.

Stop States

Upcoming
↓
Current
↓
Completed
↓
Skipped
Each state has unique styling.
Completed stops become warm and slightly faded.

                                                                         6
Route Progress

Progress Bar
Percentage
Completed Stops
Remaining Time
Estimated Finish
Live updating.

Live Navigation

Navigation Button
↓
Google Maps
↓
Apple Maps (iOS)
↓
Return to UNPLND
↓
Continue Timeline
Current stop automatically updates.

Replace Stop

Tap
↓
Bottom Sheet

                                                                         7
↓
Three Alternatives
↓
Replace
↓
Timeline updates
Never regenerate entire evening.
Only affected stop.

Regenerate Route

User may regenerate:
Entire Evening
Remaining Evening
One Category
One Stop
Keep completed stops untouched.

Dynamic Updates

Heavy Rain
↓
Suggest indoor alternative
Restaurant Closed
↓
Replace automatically
Traffic

                                                                         8
↓
Update ETA
Sunset Earlier
↓
Adjust order if beneficial
The evening stays alive.

Memory Triggers

Certain stops are tagged as:
������ Memory Moment
Examples
Viewpoints
Hidden Streets
Beaches
Bridges
Murals
Landmarks
After visiting
Prompt user:
Capture this moment?

Navigation Modes

Walking
Driving
Bike

                                                                         9
Public Transport
Taxi
Each changes ETA calculations.

Route Completion

Final Stop Finished
↓
Congratulations Screen
↓
Create Memory Album
↓
Share Evening
↓
Rate Experience
Never end abruptly.

Offline

Current route remains available.
Maps cached when possible.
Timeline accessible.
Navigation falls back gracefully.

Empty State

Should never happen.
Users only reach Route after successful generation.

                                                                        10
Animations

Map
↓
Smooth Zoom
Timeline
↓
Draws itself
Cards
↓
Cascade In
Completed Stop
↓
Soft Check Animation
Route Complete
↓
Elegant Celebration
No confetti.
No fireworks.
Premium only.

Haptics

Start Navigation
↓
Medium

                                                                        11
Complete Stop
↓
Light
Finish Evening
↓
Success
Replace Stop
↓
Selection

Accessibility

Large map controls.
VoiceOver.
Dynamic Type.
Reduced Motion.
Color Blind Safe.
One-handed interactions.

Analytics

route_opened
navigation_started
stop_completed
stop_replaced
route_regenerated
route_shared

                                                                        12
route_finished
Only meaningful events.

Performance

Route opens
<500ms
Map
Lazy loaded
Timeline
Immediate
Images
Cached
Animations
60 FPS
Target
120 FPS

Delight Checklist

✓ Every stop feels intentional.
✓ Timeline tells a story.
✓ Map feels smooth.
✓ Navigation is effortless.
✓ User feels excited.
✓ No information overload.
✓ Beautiful at first glance.

                                                                        13
DO NOT

Do NOT show raw AI output.
Do NOT display long paragraphs.
Do NOT clutter the map.
Do NOT overwhelm with statistics.
Do NOT require scrolling before understanding the evening.
Do NOT use generic place descriptions.
Do NOT recommend impossible routes.

Success Criteria

The user should look at the route and think:
"I genuinely can't wait to start."
That emotional reaction is the success metric.

Claude Instructions

The Route Screen is not logistics.
It is anticipation.
Everything should build excitement for the evening ahead.
Optimize for emotion.
Not efficiency alone.
Every stop should feel like the next chapter of a story.

END OF 19_ROUTE.md

                                                                        14
