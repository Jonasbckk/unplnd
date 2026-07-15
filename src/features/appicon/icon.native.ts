// Alternate app icons only exist in a native build made AFTER expo-alternate-app-icons was added.
// The package calls requireNativeModule() at module load, so a plain top-level import CRASHES an
// older dev client ("Cannot find native module 'ExpoAlternateAppIcons'") before any support check
// can run. Require it defensively instead and degrade to "not supported" — the picker then shows
// its unsupported state rather than taking the app down.

type IconsModule = typeof import('expo-alternate-app-icons');

let mod: IconsModule | null = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  mod = require('expo-alternate-app-icons') as IconsModule;
} catch {
  mod = null;
}

/** False on the web, on older builds without the native module, and where iOS doesn't offer it. */
export const canChangeIcon = Boolean(mod?.supportsAlternateIcons);

/** The iOS name of the active alternate icon, or null when the default icon is showing. */
export function currentIconName(): string | null {
  try {
    return mod?.getAppIconName() ?? null;
  } catch {
    return null;
  }
}

/** Switch the home-screen icon. Pass null to go back to the app's default. */
export async function applyIcon(iosName: string | null): Promise<boolean> {
  if (!mod) return false;
  try {
    if (iosName === null) await mod.resetAppIcon();
    else await mod.setAlternateAppIcon(iosName as Parameters<IconsModule['setAlternateAppIcon']>[0]);
    return true;
  } catch {
    return false;
  }
}
