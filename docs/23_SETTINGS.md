23_SETTINGS.md
Settings Specification

Version 1.0
Priority: MEDIUM
Status: MVP

Purpose

Settings should never overwhelm.
Users should rarely visit this screen.
When they do, everything should be obvious.
Simple.
Clean.
Fast.

Philosophy

The best settings page is the one users almost never need.
UNPLND should intelligently choose sensible defaults.
Customization exists only where it adds real value.

Screen Structure

Profile
↓
Appearance
↓

                                                                         1
Notifications
↓
Privacy
↓
Location
↓
Language
↓
Support
↓
Legal
↓
Account

Appearance

Options
Light
Dark
System Default
Preview updates instantly.
Never require restarting the app.

Notifications

Master Toggle
↓

                                                                         2
Evening Reminders
↓
Album Ready
↓
Weather Changes
↓
New Features
↓
Marketing (Optional)
Marketing notifications
OFF by default.

Privacy

Location Access
Photo Access
Analytics
Personalization
Data Export
Delete Account
Every permission includes a short explanation.

Location

Always
While Using App
Never

                                                                         3
Show current permission status.
Link to system settings if needed.

Language

System Default
English
Deutsch
Future
Français
Español
Italiano
Polski
Português
No app restart required.

Support

Help Center
Contact Support
Report a Bug
Suggest a Feature
Privacy Policy
Terms of Service
Rate UNPLND

                                                                         4
Legal

Privacy Policy
Terms
Licenses
Open Source
Version Number
Build Number

Account

Email
Connected Providers
Password (if applicable)
Premium Status
Logout
Delete Account

Premium

Show current plan.
Manage subscription.
Restore purchases.
Upgrade.
Never hide subscription management.

                                                                         5
Feature Preferences

Optional toggles
Auto-create albums
Weather-based suggestions
Memory reminders
Reduce animations
These are preferences,
not required setup.

About

App Version
Build
What's New
Website
Social Links
Simple and minimal.

Animations

Sections fade in.
Rows slide gently.
Switches animate natively.
Respect platform conventions.

                                                                         6
Haptics

Toggle
↓
Selection
Logout
↓
Medium
Delete Account
↓
Warning

Accessibility

Dynamic Type
VoiceOver
Reduce Motion
High Contrast
Large touch targets

Offline

Most settings remain available.
Changes sync when online.
Legal pages cached where possible.

                                                                         7
Analytics

settings_opened
notification_changed
theme_changed
language_changed
support_opened
privacy_opened
Only meaningful analytics.

Delight Checklist

✓ Easy to understand.
✓ Minimal.
✓ Native feeling.
✓ Fast.
✓ No unnecessary options.

DO NOT

Do NOT expose technical settings.
Do NOT overwhelm users.
Do NOT require restarting the app.
Do NOT bury important privacy controls.
Do NOT ask users to configure everything.
UNPLND should work beautifully out of the box.

                                                                         8
Success Criteria

A first-time user should understand the entire Settings screen within one minute.
No searching.
No confusion.
Everything exactly where expected.

Golden Rule

Settings exist to give control.
Not complexity.
Whenever possible,
remove settings instead of adding them.

Claude Instructions

Before introducing a new setting ask:
Can the app make this decision automatically?
If yes,
do not create a setting.
Simplicity always wins.
END OF 23_SETTINGS.md

                                                                         9
