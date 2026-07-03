12_INFORMATION_ARCHITECTURE.md
UNPLND Information Architecture

Version 1.0

Purpose

This document defines the complete information architecture of UNPLND.
Every screen.
Every navigation.
Every data dependency.
Every hierarchy.
Claude Code must follow this architecture exactly.

Product Structure

UNPLND consists of five main areas.
Home
Discover
Planner
Albums
Profile
Every future feature belongs inside one of these.

Global Navigation

Bottom Navigation
Home

                                                                         1
Discover
Planner
Albums
Profile
Maximum:
5 Tabs
Never increase this.

Home

Purpose
Entry point.
Fast access.
Current evening.
Quick planning.
Recently visited places.
Weather.
Suggestions.
Components
Header
Greeting
Weather Card
Continue Plan
Quick Planner
Trending
Recommended

                                                                         2
Friends Activity (Future)
Premium Banner
Bottom Navigation

Discover

Purpose
Inspiration.
Explore.
Discover.
Not planning.
Components
Search
Categories
Trending
Seasonal
Nearby
Recently Popular
Collections
Saved Filters

Planner

Purpose
Main feature.
Always accessible.
Components

                                                                         3
Mood
Budget
Group Size
Transport
Available Time
Preferences
Generate Button
Loading
Generated Route

Albums

Purpose
Memory Center.
Contains
Albums
Favorites
Shared Albums
Statistics
Map Memories
Search Albums
Future Timeline

Profile

Purpose
Personal Space.

                                                                         4
Contains
Avatar
Stats
Premium
Favorites
Settings
Privacy
Support
Logout

Screen Hierarchy

Level 1
Bottom Tabs
↓
Level 2
Feature Screens
↓
Level 3
Detail Pages
↓
Level 4
Sheets
Never exceed Level 4.

                                                                         5
Global Components

Accessible everywhere
Bottom Navigation
Toast
Loading Overlay
Error Overlay
Network Banner
Location Permission
Premium Modal

Data Sources

User
Firebase
Plans
Firestore
Albums
Firestore
Photos
Storage
Places
Google Maps API
AI
OpenAI / Claude
Weather

                                                                         6
Weather API
Notifications
Firebase Messaging
Analytics
Firebase Analytics

Cache Strategy

Cached
User
Profile
Current Plan
Albums
Recent Searches
Favorites
Nearby Places
Weather (15 minutes)
Never cache:
Authentication tokens insecurely
Sensitive payment data

Offline Strategy

Available Offline
Albums
Recent Plans
Favorites

                                                                         7
Settings
User Profile
Unavailable
Live AI
Real-time Recommendations
Live Weather
Payment

Screen Dependencies

Home depends on
User
Weather
Current Plan
Recommendations
Planner depends on
Location
Preferences
Maps
AI
Albums depend on
Photos
Storage
Metadata
Profile depends on
User

                                                                         8
Premium
Statistics

Shared State

Current User
Current Plan
Theme
Location
Premium Status
Notification Settings
Everything else should remain local.

Entry Points

App Launch
Notification
Deep Link
Shared Album
QR Code (Future)
Widget (Future)
Apple Spotlight (Future)

Exit Points

Close App
Open Google Maps
Share Album

                                                                         9
Share Plan
Invite Friend
Purchase Premium

Search Architecture

Global Search
Searches
Restaurants
Activities
Bars
Events
Saved Places
Albums
Never separate search experiences.
One search.
Everything searchable.

Filters

Mood
Budget
Distance
Open Now
Indoor
Outdoor
Category

                                                                        10
Duration
Group Size
Pet Friendly (Future)
Accessibility (Future)

Memory Structure

Album
↓
Moments
↓
Photos
↓
Location
↓
Timeline
↓
Metadata
Every album is automatically generated.
Users can edit afterwards.

Route Structure

Route
↓
Stops
↓

                                                                        11
Navigation
↓
ETA
↓
Timeline
↓
Completion
Every stop contains:
Place
Address
Coordinates
Duration
Category
Open Status
Alternative

Permissions

Location
Notifications
Photos
Camera (Future)
Microphone (Future Voice Search)
Always ask when needed.
Never on first launch without explanation.

                                                                        12
Security Layers

Authentication
↓
Authorization
↓
Firestore Rules
↓
Storage Rules
↓
API Validation
↓
Rate Limiting
Security is architecture.
Not an afterthought.

Performance Targets

Home
<500ms
Albums
<400ms
Planner
<8 seconds AI
Profile
<300ms

                                                                        13
Navigation
60 FPS

Scalability

Architecture should support
100 users
↓
1,000
↓
10,000
↓
100,000
↓
1 Million
Without redesigning navigation.

Golden Rule

Information architecture should feel invisible.
Users should never think about structure.
They should simply know where everything is.
Every single time.

Claude Instructions

Never create new screens outside this hierarchy.
Never duplicate functionality.

                                                                        14
Reuse navigation.
Reuse architecture.
If a feature requires architectural changes,
update this document first.
Architecture has priority over implementation.
END OF 12_INFORMATION_ARCHITECTURE.md

                                                                        15
