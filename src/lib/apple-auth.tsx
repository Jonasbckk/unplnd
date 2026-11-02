/**
 * Sign in with Apple — public API. This default module is the WEB no-op (also used for
 * type-checking), so the native-only expo-apple-authentication never lands in the web bundle.
 * The real implementation lives in apple-auth.native.tsx and is picked on iOS/Android.
 */
export type AppleCredentialResult =
  | { kind: 'ok'; identityToken: string; rawNonce: string; fullName?: string }
  | { kind: 'cancelled' }
  | { kind: 'error'; error: string };

export interface AppleSignInButtonProps {
  onPress: () => void;
  /** Dark appearance → Apple's white button style. */
  dark: boolean;
  cornerRadius: number;
  /** "Sign up with Apple" vs "Sign in with Apple". */
  signUp: boolean;
}

export async function isAppleSignInAvailable(): Promise<boolean> {
  return false;
}

export async function requestAppleCredential(): Promise<AppleCredentialResult> {
  return { kind: 'error', error: 'apple_unavailable' };
}

export function AppleSignInButton(_props: AppleSignInButtonProps) {
  return null;
}
