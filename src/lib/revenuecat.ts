// Web / SSR no-op — react-native-purchases is native-only, so the web bundle must not touch it.
// Type-only imports are erased at build time (no native require on web).
import type { PurchasesOffering, PurchasesPackage } from 'react-native-purchases';

export function isRevenueCatConfigured(): boolean {
  return false;
}

export function initRevenueCat(_userId?: string | null): void {}

export async function rcLogIn(_userId: string): Promise<void> {}

export async function rcLogOut(): Promise<void> {}

export async function getOffering(): Promise<PurchasesOffering | null> {
  return null;
}

export async function purchase(
  _pkg: PurchasesPackage,
): Promise<{ premium: boolean; cancelled?: boolean; error?: string }> {
  return { premium: false, error: 'unsupported' };
}

export async function restore(): Promise<boolean> {
  return false;
}

export async function checkPremium(): Promise<boolean> {
  return false;
}

export function onCustomerInfo(_cb: (premium: boolean) => void): () => void {
  return () => {};
}

export type { PurchasesOffering, PurchasesPackage } from 'react-native-purchases';
