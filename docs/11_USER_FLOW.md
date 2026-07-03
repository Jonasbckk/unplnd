11_USER_FLOW.md
UNPLND User Flow

Version 1.0

Purpose

This document defines every possible user journey inside UNPLND.
Every screen.
Every transition.
Every navigation path.
Every decision.
Claude must NEVER invent user flows.
Only implement the flows described here.

Golden Rule

The user should never wonder:
"What do I do next?"
Every screen should naturally guide the user.
Every transition should feel obvious.

Complete MVP Flow

Launch App
↓
Splash Screen
↓

                                                                         1
Authentication Check
↓
If Logged In
↓
Home
Else
↓
Onboarding
↓
Authentication
↓
Permission Requests
↓
Home

First Launch Flow

Open App
↓
Animated Logo
↓
Welcome Screen
↓
3 Onboarding Pages
↓

                                                                         2
Location Permission
↓
Notification Permission
↓
Sign Up
↓
Create Profile
↓
Home
Never ask for unnecessary permissions before explaining why.

Returning User

Open App
↓
Splash
↓
Auto Login
↓
Continue Last Session
↓
Home
Target time:
Under 2 seconds.

                                                                         3
Home Flow

User opens Home.
Available actions:
Create Plan
Open Existing Plan
View Memories
Open Discover
Open Profile
Settings
Premium
Search
Only ONE primary CTA:
Create Plan

Planner Flow

Tap "Create Plan"
↓
Mood Selection
↓
Group Size
↓
Budget
↓
Transportation

                                                                         4
↓
Available Time
↓
Optional Preferences
↓
Generate
↓
Loading Experience
↓
Generated Plan
↓
Accept
↓
Navigate
Never skip steps.
Every question should appear individually.

AI Generation Flow

Generate
↓
Validate Inputs
↓
Get Weather
↓

                                                                         5
Get Location
↓
Search Places
↓
Optimize Route
↓
Create Timeline
↓
Return Result
↓
Show Route
Fallback if AI fails:
Offer regeneration.
Never show technical errors.

Route Flow

Open Generated Plan
↓
Interactive Map
↓
Timeline
↓
Restaurant
↓

                                                                         6
Activity
↓
Bar
↓
Final Stop
↓
Start Navigation
↓
Google Maps Launch
↓
Return to UNPLND
↓
Continue Timeline

Memory Flow

Complete Evening
↓
Ask to Save
↓
Create Album
↓
Import Photos
↓
Automatic Cover

                                                                         7
↓
Map
↓
Timeline
↓
Weather
↓
Location Summary
↓
Save
↓
Share
Album creation should feel rewarding.

Discover Flow

Discover
↓
Trending Routes
↓
Nearby Ideas
↓
Seasonal Plans
↓
Weekend Picks

                                                                         8
↓
Open Detail
↓
Generate Similar
↓
Save

Favorites Flow

Save Place
↓
Favorites
↓
Create Collection
↓
Future Planning

Profile Flow

Profile
↓
Albums
↓
Favorites
↓
Statistics
↓

                                                                         9
Premium
↓
Settings
↓
Logout

Premium Flow

User taps Premium
↓
Feature Comparison
↓
Benefits
↓
Pricing
↓
Purchase
↓
Confirmation
↓
Premium Activated
Never interrupt users unexpectedly.

Notification Flow

Notification
↓

                                                                        10
Tap
↓
Relevant Screen
Never open Home first.
Always deep-link.

Search Flow

Search
↓
Results
↓
Filters
↓
Place Detail
↓
Save
↓
Navigate
↓
Generate Around Here

Offline Flow

No Connection
↓
Offline Screen

                                                                        11
↓
Retry
↓
Cached Plans
↓
Reconnect
Users should always have something useful.

Error Flow

Unexpected Error
↓
Friendly Message
↓
Retry
↓
Support
↓
Return
Never expose stack traces.
Never blame the user.

Empty State Flow

No Albums
↓
Create First Evening

                                                                        12
No Favorites
↓
Save Your First Place
No Plans
↓
Generate First Plan
Every empty state should encourage action.

Exit Flow

User leaves app.
↓
Save Current State
↓
Background
↓
Restore instantly on return.
Never lose progress.

Deep Links

Future support:
Invitation
Album
Route
Profile
Premium

                                                                        13
Discover
All screens should support direct navigation.

Navigation Principles

Maximum depth:
3 levels
Users should never get lost.
Back always returns logically.
Never trap users.

UX Rules

One primary action per screen.
No dead ends.
No confusing menus.
No hidden navigation.
Always maintain orientation.

Performance Rules

Every transition:
<300ms
Planner:
Feels instant
Home:
Ready immediately
Memory:

                                                                        14
Opens smoothly

Accessibility

Navigation must work:
One handed.
Screen Reader.
Large Text.
Reduced Motion.
Keyboard (future).

Analytics Events

Track:
App Open
Plan Started
Plan Generated
Route Started
Album Created
Album Shared
Premium Viewed
Premium Purchased
Favorite Saved
Discover Clicked
Only meaningful events.
Never over-track.

                                                                        15
Claude Instructions

Never invent navigation.
Never add extra screens.
Never skip required steps.
Every screen transition must exist in this document.
If a navigation path is missing,
stop implementation and request documentation.
The user flow is absolute.
END OF 11_USER_FLOW.md

                                                                        16
