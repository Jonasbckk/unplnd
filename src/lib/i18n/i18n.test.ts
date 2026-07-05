import { de } from './de';
import { en } from './en';

/** Every leaf key path, e.g. "albums.deleteTitle". Arrays/strings are leaves. */
function keyPaths(obj: Record<string, unknown>, prefix = ''): string[] {
  const paths: string[] = [];
  for (const [k, v] of Object.entries(obj)) {
    const path = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      paths.push(...keyPaths(v as Record<string, unknown>, path));
    } else {
      paths.push(path);
    }
  }
  return paths.sort();
}

// `planner.options.*` are option-VALUE labels that only German translates (e.g. "Stay In" →
// "Zuhause"); English intentionally falls back to the raw value, so it's excluded from parity.
const IGNORED = ['planner.options.'];
const chrome = (keys: string[]) => keys.filter((k) => !IGNORED.some((p) => k.startsWith(p)));

describe('i18n de/en parity', () => {
  const deKeys = chrome(keyPaths(de as unknown as Record<string, unknown>));
  const enKeys = chrome(keyPaths(en as unknown as Record<string, unknown>));

  it('has no UI keys missing from English', () => {
    expect(deKeys.filter((k) => !enKeys.includes(k))).toEqual([]);
  });

  it('has no UI keys missing from German', () => {
    expect(enKeys.filter((k) => !deKeys.includes(k))).toEqual([]);
  });
});
