import * as AppleAuthentication from 'expo-apple-authentication';
import * as Crypto from 'expo-crypto';
import { Platform } from 'react-native';

import type { AppleCredentialResult, AppleSignInButtonProps } from './apple-auth';

/** Sign in with Apple exists on iOS 13+ only — Android/web never show the button. */
export async function isAppleSignInAvailable(): Promise<boolean> {
  if (Platform.OS !== 'ios') return false;
  try {
    return await AppleAuthentication.isAvailableAsync();
  } catch {
    return false;
  }
}

/**
 * Native Apple sheet → identity token for Supabase (signInWithIdToken). Apple receives the
 * SHA-256 of a random nonce, Supabase the raw nonce — so a stolen token can't be replayed.
 * Apple hands out the user's name ONLY on the very first authorization; we pass it on.
 */
export async function requestAppleCredential(): Promise<AppleCredentialResult> {
  const rawNonce = `${Crypto.randomUUID()}${Crypto.randomUUID()}`;
  const hashedNonce = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, rawNonce);
  try {
    const credential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
      nonce: hashedNonce,
    });
    if (!credential.identityToken) return { kind: 'error', error: 'apple_no_token' };
    const fullName = [credential.fullName?.givenName, credential.fullName?.familyName]
      .filter(Boolean)
      .join(' ')
      .trim();
    return { kind: 'ok', identityToken: credential.identityToken, rawNonce, fullName: fullName || undefined };
  } catch (e) {
    if ((e as { code?: string })?.code === 'ERR_REQUEST_CANCELED') return { kind: 'cancelled' };
    return { kind: 'error', error: (e as Error)?.message ?? 'apple_failed' };
  }
}

/**
 * Apple's own button — App Review requires the official look (HIG). Black on light, white on
 * dark; height and radius match our secondary button so it sits evenly next to Google.
 */
export function AppleSignInButton({ onPress, dark, cornerRadius, signUp }: AppleSignInButtonProps) {
  return (
    <AppleAuthentication.AppleAuthenticationButton
      buttonType={
        signUp
          ? AppleAuthentication.AppleAuthenticationButtonType.SIGN_UP
          : AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN
      }
      buttonStyle={
        dark
          ? AppleAuthentication.AppleAuthenticationButtonStyle.WHITE
          : AppleAuthentication.AppleAuthenticationButtonStyle.BLACK
      }
      cornerRadius={cornerRadius}
      style={{ height: 52, width: '100%' }}
      onPress={onPress}
    />
  );
}
