import PostHog from 'posthog-react-native';

import type { AnalyticsEvent, AnalyticsProps } from './analytics';

export type { AnalyticsEvent, AnalyticsProps };

/**
 * Native product analytics (PostHog). Reads the key from EXPO_PUBLIC_POSTHOG_KEY, so it's a
 * complete no-op until that env var is set — dev and Expo Go are never affected. EU host by
 * default (GDPR). Only a user id + non-personal event props are ever sent — never name/email.
 */
const KEY = process.env.EXPO_PUBLIC_POSTHOG_KEY;
const HOST = process.env.EXPO_PUBLIC_POSTHOG_HOST ?? 'https://eu.i.posthog.com';

let client: PostHog | null = null;

export function initAnalytics(): void {
  if (!KEY || client) return;
  // flushAt: 1 → send each event right away instead of batching, so nothing is lost when a
  // testing session is short (low volume pre-launch; can be raised later).
  client = new PostHog(KEY, { host: HOST, captureAppLifecycleEvents: true, flushAt: 1 });
}

export function track(event: AnalyticsEvent, props?: AnalyticsProps): void {
  client?.capture(event, props);
}

export function identifyUser(userId: string): void {
  client?.identify(userId);
}

export function resetAnalytics(): void {
  client?.reset();
}
