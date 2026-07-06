import { Platform } from 'react-native';
import Purchases, {
  type CustomerInfo,
  type PurchasesOffering,
  type PurchasesPackage,
} from 'react-native-purchases';

const IOS_KEY = process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY;
const ANDROID_KEY = process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY;
const ENTITLEMENT = 'premium';

let configured = false;

function apiKey(): string | undefined {
  return Platform.OS === 'ios' ? IOS_KEY : ANDROID_KEY;
}

/** True once a RevenueCat key is present — gates the paywall so we never show a dead purchase. */
export function isRevenueCatConfigured(): boolean {
  return !!apiKey();
}

export function initRevenueCat(userId?: string | null): void {
  const key = apiKey();
  if (!key || configured) return;
  Purchases.configure({ apiKey: key, appUserID: userId ?? undefined });
  configured = true;
}

export async function rcLogIn(userId: string): Promise<void> {
  if (!configured) return;
  try {
    await Purchases.logIn(userId);
  } catch {
    // best effort
  }
}

export async function rcLogOut(): Promise<void> {
  if (!configured) return;
  try {
    await Purchases.logOut();
  } catch {
    // best effort
  }
}

export async function getOffering(): Promise<PurchasesOffering | null> {
  if (!configured) return null;
  try {
    const offerings = await Purchases.getOfferings();
    return offerings.current ?? null;
  } catch {
    return null;
  }
}

export async function purchase(
  pkg: PurchasesPackage,
): Promise<{ premium: boolean; cancelled?: boolean; error?: string }> {
  if (!configured) return { premium: false, error: 'not_configured' };
  try {
    const { customerInfo } = await Purchases.purchasePackage(pkg);
    return { premium: hasPremium(customerInfo) };
  } catch (e) {
    const err = e as { userCancelled?: boolean; message?: string };
    if (err?.userCancelled) return { premium: false, cancelled: true };
    return { premium: false, error: err?.message ?? 'purchase_failed' };
  }
}

export async function restore(): Promise<boolean> {
  if (!configured) return false;
  try {
    return hasPremium(await Purchases.restorePurchases());
  } catch {
    return false;
  }
}

export async function checkPremium(): Promise<boolean> {
  if (!configured) return false;
  try {
    return hasPremium(await Purchases.getCustomerInfo());
  } catch {
    return false;
  }
}

export function onCustomerInfo(cb: (premium: boolean) => void): () => void {
  if (!configured) return () => {};
  const listener = (info: CustomerInfo) => cb(hasPremium(info));
  Purchases.addCustomerInfoUpdateListener(listener);
  return () => Purchases.removeCustomerInfoUpdateListener(listener);
}

function hasPremium(info: CustomerInfo): boolean {
  return info.entitlements.active[ENTITLEMENT] !== undefined;
}

export type { PurchasesOffering, PurchasesPackage } from 'react-native-purchases';
