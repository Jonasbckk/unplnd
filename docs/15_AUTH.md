15_AUTH.md
Authentication Specification

Version 1.0
Status: MVP

Purpose

Authentication is the user's first interaction with UNPLND.
It must feel effortless.
Fast.
Trustworthy.
Premium.
Authentication should disappear.
The goal is to get users into the app as quickly as possible.

Authentication Philosophy

Never create friction.
Never ask unnecessary questions.
Never require information that is not immediately needed.
The user wants to experience the app.
Not fill out forms.

Supported Login Methods

Priority Order
1.

                                                                         1
Apple Sign In (iOS)
2.
Google Sign In
3.
Email & Password
Future
Passkeys
Phone Number
Magic Link

Authentication Flow

Launch App
↓
Splash Screen
↓
Check Session
↓
Authenticated?
↓
YES
↓
Go Home
↓
NO

                                                                         2
↓
Welcome
↓
Sign In
↓
Home
Target Time
<2 seconds

Splash Screen

Purpose
Restore session.
Load user.
Check onboarding.
Check authentication.
Never display longer than necessary.
Maximum duration
2 seconds

Welcome Screen

Contains
Logo
Headline
Short value proposition
Apple Button

                                                                         3
Google Button
Email Button
Privacy Notice
Terms Link
Only one scroll view.
Never overwhelm.

Email Registration

Required
First Name
Email
Password
Optional
Profile Picture
Everything else comes later.

Password Rules

Minimum
8 characters
Must contain
Uppercase
Lowercase
Number
Special Character
Live validation.

                                                                         4
Never validate only after submission.

Sign In

Options
Apple
Google
Email
Remember Session
Automatic Login
Biometric Unlock (Future)

Forgot Password

Simple flow.
Email
↓
Send Reset
↓
Confirmation
Never expose whether an email exists.

Email Verification

Required before sensitive actions.
Not required before exploring the app.
Never block onboarding unnecessarily.

                                                                         5
Guest Mode

Optional
User may explore.
Cannot
Create Albums
Sync Data
Premium
Cloud Backup
Prompt to create account only when needed.
Never force registration immediately.

Session Management

Automatically restore session.
Refresh tokens silently.
Never ask users to login repeatedly.
Logout removes:
Cached profile
Sensitive tokens
Secure credentials
Preserve
Theme
Language
Accessibility settings

                                                                         6
Account Linking

Support
Apple
Google
Email
Users can connect multiple providers.
Never create duplicate accounts.

Delete Account

Available inside Settings.
Flow
Tap Delete
↓
Warning
↓
Password Confirmation
↓
Delete
↓
Sign Out
↓
Welcome
Deletion must remove all personal data.
GDPR compliant.

                                                                         7
Error Handling

Examples
Wrong Password
↓
Friendly message
No Internet
↓
Offline explanation
Server Error
↓
Retry
Expired Session
↓
Automatic refresh
↓
Login only if refresh fails
Never expose Firebase errors.

Loading States

Buttons become loading.
Inputs disabled.
Small progress indicator.
No blocking overlay.

                                                                         8
Security

Secure Storage only.
No plaintext tokens.
Firestore Security Rules.
Rate limiting.
HTTPS only.
Validate everything server-side.

UI Components

Primary Button
Secondary Button
Apple Button
Google Button
Email Form
Password Field
Loading Indicator
Error Banner

Animations

Welcome
Fade
Logo
Small scale
Buttons

                                                                         9
Slide Up
Successful Login
Soft fade
Home appears naturally.

Haptics

Selection
↓
Button Tap
Success
↓
Authentication Complete
Error
↓
Invalid Credentials

Accessibility

VoiceOver
Large Text
High Contrast
Reduced Motion
Keyboard Navigation (Future)

Analytics Events

auth_screen_view

                                                                        10
login_started
login_success
login_failed
register_started
register_success
logout
account_deleted
Only meaningful events.

Edge Cases

No Internet
↓
Retry
Google Cancelled
↓
Return
Apple Cancelled
↓
Return
Email Exists
↓
Suggest Login
Token Expired
↓
Refresh

                                                                        11
Refresh Failed
↓
Login
Never trap users.

Acceptance Criteria

User downloads app.
↓
Opens app.
↓
Signs in.
↓
Reaches Home.
↓
Total time
Under one minute.
No confusion.
No unnecessary friction.

DO NOT

Do NOT ask for birthday.
Do NOT ask for gender.
Do NOT ask for interests.
Do NOT ask for mood during authentication.
Do NOT request location before explaining why.

                                                                        12
Do NOT force profile customization.
Do NOT interrupt login with popups.
Do NOT show technical errors.

Future Improvements

Passkeys
Face ID Unlock
Touch ID Unlock
Magic Links
Multiple Profiles
Family Accounts
Business Accounts

Claude Instructions

Authentication should feel invisible.
If users think about authentication,
it is already too complicated.
Minimize friction.
Maximize trust.
Protect security.
Never sacrifice UX.

END OF 15_AUTH.md

                                                                        13
