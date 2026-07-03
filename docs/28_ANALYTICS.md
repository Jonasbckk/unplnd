28_ANALYTICS.md
Analytics & Product Intelligence

Version 1.0
Priority: HIGH
Status: MVP

Purpose

Analytics exist to improve the product.
Never to manipulate users.
Every tracked event must help answer a real product question.
If an event has no purpose,
do not collect it.

Philosophy

Measure memories.
Not addiction.
Measure completed evenings.
Not endless sessions.
Measure real-world impact.
Not vanity metrics.

North Star Metric

Completed Evenings
Definition

                                                                         1
A planned experience that reaches the final stop or is intentionally completed by the user.
This is the most important metric in UNPLND.
Everything should improve it.

Secondary Metrics

Memory Albums Created
Albums Revisited
Plans Generated
Routes Started
Routes Completed
Friends Invited
Hidden Gems Discovered
Cities Explored
Average Route Score
Premium Conversion
User Retention

Metrics We Do NOT Optimize For

Screen Time
Session Length
Notification Opens
Feed Views
Ad Impressions
Clicks without value
Follower Count

                                                                         2
These can become side effects,
never goals.

Product Funnel

App Install
↓
First Open
↓
Onboarding Completed
↓
Account Created
↓
First Plan Generated
↓
Route Started
↓
Evening Completed
↓
Album Created
↓
Album Shared
↓
Second Evening
This funnel defines activation.

                                                                         3
Activation Metric

A user is considered activated after:
Creating
and
completing
their first evening.
Not after registration.

Retention

Track
Day 1
Day 7
Day 30
Day 90
Yearly
Retention should correlate with
completed evenings,
not app opens.

Event Naming

Format
feature_action
Examples
planner_started

                                                                         4
planner_completed
route_opened
album_shared
favorite_added
premium_purchased
Simple.
Predictable.
Consistent.

Event Properties

Only include data that is useful.
Examples
Mood
Budget Range
Group Size
Transport
Generation Time
Route Score
Never include unnecessary personal information.

Privacy

Analytics should never store:
Message content
Photo content
Precise location history

                                                                         5
Passwords
Payment details
Private notes
Always minimize collected data.

Anonymous Analytics

Where possible,
aggregate data.
Prefer trends over identities.

Dashboards

Executive Dashboard
North Star Metric
Growth
Retention
Premium
Operations Dashboard
API Errors
Generation Time
Crash Rate
Availability
Product Dashboard
Planner Usage
Album Usage
Discover Usage

                                                                         6
Favorites
Memory Map

A/B Testing

Allowed
Onboarding
Button Text
Animations
Premium Screen
Planner Flow
Not allowed
Privacy
Security
Core experience
Trust should never be A/B tested.

Performance Metrics

Cold Start
Planner Time
Album Open Time
Crash Free Sessions
API Latency
Route Quality
All monitored continuously.

                                                                         7
Quality Metrics

Average Route Score
Album Creation Rate
Route Completion Rate
Memory Revisit Rate
These indicate product quality.

Premium Metrics

Conversion
Retention
Cancellation Rate
Feature Usage
Never optimize using dark patterns.

Error Tracking

Track
Planner failures
AI failures
API failures
Offline mode
Permission denials
Authentication errors
Every error should have an owner.

                                                                         8
Data Retention

Keep only what is necessary.
Respect local regulations.
Support data export.
Support complete deletion.
Privacy first.

Delight Metrics

Track
Albums revisited
Memory callbacks opened
Golden Hour suggestions accepted
Seasonal collections used
These indicate emotional engagement.

Success Dashboard

Weekly
Completed Evenings
↓
Albums Created
↓
Albums Shared
↓
Second Evening Rate

                                                                         9
↓
Retention
↓
Premium
Everything starts with completed evenings.

Delight Checklist

✓ Analytics improve the product.
✓ Privacy respected.
✓ No manipulation.
✓ Simple event structure.
✓ Meaningful KPIs.

DO NOT

Do NOT measure everything.
Do NOT collect data without purpose.
Do NOT optimize for screen addiction.
Do NOT create surveillance.
Do NOT compromise trust.

Success Criteria

The analytics system should help answer:
How can we create better evenings?
Not:
How can we keep users inside the app longer?

                                                                        10
Golden Rule

The best metric is a life well lived.
UNPLND succeeds when people spend less time on their phones
and more time making memories.

Claude Instructions

Whenever you introduce a new feature,
define:
What question are we trying to answer?
If no meaningful question exists,
do not add analytics for it.
Every tracked event must earn its place.
Protect user trust above all else.
END OF 28_ANALYTICS.md

                                                                        11
