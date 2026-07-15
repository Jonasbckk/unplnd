// Web no-op — alternate app icons are an iOS home-screen feature and the native module would break
// the web bundle. The picker hides itself when `canChangeIcon` is false.

export const canChangeIcon = false;

export function currentIconName(): string | null {
  return null;
}

export async function applyIcon(_iosName: string | null): Promise<boolean> {
  return false;
}
