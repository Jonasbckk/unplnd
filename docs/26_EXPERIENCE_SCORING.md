26_EXPERIENCE_SCORING.md
Experience Scoring Engine

Version 1.0
Priority: CRITICAL
Status: MVP

Purpose

Not every valid route is a good route.
UNPLND should only present evenings that feel exciting, balanced and memorable.
The Experience Scoring Engine evaluates every generated plan before it is shown to the user.
Only plans above the quality threshold are accepted.

Philosophy

A technically correct plan is not enough.
The goal is emotional quality.
The best evening is not the one with the shortest route.
It is the one users remember.

Overall Score

Every generated evening receives a score from:
0 → 100
Only scores of 80 or higher should be presented immediately.
Scores between 65–79 may be improved automatically.
Scores below 65 should be regenerated.

                                                                         1
Score Categories

Experience Flow
20%
Memory Potential
20%
Travel Efficiency
15%
Budget Accuracy
10%
Variety
10%
Atmosphere
10%
Weather Fit
5%
Timing
5%
Uniqueness
5%
Total
100%

Experience Flow

Questions

                                                                         2
Does the evening tell a story?
Does every stop have a purpose?
Does the energy evolve naturally?
Avoid abrupt transitions.

Memory Potential

High score examples
Sunset
Beautiful architecture
Live music
Lake
Night skyline
Scenic drive
Great conversations
Unique activity
Low score examples
Generic chain restaurant
Long shopping mall visit
Random parking lot
Pure logistics

Travel Efficiency

Walking
Excellent
0–10 min

                                                                         3
Good
10–15 min
Acceptable
15–20 min
Poor
20+ min
Avoid unnecessary zig-zag routes.

Budget Accuracy

Ideal
80–95%
of available budget.
Never exceed the budget.
Very low spending may also reduce quality if better experiences are available.

Variety

Excellent
Food
↓
Activity
↓
Relaxation
↓
Viewpoint
Poor

                                                                         4
Restaurant
↓
Restaurant
↓
Restaurant
Every evening should include contrast.

Atmosphere

Evaluate
Lighting
Noise level
Crowding
Comfort
View quality
Conversation quality
Not every mood needs high energy.

Weather Fit

Rain
↓
Indoor
Heat
↓
Shade
Cold

                                                                         5
↓
Warm indoor spaces
Golden Hour
↓
Increase viewpoint score
Weather should improve the experience.
Never fight against it.

Timing

Restaurants
↓
Meal times
Bars
↓
Evening
Sunset
↓
Golden Hour
Avoid suggesting breakfast at 20:00.

Uniqueness

Prefer
Independent places
Hidden gems
Local experiences

                                                                         6
Unique architecture
Special events
Chains reduce uniqueness unless explicitly requested.

Penalties

Subtract points for
Closed venue
-100
Over budget
-40
Travel >30 min
-20
No activity
-15
No memorable stop
-15
Low-rated venue
-10
Unsafe area
Reject immediately

Bonus Points

Golden Hour
+10
Hidden Gem

                                                                         7
+8
Exceptional View
+8
Live Event
+6
Walkable Evening
+5
Perfect Weather Match
+5
Local Favorite
+4
Excellent Value
+4

Hard Rules

Immediately reject routes if
Unsafe
Impossible travel
Closed venues
Missing coordinates
Missing alternatives
Duplicate locations

AI Retry

If score <80

                                                                         8
↓
Improve weakest category
↓
Recalculate
↓
Retry once
↓
If still poor
↓
Generate new experience

Personalization (Future)

Adjust weights over time.
Example
User prefers nature.
Increase
Nature score.
User dislikes nightlife.
Reduce
Nightlife weighting.
Never overfit.
Still encourage discovery.

Transparency

Users never see the full score.

                                                                         9
They only experience the quality.
The score exists for internal decision making.

Performance

Scoring must complete
<200ms
after AI response.
Never slow down the experience.

Analytics

Track
Average Route Score
Rejected Routes
Retry Rate
Accepted Routes
Completion Rate
Album Creation Rate
High-score evenings should correlate with higher user satisfaction.

Delight Checklist

✓ Evening feels balanced.
✓ Contains one memorable highlight.
✓ Budget respected.
✓ Route feels natural.
✓ User is excited after reading it.

                                                                        10
DO NOT

Do NOT optimize only for distance.
Do NOT optimize only for ratings.
Do NOT optimize only for popularity.
Do NOT maximize stop count.
Optimize for memories.

Golden Rule

UNPLND is not trying to find the "best restaurant."
UNPLND is trying to create the best evening.
That difference defines the product.

Claude Instructions

Always score every generated route.
If the route would not impress you personally,
improve it before presenting it.
Never accept mediocrity.
Every accepted evening should feel intentionally crafted.
END OF 26_EXPERIENCE_SCORING.md

                                                                        11
