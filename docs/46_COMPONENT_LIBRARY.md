46_COMPONENT_LIBRARY.md
UNPLND Component Library

Version 1.0
Priority: CRITICAL
Status: Foundation

Purpose

This document defines every reusable UI component used throughout UNPLND.
No screen should invent its own UI.
Screens compose components.
Components define the product.

Philosophy

Build once.
Reuse forever.
Consistency is more valuable than uniqueness.

Component Categories

Layout
Navigation
Buttons
Cards
Inputs
Lists

                                                                         1
Feedback
Maps
Albums
Planner
Profile
Shared

Layout Components

AppScaffold
PrimaryScreen
SectionHeader
ContentContainer
SafeAreaWrapper
BottomSpacing
Divider
Spacer
All screens must use these layout primitives.

Navigation Components

BottomNavigationBar
TopNavigationBar
BackButton
SearchButton
ProfileAvatar
NotificationButton

                                                                         2
FloatingActionButton (rare)

Buttons

PrimaryButton
SecondaryButton
TextButton
IconButton
DangerButton
LoadingButton
CTAButton
Never create custom buttons outside this library.

Cards

WeatherCard
PlanCard
AlbumCard
MemoryCard
ExperienceCard
CategoryCard
PremiumCard
ProfileCard
CollectionCard
StatisticsCard
Cards share:
Radius

                                                                         3
Padding
Shadow
Spacing
Typography

Planner Components

MoodSelector
BudgetSlider
GroupSelector
TransportSelector
PreferenceChip
PlannerProgress
QuestionCard
RoutePreview
GenerateButton

Timeline Components

Timeline
TimelineItem
CurrentStopCard
CompletedStopCard
UpcomingStopCard
ProgressIndicator
ETAWidget

                                                                         4
Album Components

AlbumCover
PhotoCard
MemoryNote
TimelineSection
WeatherBadge
MapPreview
MemoryMomentBadge
ShareButton

Input Components

SearchField
TextField
PasswordField
Dropdown
SegmentedControl
DatePicker
TimePicker
Switch
Checkbox
RadioOption
ChipSelector

                                                                         5
Discover Components

HeroBanner
ExperienceCarousel
CollectionRow
FilterChip
FeaturedCard
RecommendationCard
TrendingSection

Profile Components

ProfileHeader
AdventureSummary
StatsGrid
MemoryMapPreview
RecentAlbumsRow
FavoriteCollection
PremiumBanner

Feedback Components

Toast
Snackbar
ErrorCard
SuccessCard
WarningCard

                                                                         6
OfflineBanner
LoadingOverlay
EmptyState

Map Components

RouteMap
MapMarker
CurrentLocationButton
RouteSummary
MapLegend

Empty States

NoAlbums
NoPlans
NoFavorites
Offline
NoResults
NoNotifications
All empty states include:
Illustration
Headline
Description
Primary Action

                                                                         7
Skeleton Components

AlbumSkeleton
PlanSkeleton
CardSkeleton
ListSkeleton
ProfileSkeleton
WeatherSkeleton
Never show blank screens.

Dialog Components

ConfirmationDialog
DeleteDialog
PermissionDialog
ErrorDialog
PremiumDialog
Dialogs should be rare.
Prefer bottom sheets.

Bottom Sheets

StandardBottomSheet
RouteSheet
ReplaceStopSheet
ShareSheet
PremiumSheet

                                                                         8
SettingsSheet
Rounded.
Comfortable.
Consistent.

Chips

MoodChip
BudgetChip
DistanceChip
WeatherChip
CategoryChip
SelectableChip
Always use shared styles.

Icons

Central icon library.
Never mix icon styles.
Rounded icons only.

Illustrations

Stored centrally.
Used consistently.
No random illustrations.

                                                                         9
Motion Components

FadeIn
SlideUp
ScaleIn
RouteDrawAnimation
AlbumOpenAnimation
Reusable only.

Accessibility

Every component must support:
VoiceOver
Dynamic Type
Reduced Motion
Minimum touch target
High contrast
Accessibility is built into the component.
Not added later.

Component Rules

Every component must define:
Purpose
Properties
States
Loading

                                                                        10
Error
Accessibility
Animation
Haptics
Analytics
If one is missing,
the component is incomplete.

Versioning

Components evolve.
Never break existing usage.
Deprecate carefully.

Naming Convention

Component names
PascalCase
Files
snake_case.dart
One public component per file.

DO NOT

Do NOT duplicate components.
Do NOT slightly modify existing components.
Do NOT create one-off UI.
Do NOT bypass the design system.

                                                                        11
Every new component requires approval.

Delight Checklist

✓ Reusable.
✓ Consistent.
✓ Accessible.
✓ Beautiful.
✓ Easy to maintain.

Golden Rule

Screens are temporary.
Components are forever.
Invest in components.
The product will scale naturally.

Claude Instructions

Before creating a new component ask:
Can an existing component solve this?
If yes,
reuse it.
Only create a new component when absolutely necessary.
Consistency always wins.

END OF 46_COMPONENT_LIBRARY.md

                                                                        12
