import * as Sentry from '@sentry/react-native';

/**
 * Crash / error reporting. Reads the DSN from EXPO_PUBLIC_SENTRY_DSN, so it stays a complete
 * no-op until that env var is set — local dev and Expo Go are never affected. Full NATIVE crash
 * capture needs a dev-client or EAS build (Expo Go only reports JS errors). Privacy-first: no PII
 * is attached (Constitution: never sell or leak user data).
 */
const DSN = process.env.EXPO_PUBLIC_SENTRY_DSN;

export function initMonitoring(): void {
  if (!DSN) return;
  Sentry.init({
    dsn: DSN,
    sendDefaultPii: false,
    tracesSampleRate: 0.1,
    // Symbolicated native crashes require the Sentry Expo config plugin + a build.
  });
}

/** Wraps the root component (error boundary + touch/perf context). Pass-through until initialised. */
export const wrapWithMonitoring = Sentry.wrap;

/** Report a handled error with optional context. No-op until a DSN is configured. */
export function captureError(error: unknown, context?: Record<string, unknown>): void {
  if (!DSN) return;
  Sentry.captureException(error, context ? { extra: context } : undefined);
}
