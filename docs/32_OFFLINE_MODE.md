32_OFFLINE_MODE.md
Offline Experience Specification

Version 1.0
Priority: HIGH
Status: MVP

Purpose

UNPLND should remain useful even without an internet connection.
Users often lose connection while traveling, hiking, driving or exploring new places.
The app must fail gracefully.
Never leave the user stranded.

Philosophy

Offline is not an error.
Offline is a supported experience.
The user should always know what is still available.

Offline Strategy

Online First
AI Planning
Discover
Search
Weather
Nearby Places

                                                                         1
Partner Content
Offline First
Albums
Favorites
Current Route
Completed Routes
Settings
Profile
Memory Timeline

Cache Strategy

Automatically cache
Current active route
Last 20 albums
Favorites
Recent plans
App settings
Profile information
Recently viewed collections
Never cache sensitive authentication secrets outside secure storage.

Active Evening

If connection is lost during an active evening:
Continue navigation.
Continue timeline.

                                                                         2
Continue stop completion.
Store progress locally.
Sync automatically when online.
The evening should never be interrupted.

Planner

Requires internet.
If offline:
Show explanation.
Offer:
Saved routes
Favorites
Previous evenings
Do not show generic error messages.

Albums

Albums remain fully accessible offline.
Includes
Metadata
Timeline
Downloaded images
Map preview (if cached)
Notes
Users should always be able to relive memories.

                                                                         3
Favorites

Always available offline.
Includes
Saved places
Saved collections
Saved routes
Sync changes later.

Offline Queue

Queue actions locally.
Examples
Favorite added
Album edited
Stop completed
Profile updated
Automatically synchronize when connection returns.

Conflict Resolution

MVP
Last Write Wins
Future
Smart merge strategy
Prompt only when necessary.
Avoid user confusion.

                                                                         4
Sync Engine

Detect reconnection.
Process queued actions.
Retry failed requests.
Resolve conflicts.
Update UI silently.
Never interrupt the user.

Connectivity States

Online
Limited Connection
Offline
Syncing
Display only subtle indicators.
Never use alarming warnings.

Offline Banner

Small banner.
Example
You're offline.
Your memories are still available.
Hidden automatically when connection returns.

                                                                         5
Downloaded Content

Future feature
Users may download:
Albums
Adventure Packs
Curated city guides
Road trip collections

Map Behavior

If map tiles are cached:
Display normally.
Otherwise:
Fallback to simplified route view.
Never display a broken map.

Photos

Downloaded photos available offline.
Pending uploads remain in upload queue.
Retry automatically.

Notifications

Local reminders continue working offline.
Push notifications require internet.

                                                                         6
Error Handling

Instead of
Network Error
Show
You're offline.
We'll continue once you're connected.
Human language only.

Performance

Offline content should load instantly.
Target
<200ms
Navigation remains smooth.
Animations remain available.

Analytics

Track
offline_mode_entered
offline_sync_started
offline_sync_completed
offline_conflict
cache_hit
cache_miss
Use aggregated metrics only.

                                                                         7
Accessibility

Offline indicators readable.
VoiceOver supported.
No flashing alerts.
High contrast.

Delight Checklist

✓ Offline feels intentional.
✓ Memories always available.
✓ Active evenings continue.
✓ Sync happens automatically.
✓ User never feels punished.

DO NOT

Do NOT block access to albums.
Do NOT lose user actions.
Do NOT require manual sync.
Do NOT show technical network errors.
Do NOT interrupt an evening because of poor connectivity.

Success Criteria

A user loses internet halfway through an evening.
They continue using UNPLND naturally.
When the connection returns,

                                                                         8
everything synchronizes automatically.
The user barely notices.

Golden Rule

Connectivity should never decide whether memories are created.
UNPLND should remain dependable,
wherever the evening goes.

Claude Instructions

Design every feature with offline behavior in mind.
For each new feature ask:
What happens if the user loses connection right now?
If the answer is unclear,
the feature is incomplete.
END OF 32_OFFLINE_MODE.md

                                                                         9
