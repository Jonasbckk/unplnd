import * as Location from 'expo-location';
import { Linking, Platform } from 'react-native';

export interface AppLocation {
  latitude: number;
  longitude: number;
  city: string;
}

let cached: AppLocation | null = null;

/** Triggers the OS prompt — call only after the value was explained (16_ONBOARDING). */
export async function requestLocationPermission(): Promise<boolean> {
  try {
    const result = await Location.requestForegroundPermissionsAsync();
    return result.granted;
  } catch {
    return false;
  }
}

/** Opens the system settings so the user can re-enable location after a hard denial. */
export function openLocationSettings(): void {
  if (Platform.OS === 'ios' || Platform.OS === 'android') {
    void Linking.openSettings();
  }
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T | null> {
  return Promise.race([promise, new Promise<null>((resolve) => setTimeout(() => resolve(null), ms))]);
}

/**
 * Current position + city, fetched on demand only — never background tracking (31_SECURITY).
 * Returns null when permission is denied or GPS fails: there is NO city fallback —
 * planning for the wrong city would break trust (founder decision + Constitution Rule 5).
 */
export async function getCurrentLocation(): Promise<AppLocation | null> {
  if (cached) return cached;
  try {
    const permission = await Location.getForegroundPermissionsAsync();
    let granted = permission.granted;
    if (!granted && permission.canAskAgain) {
      granted = (await Location.requestForegroundPermissionsAsync()).granted;
    }
    if (!granted) return null;

    const position = await withTimeout(
      Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }),
      8000,
    );
    if (!position) return null;

    let city = '';
    try {
      const places = await withTimeout(Location.reverseGeocodeAsync(position.coords), 5000);
      city = places?.[0]?.city ?? places?.[0]?.subregion ?? '';
    } catch {
      // reverse geocoding unavailable (e.g. web) — coordinates still count
    }

    cached = {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      city,
    };
    return cached;
  } catch {
    return null;
  }
}
