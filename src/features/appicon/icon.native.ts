import { getAppIconName, resetAppIcon, setAlternateAppIcon, supportsAlternateIcons } from 'expo-alternate-app-icons';

/** False on devices/simulators that don't offer alternate icons — hide the feature rather than fail. */
export const canChangeIcon = supportsAlternateIcons;

/** The iOS name of the active alternate icon, or null when the default icon is showing. */
export function currentIconName(): string | null {
  return getAppIconName();
}

/** Switch the home-screen icon. Pass null to go back to the app's default. */
export async function applyIcon(iosName: string | null): Promise<boolean> {
  try {
    if (iosName === null) await resetAppIcon();
    else await setAlternateAppIcon(iosName as Parameters<typeof setAlternateAppIcon>[0]);
    return true;
  } catch {
    return false;
  }
}
