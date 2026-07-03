08_COMPONENTS.md
UNPLND Component Library

Version 1.0

Purpose

Every UI element inside UNPLND must be built from reusable components.
Never duplicate components.
Never redesign existing components.
Every screen is built from this library.

General Rules

All components must support:
        • Light Mode
        • Dark Mode
        • Dynamic Type
        • Accessibility
        • Loading State
        • Disabled State
        • Error State
        • Press Animation

Every component should feel alive.

Animation Standard

Press Duration
120ms
Release
180ms

                                                                         1
Scale
0.97
Easing
Ease Out
Animations should feel soft.
Never aggressive.

Haptics

Selection
Light
Primary Action
Medium
Success
Success Feedback
Error
Error Feedback
Never vibrate unnecessarily.

Primary Button

Purpose
Main action on every screen.
Examples
Create Plan
Continue
Save Album

                                                                         2
Start Route

Height
56
Radius
20
Horizontal Padding
24
Vertical Padding
16
Shadow
Small
Typography
Button Large
Semibold
States
Default
Pressed
Loading
Disabled
Success
Error
Rules
Only ONE primary button per screen.
Never place two primary buttons next to each other.

                                                                         3
Secondary Button

Purpose
Alternative actions.
Outlined.
Lower visual hierarchy.
Examples
Skip
Later
Back
Retry

Height
52
Radius
18
Shadow
None

Icon Button

Purpose
Favorite
Share
Bookmark
Settings

                                                                         4
Close
Radius
999
Minimum Size
48x48
Icons
24x24

Floating Action Button

Purpose
Rare.
Only when the primary action needs constant access.
Examples
Quick Plan
Never overuse.

Navigation Bar

Height
iOS Standard
Large Titles supported.
Blur
Native iOS Material
Never custom gradients.

                                                                         5
Bottom Navigation

Maximum Tabs
5
Recommended
Home
Discover
Planner
Albums
Profile
Always visible.

Card System

Cards are the heart of UNPLND.
Every card follows:
Radius
28
Padding
24
Soft Shadow
Warm Background
Subtle Border
Cards should invite interaction.

                                                                         6
Restaurant Card

Contains
Image
Cuisine
Rating
Price Level
Distance
Open Status
Estimated Stay Time
Primary CTA
Reserve / Navigate

Activity Card

Contains
Activity Image
Title
Duration
Price
Indoor / Outdoor
Distance
Tags
CTA

                                                                         7
Memory Card

Contains
Cover Photo
Date
Location
Mood
People
Number of Photos
Open Album CTA

Profile Card

Contains
Avatar
Name
Streak
Cities Visited
Albums
Friends
Premium Status

AI Recommendation Card

Purpose
Highlight AI generated suggestions.
Contains

                                                                         8
AI Badge
Short explanation
Reason
Confidence
Alternative Button
Regenerate Button

Mood Selector

Selection Type
Single Choice
Visual Style
Large rounded chips
Examples
Cozy
Adventure
Party
Romantic
Food
Nature
Road Trip
Rainy Day
Luxury
Budget

                                                                         9
Budget Slider

Range
€0
↓
€500+
Quick Presets
€20
€50
€100
Unlimited
Always visible.

Group Size Selector

Style
Rounded Pills
Options
Solo
2
3–4
5–8
9+

Search Bar

Rounded

                                                                        10
Persistent
Voice Search Ready
Placeholder
Search places...
Never use tiny search fields.

Bottom Sheet

Radius
32
Blur Background
Yes
Dismiss
Swipe
Tap Outside
Close Button
Supports
Half Height
Full Height

Modal

Used only for important actions.
Examples
Delete Album
Leave Group
Cancel Plan

                                                                        11
Never interrupt unnecessarily.

Toast

Appears from bottom.
Auto dismiss
3 seconds
Examples
Plan saved
Album created
Memory shared
Friend added

Loading Skeleton

Always preferred over spinner.
Skeleton should resemble final layout.
Never show empty screens.

Empty State

Every empty state includes:
Illustration
Headline
Short explanation
Primary CTA
Never show:
"No Data"

                                                                        12
Instead:
Let's create your first adventure.

Premium Banner

Soft.
Elegant.
Never aggressive.
Never flashing.
One CTA only.

Notification Badge

Small
Subtle
Warm Accent Color
Never oversized.

Component Rules

Every new screen must use existing components.
If a component does not exist:
Create it here first.
Only then use it.
Never create screen-specific components without updating this document.

Naming Convention

PrimaryButton

                                                                        13
SecondaryButton
RestaurantCard
MemoryCard
AlbumCard
MoodChip
BudgetSlider
BottomSheet
SearchBar
ProfileHeader
TimelineCard
AIRecommendationCard
Names must remain consistent across the codebase.

Golden Rule

Components create consistency.
Consistency creates trust.
Trust creates premium perception.
Never sacrifice consistency.

Claude Instructions

Before creating any UI:
      1. Check whether a component already exists.
      2. Reuse it.
      3. Extend only if absolutely necessary.
      4. Update this document if a new reusable component is introduced.

Never invent duplicate UI elements.

                                                                        14
Every pixel should belong to the same design language.
END OF 08_COMPONENTS.md

                                                                        15
