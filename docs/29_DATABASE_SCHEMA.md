29_DATABASE_SCHEMA.md
UNPLND Database Schema

Version 1.0
Priority: CRITICAL
Status: MVP

Purpose

This document defines the complete Firestore database structure.
The schema must remain scalable, secure and easy to maintain.
Every collection has a clear responsibility.
Avoid duplicated data whenever possible.

Database Principles

Normalize where practical.
Denormalize only when it improves performance significantly.
Never duplicate user-generated content unnecessarily.
Use document references when appropriate.

Root Collections

/users
/plans
/albums
/favorites
/collections

                                                                         1
/discover
/notifications
/app_config
/feedback

Users Collection

Collection
/users/{userId}
Fields
userId
displayName
email
photoURL
premium
createdAt
updatedAt
language
theme
locationPermission
notificationPermission
favoriteMoods
favoriteCategories
stats
settings
The user document should remain lightweight.

                                                                         2
User Statistics

Stored inside
users/{userId}/stats
Examples
plansCreated
plansCompleted
albumsCreated
albumsShared
citiesVisited
favoriteMood
favoriteBudget
totalDistance
totalWalkTime
Memory statistics should be precomputed where possible.

Plans Collection

/plans/{planId}
Fields
ownerId
status
createdAt
completedAt
route
budget

                                                                         3
duration
weather
experienceScore
mood
transport
participants
summary

Route Object

Contains
routeId
stops
totalDistance
totalTime
estimatedCost
createdByAI
version

Stop Object

Contains
stopId
placeId
title
category
coordinates

                                                                         4
arrivalTime
duration
estimatedPrice
status
memoryMoment
alternativePlaces

Albums Collection

/albums/{albumId}
Fields
ownerId
planId
title
coverPhoto
city
date
weather
mood
photos
timeline
shared
favorite
createdAt
updatedAt

                                                                         5
Album Photos

Each photo
photoId
storagePath
caption
takenAt
coordinates (optional)
Never store image binaries in Firestore.
Only metadata.

Favorites

/favorites/{userId}
Contains
favoritePlaces
favoriteCollections
favoriteAlbums
favoriteRoutes
Use arrays only for small datasets.
Use subcollections when growth is expected.

Discover

/discover
Curated collections only.
Contains

                                                                         6
featured
seasonal
trending
hiddenGems
roadTrips
updatedAt
Mostly read-only.
Managed by backend.

Notifications

/notifications/{notificationId}
Fields
userId
title
body
type
read
createdAt
deepLink
expiresAt

Feedback

/feedback/{feedbackId}
Fields
userId

                                                                         7
type
message
appVersion
createdAt
status
Optional screenshot reference.

App Configuration

/app_config
Contains
minimumVersion
maintenanceMode
featureFlags
seasonalTheme
premiumConfig
No sensitive information.

Relationships

User
↓
Plans
↓
Albums
↓
Photos

                                                                         8
User
↓
Favorites
↓
Places
↓
Collections
Plans reference users.
Albums reference plans.
Never duplicate ownership unnecessarily.

IDs

Use Firestore auto-generated IDs.
Never use sequential IDs.
Never expose internal IDs publicly.

Timestamps

Always use server timestamps.
Never trust client time.

Indexes

Composite indexes expected for
ownerId + createdAt
ownerId + favorite
status + createdAt

                                                                         9
premium + createdAt (future)
Optimize queries before launch.

Pagination

Always paginate
Albums
Plans
Collections
Notifications
Never load unlimited documents.

Security

Every document has an owner.
Access verified through Firestore Security Rules.
No client-side authorization only.

Offline

Firestore offline cache enabled.
Conflict resolution
Last write wins
for MVP.
Future collaborative features may require merge strategies.

Migration Strategy

Every document includes

                                                                        10
schemaVersion
Allows future migrations.
Never assume fixed schema forever.

Performance

Keep documents
< 1 MB
Prefer
< 100 KB
Load only required fields.
Lazy load large collections.

Future Collections

/friends
/groups
/shared_albums
/messages
/year_recaps
/adventure_maps
/events
Reserved for V2.

Delight Checklist

✓ Simple hierarchy.
✓ Scalable.

                                                                        11
✓ Minimal reads.
✓ Easy to secure.
✓ Easy to extend.

DO NOT

Do NOT store API keys.
Do NOT store passwords.
Do NOT store images directly.
Do NOT duplicate large datasets.
Do NOT trust client timestamps.

Golden Rule

The database should disappear behind the product.
Developers should understand it immediately.
Users should never notice it.

Claude Instructions

Every new feature must define:
Which collection?
Which document?
Who owns it?
Who can read it?
Who can write it?
Never introduce new collections without updating this schema.
Maintain consistency at all times.

                                                                        12
END OF 29_DATABASE_SCHEMA.md
                                                                        13
