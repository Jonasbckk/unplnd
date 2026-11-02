/**
 * Product analytics — public API. This default module is a NO-OP (used by the web bundle and by
 * type-checking) so the native-only PostHog SDK is never pulled into the web build. The real
 * implementation lives in analytics.native.ts and is picked automatically on iOS/Android.
 *
 * Privacy-first: the native impl only ever sends a user id + non-personal event props, never
 * name/email (Constitution: never sell or leak user data), and is a no-op until a key is set.
 */
export type AnalyticsEvent =
  | 'onboarding_completed'
  | 'planner_started'
  | 'plan_generated'
  | 'evening_started'
  | 'evening_completed'
  | 'memory_created'
  | 'plan_published'
  | 'custom_plan_published'
  | 'connection_requested'
  | 'tier_reached'
  | 'paywall_auto_shown'
  | 'ai_notice_acknowledged';

export type AnalyticsProps = Record<string, string | number | boolean>;

export function initAnalytics(): void {}
export function track(_event: AnalyticsEvent, _props?: AnalyticsProps): void {}
export function identifyUser(_userId: string): void {}
export function resetAnalytics(): void {}
